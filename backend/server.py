"""MediCuida Grupo 1 · servidor LOCAL para práctica universitaria.

Python 3 (biblioteca estándar): HTTP + API JSON + SQLite.
Ejecutar desde la carpeta del proyecto con `python backend/server.py`.
NO usar como aplicación médica, ni exponer a internet.
"""
from __future__ import annotations

from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.parse import urlsplit
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
import webbrowser

ROOT = Path(__file__).resolve().parent.parent
BACKEND = Path(__file__).resolve().parent
DATA_DIR = BACKEND / "datos"
DB_PATH = DATA_DIR / "medicuida.sqlite3"
PORT = int(os.environ.get("MEDICUIDA_PORT", "8765"))
HOST = "127.0.0.1"  # Solo local
COOKIE_NAME = "medicuida_session"
SESSION_SECONDS = 8 * 60 * 60
SESSION_LOCK = Lock()
SESSIONS: dict[str, dict] = {}
STATIC_FILES = {
    "/": "index.html",
    "/index.html": "index.html",
    "/app.js": "app.js",
    "/styles.css": "styles.css",
}
MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
}
CODE_PATH = re.compile(r"^/api/medicamentos/MED-(\d{1,9})$")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
DNI_RE = re.compile(r"^\d{8}$")


def connect() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys=ON")
    return con


def init_database() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    with connect() as con:
        con.execute("PRAGMA journal_mode=WAL")
        con.executescript(
            """
            CREATE TABLE IF NOT EXISTS medicamentos (
                codigo INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                categoria TEXT NOT NULL,
                establecimiento TEXT NOT NULL,
                stock INTEGER NOT NULL CHECK(stock >= 0),
                creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS configuracion (
                clave TEXT PRIMARY KEY,
                valor TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS actividad (
                evento INTEGER PRIMARY KEY AUTOINCREMENT,
                accion TEXT NOT NULL,
                codigo INTEGER NOT NULL,
                fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS usuarios (
                usuario_id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombres TEXT NOT NULL,
                apellidos TEXT NOT NULL,
                dni TEXT NOT NULL UNIQUE,
                correo TEXT NOT NULL UNIQUE,
                salt_hex TEXT NOT NULL,
                password_hash_hex TEXT NOT NULL,
                creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        seeded = con.execute("SELECT valor FROM configuracion WHERE clave='seeded'").fetchone()
        if seeded is None:
            initial = json.loads((BACKEND / "medicamentos_iniciales.json").read_text(encoding="utf-8"))
            con.executemany(
                """
                INSERT INTO medicamentos(codigo, nombre, categoria, establecimiento, stock)
                VALUES (:codigo, :nombre, :categoria, :establecimiento, :stock)
                """,
                initial,
            )
            con.execute("INSERT INTO configuracion(clave, valor) VALUES ('seeded', '1')")


def normalize_spaces(value: str) -> str:
    return " ".join(value.strip().split())


def hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return salt.hex(), digest.hex()


def verify_password(password: str, salt_hex: str, digest_hex: str) -> bool:
    try:
        _, computed = hash_password(password, bytes.fromhex(salt_hex))
    except ValueError:
        return False
    return hmac.compare_digest(computed, digest_hex)


def to_public(row: sqlite3.Row) -> dict:
    return {
        "id": f"MED-{row['codigo']:03d}",
        "nombre": row["nombre"],
        "categoria": row["categoria"],
        "establecimiento": row["establecimiento"],
        "stock": row["stock"],
    }


def to_user_public(row: sqlite3.Row) -> dict:
    return {
        "nombres": row["nombres"],
        "apellidos": row["apellidos"],
        "dni": row["dni"],
        "correo": row["correo"],
    }


def validate_record(data: object) -> dict:
    if not isinstance(data, dict):
        raise ValueError("Envía un objeto JSON con los datos del medicamento.")
    result: dict = {}
    for key, max_length in (("nombre", 90), ("categoria", 65), ("establecimiento", 110)):
        val = data.get(key)
        if not isinstance(val, str):
            raise ValueError(f"El campo «{key}» es obligatorio.")
        val = normalize_spaces(val)
        if len(val) < 2 or len(val) > max_length:
            raise ValueError(f"«{key}» debe contener entre 2 y {max_length} caracteres.")
        if any(ord(c) < 32 for c in val):
            raise ValueError(f"«{key}» contiene caracteres no permitidos.")
        result[key] = val
    stock = data.get("stock")
    if type(stock) is not int or not 0 <= stock <= 1_000_000:
        raise ValueError("El stock debe ser un número entero entre 0 y 1 000 000.")
    result["stock"] = stock
    return result


def validate_user_registration(data: object) -> dict:
    if not isinstance(data, dict):
        raise ValueError("Envía un objeto JSON con los datos del usuario.")
    result: dict = {}
    for key, max_length in (("nombres", 80), ("apellidos", 100)):
        value = data.get(key)
        if not isinstance(value, str):
            raise ValueError(f"El campo «{key}» es obligatorio.")
        value = normalize_spaces(value)
        if len(value) < 2 or len(value) > max_length:
            raise ValueError(f"«{key}» debe contener entre 2 y {max_length} caracteres.")
        if any(ord(c) < 32 for c in value):
            raise ValueError(f"«{key}» contiene caracteres no permitidos.")
        result[key] = value

    dni = str(data.get("dni", "")).strip()
    if not DNI_RE.fullmatch(dni):
        raise ValueError("El DNI debe tener exactamente 8 dígitos.")
    result["dni"] = dni

    correo = str(data.get("correo", "")).strip().lower()
    if len(correo) > 120 or not EMAIL_RE.fullmatch(correo):
        raise ValueError("Ingresa un correo electrónico válido.")
    result["correo"] = correo

    password = data.get("contrasena")
    if not isinstance(password, str):
        raise ValueError("La contraseña es obligatoria.")
    if len(password) < 8 or len(password) > 72:
        raise ValueError("La contraseña debe contener entre 8 y 72 caracteres.")
    if password.strip() != password:
        raise ValueError("La contraseña no debe empezar ni terminar con espacios.")
    result["contrasena"] = password
    return result


class Handler(BaseHTTPRequestHandler):
    server_version = "MediCuidaDemo/3"

    def send_common_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")

    def json_response(self, code: int, payload: dict, cookie: str | None = None) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_common_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(raw)

    def cookie(self, value: str, max_age: int) -> str:
        return f"{COOKIE_NAME}={value}; Path=/; HttpOnly; SameSite=Strict; Max-Age={max_age}"

    def read_json(self) -> dict:
        media_type = self.headers.get("Content-Type", "").split(";")[0].strip().lower()
        if media_type != "application/json":
            raise ValueError("La solicitud debe enviarse como application/json.")
        try:
            length = int(self.headers.get("Content-Length", "-1"))
        except ValueError:
            raise ValueError("Tamaño de solicitud inválido.") from None
        if length < 1 or length > 16_384:
            raise ValueError("El contenido supera el límite de 16 KB o está vacío.")
        try:
            obj = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeError):
            raise ValueError("El JSON recibido no es válido.") from None
        if not isinstance(obj, dict):
            raise ValueError("Se esperaba un objeto JSON.")
        return obj

    def valid_origin(self) -> bool:
        origin = self.headers.get("Origin")
        if not origin:
            return True
        try:
            parsed = urlsplit(origin)
            return parsed.scheme == "http" and parsed.hostname in ("127.0.0.1", "localhost") and parsed.port == PORT
        except ValueError:
            return False

    def current_session(self) -> dict | None:
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except Exception:
            return None
        token = cookie.get(COOKIE_NAME)
        if token is None:
            return None
        with SESSION_LOCK:
            session = SESSIONS.get(token.value)
            if session is None:
                return None
            if session["exp"] < time.time():
                SESSIONS.pop(token.value, None)
                return None
            return session

    def is_authenticated(self) -> bool:
        return self.current_session() is not None

    def require_session(self) -> dict | None:
        session = self.current_session()
        if session is not None:
            return session
        self.json_response(HTTPStatus.UNAUTHORIZED, {"error": "Inicia sesión para administrar el inventario."})
        return None

    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        if path == "/api/sesion":
            session = self.current_session()
            self.json_response(HTTPStatus.OK, {
                "autenticado": session is not None,
                "usuario": session["usuario"] if session else None,
            })
            return
        if path == "/api/medicamentos":
            if self.require_session() is None:
                return
            with connect() as con:
                registros = con.execute("SELECT * FROM medicamentos ORDER BY codigo").fetchall()
            self.json_response(HTTPStatus.OK, {"medicamentos": [to_public(r) for r in registros]})
            return
        if path in STATIC_FILES:
            file = ROOT / STATIC_FILES[path]
            content = file.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_common_headers()
            self.send_header("Content-Type", MIME[file.suffix])
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return
        self.json_response(HTTPStatus.NOT_FOUND, {"error": "Ruta no encontrada."})

    def do_POST(self) -> None:
        if not self.valid_origin():
            self.json_response(HTTPStatus.FORBIDDEN, {"error": "Origen no autorizado."})
            return
        path = urlsplit(self.path).path

        if path == "/api/register":
            try:
                data = validate_user_registration(self.read_json())
            except ValueError as exc:
                self.json_response(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
                return
            salt_hex, password_hash_hex = hash_password(data["contrasena"])
            try:
                with connect() as con:
                    con.execute(
                        """
                        INSERT INTO usuarios(nombres, apellidos, dni, correo, salt_hex, password_hash_hex)
                        VALUES (?,?,?,?,?,?)
                        """,
                        (data["nombres"], data["apellidos"], data["dni"], data["correo"], salt_hex, password_hash_hex),
                    )
            except sqlite3.IntegrityError as exc:
                text = str(exc).lower()
                if "usuarios.dni" in text:
                    msg = "Ya existe un usuario registrado con ese DNI."
                elif "usuarios.correo" in text:
                    msg = "Ya existe un usuario registrado con ese correo."
                else:
                    msg = "No fue posible registrar el usuario."
                self.json_response(HTTPStatus.CONFLICT, {"error": msg})
                return
            self.json_response(HTTPStatus.CREATED, {
                "ok": True,
                "mensaje": "Usuario registrado correctamente. Ahora inicia sesión con tu DNI y contraseña.",
            })
            return

        if path == "/api/login":
            try:
                data = self.read_json()
            except ValueError as exc:
                self.json_response(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
                return
            dni = str(data.get("dni", "")).strip()
            password = data.get("contrasena")
            if not DNI_RE.fullmatch(dni) or not isinstance(password, str):
                self.json_response(HTTPStatus.BAD_REQUEST, {"error": "Ingresa un DNI válido y tu contraseña."})
                return
            with connect() as con:
                row = con.execute("SELECT * FROM usuarios WHERE dni=?", (dni,)).fetchone()
            if row is None or not verify_password(password, row["salt_hex"], row["password_hash_hex"]):
                self.json_response(HTTPStatus.UNAUTHORIZED, {"error": "DNI o contraseña incorrectos."})
                return
            usuario = to_user_public(row)
            token = secrets.token_urlsafe(32)
            with SESSION_LOCK:
                SESSIONS[token] = {"exp": time.time() + SESSION_SECONDS, "usuario": usuario}
            self.json_response(HTTPStatus.OK, {"ok": True, "usuario": usuario}, self.cookie(token, SESSION_SECONDS))
            return

        if path == "/api/logout":
            cookie = SimpleCookie()
            try:
                cookie.load(self.headers.get("Cookie", ""))
                token = cookie.get(COOKIE_NAME)
                if token:
                    with SESSION_LOCK:
                        SESSIONS.pop(token.value, None)
            except Exception:
                pass
            self.json_response(HTTPStatus.OK, {"ok": True}, self.cookie("", 0))
            return

        if path == "/api/medicamentos":
            if self.require_session() is None:
                return
            try:
                data = validate_record(self.read_json())
            except ValueError as exc:
                self.json_response(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
                return
            with connect() as con:
                cur = con.execute(
                    """
                    INSERT INTO medicamentos(nombre, categoria, establecimiento, stock)
                    VALUES (:nombre, :categoria, :establecimiento, :stock)
                    """,
                    data,
                )
                codigo = cur.lastrowid
                con.execute("INSERT INTO actividad (accion, codigo) VALUES (?,?)", ("crear", codigo))
                row = con.execute("SELECT * FROM medicamentos WHERE codigo=?", (codigo,)).fetchone()
            self.json_response(HTTPStatus.CREATED, {"medicamento": to_public(row), "mensaje": "Medicamento registrado."})
            return

        self.json_response(HTTPStatus.NOT_FOUND, {"error": "Ruta no encontrada."})

    def do_PUT(self) -> None:
        if not self.valid_origin():
            self.json_response(HTTPStatus.FORBIDDEN, {"error": "Origen no autorizado."})
            return
        m = CODE_PATH.fullmatch(urlsplit(self.path).path)
        if not m:
            self.json_response(HTTPStatus.NOT_FOUND, {"error": "Ruta no encontrada."})
            return
        if self.require_session() is None:
            return
        try:
            data = validate_record(self.read_json())
        except ValueError as exc:
            self.json_response(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return
        codigo = int(m.group(1))
        with connect() as con:
            cur = con.execute(
                """
                UPDATE medicamentos SET nombre=:nombre, categoria=:categoria,
                    establecimiento=:establecimiento, stock=:stock, actualizado_en=CURRENT_TIMESTAMP
                WHERE codigo=:codigo
                """,
                {**data, "codigo": codigo},
            )
            row = con.execute("SELECT * FROM medicamentos WHERE codigo=?", (codigo,)).fetchone() if cur.rowcount else None
            if cur.rowcount:
                con.execute("INSERT INTO actividad (accion,codigo) VALUES (?,?)", ("editar", codigo))
        if row is None:
            self.json_response(HTTPStatus.NOT_FOUND, {"error": "El medicamento ya no existe."})
            return
        self.json_response(HTTPStatus.OK, {"medicamento": to_public(row), "mensaje": "Medicamento actualizado."})

    def do_DELETE(self) -> None:
        if not self.valid_origin():
            self.json_response(HTTPStatus.FORBIDDEN, {"error": "Origen no autorizado."})
            return
        m = CODE_PATH.fullmatch(urlsplit(self.path).path)
        if not m:
            self.json_response(HTTPStatus.NOT_FOUND, {"error": "Ruta no encontrada."})
            return
        if self.require_session() is None:
            return
        codigo = int(m.group(1))
        with connect() as con:
            cur = con.execute("DELETE FROM medicamentos WHERE codigo=?", (codigo,))
            if cur.rowcount:
                con.execute("INSERT INTO actividad (accion,codigo) VALUES (?,?)", ("eliminar", codigo))
        if not cur.rowcount:
            self.json_response(HTTPStatus.NOT_FOUND, {"error": "El medicamento ya no existe."})
            return
        self.json_response(HTTPStatus.OK, {"ok": True, "mensaje": "Medicamento eliminado."})


def main() -> None:
    init_database()
    try:
        httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError as error:
        print(f"No se pudo iniciar el servidor en {HOST}:{PORT}: {error}")
        raise SystemExit(1) from error
    url = f"http://{HOST}:{PORT}"
    print("\nMediCuida – Grupo 1 | Servidor académico con SQLite")
    print(f"Página: {url}")
    print(f"Base de datos: {DB_PATH}")
    print("Primero registra un usuario y luego entra con tu DNI y contraseña.")
    print("Para detener: Ctrl+C. No cierres esta ventana mientras usas el sitio.\n", flush=True)
    if os.environ.get("MEDICUIDA_NO_BROWSER") != "1":
        webbrowser.open(url)
    try:
        httpd.serve_forever(poll_interval=0.3)
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()

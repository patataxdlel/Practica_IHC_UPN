"""MediCuida Grupo 7 · servidor LOCAL para práctica universitaria.

Python 3 (biblioteca estándar): HTTP + API JSON + SQLite.
Ejecutar desde la carpeta del proyecto con `python backend/server.py`.
NO usar como aplicación médica, ni exponer a internet.
"""
from __future__ import annotations

from datetime import datetime, timezone
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
HOST = "127.0.0.1"  # Solamente el mismo equipo; no accesible desde Internet ni la LAN
COOKIE_NAME = "medicuida_session"
SESSION_SECONDS = 8 * 60 * 60
DEMO_USER = "user"
# La clave de ejemplo se verifica únicamente en el servidor (nunca en app.js).
# No usar esta credencial compartida en un sistema real.
DEMO_PASSWORD_SHA256 = hashlib.sha256(b"123456789").digest()
SESSIONS: dict[str, float] = {}
SESSIONS_LOCK = Lock()
STATIC_FILES = {"/": "index.html", "/index.html": "index.html", "/app.js": "app.js", "/styles.css": "styles.css"}
MIME = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8"}
CODE_PATH = re.compile(r"^/api/medicamentos/MED-(\d{1,9})$")


def connect() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys=ON")
    return con


def init_database() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    with connect() as con:
        con.execute("PRAGMA journal_mode=WAL")
        con.executescript("""
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
        """)
        seeded = con.execute("SELECT valor FROM configuracion WHERE clave = 'seeded'").fetchone()
        if seeded is None:
            initial = json.loads((BACKEND / "medicamentos_iniciales.json").read_text(encoding="utf-8"))
            con.executemany("""
                INSERT INTO medicamentos(codigo, nombre, categoria, establecimiento, stock)
                VALUES (:codigo, :nombre, :categoria, :establecimiento, :stock)
            """, initial)
            con.execute("INSERT INTO configuracion(clave, valor) VALUES ('seeded', '1')")


def to_public(row: sqlite3.Row) -> dict:
    return {
        "id": f"MED-{row['codigo']:03d}",
        "nombre": row["nombre"],
        "categoria": row["categoria"],
        "establecimiento": row["establecimiento"],
        "stock": row["stock"],
    }


def validate_record(data: object) -> dict:
    if not isinstance(data, dict):
        raise ValueError("Envía un objeto JSON con los datos del medicamento.")
    result: dict = {}
    for key, max_length in (("nombre", 90), ("categoria", 65), ("establecimiento", 110)):
        val = data.get(key)
        if not isinstance(val, str):
            raise ValueError(f"El campo «{key}» es obligatorio.")
        val = " ".join(val.strip().split())
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


class Handler(BaseHTTPRequestHandler):
    server_version = "MediCuidaDemo/2"

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
        # HttpOnly: JavaScript no puede leer el token; SameSite evita envíos entre sitios.
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
            return True  # Clientes locales fuera de navegador
        try:
            parsed = urlsplit(origin)
            return parsed.scheme == "http" and parsed.hostname in ("127.0.0.1", "localhost") and parsed.port == PORT
        except ValueError:
            return False

    def is_authenticated(self) -> bool:
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except Exception:
            return False
        token = cookie.get(COOKIE_NAME)
        if token is None:
            return False
        with SESSIONS_LOCK:
            expiry = SESSIONS.get(token.value)
            if expiry is None:
                return False
            if expiry < time.time():
                SESSIONS.pop(token.value, None)
                return False
            return True

    def require_session(self) -> bool:
        if self.is_authenticated():
            return True
        self.json_response(HTTPStatus.UNAUTHORIZED, {"error": "Inicia sesión para administrar el inventario."})
        return False

    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        if path == "/api/sesion":
            self.json_response(HTTPStatus.OK, {"autenticado": self.is_authenticated()})
        elif path == "/api/medicamentos":
            if not self.require_session():
                return
            with connect() as con:
                registros = con.execute("SELECT * FROM medicamentos ORDER BY codigo").fetchall()
            self.json_response(HTTPStatus.OK, {"medicamentos": [to_public(r) for r in registros]})
        elif path in STATIC_FILES:
            file = ROOT / STATIC_FILES[path]
            content = file.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_common_headers()
            self.send_header("Content-Type", MIME[file.suffix])
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        else:
            self.json_response(HTTPStatus.NOT_FOUND, {"error": "Ruta no encontrada."})

    def do_POST(self) -> None:
        if not self.valid_origin():
            self.json_response(HTTPStatus.FORBIDDEN, {"error": "Origen no autorizado."})
            return
        path = urlsplit(self.path).path
        if path == "/api/login":
            try:
                data = self.read_json()
            except ValueError as exc:
                self.json_response(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
                return
            username = data.get("usuario")
            password = data.get("contrasena")
            authorized = (
                isinstance(username, str) and username == DEMO_USER
                and isinstance(password, str)
                and hmac.compare_digest(hashlib.sha256(password.encode("utf-8")).digest(), DEMO_PASSWORD_SHA256)
            )
            if not authorized:
                self.json_response(HTTPStatus.UNAUTHORIZED, {"error": "Usuario o contraseña incorrectos."})
                return
            token = secrets.token_urlsafe(32)
            with SESSIONS_LOCK:
                SESSIONS[token] = time.time() + SESSION_SECONDS
            self.json_response(HTTPStatus.OK, {"ok": True, "usuario": DEMO_USER}, self.cookie(token, SESSION_SECONDS))
            return
        if path == "/api/logout":
            cookie = SimpleCookie()
            try:
                cookie.load(self.headers.get("Cookie", ""))
                token = cookie.get(COOKIE_NAME)
                if token:
                    with SESSIONS_LOCK:
                        SESSIONS.pop(token.value, None)
            except Exception:
                pass
            self.json_response(HTTPStatus.OK, {"ok": True}, self.cookie("", 0))
            return
        if path == "/api/medicamentos":
            if not self.require_session():
                return
            try:
                data = validate_record(self.read_json())
            except ValueError as exc:
                self.json_response(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
                return
            with connect() as con:
                cur = con.execute("""
                    INSERT INTO medicamentos(nombre, categoria, establecimiento, stock)
                    VALUES (:nombre, :categoria, :establecimiento, :stock)
                """, data)
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
        if not self.require_session():
            return
        try:
            data = validate_record(self.read_json())
        except ValueError as exc:
            self.json_response(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return
        codigo = int(m.group(1))
        with connect() as con:
            cur = con.execute("""
                UPDATE medicamentos SET nombre=:nombre, categoria=:categoria,
                    establecimiento=:establecimiento, stock=:stock, actualizado_en=CURRENT_TIMESTAMP
                WHERE codigo=:codigo
            """, {**data, "codigo": codigo})
            if cur.rowcount:
                con.execute("INSERT INTO actividad (accion,codigo) VALUES (?,?)", ("editar", codigo))
                row = con.execute("SELECT * FROM medicamentos WHERE codigo=?", (codigo,)).fetchone()
            else:
                row = None
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
        if not self.require_session():
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
    print("\nMediCuida – Grupo 7 | Servidor académico con SQLite")
    print(f"Página: {url}")
    print(f"Base de datos: {DB_PATH}")
    print("Usuario: user | Contraseña: 123456789")
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

# MediCuida – Grupo 1 (con Backend)

**Sistema Inclusivo de Gestión de Medicamentos – MINSA**  
Proyecto universitario de demostración **no oficial**, con inventario completamente ficticio y editable. No es un sistema clínico y **no obtiene datos del MINSA**.

## ¿Qué incluye esta versión?

- Servidor **Python 3** con API HTTP/JSON, sin frameworks ni paquetes externos.
- Base de datos **SQLite** real, creada automáticamente al iniciar por primera vez.
- Gestión de medicamentos del inventario: **crear, listar, editar y eliminar**.
- Dashboard y búsqueda que leen el inventario actual desde SQLite.
- Registro de usuarios en el backend con los campos: **nombres, apellidos, DNI, correo electrónico y contraseña**.
- Inicio de sesión con **DNI + contraseña** y cookie de sesión `HttpOnly`.
- Semilla de medicamentos ficticios importada **solo la primera vez**.

## Ejecutar en Windows 10 / Windows 11

1. Extrae **todos los archivos** del ZIP en una carpeta.
2. Instala **Python 3** desde <https://www.python.org/downloads/> si todavía no lo tienes. En la instalación, activa **Add Python to PATH**.
3. Haz doble clic en `INICIAR_WINDOWS.bat`.
4. Se abrirá tu navegador automáticamente. Si no, entra a **http://127.0.0.1:8765**.
5. En la pestaña **Registrarse**, crea tu cuenta.
6. Luego entra en **Iniciar sesión** con tu **DNI** y la **contraseña creada**.
7. En el menú elige **Administrar stock** para agregar, editar o eliminar medicamentos.

**Mantén abierta la consola de Windows mientras usas el sitio.** Para apagar el servidor presiona `Ctrl+C` o cierra la consola.

### Ejecutar en macOS / Linux

Desde la carpeta extraída:

```bash
python3 backend/server.py
```

También puedes utilizar `INICIAR_LINUX_MAC.sh`.

## ¿Dónde se guardan los registros?

- **Inventario:** `backend/datos/medicuida.sqlite3`
- **Usuarios registrados:** en esa misma base de datos SQLite.
- **Tratamientos personales de prueba e historial:** en `localStorage` del navegador.

## Estructura de archivos

```text
MediCuida_Grupo1_Backend_Actualizado/
├── INICIAR_WINDOWS.bat
├── INICIAR_LINUX_MAC.sh
├── index.html
├── styles.css
├── app.js
├── README.md
└── backend/
    ├── server.py
    ├── medicamentos_iniciales.json
    └── datos/
        └── medicuida.sqlite3   (se crea automáticamente)
```

## Endpoints principales

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/register` | Registra un nuevo usuario. |
| POST | `/api/login` | Inicia sesión con DNI y contraseña. |
| GET | `/api/sesion` | Comprueba la sesión actual. |
| POST | `/api/logout` | Cierra la sesión. |
| GET | `/api/medicamentos` | Lista todos los registros. |
| POST | `/api/medicamentos` | Crea un nuevo medicamento. |
| PUT | `/api/medicamentos/MED-001` | Edita un medicamento existente. |
| DELETE | `/api/medicamentos/MED-001` | Elimina un medicamento existente. |

## Requisitos y notas

- Requiere **Python 3.9 o posterior**.
- No necesita MySQL, Node.js, npm ni dependencias externas.
- El servidor escucha en `127.0.0.1`, o sea, **solo en tu computadora**.
- Es un prototipo académico. **No ingreses datos médicos reales.**
- Para publicarlo en internet necesitarías un hosting que soporte **Python + SQLite** o una base de datos equivalente.

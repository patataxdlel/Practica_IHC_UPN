# MediCuida – Grupo 7 (con Backend)

**Sistema Inclusivo de Gestión de Medicamentos – MINSA**  
Proyecto universitario de demostración **no oficial**, con inventario completamente ficticio y editable. No es un sistema clínico y **no obtiene datos del MINSA**.

## ¿Qué se agregó?

- Servidor **Python 3** con API HTTP/JSON, sin frameworks ni paquetes externos.
- Base de datos **SQLite** real, creada automáticamente al iniciar por primera vez.
- Gestión de medicamentos del inventario: **crear, listar, editar y eliminar**.
- Dashboard y búsqueda que leen el inventario actual desde SQLite (no desde un archivo JavaScript fijo).
- Inicio de sesión con validación en el backend y cookie de sesión `HttpOnly` para la demostración.
- Semilla de 24 medicamentos ficticios, importada **solo la primera vez**. Si luego eliminas registros, **no reaparecen al reiniciar**.

## Ejecutar en Windows 10 / Windows 11

1. Extrae **todos los archivos** del ZIP en una carpeta (no abras el HTML desde el ZIP).
2. Instala **Python 3** desde <https://www.python.org/downloads/> si todavía no lo tienes. En la instalación, activa la opción **Add Python to PATH**.
3. Haz doble clic en `INICIAR_WINDOWS.bat`.
4. Se abrirá tu navegador automáticamente. Si no, entra a **http://127.0.0.1:8765**.
5. Inicia sesión con:
   - **Usuario:** `user`
   - **Contraseña:** `123456789`
6. En el menú elige **Administrar stock**. Completa el formulario y pulsa **Agregar medicamento**.
7. Junto a cada registro encontrarás **Editar** y **Eliminar**. Confirma las eliminaciones y revisa cómo cambia **Dashboard** y **Disponibilidad**.

**Mantén abierta la consola de Windows mientras usas el sitio.** Para apagar el servidor presiona `Ctrl+C` o cierra la consola. No abras directamente `index.html`, porque este frontend ahora requiere el backend.

### Ejecutar en macOS / Linux

Desde la carpeta extraída:

```bash
python3 backend/server.py
```

También puedes utilizar `INICIAR_LINUX_MAC.sh`.

## ¿Dónde se guardan los registros?

En `backend/datos/medicuida.sqlite3` (se crea al iniciar). Este archivo es la base de datos SQLite. Puedes cerrar el servidor, volverlo a abrir y los cambios permanecerán. **No borres ese archivo** si deseas conservar el inventario editado. Para respaldarlo, detén el servidor y copia el archivo `.sqlite3`.

La primera ejecución carga 24 registros de prueba desde `backend/medicamentos_iniciales.json`. Este archivo es una semilla inicial, **no es la base de datos activa**.

**Importante:** la sección **Mis medicamentos** (tratamientos personales de ejemplo e historial de tomas) continúa usando `localStorage` del navegador, como en el prototipo anterior. La nueva base SQLite guarda **el inventario de disponibilidad y stock** de la sección **Administrar stock**.

## Estructura de archivos

```text
MediCuida_Grupo7_Backend/
├── INICIAR_WINDOWS.bat         (doble clic en Windows)
├── INICIAR_LINUX_MAC.sh
├── index.html                  (landing, login, dashboard, administración)
├── styles.css                  (estilos y diseño adaptable)
├── app.js                      (interfaz, conexión a la API, gráficos)
├── README.md
└── backend/
    ├── server.py              (servidor Python + REST + SQLite)
    ├── medicamentos_iniciales.json
    └── datos/
        └── medicuida.sqlite3   (se crea automáticamente, no incluida en ZIP)
```

## Endpoints del backend

Todas las rutas de inventario requieren una sesión iniciada con `/api/login`.

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/login` | Verifica `usuario` y `contrasena`. |
| GET | `/api/sesion` | Comprueba la sesión actual. |
| POST | `/api/logout` | Cierra la sesión. |
| GET | `/api/medicamentos` | Lista todos los registros. |
| POST | `/api/medicamentos` | Crea un nuevo medicamento. |
| PUT | `/api/medicamentos/MED-001` | Edita un medicamento existente. |
| DELETE | `/api/medicamentos/MED-001` | Elimina un medicamento existente. |

Los campos JSON para crear y editar son `nombre`, `categoria`, `establecimiento` y `stock` (entero desde 0 hasta 1 000 000). Ejemplo:

```json
{
  "nombre": "Paracetamol 500 mg",
  "categoria": "Analgésicos",
  "establecimiento": "Centro de Salud de Ejemplo",
  "stock": 25
}
```

El código se genera automáticamente al crear el registro. El servidor valida los datos también en el backend y prepara las consultas a SQLite con parámetros.

## Cómo probar que funciona

1. Inicia sesión y entra a **Administrar stock**. Deben aparecer 24 medicamentos iniciales.
2. Agrega un medicamento con stock 5. Debe aparecer en la tabla como **Stock crítico** y el total del dashboard sube a 25.
3. Edita ese mismo medicamento y coloca stock 0. Su estado pasa a **Sin stock**.
4. Elimínalo: el total vuelve a 24.
5. Modifica el stock de otro registro, cierra la consola y vuelve a abrir `INICIAR_WINDOWS.bat`: la modificación se conserva.
6. Prueba contraseña incorrecta: el servidor impide el inicio de sesión.

## Requisitos, alcance y seguridad

- Requiere **Python 3.9 o posterior** con la biblioteca estándar; no necesita MySQL, Node.js, npm ni dependencias de terceros.
- La aplicación se ejecuta **solo en tu computadora**: el servidor escucha en `127.0.0.1`, no en la red.
- La contraseña de demostración es pública y compartida, no apropiada para usuarios reales. La cookie de sesión se almacena como `HttpOnly` y `SameSite=Strict`, pero **el sistema no cuenta con un sistema de usuarios o seguridad de producción**.
- Las existencias iniciales y establecimientos son ficticios. El gráfico de evolución sigue siendo una **ilustración calculada a partir del stock actual**, no un registro histórico de movimientos.
- No almacenar datos médicos o personales reales ni exponer `server.py` a Internet.
- Para publicar una versión con backend necesitas alojamiento para **Python + base de datos**, por ejemplo un servidor o hosting compatible. Subir solo los HTML a un hosting estático **no ejecuta Python ni SQLite** y no actualiza automáticamente la URL `chatgpt.site` anterior.

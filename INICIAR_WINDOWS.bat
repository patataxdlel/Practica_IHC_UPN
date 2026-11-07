@echo off
setlocal
cd /d "%~dp0"
title MediCuida - Grupo 1 - Servidor local
where py >nul 2>&1
if not errorlevel 1 (
    py -3 backend\server.py
) else (
    where python >nul 2>&1
    if not errorlevel 1 (
        python backend\server.py
    ) else (
        echo No se encontro Python 3. Instala Python 3 desde https://www.python.org/downloads/
        echo Durante la instalacion, habilita Add Python to PATH.
    )
)
echo.
echo El servidor termino. Presiona una tecla para cerrar.
pause >nul

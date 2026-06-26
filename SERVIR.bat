@echo off
cd /d "%~dp0"

where python >nul 2>&1
if errorlevel 1 (
    echo Python nao encontrado. Instale Python 3 e tente novamente.
    pause
    exit /b 1
)

echo Raio-X de Negocios — http://127.0.0.1:8765
start "Calc-Roi Server" python -m http.server 8765
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765"

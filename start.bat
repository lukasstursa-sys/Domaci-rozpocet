@echo off
:: ============================================================
:: Domaci Rozpocet - Startup Script
:: Spusti backend server a otevre aplikaci v prohlizeci
:: ============================================================

:: Najdi cestu k tomuto skriptu
set "APP_DIR=%~dp0"

:: Zkontroluj, jestli uz server bezi
netstat -ano | findstr ":3001" >nul 2>&1
if %errorlevel%==0 (
    echo Server uz bezi. Otviram prohlizec...
    start http://localhost:3001
    exit /b 0
)

:: Spust backend server skryte (bez okna)
cd /d "%APP_DIR%backend"
start /b node src/index.js >nul 2>&1

:: Pockej az server nastartuje
echo Startuji Domaci Rozpocet...
timeout /t 2 /nobreak >nul

:: Otevri prohlizec
start http://localhost:3001

echo Aplikace bezi na http://localhost:3001
echo Pro ukonceni zavre toto okno nebo stiskni Ctrl+C.

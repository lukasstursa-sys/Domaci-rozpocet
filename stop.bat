@echo off
:: ============================================================
:: Domaci Rozpocet - Stop Server
:: Ukonci vsechny Node.js procesy na portu 3001
:: ============================================================

echo Zastavuji Domaci Rozpocet server...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Server zastaven.
timeout /t 2 /nobreak >nul

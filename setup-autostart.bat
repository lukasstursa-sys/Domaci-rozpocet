@echo off
:: ============================================================
:: Domaci Rozpocet - Setup Autostart
:: Prida aplikaci do Windows Autostartu + vytvori zkratku na plose
:: ============================================================

set "APP_DIR=%~dp0"
set "VBS_PATH=%APP_DIR%start-hidden.vbs"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"

echo ============================================
echo  Domaci Rozpocet - Nastaveni
echo ============================================
echo.

:: Vytvor zkratku na plose
echo Vytvarim zkratku na plose...
(
echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
echo sLinkFile = "%DESKTOP_DIR%\Domaci Rozpocet.lnk"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
echo oLink.TargetPath = "wscript.exe"
echo oLink.Arguments = """%VBS_PATH%"""
echo oLink.WorkingDirectory = "%APP_DIR%"
echo oLink.Description = "Domaci Rozpocet - Spravce Rodinnych Financi"
echo oLink.IconLocation = "%APP_DIR%extension\public\icons\icon128.png"
echo oLink.Save
) > "%TEMP%\create_shortcut.vbs"
cscript //nologo "%TEMP%\create_shortcut.vbs"
del "%TEMP%\create_shortcut.vbs"
echo [OK] Zkratka "Domaci Rozpocet" vytvorena na plose.
echo.

:: Pridej do Autostartu
echo Pridavam do Windows Autostartu...
(
echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
echo sLinkFile = "%STARTUP_DIR%\Domaci Rozpocet.lnk"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
echo oLink.TargetPath = "wscript.exe"
echo oLink.Arguments = """%VBS_PATH%"""
echo oLink.WorkingDirectory = "%APP_DIR%"
echo oLink.Description = "Domaci Rozpocet - Autostart"
echo oLink.Save
) > "%TEMP%\create_startup.vbs"
cscript //nologo "%TEMP%\create_startup.vbs"
del "%TEMP%\create_startup.vbs"
echo [OK] Pridano do Autostartu (spusti se po kazdem prihlaseni).
echo.

echo ============================================
echo  Hotovo!
echo ============================================
echo.
echo  - Na plose mas ikonu "Domaci Rozpocet"
echo  - Po restartu PC se aplikace spusti automaticky
echo  - Otevri prohlizec na http://localhost:3001
echo.
echo Pro odebrani z Autostartu smaz soubor:
echo   %STARTUP_DIR%\Domaci Rozpocet.lnk
echo.
pause

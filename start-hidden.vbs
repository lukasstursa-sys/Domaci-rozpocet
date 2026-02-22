' ============================================================
' Domaci Rozpocet - Silent Startup (bez viditelneho okna)
' Tento skript spusti server na pozadi a otevre prohlizec.
' Pouzij tento soubor jako zkratku na plose nebo v Autostartu.
' ============================================================

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Cesta k aplikaci (slozka kde je tento skript)
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
backendDir = appDir & "\backend"

' Zkontroluj jestli server uz bezi
Set exec = WshShell.Exec("cmd /c netstat -ano | findstr "":3001""")
output = exec.StdOut.ReadAll()
If Len(Trim(output)) > 0 Then
    ' Server uz bezi, jen otevri prohlizec
    WshShell.Run "cmd /c start http://localhost:3001", 0, False
    WScript.Quit
End If

' Spust backend server skryte (0 = hidden window)
WshShell.Run "cmd /c cd /d """ & backendDir & """ && node src/index.js", 0, False

' Pockej 3 sekundy nez server nastartuje
WScript.Sleep 3000

' Otevri prohlizec
WshShell.Run "cmd /c start http://localhost:3001", 0, False

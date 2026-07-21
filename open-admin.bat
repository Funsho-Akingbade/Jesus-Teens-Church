@echo off
cd /d "%~dp0"
echo Starting Jesus Teens Church server...
start "Jesus Teens Church Server" cmd /k "cd /d %~dp0 && node server.js"
timeout /t 2 /nobreak >nul
start "" http://localhost:3000/admin

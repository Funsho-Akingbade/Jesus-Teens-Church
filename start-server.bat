@echo off
setlocal
cd /d "%~dp0"
echo Starting Jesus Teens Church server...

set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
  ) else (
    echo.
    echo Node.js was not found. Please install Node.js or add it to PATH.
    echo Download it from https://nodejs.org/
    echo.
    pause
    exit /b 1
  )
)

start "Jesus Teens Church Server" cmd /k "cd /d ""%~dp0"" && ""%NODE_EXE%"" server.js"
timeout /t 2 /nobreak >nul
start "" http://localhost:3000

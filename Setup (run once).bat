@echo off
title Virutsha POS - First Time Setup
cd /d "%~dp0"

echo ==========================================================
echo    VIRUTSHA POS  -  FIRST TIME SETUP
echo ==========================================================
echo.
echo  This only needs to be run ONCE on this laptop.
echo  It may take a few minutes. Please keep this window open.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [X] Node.js is not installed.
  echo      Install it from https://nodejs.org  ^(pick the LTS version^)
  echo      then run this file again.
  echo.
  pause
  exit /b 1
)
echo  [1/5] Node.js found.

if not exist "pos-backend\.env" (
  copy "pos-backend\.env.example" "pos-backend\.env" >nul
  REM Give this installation its own random sign-in key.
  powershell -NoProfile -Command "$k = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ }); (Get-Content 'pos-backend\.env') -replace '^JWT_SECRET=.*', ('JWT_SECRET=' + $k) | Set-Content 'pos-backend\.env' -Encoding ascii"
  echo  [2/5] Created the settings file pos-backend\.env
) else (
  echo  [2/5] Settings file already exists - leaving it alone.
)

echo  [3/5] Installing the server ^(this takes a minute^)...
cd pos-backend
call npm install --no-audit --no-fund
if errorlevel 1 goto failed

echo  [4/5] Creating the admin login and the starter menu...
call npm run seed
if errorlevel 1 goto failed

cd ..\pos-frontend
echo  [5/5] Building the screens...
call npm install --no-audit --no-fund
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
cd ..

echo.
echo ==========================================================
echo    SETUP FINISHED
echo ==========================================================
echo.
echo  Now double-click  "Start POS.bat"  to open the system.
echo.
echo  Login:     admin@virutsha.lk
echo  Password:  admin123
echo.
echo  Please change this password after the first login.
echo.
pause
exit /b 0

:failed
echo.
echo  [X] Something went wrong above. Scroll up to see the message.
echo      The most common cause is MongoDB not being installed or not running.
echo.
pause
exit /b 1

@echo off
title Virutsha POS - KEEP THIS WINDOW OPEN
cd /d "%~dp0pos-backend"

echo ==========================================================
echo    VIRUTSHA POS
echo ==========================================================
echo.
echo  The system is starting. Your browser will open shortly.
echo.
echo  KEEP THIS WINDOW OPEN while the restaurant is using
echo  the system. Closing it shuts the POS down.
echo.
echo  To stop at the end of the day: close this window.
echo ==========================================================
echo.

if not exist "node_modules" (
  echo  [X] The system has not been set up yet.
  echo      Run "Setup ^(run once^).bat" first.
  echo.
  pause
  exit /b 1
)

REM Open the browser a few seconds after the server has had time to start.
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:8000'"

node app.js

echo.
echo  The POS has stopped.
pause

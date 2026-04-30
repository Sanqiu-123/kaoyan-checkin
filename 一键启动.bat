@echo off
setlocal

pushd "%~dp0"
if errorlevel 1 (
  echo Failed to enter project folder.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\start-app.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

popd

if not "%EXIT_CODE%"=="0" (
  echo.
  echo Startup failed. Press any key to close.
  pause >nul
)

exit /b %EXIT_CODE%

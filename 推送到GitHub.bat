@echo off
setlocal

pushd "%~dp0"
if errorlevel 1 (
  echo Failed to enter project folder.
  pause
  exit /b 1
)

echo Pushing kaoyan-checkin to GitHub...
echo Repository: https://github.com/Sanqiu-123/kaoyan-checkin
echo.

git push -u origin main
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
  echo Push succeeded.
  echo You can now import the repository in Vercel.
) else (
  echo Push failed.
  echo Please check your network connection to github.com:443 and GitHub authorization.
)

echo.
pause
popd
exit /b %EXIT_CODE%

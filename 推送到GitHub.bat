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

echo Checking local changes...
git status --short
echo.

echo Staging local changes...
git add .
if errorlevel 1 (
  echo Failed to stage changes.
  pause
  popd
  exit /b 1
)

git diff --cached --quiet
if "%ERRORLEVEL%"=="0" (
  echo No local file changes to commit.
) else (
  echo Creating commit...
  git commit -m "Update app"
  if errorlevel 1 (
    echo Commit failed.
    pause
    popd
    exit /b 1
  )
)

echo.
echo Pushing commits...
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

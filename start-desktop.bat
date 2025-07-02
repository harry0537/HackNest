@echo off
echo ========================================
echo         HackNest Desktop Edition
echo ========================================
echo.

REM Kill any existing processes
echo Cleaning up existing processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im electron.exe >nul 2>&1

echo.
echo Starting HackNest Desktop Application...
echo Backend will start on port 3001
echo Frontend will start on port 3000  
echo Electron desktop window will open automatically
echo.

REM Set development environment and start
set NODE_ENV=development
npm run electron:dev

echo.
echo Desktop application closed.
pause 
@echo off
echo Starting HackNest Development Environment...
echo.

REM Kill any existing Node processes
echo Cleaning up existing processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im electron.exe >nul 2>&1

echo.
echo Starting Backend Server (port 3001)...
start /B cmd /c "cd /d backend && npm start > ../backend.log 2>&1"

REM Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Start frontend
echo.
echo Starting Frontend Server (port 3000)...
echo Note: Frontend will auto-open in browser
cd frontend
npm run dev

pause 
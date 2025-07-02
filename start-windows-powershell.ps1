Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        HackNest Development Setup" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "electron" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host ""
Write-Host "Choose your preferred mode:" -ForegroundColor Green
Write-Host "1. Development Mode (Manual - Backend + Frontend in separate terminals)" -ForegroundColor White
Write-Host "2. Desktop App Mode (Automated - Electron desktop application)" -ForegroundColor White
Write-Host "3. Quick Setup (Automated - Uses npm run dev)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1, 2, or 3)"

switch ($choice) {
    "1" {
        Write-Host "Starting Development Mode..." -ForegroundColor Green
        Write-Host ""
        Write-Host "STEP 1: Start Backend Server" -ForegroundColor Yellow
        Write-Host "Open a new PowerShell window and run:" -ForegroundColor White
        Write-Host "cd backend; npm start" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "STEP 2: Start Frontend Server" -ForegroundColor Yellow  
        Write-Host "Open another PowerShell window and run:" -ForegroundColor White
        Write-Host "cd frontend; npm run dev" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Then access: http://localhost:3000" -ForegroundColor Green
    }
    "2" {
        Write-Host "Starting Desktop Application..." -ForegroundColor Green
        $env:NODE_ENV = "development"
        npm run electron:dev
    }
    "3" {
        Write-Host "Starting Quick Setup..." -ForegroundColor Green
        npm run dev
    }
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "HackNest setup completed!" -ForegroundColor Green
Read-Host "Press Enter to exit" 
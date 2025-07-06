# HackNest Online Deployment Script (PowerShell)
# Supports Vercel, Railway, and Netlify deployments

Write-Host "🚀 HackNest Online Deployment" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Function to check if command exists
function Test-CommandExists {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Build frontend
Write-Host "`n📦 Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build
Set-Location ..

# Prepare backend for deployment
Write-Host "`n📦 Preparing backend..." -ForegroundColor Yellow
Set-Location backend
npm install --production
Set-Location ..

# Deployment options
Write-Host "`nSelect deployment platform:" -ForegroundColor Green
Write-Host "1) Vercel"
Write-Host "2) Railway"
Write-Host "3) Netlify + External API"
Write-Host "4) Custom deployment"
$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n🔷 Deploying to Vercel..." -ForegroundColor Blue
        if (Test-CommandExists "vercel") {
            vercel --prod
        } else {
            Write-Host "❌ Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Red
            Write-Host "Then run: vercel --prod"
        }
    }
    "2" {
        Write-Host "`n🚂 Deploying to Railway..." -ForegroundColor Blue
        if (Test-CommandExists "railway") {
            railway up
        } else {
            Write-Host "❌ Railway CLI not found. Install from: https://docs.railway.app/develop/cli" -ForegroundColor Red
            Write-Host "Then run: railway up"
        }
    }
    "3" {
        Write-Host "`n🔶 Deploying to Netlify..." -ForegroundColor Blue
        if (Test-CommandExists "netlify") {
            Set-Location frontend
            netlify deploy --prod --dir=dist
            Set-Location ..
            Write-Host "⚠️  Note: Deploy backend separately to a service like Railway or Heroku" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Netlify CLI not found. Install with: npm i -g netlify-cli" -ForegroundColor Red
            Write-Host "Then run: netlify deploy --prod --dir=frontend/dist"
        }
    }
    "4" {
        Write-Host "`n📋 Custom deployment preparation complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Frontend build: ./frontend/dist"
        Write-Host "Backend: ./backend"
        Write-Host ""
        Write-Host "Environment variables needed:" -ForegroundColor Yellow
        Write-Host "- NODE_ENV=production"
        Write-Host "- FRONTEND_URL=<your-frontend-url>"
        Write-Host "- BACKEND_URL=<your-backend-url>"
    }
}

Write-Host "`n✅ Deployment preparation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Post-deployment checklist:" -ForegroundColor Cyan
Write-Host "- [ ] Set environment variables in your hosting platform"
Write-Host "- [ ] Configure custom domain (if applicable)"
Write-Host "- [ ] Test all features in production"
Write-Host "- [ ] Monitor logs for any issues" 
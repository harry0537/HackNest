#!/bin/bash

# HackNest Online Deployment Script
# Supports Vercel, Railway, and Netlify deployments

echo "🚀 HackNest Online Deployment"
echo "=============================="

# Check if running on Windows and use appropriate commands
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    NPM_CMD="npm.cmd"
else
    NPM_CMD="npm"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Build frontend
echo "📦 Building frontend..."
cd frontend
$NPM_CMD install
$NPM_CMD run build
cd ..

# Prepare backend for deployment
echo "📦 Preparing backend..."
cd backend
$NPM_CMD install --production
cd ..

# Deployment options
echo ""
echo "Select deployment platform:"
echo "1) Vercel"
echo "2) Railway"
echo "3) Netlify + External API"
echo "4) Custom deployment"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🔷 Deploying to Vercel..."
        if command_exists vercel; then
            vercel --prod
        else
            echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
            echo "Then run: vercel --prod"
        fi
        ;;
    2)
        echo "🚂 Deploying to Railway..."
        if command_exists railway; then
            railway up
        else
            echo "❌ Railway CLI not found. Install from: https://docs.railway.app/develop/cli"
            echo "Then run: railway up"
        fi
        ;;
    3)
        echo "🔶 Deploying to Netlify..."
        if command_exists netlify; then
            cd frontend
            netlify deploy --prod --dir=dist
            cd ..
            echo "⚠️  Note: Deploy backend separately to a service like Railway or Heroku"
        else
            echo "❌ Netlify CLI not found. Install with: npm i -g netlify-cli"
            echo "Then run: netlify deploy --prod --dir=frontend/dist"
        fi
        ;;
    4)
        echo "📋 Custom deployment preparation complete!"
        echo ""
        echo "Frontend build: ./frontend/dist"
        echo "Backend: ./backend"
        echo ""
        echo "Environment variables needed:"
        echo "- NODE_ENV=production"
        echo "- FRONTEND_URL=<your-frontend-url>"
        echo "- BACKEND_URL=<your-backend-url>"
        ;;
esac

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "Post-deployment checklist:"
echo "- [ ] Set environment variables in your hosting platform"
echo "- [ ] Configure custom domain (if applicable)"
echo "- [ ] Test all features in production"
echo "- [ ] Monitor logs for any issues" 
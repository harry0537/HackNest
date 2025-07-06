# HackNest Online Deployment Guide

This guide covers deploying HackNest to various online platforms. The online version provides the same UI and experience as the desktop version, with some limitations in serverless environments.

## 🌐 Deployment Options

### 1. Vercel (Recommended for Quick Deploy)

**Pros:** Free tier, automatic HTTPS, global CDN, serverless functions
**Cons:** Limited tool availability in serverless environment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Environment Variables:**
- `NODE_ENV=production`
- `VERCEL=1`

### 2. Railway (Full Features)

**Pros:** Full tool support, persistent storage, WebSocket support
**Cons:** Requires paid plan for 24/7 availability

```bash
# Install Railway CLI
# Visit: https://docs.railway.app/develop/cli

# Deploy
railway up
```

### 3. Netlify + External API

**Pros:** Excellent for frontend, free tier
**Cons:** Requires separate backend hosting

```bash
# Deploy frontend to Netlify
cd frontend
netlify deploy --prod --dir=dist

# Deploy backend separately (Railway, Heroku, etc.)
```

### 4. Self-Hosted (Full Control)

**Pros:** Complete control, all features available
**Cons:** Requires server management

```bash
# On your server
git clone https://github.com/harry0537/HackNest.git
cd HackNest

# Install dependencies
npm install
cd frontend && npm install && npm run build
cd ../backend && npm install

# Start with PM2
pm2 start backend/server.js --name hacknest-api
pm2 start "npx serve frontend/dist" --name hacknest-frontend
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Production Settings
NODE_ENV=production
PORT=3001

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-api-domain.com

# Platform Detection
VERCEL=1  # If using Vercel
RAILWAY=1 # If using Railway

# Optional: API Keys
SHODAN_API_KEY=your-key
VIRUSTOTAL_API_KEY=your-key
```

### Frontend Configuration

Update `frontend/.env`:

```env
VITE_API_URL=https://your-api-domain.com
VITE_BASE_URL=/
VITE_IS_ELECTRON=false
```

## 📊 Feature Availability by Platform

| Feature | Desktop | Dedicated Server | Serverless (Vercel) |
|---------|---------|------------------|---------------------|
| Basic Port Scanning | ✅ | ✅ | ✅ (Limited) |
| Advanced Nmap Scans | ✅ | ✅ | ❌ |
| Web Vulnerability Scanning | ✅ | ✅ | ❌ |
| Metasploit Integration | ✅ | ✅ | ❌ |
| SQLMap | ✅ | ✅ | ❌ |
| SSL/TLS Analysis | ✅ | ✅ | ✅ |
| HTTP Service Detection | ✅ | ✅ | ✅ |
| Report Generation | ✅ | ✅ | ✅ |
| Windows Enumeration | ✅ | ❌ | ❌ |
| Local File Access | ✅ | ❌ | ❌ |

## 🚀 Quick Deploy Scripts

### For Windows (PowerShell)
```powershell
./deploy-online.ps1
```

### For Linux/Mac
```bash
chmod +x deploy-online.sh
./deploy-online.sh
```

## 🔒 Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **CORS**: Configure allowed origins properly
3. **Rate Limiting**: Enabled by default (100 requests/15 min)
4. **HTTPS**: Always use HTTPS in production
5. **Authentication**: Consider adding auth for production use

## 📱 Progressive Web App (PWA)

The online version supports PWA features:
- Installable on mobile/desktop
- Offline capability (limited)
- Push notifications (future)

## 🐛 Troubleshooting

### CORS Issues
- Ensure `FRONTEND_URL` and `BACKEND_URL` are correctly set
- Check that your domain is in the allowed origins list

### Tool Availability
- Serverless platforms have limited tool support
- Use dedicated server for full functionality

### Build Failures
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure Node.js version >= 14.x

## 📈 Monitoring

### Recommended Services
- **Logs**: LogRocket, Sentry
- **Uptime**: UptimeRobot, Pingdom
- **Analytics**: Google Analytics, Plausible

## 🔄 Updates

To update your deployment:

```bash
git pull origin main
npm install
cd frontend && npm install && npm run build
cd ../backend && npm install
# Restart your services
```

## 💡 Best Practices

1. **Use Environment Variables**: Never hardcode sensitive data
2. **Enable Caching**: Use CDN for static assets
3. **Monitor Performance**: Track API response times
4. **Regular Updates**: Keep dependencies updated
5. **Backup Data**: Regular backups of scan results

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/harry0537/HackNest/issues)
- **Discussions**: [GitHub Discussions](https://github.com/harry0537/HackNest/discussions)
- **Security**: Report vulnerabilities privately

---

Remember: The online version in serverless environments has limited tool availability. For full functionality, use the desktop version or deploy to a dedicated server. 
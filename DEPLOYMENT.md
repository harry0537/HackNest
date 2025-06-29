# HackNest Deployment Guide

## 🚀 Current Status
- ✅ Backend: Ready for Railway deployment
- ✅ Security: All vulnerabilities fixed
- ✅ Cross-platform: Windows/Linux compatible
- ⏳ Frontend: Ready for Vercel deployment

## 📋 Next Steps Checklist

### 1. Backend Deployment (Railway)
- [ ] Check Railway dashboard for deployment status
- [ ] Verify backend URL is accessible
- [ ] Test API endpoints:
  - `GET /api/health` - Server health check
  - `GET /api/system/info` - System information
  - `POST /api/recon/whois` - WHOIS lookup test

### 2. Frontend Deployment (Vercel)
1. Go to [vercel.com](https://vercel.com/)
2. Click "New Project" 
3. Import your GitHub repository
4. Set configuration:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables:
   - `VITE_API_URL`: Your Railway backend URL

### 3. Configuration Updates
1. Update `frontend/src/utils/api.js`:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
   ```

2. Update backend CORS (if needed):
   ```javascript
   origin: [..., 'https://your-vercel-app.vercel.app']
   ```

### 4. Testing Checklist
- [ ] Backend health check responds
- [ ] Frontend loads without errors
- [ ] API calls work from frontend to backend
- [ ] WHOIS lookup works (with nslookup fallback)
- [ ] DNS enumeration works
- [ ] Ping functionality works
- [ ] Error handling works properly

## 🌐 Expected URLs
- **Backend**: `https://your-app.railway.app`
- **Frontend**: `https://your-app.vercel.app`

## 🔧 Troubleshooting

### Common Issues:
1. **CORS Errors**: Add your Vercel URL to backend CORS settings
2. **API Connection**: Verify VITE_API_URL environment variable
3. **Tool Commands**: Check `/api/system/info` for available tools
4. **Rate Limiting**: Trust proxy is configured for production

### Debug Commands:
```bash
# Test backend health
curl https://your-app.railway.app/api/health

# Test system info
curl https://your-app.railway.app/api/system/info

# Test WHOIS (should use nslookup fallback)
curl -X POST https://your-app.railway.app/api/recon/whois \
  -H "Content-Type: application/json" \
  -d '{"target":"google.com"}'
```

## 📈 Future Enhancements
- [ ] Add user authentication
- [ ] Implement result caching
- [ ] Add more security tools
- [ ] Create API documentation
- [ ] Add monitoring/analytics
- [ ] Implement file upload for bulk scans

## 🚨 Security Notes
- Always test on authorized targets only
- Set up proper rate limiting in production
- Monitor usage and implement quotas if needed
- Consider adding user authentication for public deployment 
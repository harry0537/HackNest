# 🚀 Vercel Deployment Guide for HackNest

## ✅ What's Been Configured

Your HackNest project is now **optimized for Vercel** with:
- ✅ **vercel.json** - Complete deployment configuration
- ✅ **Root package.json** - Project structure definition  
- ✅ **Backend as serverless** - Express app exported for Vercel functions
- ✅ **Frontend build** - Vite optimized for static deployment
- ✅ **Proxy settings** - Configured for Vercel's infrastructure

## 🎯 Quick Deployment Steps

### 1. **Import to Vercel**
1. Go to [vercel.com](https://vercel.com/)
2. Click "**New Project**"
3. Import your GitHub repository: `harry0537/HackNest`
4. **Framework**: Auto-detected (Vite)
5. **Root Directory**: Leave empty (we handle this in vercel.json)
6. Click "**Deploy**"

### 2. **Vercel Will Automatically:**
- ✅ Install dependencies for both frontend and backend
- ✅ Build the frontend with Vite
- ✅ Deploy backend as serverless functions
- ✅ Route `/api/*` to backend, everything else to frontend

## 🌐 Expected URLs

After deployment:
- **Frontend**: `https://your-project.vercel.app`
- **Backend API**: `https://your-project.vercel.app/api/health`
- **System Info**: `https://your-project.vercel.app/api/system/info`

## 🧪 Testing Your Deployment

### Quick Health Check:
```bash
# Replace with your actual Vercel URL
curl https://your-project.vercel.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "HackNest API is running",
  "timestamp": "2025-06-29T...",
  "version": "1.0.0"
}
```

### Test WHOIS Function:
```bash
curl -X POST https://your-project.vercel.app/api/recon/whois \
  -H "Content-Type: application/json" \
  -d '{"target":"google.com"}'
```

## 🔧 Advanced Configuration (Optional)

### Environment Variables (if needed):
- `NODE_ENV`: `production` (auto-set by Vercel)
- `VERCEL`: `1` (auto-set by Vercel)

### Custom Domain (Optional):
1. Go to your Vercel project dashboard
2. Settings → Domains
3. Add your custom domain

## 🚨 Important Notes

### Security Tools in Serverless:
- **WHOIS**: Uses `nslookup` fallback (Windows compatible)
- **DNS**: Uses `nslookup` instead of `dig` for better compatibility
- **Ping**: Works with platform detection
- **All tools**: Cross-platform compatible

### Limitations:
- **Cold starts**: First request may be slower (normal for serverless)
- **Execution time**: Max 10 seconds per function (Hobby plan)
- **Memory**: Limited serverless memory (upgrade plan if needed)

## ✅ Verification Checklist

- [ ] Vercel deployment successful
- [ ] Frontend loads at your Vercel URL
- [ ] `/api/health` returns OK status
- [ ] `/api/system/info` shows platform info
- [ ] WHOIS lookup works from frontend
- [ ] No CORS errors in browser console

## 🎉 Success!

Your **HackNest Ethical Hacking Toolkit** is now:
- ✅ **Live on Vercel**
- ✅ **Globally accessible**
- ✅ **Serverless backend**
- ✅ **Cross-platform compatible**
- ✅ **Production ready**

Share your live URL and start ethical hacking! 🔒🌍 
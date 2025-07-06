const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import route modules
const reconRoutes = require('./routes/recon');
const scanRoutes = require('./routes/scan');
const webRoutes = require('./routes/web');
const exploitRoutes = require('./routes/exploit');
const reportRoutes = require('./routes/reports');
const systemRoutes = require('./routes/system');
const windowsRoutes = require('./routes/windows');

// Import serverless-compatible routes
const scanServerlessRoutes = require('./routes/scan-serverless');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for production deployments
if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.RAILWAY) {
  app.set('trust proxy', 1);
}

// Security middleware with relaxed settings for desktop
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable for desktop compatibility
}));

// CORS configuration for both desktop and online
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or desktop)
    if (!origin) return callback(null, true);
    
    // Production allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'https://hacknest.vercel.app',
      'https://hacknest-frontend.railway.app',
      'https://hacknest.netlify.app',
      process.env.FRONTEND_URL,
      process.env.BACKEND_URL
    ].filter(Boolean);
    
    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Request-Id']
};

app.use(cors(corsOptions));

// Rate limiting with proxy support
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for successful requests
  skipSuccessfulRequests: false,
  // Use a more permissive key generator for development
  keyGenerator: (request) => {
    if (process.env.NODE_ENV === 'production') {
      return request.ip;
    }
    // In development, use a combination of IP and user agent for better testing
    return request.ip + ':' + (request.get('User-Agent') || '');
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for reports
app.use('/reports', express.static(path.join(__dirname, 'data/results')));

// API Routes
app.use('/api/recon', reconRoutes);
app.use('/api/scan', process.env.VERCEL ? scanServerlessRoutes : scanRoutes);
app.use('/api/web', webRoutes);
app.use('/api/exploit', exploitRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/windows', windowsRoutes);

// Serverless-specific routes
if (process.env.VERCEL) {
  app.use('/api/scan-serverless', scanServerlessRoutes);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HackNest API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Export the Express app for Vercel
module.exports = app;

// Only start the server in development or when not running on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 HackNest Backend Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔒 Security tools API ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Trust proxy: ${app.get('trust proxy') ? 'enabled' : 'disabled'}`);
  });
} 
// Environment detection and configuration utility

// Check if running in Electron
export const isElectron = () => {
  return window && window.process && window.process.type === 'renderer';
};

// Check if running in production
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

// Check if running on Vercel or other serverless platform
export const isServerless = () => {
  return process.env.VERCEL || window.location.hostname.includes('vercel.app') || 
         window.location.hostname.includes('railway.app') || 
         window.location.hostname.includes('netlify.app');
};

// Get the appropriate API base URL
export const getApiBaseUrl = () => {
  // If in Electron, always use localhost
  if (isElectron()) {
    return 'http://localhost:3001';
  }
  
  // If API URL is explicitly set
  if (process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  
  // If in production/serverless, use relative path
  if (isProduction() || isServerless()) {
    return '';
  }
  
  // Default to localhost for development
  return 'http://localhost:3001';
};

// Get feature availability based on environment
export const getFeatureAvailability = () => {
  const isDesktop = isElectron();
  const isOnline = !isDesktop;
  const isServerlessEnv = isServerless();
  
  return {
    // All features available in desktop
    fullSystemScanning: isDesktop || !isServerlessEnv,
    advancedExploits: isDesktop || !isServerlessEnv,
    localFileAccess: isDesktop,
    systemCommands: isDesktop || !isServerlessEnv,
    
    // Limited features in serverless
    basicPortScanning: true,
    httpServiceDetection: true,
    sslAnalysis: true,
    reportGeneration: true,
    
    // UI features
    darkMode: true,
    exportReports: true,
    saveLocalData: isDesktop,
    
    // Tool-specific availability
    nmap: isDesktop || !isServerlessEnv,
    metasploit: isDesktop || !isServerlessEnv,
    sqlmap: isDesktop || !isServerlessEnv,
    nikto: isDesktop || !isServerlessEnv,
    
    // Environment info
    environment: isDesktop ? 'desktop' : (isServerlessEnv ? 'serverless' : 'dedicated-server'),
    platform: isDesktop ? 'electron' : 'web'
  };
};

// Get environment-specific messages
export const getEnvironmentMessage = () => {
  const features = getFeatureAvailability();
  
  if (features.environment === 'serverless') {
    return {
      type: 'info',
      message: 'Running in limited mode. Some advanced features require the desktop version or dedicated server deployment.',
      details: 'Basic scanning and analysis tools are available. For full functionality, download the desktop version.'
    };
  }
  
  if (features.environment === 'desktop') {
    return {
      type: 'success',
      message: 'Running HackNest Desktop with full feature access.',
      details: 'All security tools and features are available.'
    };
  }
  
  return {
    type: 'success',
    message: 'Running HackNest on dedicated server.',
    details: 'Full web-based functionality available.'
  };
};

// Export configuration based on environment
export const config = {
  apiBaseUrl: getApiBaseUrl(),
  features: getFeatureAvailability(),
  isElectron: isElectron(),
  isProduction: isProduction(),
  isServerless: isServerless()
};

export default config; 
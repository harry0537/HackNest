import axios from 'axios';
import toast from 'react-hot-toast';

// Detect if running in Electron
const isElectron = window.windowAPI?.isElectron || false;

// Set API base URL based on environment
const getAPIBaseURL = () => {
  // If in Electron, always use localhost backend on port 3001
  if (isElectron) {
    return 'http://localhost:3001/api';
  }
  
  // If in development (Vite dev server)
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Production web deployment
  return import.meta.env.VITE_API_URL || '/api';
};

const API_BASE_URL = getAPIBaseURL();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for long scans
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for loading states
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. The scan might still be running.');
    } else if (error.response) {
      const message = error.response.data?.error || 'An error occurred';
      toast.error(message);
    } else if (error.request) {
      toast.error('Cannot connect to backend server');
    } else {
      toast.error('Request failed');
    }
    
    throw error;
  }
);

// Health check
export const healthCheck = () => api.get('/health');

// Recon API endpoints
export const reconAPI = {
  whois: (data) => api.post('/recon/whois', data),
  nslookup: (data) => api.post('/recon/nslookup', data),
  dig: (data) => api.post('/recon/dig', data),
  ping: (data) => api.post('/recon/ping', data),
  traceroute: (data) => api.post('/recon/traceroute', data),
};

// Scan API endpoints (serverless-compatible + traditional)
export const scanAPI = {
  // Serverless-compatible tools
  portscan: (data) => api.post('/scan/portscan', data),
  httpDetect: (data) => api.post('/scan/http-detect', data),
  sslInfo: (data) => api.post('/scan/ssl-info', data),
  getAvailable: () => api.get('/scan/available'),
  
  // Traditional tools (for dedicated infrastructure)
  nmapQuick: (target, ports = 'top-ports 1000') => api.post('/scan/nmap/quick', { target, ports }),
  nmapFull: (target, scan_type = 'comprehensive') => api.post('/scan/nmap/full', { target, scan_type }),
  nmapCustom: (target, options = '-sS', ports = '1-1000', timing = 'T4') => 
    api.post('/scan/nmap/custom', { target, options, ports, timing }),
  nmapServiceDetection: (target, ports = '1-1000') => 
    api.post('/scan/nmap/service-detection', { target, ports }),
  getPresets: () => api.get('/scan/presets'),
};

// Web testing API endpoints
export const webAPI = {
  nikto: (data) => api.post('/web/nikto', data),
  whatweb: (data) => api.post('/web/whatweb', data),
  dirb: (data) => api.post('/web/dirb', data),
  headers: (data) => api.post('/web/headers', data),
};

// Exploit API endpoints
export const exploitAPI = {
  sqlmap: (target, method = 'GET', data = '', risk = 1, level = 1, batch = true) =>
    api.post('/exploit/sqlmap', { target, method, data, risk, level, batch }),
  sqlmapEnumerate: (target, database = '', table = '', column = '', method = 'GET', data = '') =>
    api.post('/exploit/sqlmap/enumerate', { target, database, table, column, method, data }),
  xssTest: (target, parameter, payload = '<script>alert("XSS")</script>') =>
    api.post('/exploit/xss-test', { target, parameter, payload }),
  getPresets: () => api.get('/exploit/presets'),
  getDisclaimer: () => api.get('/exploit/disclaimer'),
};

// Reports API endpoints
export const reportsAPI = {
  getHistory: (limit = 50, tool = null) => {
    const params = { limit };
    if (tool) params.tool = tool;
    return api.get('/reports/history', { params });
  },
  getScan: (scanId) => api.get(`/reports/scan/${scanId}`),
  deleteScan: (scanId) => api.delete(`/reports/scan/${scanId}`),
  generateReport: (scan_ids, format = 'json', title = 'HackNest Security Report') =>
    api.post('/reports/generate', { scan_ids, format, title }),
  downloadReport: (fileName) => {
    window.open(`${API_BASE_URL}/reports/download/${fileName}`, '_blank');
  },
  getReports: () => api.get('/reports/list'),
  getStats: () => api.get('/reports/stats'),
  searchScans: (query, tool = null, scan_type = null, limit = 50) => {
    const params = { limit };
    if (query) params.query = query;
    if (tool) params.tool = tool;
    if (scan_type) params.scan_type = scan_type;
    return api.get('/reports/search', { params });
  },
  exportScans: (scan_ids, format = 'csv') => {
    return api.post('/reports/export', { scan_ids, format }, {
      responseType: 'blob',
      headers: {
        'Accept': format === 'csv' ? 'text/csv' : format === 'xml' ? 'application/xml' : 'application/json'
      }
    }).then(response => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hacknest_export_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },
};

// Windows Security API endpoints
export const windowsAPI = {
  getTools: () => api.get('/windows/tools'),
  systeminfo: (data = {}) => api.post('/windows/systeminfo', data),
  ipconfig: (data = {}) => api.post('/windows/ipconfig', data),
  netstat: (data = {}) => api.post('/windows/netstat', data),
  firewall: (data = {}) => api.post('/windows/firewall', data),
  services: (data = {}) => api.post('/windows/services', data),
  processes: (data = {}) => api.post('/windows/processes', data),
  hotfix: (data = {}) => api.post('/windows/hotfix', data),
  users: (data = {}) => api.post('/windows/users', data),
  groups: (data = {}) => api.post('/windows/groups', data),
  wifiProfiles: (data = {}) => api.post('/windows/wifi-profiles', data),
  openPorts: (data = {}) => api.post('/windows/open-ports', data),
  installedSoftware: (data = {}) => api.post('/windows/installed-software', data),
  arp: (data = {}) => api.post('/windows/arp', data),
  route: (data = {}) => api.post('/windows/route', data),
};

// Utility functions
export const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

export const formatScanDuration = (start, end) => {
  const duration = new Date(end) - new Date(start);
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'high':
    case 'critical':
      return 'text-terminal-red';
    case 'medium':
      return 'text-terminal-yellow';
    case 'low':
    case 'info':
      return 'text-terminal-green';
    default:
      return 'text-dark-400';
  }
};

export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'success':
    case 'completed':
    case 'up':
      return 'status-badge status-success';
    case 'error':
    case 'failed':
    case 'down':
      return 'status-badge status-error';
    case 'warning':
    case 'timeout':
      return 'status-badge status-warning';
    case 'running':
    case 'scanning':
      return 'status-badge status-info';
    default:
      return 'status-badge bg-dark-600 text-dark-300';
  }
};

// Note: scanAPI is defined above with both serverless and traditional tools

export default api; 
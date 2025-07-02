import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Radar, 
  Globe, 
  Monitor,
  Shield,
  Activity,
  CheckCircle,
  Server,
  AlertTriangle,
  Loader,
  Zap,
  TrendingUp,
  Target
} from 'lucide-react'
import { healthCheck } from '../utils/api'
import toast from 'react-hot-toast'

function Dashboard() {
  const [systemStatus, setSystemStatus] = useState({
    backend: null, // null = checking, true = connected, false = error
    platform: 'Unknown',
    isElectron: false,
    lastChecked: null,
    error: null
  });

  const [stats, setStats] = useState({
    toolsAvailable: 0,
    recentScans: 0,
    uptime: 'Unknown'
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect Electron and platform
    const isElectron = window.windowAPI?.isElectron || false;
    const platform = window.windowAPI?.platform || 
      (navigator.platform.includes('Win') ? 'Windows' : 
       navigator.platform.includes('Mac') ? 'macOS' : 
       navigator.platform.includes('Linux') ? 'Linux' : 'Unknown');
    
    checkSystemHealth(isElectron, platform);
  }, []);

  const checkSystemHealth = async (isElectron, platform) => {
    setIsLoading(true);
    
    try {
      const health = await healthCheck();
      
      setSystemStatus({
        backend: true,
        platform,
        isElectron,
        lastChecked: new Date(),
        error: null
      });

      // Update stats if health check returns additional data
      if (health.stats) {
        setStats(health.stats);
      } else {
        setStats({
          toolsAvailable: 8, // Default count
          recentScans: 0,
          uptime: 'Active'
        });
      }

    } catch (error) {
      console.error('Health check failed:', error);
      setSystemStatus({
        backend: false,
        platform,
        isElectron,
        lastChecked: new Date(),
        error: error.message || 'Backend connection failed'
      });
      
      // Show toast only if this is not the initial load
      if (systemStatus.backend !== null) {
        toast.error('Backend connection lost');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retryConnection = () => {
    const isElectron = window.windowAPI?.isElectron || false;
    const platform = systemStatus.platform;
    checkSystemHealth(isElectron, platform);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Initializing HackNest</h2>
          <p className="text-gray-400">Checking system status...</p>
        </div>
      </div>
    );
  }

  const containerStyle = {
    padding: '24px',
    minHeight: '100vh',
    backgroundColor: '#111827',
    color: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif'
  };

  const cardStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    transition: 'all 0.2s ease-in-out'
  };

  const headerCardStyle = {
    background: systemStatus.backend 
      ? 'linear-gradient(135deg, #dc2626, #b91c1c)' 
      : 'linear-gradient(135deg, #dc2626, #991b1b)',
    borderRadius: '12px',
    padding: '32px',
    color: '#ffffff',
    marginBottom: '32px',
    position: 'relative',
    overflow: 'hidden'
  };

  const statCardStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '12px',
    padding: '24px',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    cursor: 'pointer'
  };

  const buttonStyle = {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    overflow: 'hidden'
  };

  // Error state
  if (systemStatus.backend === false) {
    return (
      <div style={containerStyle}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">Backend Connection Failed</h1>
            <p className="text-gray-400 mb-6">
              {systemStatus.error || 'Unable to connect to the HackNest backend server.'}
            </p>
            <button
              onClick={retryConnection}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Retry Connection
            </button>
            <div className="mt-6 p-4 bg-gray-800 rounded-lg text-left">
              <h3 className="font-medium text-white mb-2">Troubleshooting Tips:</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Ensure backend server is running on port 3001</li>
                <li>• Check if all Node.js processes are properly started</li>
                <li>• Try running: npm run dev or npm run electron:dev</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Welcome Header */}
      <div style={headerCardStyle}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div style={{
                padding: '16px', 
                backgroundColor: 'rgba(255,255,255,0.15)', 
                borderRadius: '16px',
                backdropFilter: 'blur(10px)'
              }}>
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">HackNest Dashboard</h1>
                <p style={{color: '#fecaca', fontSize: '18px', fontWeight: '500'}}>
                  {systemStatus.isElectron ? '🖥️ Windows Desktop Edition' : '🌐 Web Edition'} - Professional Security Testing
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 text-green-300 mb-1">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">System Online</span>
              </div>
              <p className="text-sm text-red-200">
                Last check: {systemStatus.lastChecked?.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{marginBottom: '32px'}}>
        <div 
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{color: '#9ca3af', fontSize: '14px', marginBottom: '8px', fontWeight: '500'}}>Platform</p>
              <p className="text-2xl font-bold text-white">{systemStatus.platform}</p>
            </div>
            <Monitor className="h-10 w-10" style={{color: '#3b82f6'}} />
          </div>
        </div>

        <div 
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{color: '#9ca3af', fontSize: '14px', marginBottom: '8px', fontWeight: '500'}}>Tools Available</p>
              <p className="text-2xl font-bold text-white">{stats.toolsAvailable}</p>
            </div>
            <Target className="h-10 w-10" style={{color: '#10b981'}} />
          </div>
        </div>

        <div 
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{color: '#9ca3af', fontSize: '14px', marginBottom: '8px', fontWeight: '500'}}>Status</p>
              <p className="text-2xl font-bold text-white">{stats.uptime}</p>
            </div>
            <Activity className="h-10 w-10" style={{color: '#10b981'}} />
          </div>
        </div>

        <div 
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{color: '#9ca3af', fontSize: '14px', marginBottom: '8px', fontWeight: '500'}}>Mode</p>
              <p className="text-2xl font-bold text-white">{systemStatus.isElectron ? 'Desktop' : 'Web'}</p>
            </div>
            <Server className="h-10 w-10" style={{color: '#10b981'}} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={cardStyle}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Security Testing Modules</h2>
          <div className="flex items-center gap-3">
            <Link
              to="/wizard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
            >
              <Shield className="h-4 w-4" />
              Start Wizard
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/recon"
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Search className="h-7 w-7" />
            <div>
              <div style={{fontWeight: '600', fontSize: '18px'}}>Reconnaissance</div>
              <div style={{fontSize: '14px', opacity: '0.8'}}>WHOIS, DNS, Network Discovery</div>
            </div>
          </Link>

          <Link
            to="/scan"
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Radar className="h-7 w-7" />
            <div>
              <div style={{fontWeight: '600', fontSize: '18px'}}>Port Scanning</div>
              <div style={{fontSize: '14px', opacity: '0.8'}}>Network port enumeration with Nmap</div>
            </div>
          </Link>

          <Link
            to="/web"
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Globe className="h-7 w-7" />
            <div>
              <div style={{fontWeight: '600', fontSize: '18px'}}>Web Application Testing</div>
              <div style={{fontSize: '14px', opacity: '0.8'}}>Vulnerability assessment & enumeration</div>
            </div>
          </Link>

          <Link
            to="/windows"
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Monitor className="h-7 w-7" />
            <div>
              <div style={{fontWeight: '600', fontSize: '18px'}}>Windows Security</div>
              <div style={{fontSize: '14px', opacity: '0.8'}}>System enumeration & hardening</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pentest Wizard Highlight */}
        <div style={{...cardStyle, background: 'linear-gradient(135deg, #3b82f6, #1e40af)', border: 'none'}}>
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-cyan-300 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-white text-xl mb-3">🧙‍♂️ HackNest Wizard</h4>
              <p className="text-blue-100 mb-4 leading-relaxed">
                Complete penetration testing platform with guided methodology, live tool execution, 
                and comprehensive reporting. Built for both learning and professional assessments.
              </p>
              <ul className="text-blue-200 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span>Step-by-step guided workflow</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span>Real-time tool execution and feedback</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span>Smart fallbacks when tools unavailable</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span>Professional HTML report generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span>Built-in tool download directory</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Windows Features */}
        {systemStatus.isElectron && (
          <div style={cardStyle}>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-500" />
              Windows Desktop Capabilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 style={{color: '#ffffff', marginBottom: '12px', fontWeight: '600'}}>Enhanced Tools</h4>
                <div style={{color: '#d1d5db'}} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Native PowerShell Integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Full Nmap Functionality</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>System-level Enumeration</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 style={{color: '#ffffff', marginBottom: '12px', fontWeight: '600'}}>Professional Features</h4>
                <div style={{color: '#d1d5db'}} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Offline Operations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Advanced Reporting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Custom Tool Integration</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Getting Started for Web */}
        {!systemStatus.isElectron && (
          <div style={{...cardStyle, backgroundColor: '#1e3a8a', borderColor: '#3b82f6'}}>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-6 w-6" style={{color: '#60a5fa', marginTop: '2px'}} />
              <div>
                <h4 className="font-semibold" style={{color: '#ffffff', marginBottom: '8px'}}>Web Edition Features</h4>
                <p className="text-sm" style={{color: '#dbeafe', lineHeight: '1.6', marginBottom: '12px'}}>
                  Running in web mode with essential security testing capabilities. For advanced features like full Nmap integration 
                  and Windows enumeration, try the desktop version.
                </p>
                <div className="text-xs" style={{color: '#93c5fd'}}>
                  <strong>Available:</strong> Basic reconnaissance, web testing, serverless scanning
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div style={{
        ...cardStyle, 
        backgroundColor: '#7f1d1d', 
        borderColor: '#dc2626',
        marginTop: '24px'
      }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6" style={{color: '#fca5a5', marginTop: '2px'}} />
          <div>
            <h4 className="font-semibold" style={{color: '#ffffff', marginBottom: '8px'}}>⚠️ Ethical Use Only</h4>
            <p className="text-sm" style={{color: '#fecaca', lineHeight: '1.6'}}>
              HackNest is designed for authorized security testing and educational purposes only. Always ensure you have 
              proper written authorization before testing any systems. Unauthorized access to computer systems is illegal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 
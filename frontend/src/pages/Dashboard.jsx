import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Radar, 
  Globe, 
  Zap, 
  FileText,
  TrendingUp,
  Clock,
  Shield,
  AlertTriangle,
  Activity
} from 'lucide-react'
import { reportsAPI, healthCheck } from '../utils/api'
import toast from 'react-hot-toast'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentScans, setRecentScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    loadDashboardData()
    checkBackendHealth()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsData, historyData] = await Promise.all([
        reportsAPI.getStats(),
        reportsAPI.getHistory(10)
      ])
      
      if (statsData.success) {
        setStats(statsData.statistics)
      }
      
      if (historyData.success) {
        setRecentScans(historyData.scans)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkBackendHealth = async () => {
    try {
      await healthCheck()
      setBackendStatus('connected')
    } catch (error) {
      setBackendStatus('disconnected')
    }
  }

  const quickActions = [
    {
      title: 'Reconnaissance',
      description: 'Start with WHOIS and DNS enumeration',
      icon: Search,
      href: '/recon',
      color: 'cyber'
    },
    {
      title: 'Port Scan',
      description: 'Quick Nmap scan of common ports',
      icon: Radar,
      href: '/scan',
      color: 'terminal-green'
    },
    {
      title: 'Web Assessment',
      description: 'Scan web applications for vulnerabilities',
      icon: Globe,
      href: '/web',
      color: 'terminal-yellow'
    },
    {
      title: 'Exploitation',
      description: 'Test for SQL injection and other exploits',
      icon: Zap,
      href: '/exploit',
      color: 'terminal-red'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-dark-400">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400">Overview of your security testing activities</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
            backendStatus === 'connected' 
              ? 'bg-terminal-green/20 text-terminal-green' 
              : 'bg-terminal-red/20 text-terminal-red'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              backendStatus === 'connected' ? 'bg-terminal-green' : 'bg-terminal-red'
            }`}></div>
            <span className="text-sm font-medium">
              {backendStatus === 'connected' ? 'Backend Online' : 'Backend Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyber-600 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Total Scans</p>
              <p className="text-2xl font-bold text-white">{stats?.total_scans || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-terminal-green rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Last 24h</p>
              <p className="text-2xl font-bold text-white">{stats?.recent_activity?.last_24_hours || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-terminal-yellow rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-400">This Week</p>
              <p className="text-2xl font-bold text-white">{stats?.recent_activity?.last_week || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-terminal-purple rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Tools Used</p>
              <p className="text-2xl font-bold text-white">{Object.keys(stats?.tools_used || {}).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.title}
                to={action.href}
                className="card hover:bg-dark-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 bg-${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white">{action.title}</h3>
                </div>
                <p className="text-sm text-dark-400">{action.description}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Scans</h3>
            <Link to="/reports" className="text-cyber-400 hover:text-cyber-300 text-sm">
              View all →
            </Link>
          </div>
          
          {recentScans.length > 0 ? (
            <div className="space-y-3">
              {recentScans.slice(0, 5).map((scan) => (
                <div key={scan.id} className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-cyber-600 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-mono text-white uppercase">
                        {scan.tool.slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{scan.target}</p>
                    <p className="text-xs text-dark-400">{scan.tool} • {scan.scan_type}</p>
                  </div>
                  <div className="text-xs text-dark-400">
                    {new Date(scan.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-dark-600 mx-auto mb-2" />
              <p className="text-dark-400">No scans yet</p>
              <p className="text-sm text-dark-500">Start your first scan to see results here</p>
            </div>
          )}
        </div>

        {/* Tool Usage */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Tool Usage</h3>
          
          {stats?.tools_used && Object.keys(stats.tools_used).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.tools_used)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([tool, count]) => (
                  <div key={tool} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-white capitalize">{tool}</span>
                        <span className="text-sm text-dark-400">{count}</span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-2">
                        <div 
                          className="bg-cyber-500 h-2 rounded-full" 
                          style={{ width: `${(count / Math.max(...Object.values(stats.tools_used))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-dark-600 mx-auto mb-2" />
              <p className="text-dark-400">No usage data</p>
              <p className="text-sm text-dark-500">Tool usage will appear here after scans</p>
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="card bg-terminal-yellow/10 border-terminal-yellow/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-terminal-yellow flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-terminal-yellow">Security Notice</h4>
            <p className="text-sm text-dark-300 mt-1">
              Always ensure you have proper authorization before conducting security tests. 
              HackNest is designed for educational purposes and authorized penetration testing only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 
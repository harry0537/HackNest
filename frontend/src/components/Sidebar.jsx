import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Search, 
  Radar, 
  Globe, 
  Zap, 
  FileText,
  Shield,
  Terminal,
  Activity
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Overview and statistics'
  },
  {
    name: 'Reconnaissance',
    href: '/recon',
    icon: Search,
    description: 'WHOIS, DNS, Network discovery'
  },
  {
    name: 'Port Scanning',
    href: '/scan',
    icon: Radar,
    description: 'Nmap scanning and enumeration'
  },
  {
    name: 'Web Testing',
    href: '/web',
    icon: Globe,
    description: 'Web vulnerability assessment'
  },
  {
    name: 'Exploitation',
    href: '/exploit',
    icon: Zap,
    description: 'SQLMap and exploit testing'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    description: 'Scan history and reporting'
  }
]

function Sidebar() {
  return (
    <div className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyber-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">HackNest</h2>
            <p className="text-xs text-dark-400">v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `sidebar-nav ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="h-5 w-5" />
              <div className="flex-1">
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-dark-400">{item.description}</div>
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-terminal-green" />
          <span className="text-dark-300">System Active</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-dark-400 mt-1">
          <Terminal className="h-3 w-3" />
          <span>CLI Tools Ready</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar 
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ReconModule from './pages/ReconModule'
import ScanModule from './pages/ScanModule'
import WebModule from './pages/WebModule'
import ExploitModule from './pages/ExploitModule'
import ReportsModule from './pages/ReportsModule'
import { Shield } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-dark-800 border-b border-dark-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-cyber-500" />
              <div>
                <h1 className="text-xl font-bold text-white">HackNest</h1>
                <p className="text-sm text-dark-400">Ethical Hacking Toolkit</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-dark-400">
                <span className="inline-block w-2 h-2 bg-terminal-green rounded-full mr-2"></span>
                Backend Connected
              </div>
            </div>
          </div>
        </header>
        
        {/* Routes */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/recon" element={<ReconModule />} />
            <Route path="/scan" element={<ScanModule />} />
            <Route path="/web" element={<WebModule />} />
            <Route path="/exploit" element={<ExploitModule />} />
            <Route path="/reports" element={<ReportsModule />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App 
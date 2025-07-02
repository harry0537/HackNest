import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { WorkflowProvider } from './context/WorkflowContext'

import { SimplePentestProvider } from './context/SimplePentestContext'
import Sidebar from './components/Sidebar'

import Dashboard from './pages/Dashboard'
import WorkflowDashboard from './pages/WorkflowDashboard'
import AutomatedWorkflow from './pages/AutomatedWorkflow'
import UnifiedPentestWizard from './pages/UnifiedPentestWizard'
import AdvancedTools from './pages/AdvancedTools'
import ReconModule from './pages/ReconModule'
import ScanModule from './pages/ScanModule'
import WebModule from './pages/WebModule'
import ExploitModule from './pages/ExploitModule'
import ReportsModule from './pages/ReportsModule'
import WindowsModule from './pages/WindowsModule'

function App() {

  return (
    <WorkflowProvider>
      <SimplePentestProvider>
          <div className="min-h-screen bg-gray-900 flex" style={{backgroundColor: '#1a1a1a', color: '#ffffff'}}>
            {/* Sidebar */}
            <Sidebar />
          
          {/* Main Content */}
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/wizard" element={<UnifiedPentestWizard />} />
              <Route path="/advanced" element={<AdvancedTools />} />
              <Route path="/workflow" element={<WorkflowDashboard />} />
              <Route path="/automated" element={<AutomatedWorkflow />} />
              <Route path="/recon" element={<ReconModule />} />
              <Route path="/scan" element={<ScanModule />} />
              <Route path="/web" element={<WebModule />} />
              <Route path="/exploit" element={<ExploitModule />} />
              <Route path="/reports" element={<ReportsModule />} />
              <Route path="/windows" element={<WindowsModule />} />
            </Routes>
          </div>
        </div>
        </SimplePentestProvider>
    </WorkflowProvider>
  )
}

export default App 
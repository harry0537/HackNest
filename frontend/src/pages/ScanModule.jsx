import React from 'react'
import { Radar } from 'lucide-react'

function ScanModule() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Radar className="h-8 w-8 text-cyber-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">Port Scanning</h1>
          <p className="text-dark-400">Network port scanning and service enumeration</p>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <Radar className="h-16 w-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Nmap Integration</h3>
          <p className="text-dark-400 mb-4">Port scanning module coming soon</p>
          <p className="text-sm text-dark-500">This module will integrate with Nmap for comprehensive port scanning</p>
        </div>
      </div>
    </div>
  )
}

export default ScanModule 
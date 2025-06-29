import React, { useState } from 'react'
import { Search, Globe, Wifi } from 'lucide-react'
import { reconAPI } from '../utils/api'
import toast from 'react-hot-toast'

function ReconModule() {
  const [target, setTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const handleWhoisScan = async () => {
    if (!target) {
      toast.error('Please enter a target domain')
      return
    }

    setLoading(true)
    try {
      const result = await reconAPI.whois(target)
      setResults(result)
      toast.success('WHOIS lookup completed')
    } catch (error) {
      console.error('WHOIS error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Search className="h-8 w-8 text-cyber-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">Reconnaissance</h1>
          <p className="text-dark-400">Information gathering and target enumeration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Target Input</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">
                  Domain/IP Address
                </label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="example.com"
                  className="input-field w-full"
                />
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={handleWhoisScan}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  <Globe className="h-4 w-4" />
                  {loading ? 'Running...' : 'WHOIS Lookup'}
                </button>
                
                <button className="btn-secondary w-full" disabled>
                  <Wifi className="h-4 w-4" />
                  DNS Enumeration
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Results</h3>
            
            {results ? (
              <div className="terminal-output">
                <pre className="text-sm">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-dark-600 mx-auto mb-2" />
                <p className="text-dark-400">No scan results yet</p>
                <p className="text-sm text-dark-500">Enter a target and run a scan to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReconModule 
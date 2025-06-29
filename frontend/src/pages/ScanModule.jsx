import React, { useState } from 'react'
import { Radar, Play, Loader, AlertTriangle } from 'lucide-react'
import { scanAPI } from '../utils/api'
import toast from 'react-hot-toast'

function ScanModule() {
  const [target, setTarget] = useState('')
  const [ports, setPorts] = useState('21,22,23,25,53,80,110,135,139,143,443,993,995,1723,3306,3389,5900,8080')
  const [loading, setLoading] = useState({})
  const [results, setResults] = useState({})

  const runPortScan = async () => {
    if (!target) {
      toast.error('Please enter a target hostname or IP address')
      return
    }

    setLoading(prev => ({ ...prev, portscan: true }))
    
    try {
      const response = await scanAPI.portscan({ target, ports })
      if (response.success) {
        setResults(prev => ({ ...prev, portscan: response }))
        toast.success('Port scan completed')
      } else {
        toast.error(response.error || 'Port scan failed')
      }
    } catch (error) {
      console.error('Port scan error:', error)
      toast.error(`Failed to run port scan: ${error.message}`)
    } finally {
      setLoading(prev => ({ ...prev, portscan: false }))
    }
  }

  const runHttpDetect = async () => {
    if (!target) {
      toast.error('Please enter a target hostname or IP address')
      return
    }

    setLoading(prev => ({ ...prev, httpDetect: true }))
    
    try {
      const response = await scanAPI.httpDetect({ target, ports: '80,443,8080,8443' })
      if (response.success) {
        setResults(prev => ({ ...prev, httpDetect: response }))
        toast.success('HTTP detection completed')
      } else {
        toast.error(response.error || 'HTTP detection failed')
      }
    } catch (error) {
      console.error('HTTP detect error:', error)
      toast.error(`Failed to run HTTP detection: ${error.message}`)
    } finally {
      setLoading(prev => ({ ...prev, httpDetect: false }))
    }
  }

  const runSSLInfo = async () => {
    if (!target) {
      toast.error('Please enter a target hostname or IP address')
      return
    }

    setLoading(prev => ({ ...prev, sslInfo: true }))
    
    try {
      const response = await scanAPI.sslInfo({ target, port: 443 })
      if (response.success) {
        setResults(prev => ({ ...prev, sslInfo: response }))
        toast.success('SSL analysis completed')
      } else {
        toast.error(response.error || 'SSL analysis failed')
      }
    } catch (error) {
      console.error('SSL info error:', error)
      toast.error(`Failed to run SSL analysis: ${error.message}`)
    } finally {
      setLoading(prev => ({ ...prev, sslInfo: false }))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Radar className="h-8 w-8 text-cyber-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">Port Scanning</h1>
          <p className="text-dark-400">Network port scanning and service enumeration</p>
        </div>
      </div>

      {/* Serverless Notice */}
      <div className="card bg-terminal-yellow/10 border-terminal-yellow/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-terminal-yellow flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-terminal-yellow">Serverless Environment</h4>
            <p className="text-sm text-dark-300 mt-1">
              Full Nmap functionality requires dedicated infrastructure. Available tools use native network commands.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Target Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Target Host</label>
              <input
                type="text"
                className="form-input"
                placeholder="example.com or 192.168.1.1"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Ports (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                value={ports}
                onChange={(e) => setPorts(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={runPortScan}
                disabled={!target || loading.portscan}
                className="btn-primary w-full"
              >
                {loading.portscan ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Scanning Ports...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Port Scan
                  </>
                )}
              </button>

              <button
                onClick={runHttpDetect}
                disabled={!target || loading.httpDetect}
                className="btn-secondary w-full"
              >
                {loading.httpDetect ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Detecting HTTP...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    HTTP Detection
                  </>
                )}
              </button>

              <button
                onClick={runSSLInfo}
                disabled={!target || loading.sslInfo}
                className="btn-secondary w-full"
              >
                {loading.sslInfo ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing SSL...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    SSL Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {results.portscan && (
            <div className="card">
              <h4 className="font-semibold text-white mb-3">Port Scan Results</h4>
              <div className="space-y-2">
                <p className="text-sm text-dark-300">
                  Target: <span className="text-white">{results.portscan.target}</span>
                </p>
                <p className="text-sm text-dark-300">
                  Open Ports: <span className="text-terminal-green">{results.portscan.result.open_ports.length}</span>
                </p>
                {results.portscan.result.open_ports.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-white mb-2">Open Ports:</h5>
                    <div className="space-y-1">
                      {results.portscan.result.open_ports.map((port, index) => (
                        <div key={index} className="text-sm bg-dark-700 p-2 rounded">
                          <span className="text-cyber-400">{port.port}</span>
                          <span className="text-dark-300 ml-2">({port.service})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {results.httpDetect && (
            <div className="card">
              <h4 className="font-semibold text-white mb-3">HTTP Services</h4>
              {results.httpDetect.result.services_found.length > 0 ? (
                <div className="space-y-2">
                  {results.httpDetect.result.services_found.map((service, index) => (
                    <div key={index} className="bg-dark-700 p-3 rounded">
                      <div className="text-sm">
                        <span className="text-cyber-400">{service.protocol}://{results.httpDetect.target}:{service.port}</span>
                        <div className="text-dark-300 mt-1">
                          Server: {service.server}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm">No HTTP services detected</p>
              )}
            </div>
          )}

          {results.sslInfo && (
            <div className="card">
              <h4 className="font-semibold text-white mb-3">SSL Information</h4>
              <div className="text-sm text-dark-300">
                <p>Target: <span className="text-white">{results.sslInfo.target}:{results.sslInfo.result.port}</span></p>
                <p>SSL Available: <span className="text-terminal-green">{results.sslInfo.result.ssl_available ? 'Yes' : 'No'}</span></p>
                {results.sslInfo.result.note && (
                  <p className="text-dark-400 mt-2">{results.sslInfo.result.note}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScanModule 
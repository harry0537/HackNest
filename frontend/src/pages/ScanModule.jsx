import React, { useState } from 'react'
import { Radar, Play, Loader, AlertTriangle, Target, Zap, Shield, Search } from 'lucide-react'
import { scanAPI } from '../utils/api'
import { useWorkflow } from '../context/WorkflowContext'
import toast from 'react-hot-toast'

function ScanModule() {
  const { addResult, workflow, setTarget: setWorkflowTarget, suggestions } = useWorkflow();
  const [target, setTarget] = useState(workflow.target || '')
  const [ports, setPorts] = useState('1-1000')
  const [loading, setLoading] = useState({})
  const [results, setResults] = useState({})

  const runQuickScan = async () => {
    if (!target) {
      toast.error('Please enter a target hostname or IP address')
      return
    }

    setLoading(prev => ({ ...prev, quickScan: true }))
    
    try {
      const response = await scanAPI.nmapQuick(target, 'top-ports 1000')
      if (response.success) {
        setResults(prev => ({ ...prev, quickScan: response }))
        
        // Add to workflow
        addResult('scanning', 'nmap-quick', { target, result: response })
        setWorkflowTarget(target)
        
        toast.success('Quick scan completed and added to workflow')
      } else {
        toast.error(response.error || 'Quick scan failed')
      }
    } catch (error) {
      console.error('Quick scan error:', error)
      toast.error(`Failed to run quick scan: ${error.message}`)
    } finally {
      setLoading(prev => ({ ...prev, quickScan: false }))
    }
  }

  const runCustomScan = async () => {
    if (!target) {
      toast.error('Please enter a target hostname or IP address')
      return
    }

    setLoading(prev => ({ ...prev, customScan: true }))
    
    try {
      const response = await scanAPI.nmapCustom(target, '-sS', ports, 'T4')
      if (response.success) {
        setResults(prev => ({ ...prev, customScan: response }))
        
        // Add to workflow
        addResult('scanning', 'nmap-custom', { target, result: response })
        setWorkflowTarget(target)
        
        toast.success('Custom scan completed and added to workflow')
      } else {
        toast.error(response.error || 'Custom scan failed')
      }
    } catch (error) {
      console.error('Custom scan error:', error)
      toast.error(`Failed to run custom scan: ${error.message}`)
    } finally {
      setLoading(prev => ({ ...prev, customScan: false }))
    }
  }

  const runServiceDetection = async () => {
    if (!target) {
      toast.error('Please enter a target hostname or IP address')
      return
    }

    setLoading(prev => ({ ...prev, serviceDetection: true }))
    
    try {
      const response = await scanAPI.nmapServiceDetection(target, ports)
      if (response.success) {
        setResults(prev => ({ ...prev, serviceDetection: response }))
        
        // Add to workflow
        addResult('enumeration', 'nmap-service-detection', { target, result: response })
        setWorkflowTarget(target)
        
        toast.success('Service detection completed and added to workflow')
      } else {
        toast.error(response.error || 'Service detection failed')
      }
    } catch (error) {
      console.error('Service detection error:', error)
      toast.error(`Failed to run service detection: ${error.message}`)
    } finally {
      setLoading(prev => ({ ...prev, serviceDetection: false }))
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
        
        // Add to workflow
        addResult('enumeration', 'http-detect', { target, result: response })
        setWorkflowTarget(target)
        
        toast.success('HTTP detection completed and added to workflow')
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

  const renderPortResults = (scanResult) => {
    if (!scanResult?.result?.hosts) return null;

    return scanResult.result.hosts.map((host, hostIndex) => (
      <div key={hostIndex} className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-medium text-white">Host: {host.hostname || host.ip}</h5>
          <span className="text-xs text-gray-400">
            {host.ports ? `${host.ports.length} ports` : '0 ports'}
          </span>
        </div>
        
        {host.ports && host.ports.length > 0 && (
          <div className="space-y-1">
            {host.ports.map((port, portIndex) => (
              <div key={portIndex} className="bg-dark-700 p-2 rounded text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-cyber-400">{port.port}/{port.protocol}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    port.state === 'open' ? 'bg-green-600 text-white' : 
                    port.state === 'closed' ? 'bg-red-600 text-white' :
                    'bg-yellow-600 text-white'
                  }`}>
                    {port.state}
                  </span>
                </div>
                {port.service && (
                  <div className="text-gray-300 mt-1">
                    Service: {port.service}
                    {port.version && <span className="text-gray-400"> ({port.version})</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Radar className="h-8 w-8 text-cyber-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">Port Scanning & Service Detection</h1>
          <p className="text-dark-400">Full Nmap functionality for comprehensive network scanning</p>
        </div>
      </div>

      {/* Desktop Mode Notice */}
      <div className="card bg-green-500/10 border-green-500/30">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-500">Full Desktop Mode</h4>
            <p className="text-sm text-dark-300 mt-1">
              Running with complete Nmap functionality for professional port scanning and service detection.
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
              <label className="block text-sm font-medium text-white mb-2">Port Range (for custom/service scans)</label>
              <input
                type="text"
                className="form-input"
                placeholder="1-1000 or 22,80,443"
                value={ports}
                onChange={(e) => setPorts(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={runQuickScan}
                disabled={!target || loading.quickScan}
                className="btn-primary w-full"
              >
                {loading.quickScan ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Running Quick Scan...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Scan (Top 1000 Ports)
                  </>
                )}
              </button>

              <button
                onClick={runCustomScan}
                disabled={!target || loading.customScan}
                className="btn-secondary w-full"
              >
                {loading.customScan ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Running Custom Scan...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Custom Port Scan
                  </>
                )}
              </button>

              <button
                onClick={runServiceDetection}
                disabled={!target || loading.serviceDetection}
                className="btn-secondary w-full"
              >
                {loading.serviceDetection ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Detecting Services...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Service Detection
                  </>
                )}
              </button>

              <button
                onClick={runHttpDetect}
                disabled={!target || loading.httpDetect}
                className="btn-accent w-full"
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
            </div>
          </div>
        </div>

        {/* Workflow Suggestions */}
        {suggestions.filter(s => s.phase === 'scanning' || s.phase === 'enumeration').length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-yellow-500" />
              Workflow Suggestions
            </h3>
            <div className="space-y-2">
              {suggestions
                .filter(s => s.phase === 'scanning' || s.phase === 'enumeration')
                .slice(0, 3)
                .map((suggestion, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded border-l-4"
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderLeftColor: suggestion.priority === 'high' ? '#ef4444' : '#f59e0b'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{suggestion.action}</span>
                      <span 
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: suggestion.priority === 'high' ? '#ef4444' : '#f59e0b',
                          color: '#ffffff'
                        }}
                      >
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{suggestion.description}</p>
                    <p className="text-gray-500 text-xs">Target: {suggestion.target}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-4">
          {results.quickScan && (
            <div className="card">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                Quick Scan Results
              </h4>
              <div className="space-y-2 text-sm text-dark-300">
                <p>Target: <span className="text-white">{results.quickScan.target}</span></p>
                <p>Scan Type: <span className="text-cyber-400">{results.quickScan.scan_type}</span></p>
                {renderPortResults(results.quickScan)}
              </div>
            </div>
          )}

          {results.customScan && (
            <div className="card">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Play className="h-4 w-4 text-blue-500" />
                Custom Scan Results
              </h4>
              <div className="space-y-2 text-sm text-dark-300">
                <p>Target: <span className="text-white">{results.customScan.target}</span></p>
                <p>Ports: <span className="text-cyber-400">{results.customScan.ports}</span></p>
                {renderPortResults(results.customScan)}
              </div>
            </div>
          )}

          {results.serviceDetection && (
            <div className="card">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-purple-500" />
                Service Detection Results
              </h4>
              <div className="space-y-2 text-sm text-dark-300">
                <p>Target: <span className="text-white">{results.serviceDetection.target}</span></p>
                <p>Ports: <span className="text-cyber-400">{results.serviceDetection.ports}</span></p>
                {renderPortResults(results.serviceDetection)}
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
        </div>
      </div>
    </div>
  )
}

export default ScanModule 
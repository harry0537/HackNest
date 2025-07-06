import React, { useState, useEffect } from 'react'
import { Search, Globe, Server, Activity, Play, Loader, Target } from 'lucide-react'
import { reconAPI } from '../utils/api'
import { useWorkflow } from '../context/WorkflowContext'
import { usePentestWizard } from '../context/PentestWizardContext'
import toast from 'react-hot-toast'

function ReconModule() {
  const { addResult, workflow, setTarget: setWorkflowTarget, updateWorkflowProgress, suggestions } = useWorkflow();
  const { wizardState, currentPhase, addFinding } = usePentestWizard();
  const [target, setTarget] = useState(workflow.target || '')
  const [loading, setLoading] = useState({})
  const [results, setResults] = useState({})

  // Sync target with workflow
  useEffect(() => {
    if (workflow.target && workflow.target !== target) {
      setTarget(workflow.target);
    }
  }, [workflow.target]);

  const runWhois = async () => {
    if (!target) {
      toast.error('Please enter a target domain or IP address')
      return
    }

    setLoading(prev => ({ ...prev, whois: true }))
    
    // Update workflow progress if part of automated workflow
    updateWorkflowProgress('reconnaissance', 'whois', 'start', { target });
    
    try {
      const response = await reconAPI.whois({ target })
      if (response.success) {
        setResults(prev => ({ ...prev, whois: response }))
        
        // Add to workflow with enhanced data
        addResult('reconnaissance', 'whois', { target, result: response })
        setWorkflowTarget(target)
        
        // Update workflow progress
        updateWorkflowProgress('reconnaissance', 'whois', 'complete', response);
        
        // If wizard is in information gathering phase, suggest adding as finding
        if (currentPhase?.id === 'information-gathering') {
          const hasImportantInfo = response.result?.output?.includes('Registrar') || 
                                  response.result?.output?.includes('Name Server');
          
          if (hasImportantInfo) {
            toast((t) => (
              <div className="flex flex-col gap-2">
                <span>WHOIS completed! Add important information as finding?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      addFinding({
                        title: `WHOIS Information for ${target}`,
                        description: `Domain registration and infrastructure information discovered for ${target}`,
                        severity: 'Informational',
                        type: 'Information Disclosure',
                        evidence: response.result?.output
                      });
                      toast.dismiss(t.id);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                  >
                    Add Finding
                  </button>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ), { duration: 10000 });
          }
        }
        
        toast.success('WHOIS lookup completed and added to workflow')
      } else {
        toast.error(response.error || 'WHOIS lookup failed')
        updateWorkflowProgress('reconnaissance', 'whois', 'error', { error: response.error });
      }
    } catch (error) {
      console.error('WHOIS error:', error)
      toast.error(`Failed to run WHOIS: ${error.message}`)
      updateWorkflowProgress('reconnaissance', 'whois', 'error', { error: error.message });
    } finally {
      setLoading(prev => ({ ...prev, whois: false }))
    }
  }

  const runNSLookup = async () => {
    if (!target) {
      toast.error('Please enter a target domain or IP address')
      return
    }

    setLoading(prev => ({ ...prev, nslookup: true }))
    updateWorkflowProgress('reconnaissance', 'nslookup', 'start', { target });
    
    try {
      const response = await reconAPI.nslookup({ target })
      if (response.success) {
        setResults(prev => ({ ...prev, nslookup: response }))
        
        // Add to workflow
        addResult('reconnaissance', 'nslookup', { target, result: response })
        setWorkflowTarget(target)
        
        updateWorkflowProgress('reconnaissance', 'nslookup', 'complete', response);
        toast.success('NSLookup completed and added to workflow')
      } else {
        toast.error(response.error || 'NSLookup failed')
        updateWorkflowProgress('reconnaissance', 'nslookup', 'error', { error: response.error });
      }
    } catch (error) {
      console.error('NSLookup error:', error)
      toast.error(`Failed to run NSLookup: ${error.message}`)
      updateWorkflowProgress('reconnaissance', 'nslookup', 'error', { error: error.message });
    } finally {
      setLoading(prev => ({ ...prev, nslookup: false }))
    }
  }

  const runDig = async () => {
    if (!target) {
      toast.error('Please enter a target domain')
      return
    }

    setLoading(prev => ({ ...prev, dig: true }))
    updateWorkflowProgress('reconnaissance', 'dig', 'start', { target });
    
    try {
      const response = await reconAPI.dig({ target })
      if (response.success) {
        setResults(prev => ({ ...prev, dig: response }))
        
        // Add to workflow
        addResult('reconnaissance', 'dig', { target, result: response })
        setWorkflowTarget(target)
        
        updateWorkflowProgress('reconnaissance', 'dig', 'complete', response);
        toast.success('DIG lookup completed and added to workflow')
      } else {
        toast.error(response.error || 'DIG lookup failed')
        updateWorkflowProgress('reconnaissance', 'dig', 'error', { error: response.error });
      }
    } catch (error) {
      console.error('DIG error:', error)
      toast.error(`Failed to run DIG: ${error.message}`)
      updateWorkflowProgress('reconnaissance', 'dig', 'error', { error: error.message });
    } finally {
      setLoading(prev => ({ ...prev, dig: false }))
    }
  }

  const runPing = async () => {
    if (!target) {
      toast.error('Please enter a target hostname or IP address')
      return
    }

    setLoading(prev => ({ ...prev, ping: true }))
    
    try {
      const response = await reconAPI.ping({ target })
      if (response.success) {
        setResults(prev => ({ ...prev, ping: response }))
        
        // Add to workflow
        addResult('reconnaissance', 'ping', { target, result: response })
        setWorkflowTarget(target)
        
        toast.success('Ping test completed and added to workflow')
      } else {
        toast.error(response.error || 'Ping test failed')
      }
    } catch (error) {
      console.error('Ping error:', error)
      toast.error(`Failed to run ping: ${error.message}`)
    } finally {
      setLoading(prev => ({ ...prev, ping: false }))
    }
  }

  const runTraceroute = async () => {
    if (!target) {
      toast.error('Please enter a target hostname or IP address')
      return
    }

    setLoading(prev => ({ ...prev, traceroute: true }))
    
    try {
      const response = await reconAPI.traceroute({ target })
      if (response.success) {
        setResults(prev => ({ ...prev, traceroute: response }))
        
        // Add to workflow
        addResult('reconnaissance', 'traceroute', { target, result: response })
        setWorkflowTarget(target)
        
        toast.success('Traceroute completed and added to workflow')
      } else {
        toast.error(response.error || 'Traceroute failed')
      }
    } catch (error) {
      console.error('Traceroute error:', error)
      toast.error(`Failed to run traceroute: ${error.message}`)
    } finally {
      setLoading(prev => ({ ...prev, traceroute: false }))
    }
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-900">
      <div className="flex items-center gap-3">
        <Search className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">Reconnaissance</h1>
          <p className="text-gray-400">Information gathering and network discovery</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Target Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Target Domain/IP</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="example.com or 192.168.1.1"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
              {workflow.target && workflow.target !== target && (
                <p className="text-sm text-blue-400 mt-1">
                  Workflow target: {workflow.target} 
                  <button 
                    onClick={() => setTarget(workflow.target)}
                    className="ml-2 text-blue-500 hover:text-blue-400 underline"
                  >
                    Use this
                  </button>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={runWhois}
                disabled={!target || loading.whois}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {loading.whois ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    WHOIS
                  </>
                )}
              </button>

              <button
                onClick={runNSLookup}
                disabled={!target || loading.nslookup}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {loading.nslookup ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Server className="h-4 w-4 mr-2" />
                    NSLookup
                  </>
                )}
              </button>

              <button
                onClick={runDig}
                disabled={!target || loading.dig}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {loading.dig ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    DIG
                  </>
                )}
              </button>

              <button
                onClick={runPing}
                disabled={!target || loading.ping}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {loading.ping ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Ping
                  </>
                )}
              </button>
            </div>

            <button
              onClick={runTraceroute}
              disabled={!target || loading.traceroute}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors w-full"
            >
              {loading.traceroute ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Running Traceroute...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Traceroute
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workflow Suggestions */}
        {suggestions.filter(s => s.phase === 'reconnaissance' || s.phase === 'scanning').length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-yellow-500" />
              Workflow Suggestions
            </h3>
            <div className="space-y-2">
              {suggestions
                .filter(s => s.phase === 'reconnaissance' || s.phase === 'scanning')
                .slice(0, 3)
                .map((suggestion, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded border-l-4 bg-gray-700"
                    style={{
                      borderLeftColor: suggestion.priority === 'high' ? '#ef4444' : '#f59e0b'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{suggestion.action}</span>
                      <span 
                        className="px-2 py-1 rounded text-xs text-white"
                        style={{
                          backgroundColor: suggestion.priority === 'high' ? '#ef4444' : '#f59e0b'
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
          {results.whois && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="font-semibold text-white mb-3">WHOIS Results</h4>
              <div className="bg-gray-900 p-4 rounded border border-gray-600 font-mono text-sm text-green-400 overflow-auto max-h-64">
                {results.whois.result.output}
              </div>
            </div>
          )}

          {results.nslookup && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="font-semibold text-white mb-3">NSLookup Results</h4>
              <div className="bg-gray-900 p-4 rounded border border-gray-600 font-mono text-sm text-green-400 overflow-auto max-h-64">
                {results.nslookup.result.output}
              </div>
            </div>
          )}

          {results.dig && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="font-semibold text-white mb-3">DIG Results</h4>
              <div className="bg-gray-900 p-4 rounded border border-gray-600 font-mono text-sm text-green-400 overflow-auto max-h-64">
                {results.dig.result.output}
              </div>
            </div>
          )}

          {results.ping && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="font-semibold text-white mb-3">Ping Results</h4>
              <div className="bg-gray-900 p-4 rounded border border-gray-600 font-mono text-sm text-green-400 overflow-auto max-h-64">
                {results.ping.result.output}
              </div>
            </div>
          )}

          {results.traceroute && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="font-semibold text-white mb-3">Traceroute Results</h4>
              <div className="bg-gray-900 p-4 rounded border border-gray-600 font-mono text-sm text-green-400 overflow-auto max-h-64">
                {results.traceroute.result.output}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReconModule 
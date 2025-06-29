import React, { useState } from 'react'
import { Globe, Shield, Search, FileText, Play, Loader } from 'lucide-react'
import { webAPI } from '../utils/api'
import toast from 'react-hot-toast'

function WebModule() {
  const [activeTab, setActiveTab] = useState('nikto')
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState({})

  // Form states for different tools
  const [niktoForm, setNiktoForm] = useState({
    target: '',
    ssl: false,
    port: ''
  })

  const [whatwebForm, setWhatwebForm] = useState({
    target: '',
    aggression: 1,
    format: 'json'
  })

  const [dirbForm, setDirbForm] = useState({
    target: '',
    wordlist: 'default',
    extensions: ''
  })

  const [headersForm, setHeadersForm] = useState({
    target: ''
  })

  const runScan = async (tool, formData) => {
    setLoading(prev => ({ ...prev, [tool]: true }))
    
    try {
      let response
      switch (tool) {
        case 'nikto':
          response = await webAPI.nikto(formData)
          break
        case 'whatweb':
          response = await webAPI.whatweb(formData)
          break
        case 'dirb':
          response = await webAPI.dirb(formData)
          break
        case 'headers':
          response = await webAPI.headers(formData)
          break
        default:
          throw new Error('Unknown tool')
      }

      if (response.success) {
        setResults(prev => ({ ...prev, [tool]: response }))
        toast.success(`${tool.charAt(0).toUpperCase() + tool.slice(1)} scan completed`)
      } else {
        toast.error(response.error || 'Scan failed')
      }
    } catch (error) {
      console.error(`${tool} scan error:`, error)
      toast.error(`Failed to run ${tool} scan: ${error.message}`)
    } finally {
      setLoading(prev => ({ ...prev, [tool]: false }))
    }
  }

  const tools = [
    {
      id: 'nikto',
      name: 'Nikto',
      description: 'Web vulnerability scanner',
      icon: Shield
    },
    {
      id: 'whatweb',
      name: 'WhatWeb',
      description: 'Application fingerprinting',
      icon: Search
    },
    {
      id: 'dirb',
      name: 'Dirb',
      description: 'Directory enumeration',
      icon: FileText
    },
    {
      id: 'headers',
      name: 'Headers',
      description: 'HTTP headers analysis',
      icon: Globe
    }
  ]

  const renderNiktoForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Target URL</label>
        <input
          type="url"
          className="form-input"
          placeholder="https://example.com"
          value={niktoForm.target}
          onChange={(e) => setNiktoForm(prev => ({ ...prev, target: e.target.value }))}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Port (optional)</label>
          <input
            type="number"
            className="form-input"
            placeholder="80, 443, 8080..."
            value={niktoForm.port}
            onChange={(e) => setNiktoForm(prev => ({ ...prev, port: e.target.value }))}
          />
        </div>
        
        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="nikto-ssl"
            className="form-checkbox"
            checked={niktoForm.ssl}
            onChange={(e) => setNiktoForm(prev => ({ ...prev, ssl: e.target.checked }))}
          />
          <label htmlFor="nikto-ssl" className="text-sm text-white">Force SSL</label>
        </div>
      </div>

      <button
        onClick={() => runScan('nikto', niktoForm)}
        disabled={!niktoForm.target || loading.nikto}
        className="btn-primary w-full md:w-auto"
      >
        {loading.nikto ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Running Nikto Scan...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Start Nikto Scan
          </>
        )}
      </button>
    </div>
  )

  const renderWhatwebForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Target URL</label>
        <input
          type="url"
          className="form-input"
          placeholder="https://example.com"
          value={whatwebForm.target}
          onChange={(e) => setWhatwebForm(prev => ({ ...prev, target: e.target.value }))}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Aggression Level</label>
          <select
            className="form-select"
            value={whatwebForm.aggression}
            onChange={(e) => setWhatwebForm(prev => ({ ...prev, aggression: parseInt(e.target.value) }))}
          >
            <option value={1}>1 - Passive</option>
            <option value={2}>2 - Polite</option>
            <option value={3}>3 - Aggressive</option>
            <option value={4}>4 - Heavy</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Output Format</label>
          <select
            className="form-select"
            value={whatwebForm.format}
            onChange={(e) => setWhatwebForm(prev => ({ ...prev, format: e.target.value }))}
          >
            <option value="json">JSON</option>
            <option value="text">Text</option>
          </select>
        </div>
      </div>

      <button
        onClick={() => runScan('whatweb', whatwebForm)}
        disabled={!whatwebForm.target || loading.whatweb}
        className="btn-primary w-full md:w-auto"
      >
        {loading.whatweb ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Running WhatWeb...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Start WhatWeb Scan
          </>
        )}
      </button>
    </div>
  )

  const renderDirbForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Target URL</label>
        <input
          type="url"
          className="form-input"
          placeholder="https://example.com"
          value={dirbForm.target}
          onChange={(e) => setDirbForm(prev => ({ ...prev, target: e.target.value }))}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Wordlist</label>
          <select
            className="form-select"
            value={dirbForm.wordlist}
            onChange={(e) => setDirbForm(prev => ({ ...prev, wordlist: e.target.value }))}
          >
            <option value="default">Default (common.txt)</option>
            <option value="/usr/share/dirb/wordlists/big.txt">Big wordlist</option>
            <option value="/usr/share/dirb/wordlists/small.txt">Small wordlist</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Extensions (optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="php,html,asp"
            value={dirbForm.extensions}
            onChange={(e) => setDirbForm(prev => ({ ...prev, extensions: e.target.value }))}
          />
        </div>
      </div>

      <button
        onClick={() => runScan('dirb', dirbForm)}
        disabled={!dirbForm.target || loading.dirb}
        className="btn-primary w-full md:w-auto"
      >
        {loading.dirb ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Running Directory Enumeration...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Start Directory Scan
          </>
        )}
      </button>
    </div>
  )

  const renderHeadersForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Target URL</label>
        <input
          type="url"
          className="form-input"
          placeholder="https://example.com"
          value={headersForm.target}
          onChange={(e) => setHeadersForm(prev => ({ ...prev, target: e.target.value }))}
        />
      </div>

      <button
        onClick={() => runScan('headers', headersForm)}
        disabled={!headersForm.target || loading.headers}
        className="btn-primary w-full md:w-auto"
      >
        {loading.headers ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Analyzing Headers...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Analyze Headers
          </>
        )}
      </button>
    </div>
  )

  const renderResults = (tool) => {
    const result = results[tool]
    if (!result) return null

    return (
      <div className="mt-6 card">
        <h3 className="text-lg font-semibold text-white mb-4">
          {tool.charAt(0).toUpperCase() + tool.slice(1)} Results
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <span>Target: {result.target}</span>
            <span>•</span>
            <span>Scan ID: {result.scan_id}</span>
          </div>
          
          <div className="bg-dark-900 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
            <pre className="text-terminal-green whitespace-pre-wrap">
              {typeof result.result === 'object' 
                ? JSON.stringify(result.result, null, 2)
                : result.result
              }
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Globe className="h-8 w-8 text-cyber-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">Web Application Testing</h1>
          <p className="text-dark-400">Web vulnerability scanning and assessment tools</p>
        </div>
      </div>

      {/* Tool Tabs */}
      <div className="flex space-x-1 bg-dark-800 p-1 rounded-lg">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTab(tool.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tool.id
                  ? 'bg-cyber-600 text-white'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{tool.name}</span>
            </button>
          )
        })}
      </div>

      {/* Tool Forms */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">
            {tools.find(t => t.id === activeTab)?.name}
          </h2>
          <p className="text-dark-400">
            {tools.find(t => t.id === activeTab)?.description}
          </p>
        </div>

        {activeTab === 'nikto' && renderNiktoForm()}
        {activeTab === 'whatweb' && renderWhatwebForm()}
        {activeTab === 'dirb' && renderDirbForm()}
        {activeTab === 'headers' && renderHeadersForm()}

        {renderResults(activeTab)}
      </div>

      {/* Security Warning */}
      <div className="card bg-terminal-yellow/10 border-terminal-yellow/30">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-terminal-yellow flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-terminal-yellow">Web Testing Guidelines</h4>
            <p className="text-sm text-dark-300 mt-1">
              Only test websites you own or have explicit permission to test. 
              Unauthorized scanning may violate terms of service or laws.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WebModule 
import React, { useState, useEffect } from 'react'
import { FileText, Download, Search, Filter, Trash2, Eye, Calendar } from 'lucide-react'
import { reportsAPI } from '../utils/api'
import toast from 'react-hot-toast'
import { formatTimestamp } from '../utils/api'

function ReportsModule() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedScans, setSelectedScans] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTool, setFilterTool] = useState('')
  const [filterType, setFilterType] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadScans()
    loadStats()
  }, [])

  const loadScans = async () => {
    try {
      setLoading(true)
      const response = await reportsAPI.getHistory(100)
      if (response.success) {
        setScans(response.scans || [])
      }
    } catch (error) {
      console.error('Failed to load scans:', error)
      toast.error('Failed to load scan history')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await reportsAPI.getStats()
      if (response.success) {
        setStats(response.statistics)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleDeleteScan = async (scanId) => {
    if (!confirm('Are you sure you want to delete this scan result?')) return

    try {
      await reportsAPI.deleteScan(scanId)
      setScans(scans.filter(scan => scan.id !== scanId))
      setSelectedScans(selectedScans.filter(id => id !== scanId))
      toast.success('Scan deleted successfully')
      loadStats() // Refresh stats
    } catch (error) {
      console.error('Failed to delete scan:', error)
      toast.error('Failed to delete scan')
    }
  }

  const handleSelectScan = (scanId) => {
    setSelectedScans(prev => 
      prev.includes(scanId) 
        ? prev.filter(id => id !== scanId)
        : [...prev, scanId]
    )
  }

  const handleSelectAll = () => {
    if (selectedScans.length === filteredScans.length) {
      setSelectedScans([])
    } else {
      setSelectedScans(filteredScans.map(scan => scan.id))
    }
  }

  const handleExportScans = async (format) => {
    if (selectedScans.length === 0) {
      toast.error('Please select scans to export')
      return
    }

    try {
      await reportsAPI.exportScans(selectedScans, format)
      toast.success(`Scans exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Failed to export scans:', error)
      toast.error('Failed to export scans')
    }
  }

  const filteredScans = scans.filter(scan => {
    const matchesSearch = !searchQuery || 
      scan.target?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.tool?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.scan_type?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTool = !filterTool || scan.tool === filterTool
    const matchesType = !filterType || scan.scan_type === filterType
    
    return matchesSearch && matchesTool && matchesType
  })

  const uniqueTools = [...new Set(scans.map(scan => scan.tool).filter(Boolean))]
  const uniqueTypes = [...new Set(scans.map(scan => scan.scan_type).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-dark-400">Loading reports...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-cyber-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Reports & History</h1>
            <p className="text-dark-400">View and manage your scan results</p>
          </div>
        </div>

        {selectedScans.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-400">
              {selectedScans.length} selected
            </span>
            <button
              onClick={() => handleExportScans('json')}
              className="btn-secondary text-sm"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
            <button
              onClick={() => handleExportScans('csv')}
              className="btn-secondary text-sm"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.total_scans || 0}</p>
              <p className="text-sm text-dark-400">Total Scans</p>
            </div>
          </div>
          <div className="card">
            <div className="text-center">
              <p className="text-2xl font-bold text-terminal-green">{stats.recent_activity?.last_24_hours || 0}</p>
              <p className="text-sm text-dark-400">Last 24 Hours</p>
            </div>
          </div>
          <div className="card">
            <div className="text-center">
              <p className="text-2xl font-bold text-terminal-yellow">{stats.recent_activity?.last_week || 0}</p>
              <p className="text-sm text-dark-400">This Week</p>
            </div>
          </div>
          <div className="card">
            <div className="text-center">
              <p className="text-2xl font-bold text-cyber-500">{Object.keys(stats.tools_used || {}).length}</p>
              <p className="text-sm text-dark-400">Tools Used</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="h-5 w-5 text-dark-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search scans..."
                className="form-input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="form-select w-auto"
            value={filterTool}
            onChange={(e) => setFilterTool(e.target.value)}
          >
            <option value="">All Tools</option>
            {uniqueTools.map(tool => (
              <option key={tool} value={tool}>{tool}</option>
            ))}
          </select>
          
          <select
            className="form-select w-auto"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <button
            onClick={() => {
              setSearchQuery('')
              setFilterTool('')
              setFilterType('')
            }}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Scans Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Scan History</h2>
          {filteredScans.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-cyber-400 hover:text-cyber-300"
            >
              {selectedScans.length === filteredScans.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {filteredScans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left p-2">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={selectedScans.length === filteredScans.length && filteredScans.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-2 text-dark-400">Target</th>
                  <th className="text-left p-2 text-dark-400">Tool</th>
                  <th className="text-left p-2 text-dark-400">Type</th>
                  <th className="text-left p-2 text-dark-400">Date</th>
                  <th className="text-left p-2 text-dark-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.map(scan => (
                  <tr key={scan.id} className="border-b border-dark-800 hover:bg-dark-700">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={selectedScans.includes(scan.id)}
                        onChange={() => handleSelectScan(scan.id)}
                      />
                    </td>
                    <td className="p-2">
                      <div className="font-medium text-white">{scan.target}</div>
                      <div className="text-sm text-dark-400">ID: {scan.id}</div>
                    </td>
                    <td className="p-2">
                      <span className="status-badge status-info">{scan.tool}</span>
                    </td>
                    <td className="p-2 text-dark-300">{scan.scan_type || 'N/A'}</td>
                    <td className="p-2 text-dark-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatTimestamp(scan.timestamp)}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // View scan details - could open a modal or navigate to detail page
                            console.log('View scan:', scan.id)
                          }}
                          className="text-cyber-400 hover:text-cyber-300"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteScan(scan.id)}
                          className="text-terminal-red hover:text-red-400"
                          title="Delete Scan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Scans Found</h3>
            <p className="text-dark-400 mb-4">
              {searchQuery || filterTool || filterType 
                ? 'No scans match your current filters' 
                : 'Start running scans to see results here'
              }
            </p>
            {(searchQuery || filterTool || filterType) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilterTool('')
                  setFilterType('')
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportsModule 
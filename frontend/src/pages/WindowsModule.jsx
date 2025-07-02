import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useWorkflow } from '../context/WorkflowContext';
import { 
  Shield, 
  Monitor, 
  Network, 
  Users, 
  HardDrive, 
  Wifi, 
  Server, 
  Settings,
  Play,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

const WindowsModule = () => {
  const { addResult, workflow, suggestions } = useWorkflow();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [runningTools, setRunningTools] = useState(new Set());

  useEffect(() => {
    fetchWindowsTools();
  }, []);

  const fetchWindowsTools = async () => {
    try {
      const response = await fetch('/api/windows/tools');
      const data = await response.json();
      
      if (data.success) {
        setTools(data.tools);
        if (!data.isWindows) {
          toast.error('Windows tools are only available on Windows systems');
        }
      }
    } catch (error) {
      console.error('Error fetching Windows tools:', error);
      toast.error('Failed to load Windows tools');
    }
  };

  const executeTool = async (tool) => {
    if (runningTools.has(tool.name)) return;

    setRunningTools(prev => new Set([...prev, tool.name]));
    setLoading(true);

    try {
      const endpoint = tool.endpoint.replace('/windows', '/api/windows');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        setResults(prev => ({
          ...prev,
          [tool.name]: data
        }));
        
        // Add to workflow
        const phaseMap = {
          'System Enumeration': 'enumeration',
          'Network': 'scanning',
          'Security': 'vulnerabilityAssessment'
        };
        const phase = phaseMap[tool.category] || 'enumeration';
        
        addResult(phase, `windows-${tool.name.toLowerCase().replace(/\s+/g, '-')}`, {
          target: 'localhost',
          result: data
        });
        
        toast.success(`${tool.name} completed and added to workflow`);
      } else {
        toast.error(`${tool.name} failed: ${data.error}`);
      }
    } catch (error) {
      console.error(`Error executing ${tool.name}:`, error);
      toast.error(`Failed to execute ${tool.name}`);
    } finally {
      setRunningTools(prev => {
        const newSet = new Set(prev);
        newSet.delete(tool.name);
        return newSet;
      });
      setLoading(false);
    }
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `windows-security-scan-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Results exported successfully');
  };

  const clearResults = () => {
    setResults({});
    toast.success('Results cleared');
  };

  const getToolIcon = (category) => {
    switch (category) {
      case 'Security':
        return <Shield className="w-5 h-5" />;
      case 'Network':
        return <Network className="w-5 h-5" />;
      case 'System Enumeration':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const formatOutput = (output) => {
    if (typeof output === 'string') {
      return output.split('\n').map((line, index) => (
        <div key={index} className="font-mono text-sm">
          {line || '\u00A0'}
        </div>
      ));
    }
    return <pre className="font-mono text-sm">{JSON.stringify(output, null, 2)}</pre>;
  };

  const groupedTools = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {});

  const containerStyle = {
    padding: '24px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    minHeight: '100vh'
  };

  const headerStyle = {
    background: 'linear-gradient(to right, #dc2626, #b91c1c)',
    borderRadius: '8px',
    padding: '24px',
    color: '#ffffff',
    marginBottom: '24px'
  };

  const buttonStyle = {
    backgroundColor: '#ffffff',
    color: '#dc2626',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500'
  };

  const cardStyle = {
    backgroundColor: '#2d2d2d',
    border: '1px solid #404040',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px'
  };

  const toolButtonStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500'
  };

  const enabledButtonStyle = {
    ...toolButtonStyle,
    backgroundColor: '#dc2626',
    color: '#ffffff'
  };

  const disabledButtonStyle = {
    ...toolButtonStyle,
    backgroundColor: '#666666',
    color: '#cccccc',
    cursor: 'not-allowed'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Windows Security Module</h1>
              <p style={{color: '#fecaca'}}>Windows-specific security enumeration and analysis tools</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {Object.keys(results).length > 0 && (
              <>
                <button
                  onClick={exportResults}
                  style={buttonStyle}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#ffffff'}
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <button
                  onClick={clearResults}
                  style={{...buttonStyle, backgroundColor: '#b91c1c', color: '#ffffff'}}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#991b1b'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#b91c1c'}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Suggestions */}
      {suggestions.filter(s => s.phase === 'enumeration' || s.phase === 'scanning' || s.phase === 'vulnerabilityAssessment').length > 0 && (
        <div style={{...cardStyle, marginBottom: '32px'}}>
          <h2 className="text-xl font-semibold flex items-center space-x-2" style={{color: '#ffffff', marginBottom: '16px'}}>
            <Target className="w-5 h-5 text-yellow-500" />
            <span>Workflow Suggestions</span>
          </h2>
          <div className="space-y-2">
            {suggestions
              .filter(s => s.phase === 'enumeration' || s.phase === 'scanning' || s.phase === 'vulnerabilityAssessment')
              .slice(0, 4)
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

      {/* Tools Grid */}
      {Object.entries(groupedTools).map(([category, categoryTools]) => (
        <div key={category} style={{marginBottom: '32px'}}>
          <h2 className="text-xl font-semibold flex items-center space-x-2" style={{color: '#ffffff', marginBottom: '16px'}}>
            {getToolIcon(category)}
            <span>{category}</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTools.map((tool) => (
              <div key={tool.name} style={cardStyle}>
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getToolIcon(tool.category)}
                      <h3 className="font-semibold" style={{color: '#ffffff'}}>{tool.name}</h3>
                    </div>
                    <div className="flex items-center space-x-1">
                      {tool.available ? (
                        <CheckCircle className="w-4 h-4" style={{color: '#10b981'}} />
                      ) : (
                        <AlertTriangle className="w-4 h-4" style={{color: '#f59e0b'}} />
                      )}
                      {runningTools.has(tool.name) && (
                        <div className="animate-spin">
                          <RefreshCw className="w-4 h-4" style={{color: '#3b82f6'}} />
                        </div>
                      )}
                      {results[tool.name] && (
                        <Clock className="w-4 h-4" style={{color: '#6b7280'}} />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm mb-4" style={{color: '#cccccc'}}>
                    {tool.description}
                  </p>
                  
                  <button
                    onClick={() => executeTool(tool)}
                    disabled={!tool.available || runningTools.has(tool.name)}
                    style={tool.available && !runningTools.has(tool.name) ? enabledButtonStyle : disabledButtonStyle}
                    onMouseOver={(e) => {
                      if (tool.available && !runningTools.has(tool.name)) {
                        e.target.style.backgroundColor = '#b91c1c';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (tool.available && !runningTools.has(tool.name)) {
                        e.target.style.backgroundColor = '#dc2626';
                      }
                    }}
                  >
                    <Play className="w-4 h-4" />
                    <span>
                      {runningTools.has(tool.name) ? 'Running...' : 'Execute'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Results Section */}
      {Object.keys(results).length > 0 && (
        <div style={{marginTop: '32px'}}>
          <h2 className="text-xl font-semibold" style={{color: '#ffffff', marginBottom: '16px'}}>Results</h2>
          
          {Object.entries(results).map(([toolName, result]) => (
            <div key={toolName} style={{...cardStyle, marginBottom: '16px'}}>
              <div className="p-4 border-b" style={{borderColor: '#404040', backgroundColor: '#333333', marginBottom: '16px', borderRadius: '8px 8px 0 0'}}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold" style={{color: '#ffffff'}}>{toolName}</h3>
                  <div className="flex items-center space-x-2 text-sm" style={{color: '#cccccc'}}>
                    <CheckCircle className="w-4 h-4" style={{color: '#10b981'}} />
                    <span>Completed</span>
                    {result.scan_id && (
                      <span style={{backgroundColor: '#666666', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px'}}>
                        ID: {result.scan_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div style={{backgroundColor: '#1a1a1a', color: '#10b981', padding: '16px', borderRadius: '8px', overflow: 'auto', maxHeight: '400px', fontFamily: 'monospace', fontSize: '14px', border: '1px solid #404040'}}>
                  {result.result && result.result.output ? 
                    formatOutput(result.result.output) : 
                    formatOutput(result.result)
                  }
                </div>
                
                {result.raw_output && (
                  <details className="mt-4">
                    <summary style={{cursor: 'pointer', fontSize: '14px', color: '#cccccc'}}>
                      Raw Output
                    </summary>
                    <div style={{marginTop: '8px', backgroundColor: '#333333', padding: '12px', borderRadius: '4px', fontSize: '14px', fontFamily: 'monospace', color: '#ffffff'}}>
                      {formatOutput(result.raw_output)}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Platform Check */}
      {tools.length === 0 && (
        <div style={{backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '24px', textAlign: 'center', color: '#92400e'}}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{color: '#f59e0b'}} />
          <h3 className="text-lg font-semibold mb-2" style={{color: '#92400e'}}>
            Windows Tools Not Available
          </h3>
          <p style={{color: '#b45309'}}>
            Windows security tools are only available when running on Windows systems.
            These tools require PowerShell and Windows-specific commands.
          </p>
        </div>
      )}
    </div>
  );
};

export default WindowsModule; 
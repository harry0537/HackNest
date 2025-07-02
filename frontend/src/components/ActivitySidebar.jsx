import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { 
  Activity, 
  Play, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Clock, 
  Zap, 
  Database, 
  Terminal,
  ChevronDown,
  ChevronRight,
  Target,
  Globe,
  Shield,
  Search,
  AlertTriangle,
  Info,
  Filter,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2
} from 'lucide-react';

const ActivitySidebar = ({ isOpen, onToggle }) => {
  const { automatedWorkflow, workflow } = useWorkflow();
  const [expandedActivities, setExpandedActivities] = useState(new Set());
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, errors, success, data-handoff
  const [showDetails, setShowDetails] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-scroll to latest activity
  useEffect(() => {
    if (autoScroll && automatedWorkflow.activities.length > 0) {
      const latestActivity = document.getElementById('latest-activity');
      if (latestActivity) {
        latestActivity.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [automatedWorkflow.activities, autoScroll]);

  const toggleActivityExpansion = (activityId) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const getActivityIcon = (type, phase) => {
    switch (type) {
      case 'start':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'data-handoff':
        return <Database className="h-4 w-4 text-yellow-500" />;
      case 'progress':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 'reconnaissance':
        return <Search className="h-4 w-4" />;
      case 'scanning':
        return <Target className="h-4 w-4" />;
      case 'enumeration':
        return <Globe className="h-4 w-4" />;
      case 'vulnerabilityAssessment':
        return <Shield className="h-4 w-4" />;
      case 'exploitation':
        return <Zap className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'reconnaissance':
        return 'text-blue-400';
      case 'scanning':
        return 'text-green-400';
      case 'enumeration':
        return 'text-purple-400';
      case 'vulnerabilityAssessment':
        return 'text-orange-400';
      case 'exploitation':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatCommand = (tool, data) => {
    // Generate realistic commands based on tool type
    switch (tool) {
      case 'whois':
        return `whois ${data?.target || workflow.target}`;
      case 'nslookup':
        return `nslookup ${data?.target || workflow.target}`;
      case 'nmap-quick':
        return `nmap -T4 --top-ports 1000 ${data?.target || workflow.target}`;
      case 'nmap-service-detection':
        return `nmap -sV -sC ${data?.target || workflow.target}`;
      case 'dirb':
        return `dirb http://${data?.target || workflow.target}/`;
      case 'nikto':
        return `nikto -h ${data?.target || workflow.target}`;
      case 'sqlmap':
        return `sqlmap -u "${data?.target || workflow.target}" --batch`;
      default:
        return `${tool} ${data?.target || workflow.target}`;
    }
  };

  const renderDataHandoff = (activity) => {
    if (activity.type !== 'data-handoff' || !activity.data) return null;

    const hasData = Object.keys(activity.data).some(key => 
      activity.data[key] && 
      (Array.isArray(activity.data[key]) ? activity.data[key].length > 0 : activity.data[key])
    );

    if (!hasData) return null;

    return (
      <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
        <div className="text-yellow-400 font-medium mb-2 text-xs uppercase tracking-wide">
          Data Extracted:
        </div>
        <div className="space-y-1">
          {activity.data.ips && activity.data.ips.length > 0 && (
            <div className="text-gray-300 text-xs">
              <span className="text-yellow-300">IPs:</span> {activity.data.ips.slice(0, 3).join(', ')}
              {activity.data.ips.length > 3 && ` (+${activity.data.ips.length - 3} more)`}
            </div>
          )}
          {activity.data.openPorts && activity.data.openPorts.length > 0 && (
            <div className="text-gray-300 text-xs">
              <span className="text-yellow-300">Open Ports:</span> {activity.data.openPorts.length}
            </div>
          )}
          {activity.data.webServices && activity.data.webServices.length > 0 && (
            <div className="text-gray-300 text-xs">
              <span className="text-yellow-300">Web Services:</span> {activity.data.webServices.length}
            </div>
          )}
          {activity.data.webTargets && activity.data.webTargets.length > 0 && (
            <div className="text-gray-300 text-xs">
              <span className="text-yellow-300">Web Targets:</span> {activity.data.webTargets.length}
            </div>
          )}
          {activity.data.directories && activity.data.directories.length > 0 && (
            <div className="text-gray-300 text-xs">
              <span className="text-yellow-300">Directories:</span> {activity.data.directories.length}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProgressBar = () => {
    if (!automatedWorkflow.isRunning && automatedWorkflow.progress === 0) return null;

    return (
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">Workflow Progress</span>
          <span className="text-xs text-gray-400">
            {automatedWorkflow.completedSteps}/{automatedWorkflow.totalSteps}
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${automatedWorkflow.progress}%` }}
          ></div>
        </div>
        
        {automatedWorkflow.isRunning && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center text-gray-400">
              <div className="animate-pulse mr-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              </div>
              {automatedWorkflow.currentTool || automatedWorkflow.currentPhase}
            </div>
            <div className="text-gray-500">
              {Math.round(automatedWorkflow.progress)}%
            </div>
          </div>
        )}
      </div>
    );
  };

  const getFilteredActivities = () => {
    let filtered = [...automatedWorkflow.activities];
    
    switch (filterType) {
      case 'errors':
        filtered = filtered.filter(a => a.type === 'error');
        break;
      case 'success':
        filtered = filtered.filter(a => a.type === 'complete');
        break;
      case 'data-handoff':
        filtered = filtered.filter(a => a.type === 'data-handoff');
        break;
      case 'all':
      default:
        // Show all activities
        break;
    }
    
    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getSummaryStats = () => {
    const activities = automatedWorkflow.activities;
    return {
      total: activities.length,
      completed: activities.filter(a => a.type === 'complete').length,
      errors: activities.filter(a => a.type === 'error').length,
      dataHandoffs: activities.filter(a => a.type === 'data-handoff').length
    };
  };

  const stats = getSummaryStats();

  return (
    <div className={`fixed right-0 top-0 h-full bg-gray-900 border-l border-gray-700 transition-all duration-300 z-40 ${
      isOpen ? (isMinimized ? 'w-80' : 'w-96') : 'w-12'
    }`}>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full bg-gray-800 hover:bg-gray-700 p-2 rounded-l border border-r-0 border-gray-700 transition-colors"
      >
        {isOpen ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <Activity className="h-4 w-4 text-gray-400" />}
      </button>

      {isOpen && (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Live Activity</h3>
              </div>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4 text-gray-400" /> : <Minimize2 className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
            
            {!isMinimized && (
              <>
                <p className="text-xs text-gray-400 mb-3">Real-time workflow execution monitoring</p>
                
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{stats.total}</div>
                    <div className="text-xs text-gray-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{stats.completed}</div>
                    <div className="text-xs text-gray-400">Success</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-400">{stats.errors}</div>
                    <div className="text-xs text-gray-400">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">{stats.dataHandoffs}</div>
                    <div className="text-xs text-gray-400">Data</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {renderProgressBar()}

          {!isMinimized && (
            <>
              {/* Controls */}
              <div className="p-3 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="all">All ({stats.total})</option>
                      <option value="success">Success ({stats.completed})</option>
                      <option value="errors">Errors ({stats.errors})</option>
                      <option value="data-handoff">Data ({stats.dataHandoffs})</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="p-1 hover:bg-gray-700 rounded"
                      title={showDetails ? 'Hide details' : 'Show details'}
                    >
                      {showDetails ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </button>
                    
                    <label className="flex items-center text-xs text-gray-400">
                      <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        className="mr-1"
                      />
                      Auto-scroll
                    </label>
                  </div>
                </div>
              </div>

              {/* Activities */}
              <div className="flex-1 overflow-y-auto">
                {getFilteredActivities().length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {automatedWorkflow.activities.length === 0 
                        ? 'No activity yet' 
                        : `No ${filterType === 'all' ? '' : filterType + ' '}activities`}
                    </p>
                    <p className="text-xs mt-1">
                      {automatedWorkflow.activities.length === 0 
                        ? 'Start an automated workflow to see live updates'
                        : 'Try changing the filter to see other activities'}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {getFilteredActivities().map((activity, index) => (
                      <div
                        key={activity.id}
                        id={index === 0 ? 'latest-activity' : undefined}
                        className={`border rounded-lg p-3 transition-all duration-200 hover:bg-gray-800/50 ${
                          activity.type === 'error' 
                            ? 'border-red-500/30 bg-red-500/5' 
                            : activity.type === 'data-handoff'
                            ? 'border-yellow-500/30 bg-yellow-500/5'
                            : activity.type === 'complete'
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-gray-600 bg-gray-800/30'
                        }`}
                      >
                        {/* Activity Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            {getActivityIcon(activity.type, activity.phase)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium ${getPhaseColor(activity.phase)}`}>
                                  {activity.phase}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(activity.timestamp)}
                                </span>
                              </div>
                              
                              <p className="text-sm text-white mb-1 leading-relaxed">{activity.message}</p>
                              
                              {showDetails && activity.tool && activity.tool !== 'automation' && (
                                <div className="text-xs text-gray-400 font-mono bg-gray-900/50 p-2 rounded border border-gray-700 mt-2">
                                  <span className="text-gray-500">$ </span>
                                  {formatCommand(activity.tool, activity.data)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {showDetails && (activity.data || activity.type === 'data-handoff') && (
                            <button
                              onClick={() => toggleActivityExpansion(activity.id)}
                              className="ml-2 p-1 hover:bg-gray-700 rounded transition-colors"
                            >
                              {expandedActivities.has(activity.id) ? (
                                <ChevronDown className="h-3 w-3 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Expanded Details */}
                        {showDetails && expandedActivities.has(activity.id) && (
                          <div className="mt-3 border-t border-gray-600 pt-2">
                            {renderDataHandoff(activity)}
                            
                            {activity.data && activity.type !== 'data-handoff' && (
                              <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs border border-gray-700">
                                <div className="text-gray-400 font-medium mb-1 flex items-center gap-1">
                                  <Database className="h-3 w-3" />
                                  Raw Output:
                                </div>
                                <pre className="text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
                                  {typeof activity.data === 'string' 
                                    ? activity.data.substring(0, 500) + (activity.data.length > 500 ? '...' : '')
                                    : JSON.stringify(activity.data, null, 2).substring(0, 500)
                                  }
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-gray-700">
                <div className="text-xs text-gray-500 text-center">
                  {automatedWorkflow.isRunning ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                      Workflow in progress...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Target className="h-3 w-3" />
                      {workflow.target || 'No target set'}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivitySidebar; 
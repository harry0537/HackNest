import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { 
  Zap, 
  Play, 
  Square, 
  Target, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Globe,
  Shield,
  Search,
  Settings,
  FileText,
  BarChart3,
  AlertTriangle,
  Info,
  Download,
  Pause,
  RotateCcw,
  XCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reconAPI, scanAPI, webAPI } from '../utils/api';

const AutomatedWorkflow = () => {
  const { 
    workflow, 
    automatedWorkflow, 
    workflowTemplates, 
    startAutomatedWorkflow, 
    stopAutomatedWorkflow,
    updateWorkflowProgress,
    addResult,
    setTarget
  } = useWorkflow();

  const [selectedTemplate, setSelectedTemplate] = useState('quick-assessment');
  const [targetInput, setTargetInput] = useState(workflow.target || '');
  const [currentExecutionIndex, setCurrentExecutionIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [failedTools, setFailedTools] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(2);
  const [executionLog, setExecutionLog] = useState([]);

  // Automated execution engine with error handling
  useEffect(() => {
    let executionTimeout;

    const executeWorkflow = async () => {
      if (!automatedWorkflow.isRunning || !selectedTemplate || isPaused) return;

      const template = workflowTemplates[selectedTemplate];
      if (!template) return;

      setIsExecuting(true);

      try {
        // Flatten all tools from all phases
        const allTools = [];
        template.phases.forEach(phase => {
          phase.tools.forEach(tool => {
            allTools.push({ phase: phase.phase, tool });
          });
        });

        for (let i = currentExecutionIndex; i < allTools.length; i++) {
          if (!automatedWorkflow.isRunning || isPaused) break;

          const { phase, tool } = allTools[i];
          
          // Add to execution log
          setExecutionLog(prev => [...prev, {
            timestamp: new Date(),
            phase,
            tool,
            status: 'starting',
            message: `Starting ${tool} execution`
          }]);

          updateWorkflowProgress(phase, tool, 'start');
          
          try {
            let result;
            const target = workflow.target;

            // Add timeout for each tool execution
            const toolExecutionPromise = executeToolWithTimeout(tool, target, 60000); // 60 second timeout
            
            result = await toolExecutionPromise;

            if (result && result.success) {
              addResult(phase, tool, { target, result });
              updateWorkflowProgress(phase, tool, 'complete', result);
              
              // Update execution log
              setExecutionLog(prev => [...prev, {
                timestamp: new Date(),
                phase,
                tool,
                status: 'completed',
                message: `${tool} completed successfully`,
                result
              }]);
              
              // Small delay between tools for better UX
              await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
              throw new Error(result?.error || 'Tool execution failed');
            }

          } catch (error) {
            console.error(`Error executing ${tool}:`, error);
            
            // Add to failed tools list
            setFailedTools(prev => [...prev, { phase, tool, error: error.message }]);
            
            // Update execution log
            setExecutionLog(prev => [...prev, {
              timestamp: new Date(),
              phase,
              tool,
              status: 'failed',
              message: `${tool} failed: ${error.message}`,
              error: error.message
            }]);

            updateWorkflowProgress(phase, tool, 'error', { error: error.message });
            
            // Show error toast
            toast.error(`${tool} failed: ${error.message}`);
            
            // Continue with next tool after a short delay
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          setCurrentExecutionIndex(i + 1);
        }

        // Workflow completed
        if (currentExecutionIndex >= allTools.length) {
          const successCount = allTools.length - failedTools.length;
          const successRate = Math.round((successCount / allTools.length) * 100);
          
          toast.success(`Workflow completed! ${successCount}/${allTools.length} tools successful (${successRate}%)`);
          
          setExecutionLog(prev => [...prev, {
            timestamp: new Date(),
            phase: 'workflow',
            tool: 'automation',
            status: 'completed',
            message: `Workflow completed with ${successRate}% success rate`
          }]);
        }

      } catch (error) {
        console.error('Workflow execution error:', error);
        toast.error('Workflow execution failed');
        
        setExecutionLog(prev => [...prev, {
          timestamp: new Date(),
          phase: 'workflow',
          tool: 'automation',
          status: 'failed',
          message: `Workflow failed: ${error.message}`,
          error: error.message
        }]);
      } finally {
        setIsExecuting(false);
      }
    };

    if (automatedWorkflow.isRunning && !isExecuting && !isPaused) {
      executionTimeout = setTimeout(executeWorkflow, 1000);
    }

    return () => {
      if (executionTimeout) clearTimeout(executionTimeout);
    };
  }, [automatedWorkflow.isRunning, currentExecutionIndex, selectedTemplate, workflow.target, automatedWorkflow.extractedData, isPaused]);

  const executeToolWithTimeout = async (tool, target, timeoutMs) => {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Tool ${tool} timed out after ${timeoutMs/1000} seconds`));
      }, timeoutMs);

      try {
        let result;
        
        // Execute based on tool type
        switch (tool) {
          case 'whois':
            result = await reconAPI.whois({ target });
            break;
          case 'nslookup':
            result = await reconAPI.nslookup({ target });
            break;
          case 'dig':
            result = await reconAPI.dig({ target });
            break;
          case 'nmap-quick':
            result = await scanAPI.nmapQuick(target);
            break;
          case 'nmap-full':
            result = await scanAPI.nmapFull(target);
            break;
          case 'nmap-service-detection':
            result = await scanAPI.nmapServiceDetection(target);
            break;
          case 'http-detect':
            result = await scanAPI.httpDetect({ target });
            break;
          case 'dirb':
            // Use extracted data if available
            const webTargets = automatedWorkflow.extractedData['http-detect']?.webTargets || 
                              automatedWorkflow.extractedData['nmap-quick']?.webServices || [];
            
            if (webTargets.length > 0) {
              const targetUrl = webTargets[0].url || `http://${target}`;
              result = await webAPI.dirb({ target: targetUrl });
            } else {
              result = await webAPI.dirb({ target: `http://${target}` });
            }
            break;
          case 'nikto':
            // Use extracted web targets
            const niktoTargets = automatedWorkflow.extractedData['http-detect']?.webTargets || [];
            if (niktoTargets.length > 0) {
              result = await webAPI.nikto({ target: niktoTargets[0].url });
            } else {
              result = await webAPI.nikto({ target: `http://${target}` });
            }
            break;
          case 'whatweb':
            result = await webAPI.whatweb({ target: `http://${target}` });
            break;
          case 'headers':
            result = await webAPI.headers({ target: `http://${target}` });
            break;
          default:
            throw new Error(`Unknown tool: ${tool}`);
        }

        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  };

  const handleStartWorkflow = () => {
    if (!targetInput.trim()) {
      toast.error('Please enter a target');
      return;
    }

    // Reset state
    setTarget(targetInput);
    setCurrentExecutionIndex(0);
    setFailedTools([]);
    setRetryCount(0);
    setExecutionLog([]);
    setIsPaused(false);
    
    startAutomatedWorkflow(selectedTemplate, targetInput);
    
    toast.success('Automated workflow started!');
  };

  const handleStopWorkflow = () => {
    stopAutomatedWorkflow();
    setIsExecuting(false);
    setCurrentExecutionIndex(0);
    setIsPaused(false);
    
    toast.info('Workflow stopped');
  };

  const handlePauseResumeWorkflow = () => {
    setIsPaused(!isPaused);
    
    if (isPaused) {
      toast.success('Workflow resumed');
    } else {
      toast.info('Workflow paused');
    }
  };

  const handleRetryFailedTools = async () => {
    if (failedTools.length === 0) return;
    
    if (retryCount >= maxRetries) {
      toast.error(`Maximum retries (${maxRetries}) reached for failed tools`);
      return;
    }

    setRetryCount(prev => prev + 1);
    toast.info(`Retrying ${failedTools.length} failed tools (attempt ${retryCount + 1}/${maxRetries})`);
    
    // Reset failed tools and continue execution
    setFailedTools([]);
    setIsPaused(false);
    
    // Continue from where we left off
    if (!automatedWorkflow.isRunning) {
      startAutomatedWorkflow(selectedTemplate, workflow.target);
    }
  };

  const getTemplateIcon = (templateKey) => {
    switch (templateKey) {
      case 'web-assessment':
        return <Globe className="h-6 w-6" />;
      case 'network-assessment':
        return <Shield className="h-6 w-6" />;
      case 'quick-assessment':
        return <Zap className="h-6 w-6" />;
      default:
        return <Settings className="h-6 w-6" />;
    }
  };

  const getPhaseProgress = () => {
    if (!automatedWorkflow.isRunning && automatedWorkflow.progress === 0) return [];

    const template = workflowTemplates[selectedTemplate];
    if (!template) return [];

    let currentStep = 0;
    const phaseProgress = template.phases.map(phase => {
      const phaseSteps = phase.tools.length;
      const completedInPhase = Math.min(
        Math.max(0, automatedWorkflow.completedSteps - currentStep),
        phaseSteps
      );
      currentStep += phaseSteps;

      return {
        ...phase,
        completed: completedInPhase,
        total: phaseSteps,
        progress: (completedInPhase / phaseSteps) * 100,
        isActive: currentStep > automatedWorkflow.completedSteps && completedInPhase < phaseSteps
      };
    });

    return phaseProgress;
  };

  const exportResults = () => {
    const exportData = {
      workflow,
      automatedWorkflow: {
        ...automatedWorkflow,
        activities: automatedWorkflow.activities.slice(0, 50) // Limit activities
      },
      template: selectedTemplate,
      executionLog,
      failedTools,
      stats: {
        totalTools: workflowTemplates[selectedTemplate]?.phases.reduce((total, phase) => total + phase.tools.length, 0) || 0,
        successfulTools: (workflowTemplates[selectedTemplate]?.phases.reduce((total, phase) => total + phase.tools.length, 0) || 0) - failedTools.length,
        failedTools: failedTools.length,
        retryCount
      },
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `hacknest-workflow-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Workflow results exported successfully');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Automated Penetration Testing</h1>
            <p className="text-gray-400">Intelligent workflow automation with error recovery</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {automatedWorkflow.isRunning && (
            <>
              <button
                onClick={handlePauseResumeWorkflow}
                className={`${isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              
              <button
                onClick={handleStopWorkflow}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Square className="h-4 w-4" />
                Stop
              </button>
            </>
          )}
          
          {failedTools.length > 0 && retryCount < maxRetries && (
            <button
              onClick={handleRetryFailedTools}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Retry Failed ({failedTools.length})
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {isPaused && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Pause className="h-5 w-5 text-yellow-500" />
            <div>
              <h4 className="font-medium text-yellow-500">Workflow Paused</h4>
              <p className="text-sm text-gray-300">Click Resume to continue execution</p>
            </div>
          </div>
        </div>
      )}

      {failedTools.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <h4 className="font-medium text-red-500">Failed Tools ({failedTools.length})</h4>
                <p className="text-sm text-gray-300">
                  Some tools failed during execution. {retryCount < maxRetries ? 'You can retry them.' : 'Maximum retries reached.'}
                </p>
              </div>
            </div>
            {retryCount < maxRetries && (
              <button
                onClick={handleRetryFailedTools}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Retry ({retryCount}/{maxRetries})
              </button>
            )}
          </div>
          <div className="mt-3 space-y-1">
            {failedTools.slice(0, 3).map((failed, index) => (
              <div key={index} className="text-sm text-gray-400">
                • {failed.tool} in {failed.phase}: {failed.error}
              </div>
            ))}
            {failedTools.length > 3 && (
              <div className="text-sm text-gray-500">... and {failedTools.length - 3} more</div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Assessment Templates</h3>
            
            <div className="space-y-3">
              {Object.entries(workflowTemplates).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  disabled={automatedWorkflow.isRunning}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedTemplate === key
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                  } ${automatedWorkflow.isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${selectedTemplate === key ? 'text-purple-400' : 'text-gray-400'}`}>
                      {getTemplateIcon(key)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">{template.name}</h4>
                      <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                      <div className="text-xs text-gray-500">
                        {template.phases.reduce((total, phase) => total + phase.tools.length, 0)} steps
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Input */}
          <div className="card mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Target Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Target Host/Domain</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="example.com or 192.168.1.100"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  disabled={automatedWorkflow.isRunning}
                />
              </div>

              <button
                onClick={handleStartWorkflow}
                disabled={!targetInput.trim() || automatedWorkflow.isRunning}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                {automatedWorkflow.isRunning ? 'Workflow Running...' : 'Start Automated Assessment'}
              </button>
            </div>
          </div>

          {/* Execution Stats */}
          {(automatedWorkflow.isRunning || automatedWorkflow.progress > 0) && (
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Execution Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-green-400">
                    {Math.round(((automatedWorkflow.completedSteps - failedTools.length) / Math.max(1, automatedWorkflow.completedSteps)) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Failed Tools:</span>
                  <span className="text-red-400">{failedTools.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Retry Attempts:</span>
                  <span className="text-yellow-400">{retryCount}/{maxRetries}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className={`${isPaused ? 'text-yellow-400' : automatedWorkflow.isRunning ? 'text-blue-400' : 'text-gray-400'}`}>
                    {isPaused ? 'Paused' : automatedWorkflow.isRunning ? 'Running' : 'Stopped'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Workflow Progress */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Workflow Execution</h3>
              
              {automatedWorkflow.progress > 0 && (
                <button
                  onClick={exportResults}
                  className="btn-secondary text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </button>
              )}
            </div>

            {/* Overall Progress */}
            {(automatedWorkflow.isRunning || automatedWorkflow.progress > 0) && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Overall Progress</span>
                  <span className="text-sm text-gray-400">
                    {Math.round(automatedWorkflow.progress)}% ({automatedWorkflow.completedSteps}/{automatedWorkflow.totalSteps})
                  </span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      isPaused ? 'bg-yellow-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
                    }`}
                    style={{ width: `${automatedWorkflow.progress}%` }}
                  ></div>
                </div>

                {automatedWorkflow.isRunning && (
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <div className="flex items-center text-gray-400">
                      {isPaused ? (
                        <>
                          <Pause className="w-4 h-4 mr-2 text-yellow-500" />
                          Paused at: {automatedWorkflow.currentTool}
                        </>
                      ) : (
                        <>
                          <div className="animate-pulse mr-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                          Currently executing: {automatedWorkflow.currentTool}
                        </>
                      )}
                    </div>
                    <div className="text-gray-500">
                      ETA: {Math.round((automatedWorkflow.totalSteps - automatedWorkflow.completedSteps) * 2)} min
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phase Progress */}
            {workflowTemplates[selectedTemplate] && (automatedWorkflow.isRunning || automatedWorkflow.progress > 0) && (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-white">Phase Breakdown</h4>
                
                {getPhaseProgress().map((phase, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    phase.isActive 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : phase.completed === phase.total 
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-600 bg-gray-800/50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`${
                          phase.isActive ? 'text-blue-400' : 
                          phase.completed === phase.total ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          {phase.completed === phase.total ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : phase.isActive ? (
                            <Clock className="h-5 w-5" />
                          ) : (
                            <Search className="h-5 w-5" />
                          )}
                        </div>
                        <span className="font-medium text-white capitalize">{phase.phase}</span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {phase.completed}/{phase.total}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          phase.completed === phase.total ? 'bg-green-500' :
                          phase.isActive ? 'bg-blue-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${phase.progress}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {phase.tools.map((tool, toolIndex) => {
                        const isToolFailed = failedTools.some(f => f.tool === tool && f.phase === phase.phase);
                        return (
                          <span
                            key={toolIndex}
                            className={`px-2 py-1 rounded text-xs ${
                              isToolFailed
                                ? 'bg-red-600 text-white'
                                : toolIndex < phase.completed
                                ? 'bg-green-600 text-white'
                                : toolIndex === phase.completed && phase.isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-gray-300'
                            }`}
                          >
                            {tool}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Getting Started */}
            {!automatedWorkflow.isRunning && automatedWorkflow.progress === 0 && (
              <div className="text-center py-12">
                <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">Ready to Start Assessment</h4>
                <p className="text-gray-400 mb-4">
                  Select a template, enter your target, and click "Start Automated Assessment" to begin.
                </p>
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-left">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-400 mb-1">Enhanced Features</h5>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Intelligent error recovery and retry mechanisms</li>
                        <li>• Pause/resume functionality for workflow control</li>
                        <li>• Real-time progress monitoring with ETA</li>
                        <li>• Comprehensive execution logging and statistics</li>
                        <li>• Automatic data handoff between tools</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomatedWorkflow; 
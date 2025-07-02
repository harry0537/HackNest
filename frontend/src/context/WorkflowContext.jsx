import React, { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const WorkflowContext = createContext();

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider = ({ children }) => {
  const [workflow, setWorkflow] = useState({
    target: '',
    results: {
      reconnaissance: {},
      scanning: {},
      enumeration: {},
      vulnerabilityAssessment: {},
      exploitation: {},
      postExploitation: {}
    },
    metadata: {
      startTime: null,
      endTime: null,
      totalScans: 0,
      findings: []
    }
  });

  const [suggestions, setSuggestions] = useState([]);
  
  // New: Automated workflow execution state
  const [automatedWorkflow, setAutomatedWorkflow] = useState({
    isRunning: false,
    currentPhase: '',
    currentTool: '',
    progress: 0,
    totalSteps: 0,
    completedSteps: 0,
    activities: [], // Real-time activity feed
    extractedData: {}, // Data extracted for handoffs
    errors: []
  });

  const [workflowTemplates] = useState({
    'web-assessment': {
      name: 'Web Application Assessment',
      description: 'Complete web application security assessment',
      phases: [
        { phase: 'reconnaissance', tools: ['whois', 'nslookup', 'dig'] },
        { phase: 'scanning', tools: ['nmap-quick', 'nmap-service-detection'] },
        { phase: 'enumeration', tools: ['http-detect', 'dirb', 'nikto'] },
        { phase: 'vulnerabilityAssessment', tools: ['whatweb', 'headers'] },
        { phase: 'exploitation', tools: ['sqlmap'] }
      ]
    },
    'network-assessment': {
      name: 'Network Infrastructure Assessment',
      description: 'Comprehensive network security assessment',
      phases: [
        { phase: 'reconnaissance', tools: ['whois', 'nslookup'] },
        { phase: 'scanning', tools: ['nmap-quick', 'nmap-full', 'nmap-service-detection'] },
        { phase: 'enumeration', tools: ['http-detect'] },
        { phase: 'vulnerabilityAssessment', tools: ['nikto', 'whatweb'] }
      ]
    },
    'quick-assessment': {
      name: 'Quick Security Assessment',
      description: 'Fast security overview assessment',
      phases: [
        { phase: 'reconnaissance', tools: ['whois'] },
        { phase: 'scanning', tools: ['nmap-quick'] },
        { phase: 'enumeration', tools: ['http-detect'] }
      ]
    }
  });

  // Add activity to real-time feed
  const addActivity = useCallback((type, phase, tool, message, data = null) => {
    const activity = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type, // 'start', 'progress', 'complete', 'error', 'data-handoff'
      phase,
      tool,
      message,
      data
    };

    setAutomatedWorkflow(prev => ({
      ...prev,
      activities: [activity, ...prev.activities.slice(0, 99)] // Keep last 100 activities
    }));
  }, []);

  // Extract intelligence from scan results for data handoff
  const extractIntelligence = useCallback((toolName, result) => {
    let extracted = {};

    try {
      if (toolName === 'whois') {
        // Extract IPs and nameservers from WHOIS
        const output = result.result?.output || '';
        const ipMatches = output.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g) || [];
        const nameservers = output.match(/Name Server: (.+)/gi)?.map(ns => ns.replace('Name Server: ', '').trim()) || [];
        
        extracted = {
          ips: [...new Set(ipMatches)],
          nameservers: nameservers,
          registrar: output.match(/Registrar: (.+)/i)?.[1]?.trim()
        };

        addActivity('data-handoff', 'reconnaissance', 'whois', 
          `Extracted ${extracted.ips.length} IP addresses and ${extracted.nameservers.length} nameservers for port scanning`,
          extracted
        );
      }
      
      else if (toolName.includes('nmap')) {
        // Extract open ports and services
        const hosts = result.result?.hosts || [];
        const openPorts = [];
        const webServices = [];
        
        hosts.forEach(host => {
          if (host.ports) {
            host.ports.forEach(port => {
              if (port.state === 'open') {
                openPorts.push({
                  host: host.ip || host.hostname,
                  port: port.port,
                  protocol: port.protocol,
                  service: port.service,
                  version: port.version
                });

                // Check for web services
                if (['http', 'https', 'ssl/http', 'http-proxy'].includes(port.service?.toLowerCase()) || 
                    [80, 443, 8080, 8443, 8000, 8888].includes(parseInt(port.port))) {
                  webServices.push({
                    host: host.ip || host.hostname,
                    port: port.port,
                    protocol: port.service?.includes('ssl') || port.port === '443' ? 'https' : 'http',
                    service: port.service
                  });
                }
              }
            });
          }
        });

        extracted = {
          openPorts,
          webServices,
          totalHosts: hosts.length
        };

        addActivity('data-handoff', 'scanning', toolName, 
          `Found ${openPorts.length} open ports and ${webServices.length} web services for enumeration`,
          extracted
        );
      }
      
      else if (toolName === 'http-detect') {
        // Extract HTTP services for web testing
        const services = result.result?.services_found || [];
        extracted = {
          webTargets: services.map(service => ({
            url: `${service.protocol}://${result.target}:${service.port}`,
            server: service.server,
            port: service.port
          }))
        };

        addActivity('data-handoff', 'enumeration', 'http-detect', 
          `Identified ${extracted.webTargets.length} web targets for vulnerability assessment`,
          extracted
        );
      }

      else if (toolName === 'dirb') {
        // Extract discovered directories
        const output = result.result?.output || '';
        const directories = output.match(/\+ (.+?) \(/g)?.map(dir => dir.replace('+ ', '').replace(' (', '')) || [];
        
        extracted = {
          directories,
          baseUrl: result.target
        };

        addActivity('data-handoff', 'enumeration', 'dirb', 
          `Discovered ${directories.length} directories/files for further testing`,
          extracted
        );
      }

      // Store extracted data
      setAutomatedWorkflow(prev => ({
        ...prev,
        extractedData: {
          ...prev.extractedData,
          [toolName]: extracted
        }
      }));

    } catch (error) {
      console.error('Error extracting intelligence:', error);
    }

    return extracted;
  }, [addActivity]);

  // Enhanced addResult with intelligence extraction
  const addResult = useCallback((phase, toolName, data) => {
    setWorkflow(prev => ({
      ...prev,
      results: {
        ...prev.results,
        [phase]: {
          ...prev.results[phase],
          [toolName]: {
            ...data,
            timestamp: new Date().toISOString(),
            scan_id: data.result?.scan_id || Date.now()
          }
        }
      },
      metadata: {
        ...prev.metadata,
        totalScans: prev.metadata.totalScans + 1,
        endTime: new Date().toISOString()
      }
    }));

    // Extract intelligence for data handoff
    const extracted = extractIntelligence(toolName, data);
    
    // Generate smart suggestions
    generateSuggestions(phase, toolName, data, extracted);
  }, [extractIntelligence]);

  // Generate smart suggestions based on results
  const generateSuggestions = useCallback((phase, toolName, data, extracted) => {
    const newSuggestions = [];
    const target = data.target || workflow.target;

    if (toolName === 'whois' && extracted?.ips?.length > 0) {
      newSuggestions.push({
        phase: 'scanning',
        action: 'Port scan discovered IP addresses',
        description: `Run port scan on ${extracted.ips.length} discovered IPs`,
        target: extracted.ips[0],
        priority: 'high',
        tool: 'nmap-quick',
        automated: true
      });
    }

    if (toolName.includes('nmap') && extracted?.webServices?.length > 0) {
      newSuggestions.push({
        phase: 'enumeration',
        action: 'Enumerate web services',
        description: `Test ${extracted.webServices.length} discovered web services`,
        target: extracted.webServices[0].host,
        priority: 'high',
        tool: 'dirb',
        automated: true
      });
    }

    if (toolName === 'http-detect' && extracted?.webTargets?.length > 0) {
      newSuggestions.push({
        phase: 'vulnerabilityAssessment',
        action: 'Web vulnerability assessment',
        description: `Scan web applications for vulnerabilities`,
        target: extracted.webTargets[0].url,
        priority: 'high',
        tool: 'nikto',
        automated: true
      });
    }

    if (newSuggestions.length > 0) {
      setSuggestions(prev => [...newSuggestions, ...prev.slice(0, 10)]);
    }
  }, [workflow.target]);

  // Start automated workflow
  const startAutomatedWorkflow = useCallback(async (templateName, target) => {
    const template = workflowTemplates[templateName];
    if (!template) {
      toast.error('Invalid workflow template');
      return;
    }

    setWorkflow(prev => ({
      ...prev,
      target,
      metadata: {
        ...prev.metadata,
        startTime: new Date().toISOString(),
        totalScans: 0
      }
    }));

    const totalSteps = template.phases.reduce((sum, phase) => sum + phase.tools.length, 0);

    setAutomatedWorkflow({
      isRunning: true,
      currentPhase: template.phases[0].phase,
      currentTool: '',
      progress: 0,
      totalSteps,
      completedSteps: 0,
      activities: [],
      extractedData: {},
      errors: []
    });

    addActivity('start', 'workflow', 'automation', 
      `Starting ${template.name} for target: ${target}`, 
      { template: templateName, totalSteps }
    );

    toast.success(`Starting ${template.name}`);
  }, [workflowTemplates, addActivity]);

  // Stop automated workflow
  const stopAutomatedWorkflow = useCallback(() => {
    setAutomatedWorkflow(prev => ({
      ...prev,
      isRunning: false,
      currentPhase: '',
      currentTool: ''
    }));

    addActivity('complete', 'workflow', 'automation', 'Workflow execution stopped by user');
    toast.info('Workflow execution stopped');
  }, [addActivity]);

  // Update workflow progress
  const updateWorkflowProgress = useCallback((phase, tool, status, data = null) => {
    setAutomatedWorkflow(prev => {
      const newCompletedSteps = status === 'complete' ? prev.completedSteps + 1 : prev.completedSteps;
      const newProgress = (newCompletedSteps / prev.totalSteps) * 100;

      return {
        ...prev,
        currentPhase: phase,
        currentTool: tool,
        completedSteps: newCompletedSteps,
        progress: newProgress,
        isRunning: newProgress < 100 && prev.isRunning
      };
    });

    if (status === 'complete') {
      addActivity('complete', phase, tool, `${tool} completed successfully`, data);
    } else if (status === 'error') {
      addActivity('error', phase, tool, `${tool} failed: ${data?.error || 'Unknown error'}`, data);
    } else if (status === 'start') {
      addActivity('start', phase, tool, `Starting ${tool} execution`, data);
    }
  }, [addActivity]);

  const setTarget = useCallback((target) => {
    setWorkflow(prev => ({
      ...prev,
      target
    }));
  }, []);

  const clearWorkflow = useCallback(() => {
    setWorkflow({
      target: '',
      results: {
        reconnaissance: {},
        scanning: {},
        enumeration: {},
        vulnerabilityAssessment: {},
        exploitation: {},
        postExploitation: {}
      },
      metadata: {
        startTime: null,
        endTime: null,
        totalScans: 0,
        findings: []
      }
    });
    setSuggestions([]);
    setAutomatedWorkflow({
      isRunning: false,
      currentPhase: '',
      currentTool: '',
      progress: 0,
      totalSteps: 0,
      completedSteps: 0,
      activities: [],
      extractedData: {},
      errors: []
    });
  }, []);

  const getWorkflowSummary = useCallback(() => {
    const { results } = workflow;
    const summary = {
      totalResults: 0,
      phases: {},
      findings: []
    };

    Object.entries(results).forEach(([phase, phaseResults]) => {
      const toolCount = Object.keys(phaseResults).length;
      summary.totalResults += toolCount;
      summary.phases[phase] = toolCount;
    });

    return summary;
  }, [workflow]);

  const value = {
    workflow,
    suggestions,
    automatedWorkflow,
    workflowTemplates,
    addResult,
    setTarget,
    clearWorkflow,
    getWorkflowSummary,
    startAutomatedWorkflow,
    stopAutomatedWorkflow,
    updateWorkflowProgress,
    addActivity,
    extractIntelligence
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}; 
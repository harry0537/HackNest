const express = require('express');
const router = express.Router();
const PlatformUtils = require('../utils/platform');
const { getPlatform, checkAllTools, generateInstallInstructions, findToolPath } = require('../utils/platform');

// System information endpoint
router.get('/info', (req, res) => {
  try {
    const systemInfo = PlatformUtils.getSystemInfo();
    
    res.json({
      success: true,
      system: systemInfo,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('System info error:', error);
    res.status(500).json({
      error: 'Failed to get system information',
      details: error.message
    });
  }
});

// Available tools check
router.get('/tools', (req, res) => {
  try {
    const systemInfo = PlatformUtils.getSystemInfo();
    
    res.json({
      success: true,
      platform: systemInfo.platform,
      availableCommands: systemInfo.availableCommands,
      recommendations: {
        whois: systemInfo.isWindows ? 'Use nslookup instead' : 'Native whois available',
        dns: systemInfo.isWindows ? 'Using nslookup' : 'Using dig',
        traceroute: systemInfo.isWindows ? 'Using tracert' : 'Using traceroute'
      }
    });
  } catch (error) {
    console.error('Tools check error:', error);
    res.status(500).json({
      error: 'Failed to check available tools',
      details: error.message
    });
  }
});

// Get tool installation status
router.get('/tools/status', (req, res) => {
  try {
    const toolReport = checkAllTools();
    
    res.json({
      success: true,
      platform: toolReport.platform,
      status: toolReport.status,
      readiness: toolReport.readiness,
      summary: toolReport.summary,
      tools: toolReport.tools,
      portableToolsPath: toolReport.portableToolsPath,
      portableToolsExists: toolReport.portableToolsExists
    });
  } catch (error) {
    console.error('Tool status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check tool status',
      details: error.message
    });
  }
});

// Get installation instructions for missing tools
router.get('/tools/install-instructions', (req, res) => {
  try {
    const instructions = generateInstallInstructions();
    
    res.json({
      success: true,
      ...instructions
    });
  } catch (error) {
    console.error('Install instructions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate installation instructions',
      details: error.message
    });
  }
});

// Check specific tool availability
router.get('/tools/check/:toolName', (req, res) => {
  try {
    const { toolName } = req.params;
    const toolInfo = findToolPath(toolName);
    
    res.json({
      success: true,
      tool: toolName,
      ...toolInfo
    });
  } catch (error) {
    console.error('Tool check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check tool',
      details: error.message
    });
  }
});

// Get system capabilities and recommendations  
router.get('/capabilities', (req, res) => {
  try {
    const platform = getPlatform();
    const toolReport = checkAllTools();
    
    // Determine what HackNest can do based on available tools
    const capabilities = {
      reconnaissance: {
        available: toolReport.tools.nmap?.found || toolReport.tools.subfinder?.found,
        tools: ['nmap', 'subfinder', 'nuclei'].filter(t => toolReport.tools[t]?.found),
        level: calculateCapabilityLevel(['nmap', 'subfinder', 'nuclei'], toolReport.tools)
      },
      webTesting: {
        available: toolReport.tools.curl?.found || toolReport.tools.gobuster?.found,
        tools: ['curl', 'gobuster', 'sqlmap', 'nikto'].filter(t => toolReport.tools[t]?.found),
        level: calculateCapabilityLevel(['curl', 'gobuster', 'sqlmap', 'nikto'], toolReport.tools)
      },
      exploitation: {
        available: toolReport.tools.hydra?.found || toolReport.tools.john?.found,
        tools: ['hydra', 'john'].filter(t => toolReport.tools[t]?.found),
        level: calculateCapabilityLevel(['hydra', 'john'], toolReport.tools)
      },
      reporting: {
        available: true, // Always available
        tools: ['built-in'],
        level: 'full'
      }
    };

    // Overall capability assessment
    const overallLevel = Object.values(capabilities).reduce((acc, cap) => {
      const levelScore = { none: 0, basic: 1, partial: 2, full: 3 }[cap.level] || 0;
      return acc + levelScore;
    }, 0) / Object.keys(capabilities).length;

    let overallCapability = 'none';
    if (overallLevel >= 2.5) overallCapability = 'full';
    else if (overallLevel >= 1.5) overallCapability = 'partial';
    else if (overallLevel >= 0.5) overallCapability = 'basic';

    res.json({
      success: true,
      platform: platform,
      overallCapability,
      readiness: toolReport.readiness,
      capabilities,
      recommendations: generateRecommendations(toolReport, capabilities),
      toolSummary: toolReport.summary
    });
  } catch (error) {
    console.error('Capabilities check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assess capabilities',
      details: error.message
    });
  }
});

// Helper function to calculate capability level
function calculateCapabilityLevel(requiredTools, availableTools) {
  const foundTools = requiredTools.filter(tool => availableTools[tool]?.found);
  const percentage = foundTools.length / requiredTools.length;
  
  if (percentage >= 0.8) return 'full';
  if (percentage >= 0.5) return 'partial';
  if (percentage >= 0.2) return 'basic';
  return 'none';
}

// Helper function to generate recommendations
function generateRecommendations(toolReport, capabilities) {
  const recommendations = [];

  // Critical tools missing
  if (toolReport.summary.requiredMissing > 0) {
    recommendations.push({
      priority: 'critical',
      category: 'tools',
      message: `${toolReport.summary.requiredMissing} critical tools are missing. HackNest may not function properly.`,
      action: 'Run the automated installer or install tools manually',
      command: '.\\install-tools.ps1 -InstallEssential'
    });
  }

  // Reconnaissance capabilities
  if (capabilities.reconnaissance.level === 'none') {
    recommendations.push({
      priority: 'high',
      category: 'reconnaissance',
      message: 'No reconnaissance tools available. Install Nmap for basic scanning.',
      action: 'Install Nmap',
      command: 'choco install nmap -y'
    });
  } else if (capabilities.reconnaissance.level === 'basic') {
    recommendations.push({
      priority: 'medium',
      category: 'reconnaissance',
      message: 'Limited reconnaissance capabilities. Consider installing Subfinder and Nuclei.',
      action: 'Install advanced reconnaissance tools',
      command: 'go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest'
    });
  }

  // Web testing capabilities
  if (capabilities.webTesting.level === 'none') {
    recommendations.push({
      priority: 'medium',
      category: 'web',
      message: 'No web testing tools available. Install cURL for basic web testing.',
      action: 'Install web testing tools',
      command: 'choco install curl -y'
    });
  }

  // Portable tools recommendation
  if (!toolReport.portableToolsExists) {
    recommendations.push({
      priority: 'low',
      category: 'setup',
      message: 'Consider setting up portable tools for better compatibility.',
      action: 'Create portable tools directory',
      command: `New-Item -Path "${toolReport.portableToolsPath}" -ItemType Directory -Force`
    });
  }

  // Tool updates
  recommendations.push({
    priority: 'low',
    category: 'maintenance',
    message: 'Keep your security tools updated for latest vulnerability signatures.',
    action: 'Update tools regularly',
    command: 'choco upgrade all -y'
  });

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

module.exports = router; 
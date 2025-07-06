/**
 * Platform-specific utilities for command execution
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Portable tools configuration
const PORTABLE_TOOLS_PATH = process.env.HACKNEST_TOOLS_PATH || 
  (os.platform() === 'win32' ? 'C:\\HackNest\\Tools' : path.join(os.homedir(), 'HackNest', 'Tools'));

// Tool configuration with fallbacks
const TOOL_CONFIG = {
  nmap: {
    name: 'Nmap',
    windows: ['nmap.exe', 'nmap'],
    linux: ['nmap'],
    darwin: ['nmap'],
    portable: 'nmap/nmap.exe',
    fallback: 'ping', // Basic connectivity test
    required: true
  },
  python: {
    name: 'Python',
    windows: ['python.exe', 'python3.exe', 'py.exe'],
    linux: ['python3', 'python'],
    darwin: ['python3', 'python'],
    portable: 'python/python.exe',
    fallback: null,
    required: true
  },
  node: {
    name: 'Node.js',
    windows: ['node.exe'],
    linux: ['node'],
    darwin: ['node'],
    portable: 'nodejs/node.exe',
    fallback: null,
    required: true
  },
  go: {
    name: 'Go',
    windows: ['go.exe'],
    linux: ['go'],
    darwin: ['go'],
    portable: 'go/bin/go.exe',
    fallback: null,
    required: false
  },
  subfinder: {
    name: 'Subfinder',
    windows: ['subfinder.exe'],
    linux: ['subfinder'],
    darwin: ['subfinder'],
    portable: 'subfinder/subfinder.exe',
    fallback: 'nslookup', // Basic DNS enumeration
    required: false
  },
  nuclei: {
    name: 'Nuclei',
    windows: ['nuclei.exe'],
    linux: ['nuclei'],
    darwin: ['nuclei'],
    portable: 'nuclei/nuclei.exe',
    fallback: null,
    required: false
  },
  gobuster: {
    name: 'Gobuster',
    windows: ['gobuster.exe'],
    linux: ['gobuster'],
    darwin: ['gobuster'],
    portable: 'gobuster/gobuster.exe',
    fallback: 'curl', // Basic HTTP testing
    required: false
  },
  sqlmap: {
    name: 'SQLMap',
    windows: ['sqlmap.py', 'sqlmap'],
    linux: ['sqlmap'],
    darwin: ['sqlmap'],
    portable: 'sqlmap/sqlmap.py',
    fallback: null,
    required: false
  },
  hydra: {
    name: 'Hydra',
    windows: ['hydra.exe'],
    linux: ['hydra'],
    darwin: ['hydra'],
    portable: 'hydra/hydra.exe',
    fallback: null,
    required: false
  },
  john: {
    name: 'John the Ripper',
    windows: ['john.exe'],
    linux: ['john'],
    darwin: ['john'],
    portable: 'john/john.exe',
    fallback: null,
    required: false
  },
  nikto: {
    name: 'Nikto',
    windows: ['nikto.pl', 'nikto'],
    linux: ['nikto'],
    darwin: ['nikto'],
    portable: 'nikto/nikto.pl',
    fallback: 'curl', // Basic web scanning
    required: false
  },
  curl: {
    name: 'cURL',
    windows: ['curl.exe'],
    linux: ['curl'],
    darwin: ['curl'],
    portable: 'curl/curl.exe',
    fallback: null,
    required: true
  },
  wget: {
    name: 'Wget',
    windows: ['wget.exe'],
    linux: ['wget'],
    darwin: ['wget'],
    portable: 'wget/wget.exe',
    fallback: 'curl',
    required: false
  }
};

/**
 * Get the current platform
 */
function getPlatform() {
  const platform = os.platform();
  const arch = os.arch();
  
  return {
    platform,
    arch,
    isWindows: platform === 'win32',
    isLinux: platform === 'linux',
    isMacOS: platform === 'darwin',
    is64Bit: arch === 'x64' || arch === 'arm64'
  };
}

/**
 * Check if a command exists in the system PATH
 */
function commandExists(command) {
  try {
    const platform = getPlatform();
    const checkCmd = platform.isWindows ? `where ${command}` : `which ${command}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Find tool executable with fallback options
 */
function findToolPath(toolName) {
  const config = TOOL_CONFIG[toolName];
  if (!config) {
    return { found: false, path: null, error: `Unknown tool: ${toolName}` };
  }

  const platform = getPlatform();
  const possibleNames = config[platform.platform] || config.linux || [];

  // 1. Check portable tools directory first
  if (fs.existsSync(PORTABLE_TOOLS_PATH) && config.portable) {
    const portablePath = path.join(PORTABLE_TOOLS_PATH, config.portable);
    if (fs.existsSync(portablePath)) {
      return {
        found: true,
        path: portablePath,
        source: 'portable',
        name: config.name
      };
    }
  }

  // 2. Check system PATH
  for (const name of possibleNames) {
    if (commandExists(name)) {
      return {
        found: true,
        path: name,
        source: 'system',
        name: config.name
      };
    }
  }

  // 3. Check common installation paths
  const commonPaths = getCommonPaths(platform, toolName);
  for (const commonPath of commonPaths) {
    if (fs.existsSync(commonPath)) {
      return {
        found: true,
        path: commonPath,
        source: 'common',
        name: config.name
      };
    }
  }

  // 4. Return fallback if available
  if (config.fallback && commandExists(config.fallback)) {
    return {
      found: true,
      path: config.fallback,
      source: 'fallback',
      name: config.name,
      warning: `Using fallback tool '${config.fallback}' instead of '${config.name}'`
    };
  }

  return {
    found: false,
    path: null,
    source: null,
    name: config.name,
    error: `${config.name} not found. Please install it or use the provided installer.`,
    required: config.required
  };
}

/**
 * Get common installation paths for tools
 */
function getCommonPaths(platform, toolName) {
  const paths = [];

  if (platform.isWindows) {
    // Windows common paths
    const programFiles = [
      process.env.ProgramFiles,
      process.env['ProgramFiles(x86)'],
      'C:\\Program Files',
      'C:\\Program Files (x86)'
    ].filter(Boolean);

    for (const pf of programFiles) {
      switch (toolName) {
        case 'nmap':
          paths.push(path.join(pf, 'Nmap', 'nmap.exe'));
          break;
        case 'python':
          paths.push(path.join(pf, 'Python39', 'python.exe'));
          paths.push(path.join(pf, 'Python310', 'python.exe'));
          paths.push(path.join(pf, 'Python311', 'python.exe'));
          break;
        case 'node':
          paths.push(path.join(pf, 'nodejs', 'node.exe'));
          break;
      }
    }
  } else {
    // Linux/macOS common paths
    const commonDirs = ['/usr/bin', '/usr/local/bin', '/opt', '/snap/bin'];
    
    for (const dir of commonDirs) {
      switch (toolName) {
        case 'nmap':
          paths.push(path.join(dir, 'nmap'));
          break;
        case 'python':
          paths.push(path.join(dir, 'python3'));
          paths.push(path.join(dir, 'python'));
          break;
        case 'node':
          paths.push(path.join(dir, 'node'));
          break;
      }
    }
  }

  return paths;
}

/**
 * Get tool command with proper path and arguments
 */
function getToolCommand(toolName, args = []) {
  const toolInfo = findToolPath(toolName);
  
  if (!toolInfo.found) {
    throw new Error(toolInfo.error || `Tool ${toolName} not found`);
  }

  // Handle special cases
  let command = toolInfo.path;
  const platform = getPlatform();

  // Python scripts need python interpreter
  if (toolInfo.path.endsWith('.py')) {
    const pythonInfo = findToolPath('python');
    if (pythonInfo.found) {
      command = `"${pythonInfo.path}" "${toolInfo.path}"`;
    }
  }

  // Add quotes for Windows paths with spaces
  if (platform.isWindows && toolInfo.path.includes(' ') && !command.startsWith('"')) {
    command = `"${command}"`;
  }

  // Add arguments
  if (args && args.length > 0) {
    command += ' ' + args.join(' ');
  }

  return {
    command,
    toolInfo,
    warning: toolInfo.warning
  };
}

/**
 * Check all tools and return status report
 */
function checkAllTools() {
  const report = {
    platform: getPlatform(),
    portableToolsPath: PORTABLE_TOOLS_PATH,
    portableToolsExists: fs.existsSync(PORTABLE_TOOLS_PATH),
    tools: {},
    summary: {
      total: 0,
      found: 0,
      missing: 0,
      fallbacks: 0,
      required: 0,
      requiredMissing: 0
    }
  };

  for (const [toolName, config] of Object.entries(TOOL_CONFIG)) {
    const toolInfo = findToolPath(toolName);
    report.tools[toolName] = {
      ...toolInfo,
      required: config.required,
      fallbackAvailable: config.fallback ? commandExists(config.fallback) : false
    };

    report.summary.total++;
    if (toolInfo.found) {
      report.summary.found++;
      if (toolInfo.source === 'fallback') {
        report.summary.fallbacks++;
      }
    } else {
      report.summary.missing++;
    }

    if (config.required) {
      report.summary.required++;
      if (!toolInfo.found) {
        report.summary.requiredMissing++;
      }
    }
  }

  // Overall status
  report.status = report.summary.requiredMissing === 0 ? 'ready' : 'incomplete';
  report.readiness = Math.round((report.summary.found / report.summary.total) * 100);

  return report;
}

/**
 * Install missing tools using package managers
 */
function generateInstallInstructions() {
  const platform = getPlatform();
  const missing = [];
  
  for (const [toolName, config] of Object.entries(TOOL_CONFIG)) {
    const toolInfo = findToolPath(toolName);
    if (!toolInfo.found) {
      missing.push(toolName);
    }
  }

  if (missing.length === 0) {
    return { status: 'complete', message: 'All tools are installed!' };
  }

  const instructions = {
    status: 'incomplete',
    missing: missing,
    instructions: {
      automated: generateAutomatedInstall(platform, missing),
      manual: generateManualInstall(platform, missing)
    }
  };

  return instructions;
}

function generateAutomatedInstall(platform, missing) {
  if (platform.isWindows) {
    return {
      title: 'Automated Installation (Windows)',
      command: '.\\install-tools.ps1 -InstallEssential',
      description: 'Run the provided PowerShell installer script as Administrator'
    };
  } else if (platform.isLinux) {
    return {
      title: 'Automated Installation (Linux)',
      command: 'sudo apt update && sudo apt install -y ' + missing.join(' '),
      description: 'Install tools using APT package manager'
    };
  } else if (platform.isMacOS) {
    return {
      title: 'Automated Installation (macOS)',
      command: 'brew install ' + missing.join(' '),
      description: 'Install tools using Homebrew package manager'
    };
  }
}

function generateManualInstall(platform, missing) {
  const instructions = [];
  
  for (const tool of missing) {
    const config = TOOL_CONFIG[tool];
    if (config) {
      instructions.push({
        tool: tool,
        name: config.name,
        required: config.required,
        instruction: getManualInstallInstruction(platform, tool)
      });
    }
  }
  
  return instructions;
}

function getManualInstallInstruction(platform, tool) {
  const base = {
    nmap: {
      windows: 'Download from https://nmap.org/download.html',
      linux: 'sudo apt install nmap',
      darwin: 'brew install nmap'
    },
    python: {
      windows: 'Download from https://python.org/downloads/',
      linux: 'sudo apt install python3',
      darwin: 'brew install python3'
    },
    node: {
      windows: 'Download from https://nodejs.org/',
      linux: 'sudo apt install nodejs npm',
      darwin: 'brew install node'
    },
    go: {
      windows: 'Download from https://golang.org/dl/',
      linux: 'sudo apt install golang-go',
      darwin: 'brew install go'
    }
  };

  return base[tool]?.[platform.platform] || `Install ${tool} using your system's package manager`;
}

module.exports = {
  getPlatform,
  commandExists,
  findToolPath,
  getToolCommand,
  checkAllTools,
  generateInstallInstructions,
  PORTABLE_TOOLS_PATH,
  TOOL_CONFIG
}; 
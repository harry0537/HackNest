const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const router = express.Router();
const OutputParser = require('../utils/parser');
const storage = require('../utils/storage');
const PlatformUtils = require('../utils/platform');

const execAsync = promisify(exec);

// Helper function to handle exec with proper async/await
async function executeCommand(command, options = {}) {
  try {
    const { stdout, stderr } = await execAsync(command, options);
    return { stdout, stderr, error: null };
  } catch (error) {
    return { stdout: error.stdout || '', stderr: error.stderr || '', error };
  }
}

// Windows System Information
router.post('/systeminfo', async (req, res) => {
  try {
    if (!PlatformUtils.isWindows()) {
      return res.status(400).json({
        error: 'This endpoint is only available on Windows systems'
      });
    }

    const command = PlatformUtils.getSystemInfoCommand();
    
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('SystemInfo error:', error);
        return res.status(500).json({
          error: 'Failed to execute systeminfo command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'systeminfo');
      
      const saveResult = await storage.saveScanResult('systeminfo', 'localhost', parsedResult, 'windows-enum');
      
          res.json({
            success: true,
            tool: 'systeminfo',
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (asyncError) {
          console.error('System info async error:', asyncError);
          res.status(500).json({
            error: 'Failed to process system info',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('SystemInfo route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Windows Network Configuration
router.post('/ipconfig', async (req, res) => {
  try {
    const { detailed = false } = req.body;

    if (!PlatformUtils.isWindows()) {
      return res.status(400).json({
        error: 'This endpoint is only available on Windows systems'
      });
    }

    const command = PlatformUtils.getIPConfigCommand(detailed);
    
    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('IPConfig error:', error);
        return res.status(500).json({
          error: 'Failed to execute ipconfig command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'ipconfig');
      parsedResult.detailed = detailed;
      
      const saveResult = await storage.saveScanResult('ipconfig', 'localhost', parsedResult, 'network-config');
      
      res.json({
        success: true,
        tool: 'ipconfig',
        detailed: detailed,
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('IPConfig async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('IPConfig route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Windows Network Statistics
router.post('/netstat', async (req, res) => {
  try {
    const { showAll = true, showPID = true, showNumeric = true } = req.body;

    if (!PlatformUtils.isWindows()) {
      return res.status(400).json({
        error: 'This endpoint is only available on Windows systems'
      });
    }

    const command = PlatformUtils.getNetstatCommand({ showAll, showPID, showNumeric });
    
    exec(command, { timeout: 20000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('Netstat error:', error);
        return res.status(500).json({
          error: 'Failed to execute netstat command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'netstat');
      
      const saveResult = await storage.saveScanResult('netstat', 'localhost', parsedResult, 'network-connections');
      
      res.json({
        success: true,
        tool: 'netstat',
        options: { showAll, showPID, showNumeric },
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('Netstat async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Netstat route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Windows Firewall Rules
router.post('/firewall', async (req, res) => {
  try {
    if (!PlatformUtils.isWindows()) {
      return res.status(400).json({
        error: 'This endpoint is only available on Windows systems'
      });
    }

    const command = PlatformUtils.getWindowsFirewallCommand();
    
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('Windows Firewall error:', error);
        return res.status(500).json({
          error: 'Failed to execute firewall command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'windows-firewall');
      
      const saveResult = await storage.saveScanResult('windows-firewall', 'localhost', parsedResult, 'security-config');
      
      res.json({
        success: true,
        tool: 'windows-firewall',
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('Windows Firewall async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Windows Firewall route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Windows Services
router.post('/services', async (req, res) => {
  try {
    if (!PlatformUtils.isWindows()) {
      return res.status(400).json({
        error: 'This endpoint is only available on Windows systems'
      });
    }

    const command = PlatformUtils.getWindowsServicesCommand();
    
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('Windows Services error:', error);
        return res.status(500).json({
          error: 'Failed to execute services command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'windows-services');
      
      const saveResult = await storage.saveScanResult('windows-services', 'localhost', parsedResult, 'services-enum');
      
      res.json({
        success: true,
        tool: 'windows-services',
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('Windows Services async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Windows Services route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Windows Processes
router.post('/processes', async (req, res) => {
  try {
    if (!PlatformUtils.isWindows()) {
      return res.status(400).json({
        error: 'This endpoint is only available on Windows systems'
      });
    }

    const command = PlatformUtils.getWindowsProcessesCommand();
    
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('Windows Processes error:', error);
        return res.status(500).json({
          error: 'Failed to execute processes command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'windows-processes');
      
      const saveResult = await storage.saveScanResult('windows-processes', 'localhost', parsedResult, 'process-enum');
      
      res.json({
        success: true,
        tool: 'windows-processes',
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('Windows Processes async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Windows Processes route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Windows Hotfixes/Updates
router.post('/hotfix', async (req, res) => {
  try {
    if (!PlatformUtils.isWindows()) {
      return res.status(400).json({
        error: 'This endpoint is only available on Windows systems'
      });
    }

    const command = PlatformUtils.getWindowsHotfixCommand();
    
    exec(command, { timeout: 45000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('Windows Hotfix error:', error);
        return res.status(500).json({
          error: 'Failed to execute hotfix command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'windows-hotfix');
      
      const saveResult = await storage.saveScanResult('windows-hotfix', 'localhost', parsedResult, 'update-enum');
      
      res.json({
        success: true,
        tool: 'windows-hotfix',
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('Windows Hotfix async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Windows Hotfix route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Windows User Accounts
router.post('/users', async (req, res) => {
  try {
    if (!PlatformUtils.isWindows()) {
      return res.status(400).json({
        error: 'This endpoint is only available on Windows systems'
      });
    }

    const command = PlatformUtils.getWindowsUserAccountsCommand();
    
    exec(command, { timeout: 20000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('Windows Users error:', error);
        return res.status(500).json({
          error: 'Failed to execute users command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'windows-users');
      
      const saveResult = await storage.saveScanResult('windows-users', 'localhost', parsedResult, 'user-enum');
      
      res.json({
        success: true,
        tool: 'windows-users',
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('Windows Users async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Windows Users route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Windows Groups
router.post('/groups', async (req, res) => {
  try {
    if (!PlatformUtils.isWindows()) {
      return res.status(400).json({
        error: 'This endpoint is only available on Windows systems'
      });
    }

    const command = PlatformUtils.getWindowsGroupsCommand();
    
    exec(command, { timeout: 20000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('Windows Groups error:', error);
        return res.status(500).json({
          error: 'Failed to execute groups command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'windows-groups');
      
      const saveResult = await storage.saveScanResult('windows-groups', 'localhost', parsedResult, 'group-enum');
      
      res.json({
        success: true,
        tool: 'windows-groups',
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('Windows Groups async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Windows Groups route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Windows Network Profiles (WiFi)
router.post('/wifi-profiles', async (req, res) => {
  try {
    if (!PlatformUtils.isWindows()) {
      return res.status(400).json({
        error: 'This endpoint is only available on Windows systems'
      });
    }

    const command = PlatformUtils.getWindowsNetworkProfileCommand();
    
    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('WiFi Profiles error:', error);
        return res.status(500).json({
          error: 'Failed to execute wifi profiles command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'wifi-profiles');
      
      const saveResult = await storage.saveScanResult('wifi-profiles', 'localhost', parsedResult, 'network-enum');
      
      res.json({
        success: true,
        tool: 'wifi-profiles',
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('WiFi Profiles async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('WiFi Profiles route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Windows Open Ports (PowerShell)
router.post('/open-ports', async (req, res) => {
  try {
    if (!PlatformUtils.isWindows()) {
      return res.status(400).json({
        error: 'This endpoint is only available on Windows systems'
      });
    }

    const command = PlatformUtils.getWindowsOpenPortsCommand();
    
    exec(command, { timeout: 20000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('Open Ports error:', error);
        return res.status(500).json({
          error: 'Failed to execute open ports command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'open-ports');
      
      const saveResult = await storage.saveScanResult('open-ports', 'localhost', parsedResult, 'port-enum');
      
      res.json({
        success: true,
        tool: 'open-ports',
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('Open Ports async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Open Ports route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Windows Installed Software
router.post('/installed-software', async (req, res) => {
  try {
    if (!PlatformUtils.isWindows()) {
      return res.status(400).json({
        error: 'This endpoint is only available on Windows systems'
      });
    }

    const command = PlatformUtils.getWindowsInstalledSoftwareCommand();
    
    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('Installed Software error:', error);
        return res.status(500).json({
          error: 'Failed to execute installed software command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'installed-software');
      
      const saveResult = await storage.saveScanResult('installed-software', 'localhost', parsedResult, 'software-enum');
      
      res.json({
        success: true,
        tool: 'installed-software',
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('Installed Software async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Installed Software route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ARP Table
router.post('/arp', async (req, res) => {
  try {
    const { target } = req.body;
    
    const command = PlatformUtils.getArpCommand(target);
    
    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('ARP error:', error);
        return res.status(500).json({
          error: 'Failed to execute ARP command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'arp');
      parsedResult.target = target || 'all';
      
      const saveResult = await storage.saveScanResult('arp', target || 'localhost', parsedResult, 'network-discovery');
      
      res.json({
        success: true,
        tool: 'arp',
        target: target || 'all',
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('ARP async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('ARP route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Route Table
router.post('/route', async (req, res) => {
  try {
    const command = PlatformUtils.getRouteCommand();
    
    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      if (error) {
        console.error('Route error:', error);
        return res.status(500).json({
          error: 'Failed to execute route command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'route');
      
      const saveResult = await storage.saveScanResult('route', 'localhost', parsedResult, 'network-routing');
      
      res.json({
        success: true,
        tool: 'route',
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
        } catch (asyncError) {
          console.error('Route async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Route route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get Windows security tools info
router.get('/tools', (req, res) => {
  const systemInfo = PlatformUtils.getSystemInfo();
  
  const windowsTools = [
    {
      name: 'System Information',
      description: 'Get detailed Windows system information',
      endpoint: '/windows/systeminfo',
      available: systemInfo.availableCommands.systeminfo,
      category: 'System Enumeration'
    },
    {
      name: 'Network Configuration',
      description: 'Get network adapter configuration',
      endpoint: '/windows/ipconfig',
      available: systemInfo.availableCommands.ipconfig,
      category: 'Network'
    },
    {
      name: 'Network Connections',
      description: 'List active network connections',
      endpoint: '/windows/netstat',
      available: systemInfo.availableCommands.netstat,
      category: 'Network'
    },
    {
      name: 'Firewall Rules',
      description: 'List Windows Firewall rules',
      endpoint: '/windows/firewall',
      available: systemInfo.availableCommands.windowsFirewall,
      category: 'Security'
    },
    {
      name: 'Running Services',
      description: 'List running Windows services',
      endpoint: '/windows/services',
      available: systemInfo.availableCommands.windowsServices,
      category: 'System Enumeration'
    },
    {
      name: 'Active Processes',
      description: 'List running processes with details',
      endpoint: '/windows/processes',
      available: systemInfo.availableCommands.windowsProcesses,
      category: 'System Enumeration'
    },
    {
      name: 'System Updates',
      description: 'List installed Windows updates',
      endpoint: '/windows/hotfix',
      available: systemInfo.availableCommands.windowsHotfix,
      category: 'System Enumeration'
    },
    {
      name: 'User Accounts',
      description: 'List local user accounts',
      endpoint: '/windows/users',
      available: systemInfo.availableCommands.windowsUsers,
      category: 'Security'
    },
    {
      name: 'User Groups',
      description: 'List local user groups',
      endpoint: '/windows/groups',
      available: systemInfo.availableCommands.windowsGroups,
      category: 'Security'
    },
    {
      name: 'WiFi Profiles',
      description: 'List saved WiFi network profiles',
      endpoint: '/windows/wifi-profiles',
      available: systemInfo.availableCommands.windowsNetworkProfile,
      category: 'Network'
    },
    {
      name: 'Open Ports',
      description: 'List listening ports and processes',
      endpoint: '/windows/open-ports',
      available: systemInfo.availableCommands.windowsOpenPorts,
      category: 'Network'
    },
    {
      name: 'Installed Software',
      description: 'List installed programs',
      endpoint: '/windows/installed-software',
      available: systemInfo.availableCommands.windowsInstalledSoftware,
      category: 'System Enumeration'
    },
    {
      name: 'ARP Table',
      description: 'Display ARP table entries',
      endpoint: '/windows/arp',
      available: systemInfo.availableCommands.arp,
      category: 'Network'
    },
    {
      name: 'Route Table',
      description: 'Display routing table',
      endpoint: '/windows/route',
      available: systemInfo.availableCommands.route,
      category: 'Network'
    }
  ];

  res.json({
    success: true,
    platform: systemInfo.platform,
    isWindows: systemInfo.isWindows,
    tools: windowsTools
  });
});

module.exports = router; 
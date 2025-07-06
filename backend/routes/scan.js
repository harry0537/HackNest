const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const router = express.Router();
const OutputParser = require('../utils/parser');
const storage = require('../utils/storage');

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

// Validate IP address or hostname
function validateTarget(target) {
  // IP address regex (IPv4)
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // Hostname regex
  const hostnameRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})*$/;
  // CIDR regex
  const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
  
  return ipRegex.test(target) || hostnameRegex.test(target) || cidrRegex.test(target);
}

// Nmap quick scan
router.post('/nmap/quick', async (req, res) => {
  try {
    const { target, ports = 'top-ports 1000' } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    if (!validateTarget(target)) {
      return res.status(400).json({
        error: 'Invalid target format'
      });
    }

    const command = `nmap -T4 --${ports} ${target}`;
    
    exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error) {
            console.error('Nmap error:', error);
            return res.status(500).json({
              error: 'Failed to execute nmap command',
              details: error.message
            });
          }

          const parsedResult = OutputParser.parseNmapOutput(stdout);
          
          const saveResult = await storage.saveScanResult('nmap', target, parsedResult, 'quick-scan');
          
          res.json({
            success: true,
            tool: 'nmap',
            scan_type: 'quick',
            target: target,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
        } catch (asyncError) {
          console.error('Nmap quick scan async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Nmap route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Nmap full scan
router.post('/nmap/full', async (req, res) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    if (!validateTarget(target)) {
      return res.status(400).json({
        error: 'Invalid target format'
      });
    }

    const command = `nmap -A -T4 -p- ${target}`;
    
    exec(command, { timeout: 1800000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error) {
            console.error('Nmap error:', error);
            return res.status(500).json({
              error: 'Failed to execute nmap command',
              details: error.message
            });
          }

          const parsedResult = OutputParser.parseNmapOutput(stdout);
          
          const saveResult = await storage.saveScanResult('nmap', target, parsedResult, 'full-scan');
          
          res.json({
            success: true,
            tool: 'nmap',
            scan_type: 'full',
            target: target,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
        } catch (asyncError) {
          console.error('Nmap full scan async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Nmap route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Nmap custom scan
router.post('/nmap/custom', async (req, res) => {
  try {
    const { target, options = '-sS', ports = '1-1000', timing = 'T4' } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    if (!validateTarget(target)) {
      return res.status(400).json({
        error: 'Invalid target format. Use IP address, hostname, or CIDR notation.'
      });
    }

    // Validate timing template
    const validTiming = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5'];
    if (!validTiming.includes(timing)) {
      return res.status(400).json({
        error: 'Invalid timing template',
        valid_options: validTiming
      });
    }

    // Build nmap command
    let command = `nmap -${timing}`;
    
    // Add custom options (sanitized)
    const sanitizedOptions = options.replace(/[;&|`$()]/g, ''); // Remove dangerous characters
    if (sanitizedOptions) {
      command += ` ${sanitizedOptions}`;
    }
    
    // Add port specification
    if (ports && ports !== 'all') {
      command += ` -p ${ports}`;
    } else if (ports === 'all') {
      command += ' -p-';
    }
    
    command += ` ${target}`;

    console.log('Executing nmap custom scan:', command);
    
    exec(command, { timeout: 900000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error) {
            console.error('Nmap custom scan error:', error);
            return res.status(500).json({
              error: 'Failed to execute nmap command',
              details: error.message
            });
          }

          const parsedResult = OutputParser.parseNmapOutput(stdout);
          
          // Save result to storage
          const saveResult = await storage.saveScanResult('nmap', target, parsedResult, 'custom-scan');
          
          res.json({
            success: true,
            tool: 'nmap',
            scan_type: 'custom',
            target: target,
            options: options,
            ports: ports,
            timing: timing,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (asyncError) {
          console.error('Nmap custom scan async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Nmap custom scan route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Nmap service detection
router.post('/nmap/service-detection', async (req, res) => {
  try {
    const { target, ports = '1-1000' } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    if (!validateTarget(target)) {
      return res.status(400).json({
        error: 'Invalid target format'
      });
    }

    const command = `nmap -sV -T4 -p ${ports} ${target}`;
    
    console.log('Executing nmap service detection:', command);
    
    exec(command, { timeout: 600000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error) {
            console.error('Nmap service detection error:', error);
            return res.status(500).json({
              error: 'Failed to execute nmap command',
              details: error.message
            });
          }

          const parsedResult = OutputParser.parseNmapOutput(stdout);
          
          // Save result to storage
          const saveResult = await storage.saveScanResult('nmap', target, parsedResult, 'service-detection');
          
          res.json({
            success: true,
            tool: 'nmap',
            scan_type: 'service-detection',
            target: target,
            ports: ports,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (asyncError) {
          console.error('Nmap service detection async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Nmap service detection route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get scan presets/templates
router.get('/presets', (req, res) => {
  const presets = [
    {
      name: 'Quick Scan',
      description: 'Fast scan of top 1000 ports',
      endpoint: '/nmap/quick',
      estimated_time: '1-5 minutes'
    },
    {
      name: 'Full TCP Scan',
      description: 'Comprehensive scan of all TCP ports',
      endpoint: '/nmap/full',
      estimated_time: '10-30 minutes'
    },
    {
      name: 'Service Detection',
      description: 'Detect services and versions on open ports',
      endpoint: '/nmap/service-detection',
      estimated_time: '5-15 minutes'
    },
    {
      name: 'Stealth Scan',
      description: 'Slow, fragmented scan to avoid detection',
      endpoint: '/nmap/custom',
      estimated_time: '15-45 minutes',
      parameters: { scan_type: 'stealth' }
    },
    {
      name: 'Aggressive Scan',
      description: 'OS detection, service detection, and script scanning',
      endpoint: '/nmap/custom',
      estimated_time: '10-25 minutes',
      parameters: { scan_type: 'aggressive' }
    }
  ];

  res.json({
    success: true,
    presets: presets
  });
});

// Simplified endpoints for the wizard
router.post('/quick', async (req, res) => {
  try {
    const { target, ports = 'top-ports 1000' } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    if (!validateTarget(target)) {
      return res.status(400).json({
        error: 'Invalid target format'
      });
    }

    const command = `nmap -T4 --${ports} ${target}`;
    
    exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error) {
            console.error('Nmap error:', error);
            
            // Provide fallback information if nmap fails
            let fallbackOutput = `Port scan failed for ${target}\n`;
            fallbackOutput += `Error: ${error.message}\n\n`;
            fallbackOutput += 'This may be due to:\n';
            fallbackOutput += '- Nmap not installed\n';
            fallbackOutput += '- Target unreachable\n';
            fallbackOutput += '- Firewall blocking scan\n';
            
            return res.json({
              success: false,
              tool: 'nmap',
              scan_type: 'quick',
              target: target,
              output: fallbackOutput,
              result: { error: error.message, target: target },
              error: error.message
            });
          }

          const parsedResult = OutputParser.parseNmapOutput(stdout);
          
          const saveResult = await storage.saveScanResult('nmap', target, parsedResult, 'quick-scan');
          
          res.json({
            success: true,
            tool: 'nmap',
            scan_type: 'quick',
            target: target,
            output: stdout,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
        } catch (asyncError) {
          console.error('Nmap quick scan async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Nmap route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

router.post('/full', async (req, res) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    if (!validateTarget(target)) {
      return res.status(400).json({
        error: 'Invalid target format'
      });
    }

    const command = `nmap -A -T4 -p- ${target}`;
    
    exec(command, { timeout: 1800000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error) {
            console.error('Nmap error:', error);
            
            let fallbackOutput = `Full port scan failed for ${target}\n`;
            fallbackOutput += `Error: ${error.message}\n\n`;
            fallbackOutput += 'Note: Full scans can take a very long time\n';
            fallbackOutput += 'Consider using Quick Scan instead\n';
            
            return res.json({
              success: false,
              tool: 'nmap',
              scan_type: 'full',
              target: target,
              output: fallbackOutput,
              result: { error: error.message, target: target },
              error: error.message
            });
          }

          const parsedResult = OutputParser.parseNmapOutput(stdout);
          
          const saveResult = await storage.saveScanResult('nmap', target, parsedResult, 'full-scan');
          
          res.json({
            success: true,
            tool: 'nmap',
            scan_type: 'full',
            target: target,
            output: stdout,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
        } catch (asyncError) {
          console.error('Nmap full scan async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Nmap route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

router.post('/service', async (req, res) => {
  try {
    const { target, ports = '1-1000' } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    if (!validateTarget(target)) {
      return res.status(400).json({
        error: 'Invalid target format'
      });
    }

    const command = `nmap -sV -T4 -p ${ports} ${target}`;
    
    console.log('Executing nmap service detection:', command);
    
    exec(command, { timeout: 600000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error) {
            console.error('Nmap service detection error:', error);
            
            let fallbackOutput = `Service detection failed for ${target}\n`;
            fallbackOutput += `Error: ${error.message}\n\n`;
            fallbackOutput += 'This may be due to:\n';
            fallbackOutput += '- No open ports found\n';
            fallbackOutput += '- Services not responding\n';
            fallbackOutput += '- Scan permissions required\n';
            
            return res.json({
              success: false,
              tool: 'nmap',
              scan_type: 'service-detection',
              target: target,
              output: fallbackOutput,
              result: { error: error.message, target: target },
              error: error.message
            });
          }

          const parsedResult = OutputParser.parseNmapOutput(stdout);
          
          // Save result to storage
          const saveResult = await storage.saveScanResult('nmap', target, parsedResult, 'service-detection');
          
          res.json({
            success: true,
            tool: 'nmap',
            scan_type: 'service-detection',
            target: target,
            ports: ports,
            output: stdout,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (asyncError) {
          console.error('Nmap service detection async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Nmap service detection route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Masscan fast port scanner
router.post('/masscan', async (req, res) => {
  try {
    const { 
      target, 
      ports = '1-65535',
      rate = 1000,
      exclude = ''
    } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    if (!validateTarget(target)) {
      return res.status(400).json({
        error: 'Invalid target format'
      });
    }

    // Build masscan command
    let command = `masscan ${target} -p${ports} --rate=${rate}`;
    
    if (exclude) {
      command += ` --exclude ${exclude}`;
    }
    
    command += ' --open-only';
    
    console.log('Executing Masscan fast port scan');
    
    exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.log('Masscan not available, performing fast Nmap scan...');
            
            // Fallback to fast Nmap scan
            let fallbackOutput = `Fast port scan for ${target}\n`;
            fallbackOutput += '='.repeat(30) + '\n';
            fallbackOutput += `Masscan execution failed: ${error.message}\n\n`;
            
            try {
              // Use fast Nmap scan as fallback
              const nmapCommand = `nmap -T5 -n --open -p ${ports.includes('-') ? ports : `1-${ports}`} ${target}`;
              const { stdout: nmapResponse } = await new Promise((resolve, reject) => {
                exec(nmapCommand, { timeout: 180000 }, (err, out, serr) => {
                  if (err) reject(err);
                  else resolve({ stdout: out, stderr: serr });
                });
              });
              
              fallbackOutput += 'Fast Nmap scan results:\n';
              fallbackOutput += nmapResponse;
              
              const parsedResult = OutputParser.parseNmapOutput(nmapResponse);
              parsedResult.fallback_tool = 'nmap';
              
              const saveResult = await storage.saveScanResult('masscan', target, parsedResult, 'fast-scan');
              
              return res.json({
                success: false,
                tool: 'masscan',
                target: target,
                output: fallbackOutput,
                result: parsedResult,
                scan_id: saveResult.scan_id,
                note: 'Masscan not available, performed fast Nmap scan',
                error: error.message
              });
              
            } catch (nmapError) {
              fallbackOutput += `Fast Nmap scan also failed: ${nmapError.message}\n`;
              fallbackOutput += '\nInstall Masscan for ultra-fast port scanning.\n';
              fallbackOutput += 'Download from: https://github.com/robertdavidgraham/masscan\n';
              
              const parsedResult = {
                tool: 'scan-unavailable',
                target: target,
                note: 'Both Masscan and fast Nmap scan failed'
              };
              
              const saveResult = await storage.saveScanResult('masscan', target, parsedResult, 'fast-scan');
              
              return res.json({
                success: false,
                tool: 'masscan',
                target: target,
                output: fallbackOutput,
                result: parsedResult,
                scan_id: saveResult.scan_id,
                note: 'Masscan and fallback scan not available',
                error: error.message
              });
            }
          }

          const parsedResult = OutputParser.parseMasscanOutput(stdout);
          
          const saveResult = await storage.saveScanResult('masscan', target, parsedResult, 'fast-scan');
          
          res.json({
            success: true,
            tool: 'masscan',
            target: target,
            ports: ports,
            rate: rate,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
        } catch (asyncError) {
          console.error('Masscan async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Masscan route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Nmap script scanning
router.post('/nmap/scripts', async (req, res) => {
  try {
    const { 
      target, 
      scripts = 'default',
      ports = '1-1000'
    } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    if (!validateTarget(target)) {
      return res.status(400).json({
        error: 'Invalid target format'
      });
    }

    // Build nmap script command
    let command = `nmap --script=${scripts} -p ${ports} ${target}`;
    
    console.log('Executing Nmap script scan');
    
    exec(command, { timeout: 600000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.log('Nmap script scan failed, performing basic service detection...');
            
            let fallbackOutput = `Service detection for ${target}\n`;
            fallbackOutput += '='.repeat(30) + '\n';
            fallbackOutput += `Nmap script scan failed: ${error.message}\n\n`;
            
            try {
              // Fallback to basic service detection
              const basicCommand = `nmap -sV -T4 -p ${ports} ${target}`;
              const { stdout: basicResponse } = await new Promise((resolve, reject) => {
                exec(basicCommand, { timeout: 300000 }, (err, out, serr) => {
                  if (err) reject(err);
                  else resolve({ stdout: out, stderr: serr });
                });
              });
              
              fallbackOutput += 'Basic service detection results:\n';
              fallbackOutput += basicResponse;
              
              const parsedResult = OutputParser.parseNmapOutput(basicResponse);
              parsedResult.fallback_scan = true;
              
              const saveResult = await storage.saveScanResult('nmap-scripts', target, parsedResult, 'script-scan');
              
              return res.json({
                success: false,
                tool: 'nmap-scripts',
                target: target,
                output: fallbackOutput,
                result: parsedResult,
                scan_id: saveResult.scan_id,
                note: 'Script scan failed, performed basic service detection',
                error: error.message
              });
              
            } catch (fallbackError) {
              fallbackOutput += `Basic service detection also failed: ${fallbackError.message}\n`;
              
              return res.json({
                success: false,
                tool: 'nmap-scripts',
                target: target,
                output: fallbackOutput,
                result: { error: error.message, target: target },
                error: error.message
              });
            }
          }

          const parsedResult = OutputParser.parseNmapScriptOutput(stdout);
          
          const saveResult = await storage.saveScanResult('nmap-scripts', target, parsedResult, 'script-scan');
          
          res.json({
            success: true,
            tool: 'nmap-scripts',
            target: target,
            scripts: scripts,
            ports: ports,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
        } catch (asyncError) {
          console.error('Nmap scripts async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Nmap scripts route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Nmap vulnerability scanning
router.post('/nmap/vulners', async (req, res) => {
  try {
    const { 
      target, 
      ports = '1-1000'
    } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    if (!validateTarget(target)) {
      return res.status(400).json({
        error: 'Invalid target format'
      });
    }

    // Nmap vulnerability scanning with vulners script
    const command = `nmap --script vulners -sV -p ${ports} ${target}`;
    
    console.log('Executing Nmap vulnerability scan');
    
    exec(command, { timeout: 600000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.log('Nmap vulners script not available, performing manual vulnerability checks...');
            
            let fallbackOutput = `Vulnerability assessment for ${target}\n`;
            fallbackOutput += '='.repeat(35) + '\n';
            fallbackOutput += `Nmap vulners script failed: ${error.message}\n\n`;
            
            try {
              // Manual vulnerability checks for common services
              const serviceCommand = `nmap -sV -T4 -p ${ports} ${target}`;
              const { stdout: serviceResponse } = await new Promise((resolve, reject) => {
                exec(serviceCommand, { timeout: 300000 }, (err, out, serr) => {
                  if (err) reject(err);
                  else resolve({ stdout: out, stderr: serr });
                });
              });
              
              fallbackOutput += 'Service detection results:\n';
              fallbackOutput += serviceResponse;
              fallbackOutput += '\n\nManual vulnerability assessment:\n';
              
              // Check for common vulnerable services
              const vulnServices = [
                { service: 'ssh', version: '2.2', vuln: 'OpenSSH < 7.4 - Username enumeration' },
                { service: 'ftp', version: 'vsftpd 2.3.4', vuln: 'VSFTPD 2.3.4 backdoor' },
                { service: 'http', version: 'apache 2.2', vuln: 'Apache 2.2.x - Range header DoS' },
                { service: 'mysql', version: '5.0', vuln: 'MySQL < 5.7.6 - Multiple vulnerabilities' }
              ];
              
              vulnServices.forEach(vuln => {
                if (serviceResponse.toLowerCase().includes(vuln.service)) {
                  fallbackOutput += `- Potential vulnerability: ${vuln.vuln}\n`;
                }
              });
              
              fallbackOutput += '\nNote: Install nmap vulners script for comprehensive vulnerability scanning.\n';
              fallbackOutput += 'Command: nmap --script-updatedb\n';
              
              const parsedResult = OutputParser.parseNmapOutput(serviceResponse);
              parsedResult.manual_vuln_check = true;
              
              const saveResult = await storage.saveScanResult('nmap-vulners', target, parsedResult, 'vuln-scan');
              
              return res.json({
                success: false,
                tool: 'nmap-vulners',
                target: target,
                output: fallbackOutput,
                result: parsedResult,
                scan_id: saveResult.scan_id,
                note: 'Vulners script not available, performed manual vulnerability assessment',
                error: error.message
              });
              
            } catch (fallbackError) {
              fallbackOutput += `Manual vulnerability check failed: ${fallbackError.message}\n`;
              
              return res.json({
                success: false,
                tool: 'nmap-vulners',
                target: target,
                output: fallbackOutput,
                result: { error: error.message, target: target },
                error: error.message
              });
            }
          }

          const parsedResult = OutputParser.parseNmapVulnersOutput(stdout);
          
          const saveResult = await storage.saveScanResult('nmap-vulners', target, parsedResult, 'vuln-scan');
          
          res.json({
            success: true,
            tool: 'nmap-vulners',
            target: target,
            ports: ports,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
        } catch (asyncError) {
          console.error('Nmap vulners async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Nmap vulners route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// UDP port scanning
router.post('/udp-scan', async (req, res) => {
  try {
    const { 
      target, 
      ports = 'top-ports 1000',
      timing = 'T4'
    } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    if (!validateTarget(target)) {
      return res.status(400).json({
        error: 'Invalid target format'
      });
    }

    // UDP scan command
    let command = `nmap -sU -${timing}`;
    
    if (ports.includes('top-ports')) {
      command += ` --${ports}`;
    } else {
      command += ` -p ${ports}`;
    }
    
    command += ` ${target}`;
    
    console.log('Executing UDP port scan');
    
    exec(command, { timeout: 900000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.log('UDP scan failed, performing basic UDP service check...');
            
            let fallbackOutput = `UDP service detection for ${target}\n`;
            fallbackOutput += '='.repeat(35) + '\n';
            fallbackOutput += `UDP scan failed: ${error.message}\n\n`;
            
            try {
              // Check common UDP services manually
              const udpServices = [
                { port: 53, name: 'DNS' },
                { port: 161, name: 'SNMP' },
                { port: 123, name: 'NTP' },
                { port: 69, name: 'TFTP' },
                { port: 67, name: 'DHCP' }
              ];
              
              fallbackOutput += 'Checking common UDP services:\n\n';
              
              for (const service of udpServices) {
                try {
                  const testCommand = `nc -u -z -w 3 ${target} ${service.port}`;
                  const { stdout: testResponse } = await new Promise((resolve, reject) => {
                    exec(testCommand, { timeout: 5000 }, (err, out, serr) => {
                      // For UDP, no response might mean service is running
                      resolve({ stdout: out, stderr: serr });
                    });
                  });
                  
                  fallbackOutput += `${service.port}/udp ${service.name} - Checked\n`;
                  
                } catch (testError) {
                  fallbackOutput += `${service.port}/udp ${service.name} - Error checking\n`;
                }
              }
              
              fallbackOutput += '\nNote: UDP scanning requires elevated privileges and is inherently unreliable.\n';
              fallbackOutput += 'Consider using nmap with sudo for accurate UDP scanning.\n';
              
              const parsedResult = {
                tool: 'basic-udp-check',
                target: target,
                note: 'UDP scan failed, performed basic service checks'
              };
              
              const saveResult = await storage.saveScanResult('udp-scan', target, parsedResult, 'udp-scan');
              
              return res.json({
                success: false,
                tool: 'udp-scan',
                target: target,
                output: fallbackOutput,
                result: parsedResult,
                scan_id: saveResult.scan_id,
                note: 'UDP scan failed, performed basic checks',
                error: error.message
              });
              
            } catch (fallbackError) {
              fallbackOutput += `Basic UDP checks failed: ${fallbackError.message}\n`;
              
              return res.json({
                success: false,
                tool: 'udp-scan',
                target: target,
                output: fallbackOutput,
                result: { error: error.message, target: target },
                error: error.message
              });
            }
          }

          const parsedResult = OutputParser.parseNmapOutput(stdout);
          parsedResult.scan_type = 'UDP';
          
          const saveResult = await storage.saveScanResult('udp-scan', target, parsedResult, 'udp-scan');
          
          res.json({
            success: true,
            tool: 'udp-scan',
            target: target,
            ports: ports,
            timing: timing,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
        } catch (asyncError) {
          console.error('UDP scan async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('UDP scan route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router; 
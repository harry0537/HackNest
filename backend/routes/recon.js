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

// Whois lookup
router.post('/whois', async (req, res) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target domain is required'
      });
    }

    // Validate target
    const validation = PlatformUtils.validateTarget(target, 'domain');
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    const command = PlatformUtils.getWhoisCommand(target);
    
    console.log('Executing Whois lookup');
    
    const result = await executeCommand(command, { timeout: 30000 });
    
    if (result.error) {
      console.error('Whois error:', result.error);
      
      // Provide fallback information
      let fallbackOutput = `WHOIS lookup failed for ${target}\n`;
      fallbackOutput += `Error: ${result.error.message}\n\n`;
      fallbackOutput += 'This may be due to:\n';
      fallbackOutput += '- WHOIS service unavailable\n';
      fallbackOutput += '- Domain does not exist\n';
      fallbackOutput += '- Network connectivity issues\n';
      
      return res.json({
        success: false,
        tool: 'whois',
        target: target,
        output: fallbackOutput,
        result: { error: result.error.message, target: target },
        error: result.error.message
      });
    }

    const parsedResult = OutputParser.parseWhoisOutput(result.stdout);
    
    // Save result to storage
    const saveResult = await storage.saveScanResult('whois', target, parsedResult, 'recon');
    
    res.json({
      success: true,
      tool: 'whois',
      target: target,
      output: result.stdout,
      result: parsedResult,
      scan_id: saveResult.scan_id,
      raw_output: result.stderr || null
    });

  } catch (error) {
    console.error('Whois route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// DNS lookup (nslookup)
router.post('/nslookup', async (req, res) => {
  try {
    const { target, record_type = 'A' } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target domain is required'
      });
    }

    const validRecordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA'];
    if (!validRecordTypes.includes(record_type.toUpperCase())) {
      return res.status(400).json({
        error: 'Invalid record type',
        valid_types: validRecordTypes
      });
    }

    const command = `nslookup -type=${record_type} ${target}`;
    
    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error) {
            console.error('Nslookup error:', error);
            return res.status(500).json({
              error: 'Failed to execute nslookup command',
              details: error.message
            });
          }

          const parsedResult = OutputParser.parseGenericOutput(stdout, 'nslookup');
          parsedResult.record_type = record_type;
          parsedResult.target = target;
          
          // Save result to storage
          const saveResult = await storage.saveScanResult('nslookup', target, parsedResult, 'dns-recon');
          
          res.json({
            success: true,
            tool: 'nslookup',
            target: target,
            record_type: record_type,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (asyncError) {
          console.error('Nslookup async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Nslookup route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// DNS enumeration with dig
router.post('/dig', async (req, res) => {
  try {
    const { target, record_type = 'ANY' } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target domain is required'
      });
    }

    const command = PlatformUtils.getDNSCommand(target, record_type);
    
    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error) {
            console.error('Dig error:', error);
            return res.status(500).json({
              error: 'Failed to execute dig command',
              details: error.message
            });
          }

          const parsedResult = OutputParser.parseGenericOutput(stdout, 'dig');
          parsedResult.record_type = record_type;
          parsedResult.target = target;
          
          // Save result to storage
          const saveResult = await storage.saveScanResult('dig', target, parsedResult, 'dns-enum');
          
          res.json({
            success: true,
            tool: 'dig',
            target: target,
            record_type: record_type,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (asyncError) {
          console.error('Dig async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Dig route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Ping connectivity test
router.post('/ping', async (req, res) => {
  try {
    const { target, count = 4 } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target host is required'
      });
    }

    if (count > 10) {
      return res.status(400).json({
        error: 'Maximum ping count is 10'
      });
    }

    const command = PlatformUtils.getPingCommand(target, count);
    
    console.log('Executing ping connectivity test');
    
    const result = await executeCommand(command, { timeout: 20000 });
    
    // Ping may return non-zero exit code for unreachable hosts, but still provide useful info
    let isSuccessful = !result.error || result.stdout.includes('bytes=') || result.stdout.includes('bytes from') || result.stdout.includes('time=');
    
    let output = `Ping test for ${target}\n`;
    output += '='.repeat(30) + '\n';
    output += result.stdout;
    
    if (result.error && !isSuccessful) {
      output += `\nPing failed: ${result.error.message}\n`;
      output += 'This may indicate:\n';
      output += '- Host is unreachable\n';
      output += '- Firewall blocking ICMP\n';
      output += '- Network connectivity issues\n';
    }
    
    const parsedResult = OutputParser.parseGenericOutput(result.stdout, 'ping');
    parsedResult.target = target;
    parsedResult.ping_count = count;
    parsedResult.success = isSuccessful;
    
    // Save result to storage
    const saveResult = await storage.saveScanResult('ping', target, parsedResult, 'connectivity');
    
    res.json({
      success: isSuccessful,
      tool: 'ping',
      target: target,
      output: output,
      result: parsedResult,
      scan_id: saveResult.scan_id,
      raw_output: result.stderr || null
    });

  } catch (error) {
    console.error('Ping route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Traceroute
router.post('/traceroute', async (req, res) => {
  try {
    const { target, max_hops = 30 } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target host is required'
      });
    }

    const command = PlatformUtils.getTracerouteCommand(target, max_hops);
    
    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error) {
            console.error('Traceroute error:', error);
            return res.status(500).json({
              error: 'Failed to execute traceroute command',
              details: error.message
            });
          }

          const parsedResult = OutputParser.parseGenericOutput(stdout, 'traceroute');
          parsedResult.target = target;
          parsedResult.max_hops = max_hops;
          
          // Save result to storage
          const saveResult = await storage.saveScanResult('traceroute', target, parsedResult, 'network-path');
          
          res.json({
            success: true,
            tool: 'traceroute',
            target: target,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (asyncError) {
          console.error('Traceroute async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Traceroute route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// DNS enumeration (alias for dig)
router.post('/dns', async (req, res) => {
  try {
    const { target, record_type = 'ANY' } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target domain is required'
      });
    }

    const command = PlatformUtils.getDNSCommand(target, record_type);
    
    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error) {
            console.error('DNS enumeration error:', error);
            
            let fallbackOutput = `DNS enumeration failed for ${target}\n`;
            fallbackOutput += `Error: ${error.message}\n\n`;
            fallbackOutput += 'This may be due to:\n';
            fallbackOutput += '- DNS server unavailable\n';
            fallbackOutput += '- Domain does not exist\n';
            fallbackOutput += '- DNS resolution issues\n';
            
            return res.json({
              success: false,
              tool: 'dns',
              target: target,
              output: fallbackOutput,
              result: { error: error.message, target: target },
              error: error.message
            });
          }

          let output = `DNS enumeration for ${target} (${record_type})\n`;
          output += '='.repeat(40) + '\n';
          output += stdout;

          const parsedResult = OutputParser.parseGenericOutput(stdout, 'dns');
          parsedResult.record_type = record_type;
          parsedResult.target = target;
          
          // Save result to storage
          const saveResult = await storage.saveScanResult('dns', target, parsedResult, 'dns-enum');
          
          res.json({
            success: true,
            tool: 'dns',
            target: target,
            record_type: record_type,
            output: output,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (asyncError) {
          console.error('DNS async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('DNS enumeration route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Amass subdomain enumeration
router.post('/amass', async (req, res) => {
  try {
    const { 
      target,
      passive = true,
      sources = 'default',
      timeout = 30
    } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target domain is required'
      });
    }

    // Build amass command
    let command = `amass enum -d ${target}`;
    
    if (passive) {
      command += ' -passive';
    }
    
    if (sources !== 'default') {
      command += ` -src ${sources}`;
    }
    
    command += ` -timeout ${timeout}`;
    
    console.log('Executing Amass subdomain enumeration');
    
    exec(command, { timeout: (timeout + 10) * 1000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.log('Amass not available, performing basic subdomain enumeration...');
            
            // Fallback to basic subdomain enumeration
            let fallbackOutput = `Subdomain enumeration for ${target}\n`;
            fallbackOutput += '='.repeat(40) + '\n';
            fallbackOutput += `Amass execution failed: ${error.message}\n\n`;
            
            // Basic subdomain discovery using common prefixes
            const commonSubdomains = [
              'www', 'mail', 'ftp', 'api', 'admin', 'dev', 'test', 'staging', 
              'beta', 'app', 'shop', 'blog', 'forum', 'support', 'help',
              'cdn', 'assets', 'static', 'media', 'images', 'files'
            ];
            
            fallbackOutput += 'Performing basic subdomain checks:\n\n';
            const foundSubdomains = [];
            
            try {
              for (const sub of commonSubdomains) {
                const subdomain = `${sub}.${target}`;
                const testCommand = `nslookup ${subdomain}`;
                
                try {
                  const { stdout: dnsResponse } = await new Promise((resolve, reject) => {
                    exec(testCommand, { timeout: 5000 }, (err, out, serr) => {
                      if (err) reject(err);
                      else resolve({ stdout: out, stderr: serr });
                    });
                  });
                  
                  if (dnsResponse.includes('Address:') || dnsResponse.includes('answer:')) {
                    foundSubdomains.push(subdomain);
                    fallbackOutput += `${subdomain} - [FOUND]\n`;
                  } else {
                    fallbackOutput += `${subdomain} - [NOT FOUND]\n`;
                  }
                  
                } catch (testError) {
                  fallbackOutput += `${subdomain} - [ERROR]\n`;
                }
              }
              
              fallbackOutput += `\nTotal subdomains found: ${foundSubdomains.length}\n`;
              
            } catch (fallbackError) {
              fallbackOutput += `Basic subdomain enumeration failed: ${fallbackError.message}\n`;
            }
            
            fallbackOutput += '\nInstall Amass for comprehensive subdomain discovery.\n';
            fallbackOutput += 'Download from: https://github.com/OWASP/Amass\n';
            
            const parsedResult = {
              tool: 'basic-subdomain-enum',
              target: target,
              subdomains: foundSubdomains,
              note: 'Amass not available, performed basic enumeration'
            };
            
            const saveResult = await storage.saveScanResult('amass', target, parsedResult, 'subdomain-enum');
            
            return res.json({
              success: false,
              tool: 'amass',
              target: target,
              output: fallbackOutput,
              result: parsedResult,
              scan_id: saveResult.scan_id,
              note: 'Amass not available, performed basic subdomain enumeration',
              error: error.message
            });
          }

          const parsedResult = OutputParser.parseAmassOutput(stdout);
          
          const saveResult = await storage.saveScanResult('amass', target, parsedResult, 'subdomain-enum');
          
          res.json({
            success: true,
            tool: 'amass',
            target: target,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
        } catch (asyncError) {
          console.error('Amass async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Amass route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Subfinder subdomain enumeration
router.post('/subfinder', async (req, res) => {
  try {
    const { 
      target,
      sources = 'all',
      silent = false
    } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target domain is required'
      });
    }

    let command = `subfinder -d ${target}`;
    
    if (sources !== 'all') {
      command += ` -sources ${sources}`;
    }
    
    if (silent) {
      command += ' -silent';
    }
    
    console.log('Executing Subfinder subdomain enumeration');
    
    exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.log('Subfinder not available, using alternative subdomain discovery...');
            
            // Alternative subdomain discovery using DNS
            let fallbackOutput = `Alternative subdomain discovery for ${target}\n`;
            fallbackOutput += '='.repeat(45) + '\n';
            fallbackOutput += `Subfinder execution failed: ${error.message}\n\n`;
            
            const wordlist = [
              'api', 'admin', 'app', 'blog', 'cdn', 'dev', 'ftp', 'mail', 
              'mobile', 'portal', 'shop', 'staging', 'test', 'vpn', 'web',
              'www', 'secure', 'login', 'dashboard', 'panel', 'control'
            ];
            
            fallbackOutput += 'Performing DNS-based subdomain discovery:\n\n';
            const discoveredSubdomains = [];
            
            try {
              for (const word of wordlist) {
                const subdomain = `${word}.${target}`;
                
                try {
                  const { stdout: digResponse } = await new Promise((resolve, reject) => {
                    exec(`dig +short ${subdomain}`, { timeout: 3000 }, (err, out, serr) => {
                      if (err) reject(err);
                      else resolve({ stdout: out, stderr: serr });
                    });
                  });
                  
                  if (digResponse.trim() && !digResponse.includes('NXDOMAIN')) {
                    discoveredSubdomains.push(subdomain);
                    fallbackOutput += `${subdomain} - ${digResponse.trim()}\n`;
                  }
                  
                } catch (digError) {
                  // Silently continue for DNS errors
                }
              }
              
              fallbackOutput += `\nDiscovered ${discoveredSubdomains.length} subdomains\n`;
              
            } catch (fallbackError) {
              fallbackOutput += `DNS subdomain discovery failed: ${fallbackError.message}\n`;
            }
            
            fallbackOutput += '\nInstall Subfinder for advanced subdomain discovery.\n';
            fallbackOutput += 'Download from: https://github.com/projectdiscovery/subfinder\n';
            
            const parsedResult = {
              tool: 'dns-subdomain-discovery',
              target: target,
              subdomains: discoveredSubdomains,
              note: 'Subfinder not available, performed DNS discovery'
            };
            
            const saveResult = await storage.saveScanResult('subfinder', target, parsedResult, 'subdomain-enum');
            
            return res.json({
              success: false,
              tool: 'subfinder',
              target: target,
              output: fallbackOutput,
              result: parsedResult,
              scan_id: saveResult.scan_id,
              note: 'Subfinder not available, performed DNS-based discovery',
              error: error.message
            });
          }

          const parsedResult = OutputParser.parseSubfinderOutput(stdout);
          
          const saveResult = await storage.saveScanResult('subfinder', target, parsedResult, 'subdomain-enum');
          
          res.json({
            success: true,
            tool: 'subfinder',
            target: target,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
        } catch (asyncError) {
          console.error('Subfinder async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Subfinder route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Assetfinder asset discovery
router.post('/assetfinder', async (req, res) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target domain is required'
      });
    }

    const command = `assetfinder --subs-only ${target}`;
    
    console.log('Executing Assetfinder asset discovery');
    
    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.log('Assetfinder not available, performing certificate transparency search...');
            
            // Fallback using certificate transparency logs
            let fallbackOutput = `Certificate transparency search for ${target}\n`;
            fallbackOutput += '='.repeat(45) + '\n';
            fallbackOutput += `Assetfinder execution failed: ${error.message}\n\n`;
            
            try {
              // Use crt.sh certificate transparency search
              const ctCommand = `curl -s "https://crt.sh/?q=${target}&output=json"`;
              const { stdout: ctResponse } = await new Promise((resolve, reject) => {
                exec(ctCommand, { timeout: 30000 }, (err, out, serr) => {
                  if (err) reject(err);
                  else resolve({ stdout: out, stderr: serr });
                });
              });
              
              if (ctResponse) {
                try {
                  const certificates = JSON.parse(ctResponse);
                  const subdomains = new Set();
                  
                  certificates.forEach(cert => {
                    if (cert.name_value) {
                      cert.name_value.split('\n').forEach(name => {
                        if (name.includes(target) && !name.startsWith('*.')) {
                          subdomains.add(name);
                        }
                      });
                    }
                  });
                  
                  fallbackOutput += 'Subdomains found via Certificate Transparency:\n\n';
                  Array.from(subdomains).forEach(subdomain => {
                    fallbackOutput += `${subdomain}\n`;
                  });
                  
                  fallbackOutput += `\nTotal unique subdomains: ${subdomains.size}\n`;
                  
                  const parsedResult = {
                    tool: 'certificate-transparency',
                    target: target,
                    subdomains: Array.from(subdomains),
                    note: 'Assetfinder not available, used certificate transparency'
                  };
                  
                  const saveResult = await storage.saveScanResult('assetfinder', target, parsedResult, 'asset-discovery');
                  
                  return res.json({
                    success: false,
                    tool: 'assetfinder',
                    target: target,
                    output: fallbackOutput,
                    result: parsedResult,
                    scan_id: saveResult.scan_id,
                    note: 'Assetfinder not available, performed certificate transparency search',
                    error: error.message
                  });
                  
                } catch (parseError) {
                  fallbackOutput += 'Failed to parse certificate transparency data\n';
                }
              }
              
            } catch (ctError) {
              fallbackOutput += `Certificate transparency search failed: ${ctError.message}\n`;
            }
            
            fallbackOutput += '\nInstall Assetfinder for comprehensive asset discovery.\n';
            fallbackOutput += 'Download from: https://github.com/tomnomnom/assetfinder\n';
            
            const parsedResult = {
              tool: 'basic-asset-discovery',
              target: target,
              note: 'Assetfinder not available'
            };
            
            const saveResult = await storage.saveScanResult('assetfinder', target, parsedResult, 'asset-discovery');
            
            return res.json({
              success: false,
              tool: 'assetfinder',
              target: target,
              output: fallbackOutput,
              result: parsedResult,
              scan_id: saveResult.scan_id,
              note: 'Assetfinder not available',
              error: error.message
            });
          }

          const parsedResult = OutputParser.parseAssetfinderOutput(stdout);
          
          const saveResult = await storage.saveScanResult('assetfinder', target, parsedResult, 'asset-discovery');
          
          res.json({
            success: true,
            tool: 'assetfinder',
            target: target,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
        } catch (asyncError) {
          console.error('Assetfinder async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Assetfinder route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// TheHarvester email and subdomain harvesting
router.post('/theharvester', async (req, res) => {
  try {
    const { 
      target,
      sources = 'google,bing,yahoo',
      limit = 500
    } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target domain is required'
      });
    }

    const command = `theHarvester -d ${target} -b ${sources} -l ${limit}`;
    
    console.log('Executing TheHarvester email and subdomain harvesting');
    
    exec(command, { timeout: 180000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.log('TheHarvester not available, performing basic email discovery...');
            
            // Fallback to basic email pattern search
            let fallbackOutput = `Email and information harvesting for ${target}\n`;
            fallbackOutput += '='.repeat(50) + '\n';
            fallbackOutput += `TheHarvester execution failed: ${error.message}\n\n`;
            
            // Basic web scraping for emails
            try {
              const searchCommand = `curl -s "https://www.${target}" | grep -Eo "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"`;
              const { stdout: emailResponse } = await new Promise((resolve, reject) => {
                exec(searchCommand, { timeout: 15000 }, (err, out, serr) => {
                  if (err) reject(err);
                  else resolve({ stdout: out, stderr: serr });
                });
              });
              
              if (emailResponse) {
                const emails = emailResponse.split('\n').filter(email => email.trim());
                const uniqueEmails = [...new Set(emails)];
                
                fallbackOutput += 'Emails found on main website:\n';
                uniqueEmails.forEach(email => {
                  fallbackOutput += `${email}\n`;
                });
                fallbackOutput += `\nTotal unique emails: ${uniqueEmails.length}\n`;
              } else {
                fallbackOutput += 'No emails found on main website\n';
              }
              
            } catch (searchError) {
              fallbackOutput += `Basic email search failed: ${searchError.message}\n`;
            }
            
            fallbackOutput += '\nInstall TheHarvester for comprehensive OSINT gathering.\n';
            fallbackOutput += 'Download from: https://github.com/laramies/theHarvester\n';
            
            const parsedResult = {
              tool: 'basic-email-search',
              target: target,
              note: 'TheHarvester not available, performed basic search'
            };
            
            const saveResult = await storage.saveScanResult('theharvester', target, parsedResult, 'osint-gathering');
            
            return res.json({
              success: false,
              tool: 'theharvester',
              target: target,
              output: fallbackOutput,
              result: parsedResult,
              scan_id: saveResult.scan_id,
              note: 'TheHarvester not available, performed basic email search',
              error: error.message
            });
          }

          const parsedResult = OutputParser.parseTheHarvesterOutput(stdout);
          
          const saveResult = await storage.saveScanResult('theharvester', target, parsedResult, 'osint-gathering');
          
          res.json({
            success: true,
            tool: 'theharvester',
            target: target,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
        } catch (asyncError) {
          console.error('TheHarvester async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('TheHarvester route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router; 
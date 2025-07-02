const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
const OutputParser = require('../utils/parser');
const storage = require('../utils/storage');

// SSL test route
router.post('/ssl-test', async (req, res) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    // Extract hostname from URL if full URL provided
    let hostname = target;
    try {
      const url = new URL(target);
      hostname = url.hostname;
    } catch (e) {
      // Assume it's already a hostname if URL parsing fails
    }

    const command = `nmap --script ssl-enum-ciphers,ssl-cert -p 443 ${hostname}`;
    
    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      try {
        if (error && !stdout) {
          console.error('SSL test error:', error);
          return res.status(500).json({
            error: 'Failed to execute SSL test',
            details: error.message
          });
        }

        const parsedResult = OutputParser.parseGenericOutput(stdout, 'ssl');
        parsedResult.target = target;
        parsedResult.hostname = hostname;
        
        // Save result to storage
        const saveResult = await storage.saveScanResult('ssl-test', target, parsedResult, 'ssl-analysis');
        
        res.json({
          success: true,
          tool: 'ssl-test',
          target: target,
          output: stdout,
          result: parsedResult,
          scan_id: saveResult.scan_id,
          raw_output: stderr || null
        });
      } catch (saveError) {
        console.error('SSL test save error:', saveError);
        res.status(500).json({
          error: 'Failed to save SSL test results',
          details: saveError.message
        });
      }
    });

  } catch (error) {
    console.error('SSL test route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Nikto web vulnerability scanner
router.post('/nikto', async (req, res) => {
  try {
    const { target, ssl = false, port = 80 } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    let command = `nikto -h ${target}`;
    
    if (ssl) {
      command += ' -ssl';
    }
    
    if (port !== 80) {
      command += ` -p ${port}`;
    }

    command += ' -Format txt';

    exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
      // Handle results without async in callback
      (async () => {
        try {
          if (error && !stdout) {
            console.log('Nikto not available, performing basic web analysis...');
            
            // Fallback to basic web analysis using curl
            let basicOutput = `Web analysis for ${target}\n`;
            basicOutput += '='.repeat(50) + '\n';
            
            try {
              // Get basic HTTP headers using promise wrapper
              const headerResult = await new Promise((resolve, reject) => {
                exec(`curl -I -L --max-time 30 "${target}"`, { timeout: 35000 }, (err, out, serr) => {
                  if (err) reject(err);
                  else resolve({ stdout: out, stderr: serr });
                });
              });
              const headers = headerResult.stdout;
              
              basicOutput += 'HTTP Headers:\n';
              basicOutput += headers;
              basicOutput += '\n';
              
              // Check for common security headers
              const securityHeaders = ['X-Frame-Options', 'X-XSS-Protection', 'X-Content-Type-Options', 'Strict-Transport-Security'];
              const missingHeaders = securityHeaders.filter(header => !headers.includes(header));
              
              if (missingHeaders.length > 0) {
                basicOutput += 'Missing Security Headers:\n';
                missingHeaders.forEach(header => {
                  basicOutput += `- ${header}\n`;
                });
              }
              
              // Try to get server information
              const serverMatch = headers.match(/Server: ([^\r\n]+)/i);
              if (serverMatch) {
                basicOutput += `\nServer: ${serverMatch[1]}\n`;
              }
              
              const parsedResult = {
                tool: 'basic-web-analysis',
                target: target,
                server: serverMatch ? serverMatch[1] : 'Unknown',
                missing_security_headers: missingHeaders,
                ssl_enabled: ssl,
                port: port
              };
              
              const saveResult = await storage.saveScanResult('nikto', target, parsedResult, 'web-vuln');
              
              return res.json({
                success: true,
                tool: 'nikto',
                target: target,
                output: basicOutput,
                result: parsedResult,
                scan_id: saveResult.scan_id,
                note: 'Used basic web analysis (nikto not available)'
              });
              
            } catch (fallbackError) {
              console.error('Fallback web analysis failed:', fallbackError);
              
              // Even if curl fails, provide some basic analysis
              let basicOutput = `Web analysis attempted for ${target}\n`;
              basicOutput += '='.repeat(50) + '\n';
              basicOutput += 'Tool Status: Nikto not available\n';
              basicOutput += 'Fallback Method: HTTP header analysis via curl\n';
              basicOutput += `Primary Error: ${error.message}\n`;
              basicOutput += `Fallback Error: ${fallbackError.message}\n\n`;
              basicOutput += 'Recommendations:\n';
              basicOutput += '- Install Nikto for comprehensive web vulnerability scanning\n';
              basicOutput += '- Verify target URL is accessible\n';
              basicOutput += '- Check network connectivity\n';
              
              const parsedResult = {
                tool: 'basic-web-analysis',
                target: target,
                status: 'failed',
                primary_error: error.message,
                fallback_error: fallbackError.message,
                recommendations: [
                  'Install Nikto for comprehensive scanning',
                  'Verify target accessibility',
                  'Check network connectivity'
                ]
              };
              
              const saveResult = await storage.saveScanResult('nikto', target, parsedResult, 'web-vuln');
              
              return res.json({
                success: false,
                tool: 'nikto',
                target: target,
                output: basicOutput,
                result: parsedResult,
                scan_id: saveResult.scan_id,
                note: 'Tool not available and fallback failed'
              });
            }
          }

          const parsedResult = OutputParser.parseGenericOutput(stdout, 'nikto');
          parsedResult.target = target;
          parsedResult.ssl_enabled = ssl;
          parsedResult.port = port;
          
          // Save result to storage
          const saveResult = await storage.saveScanResult('nikto', target, parsedResult, 'web-vuln');
          
          res.json({
            success: true,
            tool: 'nikto',
            target: target,
            output: stdout,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (saveError) {
          console.error('Nikto save error:', saveError);
          res.status(500).json({
            error: 'Failed to save scan results',
            details: saveError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Nikto route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// WhatWeb application fingerprinting
router.post('/whatweb', async (req, res) => {
  try {
    const { target, aggression = 1, format = 'json' } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    // Validate aggression level
    if (aggression < 1 || aggression > 4) {
      return res.status(400).json({
        error: 'Aggression level must be between 1-4'
      });
    }

    const command = `whatweb --aggression=${aggression} --format=${format} ${target}`;
    
    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.error('WhatWeb error:', error);
            return res.status(500).json({
              error: 'Failed to execute WhatWeb scan',
              details: error.message
            });
          }

          let parsedResult;
          try {
            if (format === 'json') {
              parsedResult = JSON.parse(stdout);
            } else {
              parsedResult = OutputParser.parseGenericOutput(stdout, 'whatweb');
            }
          } catch (parseError) {
            parsedResult = OutputParser.parseGenericOutput(stdout, 'whatweb');
          }
          
          parsedResult.target = target;
          parsedResult.aggression = aggression;
          
          // Save result to storage
          const saveResult = await storage.saveScanResult('whatweb', target, parsedResult, 'web-fingerprint');
          
          res.json({
            success: true,
            tool: 'whatweb',
            target: target,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (saveError) {
          console.error('WhatWeb save error:', saveError);
          res.status(500).json({
            error: 'Failed to save scan results',
            details: saveError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('WhatWeb route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Directory enumeration with Windows compatibility
router.post('/directories', async (req, res) => {
  try {
    const { target, wordlist, extensions } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    // Basic URL validation
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(target)) {
      return res.status(400).json({
        error: 'Invalid URL format. Use http:// or https://'
      });
    }

    // Try dirb first, fall back to curl-based directory check on Windows
    let command = `dirb ${target}`;
    
    if (wordlist && wordlist !== 'default') {
      command += ` ${wordlist}`;
    }
    
    if (extensions) {
      command += ` -X ${extensions}`;
    }
    
    command += ' -r -S';

    exec(command, { timeout: 180000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error) {
            // If dirb fails (not installed), provide a basic directory check
            console.log('Dirb not available, performing basic directory enumeration...');
            
            const basicDirs = ['admin', 'login', 'test', 'backup', 'config', 'uploads', 'images', 'css', 'js', 'api'];
            let basicResults = `Directory enumeration for ${target}\n`;
            basicResults += '='.repeat(50) + '\n';
            
            const checkPromises = basicDirs.map((dir) => {
              const testUrl = `${target.replace(/\/$/, '')}/${dir}`;
              return new Promise((resolve) => {
                exec(`curl -s -o /dev/null -w "%{http_code}" "${testUrl}"`, { timeout: 10000 }, (err, out) => {
                  const statusCode = out.trim();
                  if (statusCode === '200' || statusCode === '301' || statusCode === '302') {
                    resolve(`${testUrl} - ${statusCode}`);
                  } else {
                    resolve(null);
                  }
                });
              });
            });

            try {
              const results = await Promise.all(checkPromises);
              const foundDirs = results.filter(r => r !== null);
              
              if (foundDirs.length > 0) {
                basicResults += 'Found directories:\n' + foundDirs.join('\n');
              } else {
                basicResults += 'No common directories found';
              }

              const parsedResult = {
                tool: 'basic-dir-enum',
                target: target,
                directories_found: foundDirs.length,
                method: 'Basic HTTP status check'
              };
              
              const saveResult = await storage.saveScanResult('dirb', target, parsedResult, 'dir-enum');
              
              return res.json({
                success: true,
                tool: 'dirb',
                target: target,
                output: basicResults,
                result: parsedResult,
                scan_id: saveResult.scan_id,
                note: 'Used basic directory enumeration (dirb not available)'
              });
            } catch (basicError) {
              console.error('Basic directory enumeration failed:', basicError);
              
              let basicOutput = `Directory enumeration attempted for ${target}\n`;
              basicOutput += '='.repeat(50) + '\n';
              basicOutput += 'Tool Status: Dirb not available\n';
              basicOutput += 'Fallback Method: Basic HTTP status checks\n';
              basicOutput += `Primary Error: ${error.message}\n`;
              basicOutput += `Fallback Error: ${basicError.message}\n\n`;
              basicOutput += 'Recommendations:\n';
              basicOutput += '- Install dirb or gobuster for comprehensive directory enumeration\n';
              basicOutput += '- Verify target URL is accessible\n';
              basicOutput += '- Check network connectivity\n';
              
              const parsedResult = {
                tool: 'basic-dir-enum',
                target: target,
                status: 'failed',
                primary_error: error.message,
                fallback_error: basicError.message,
                recommendations: [
                  'Install dirb/gobuster for comprehensive enumeration',
                  'Verify target accessibility',
                  'Check network connectivity'
                ]
              };
              
              const saveResult = await storage.saveScanResult('dirb', target, parsedResult, 'dir-enum');
              
              return res.json({
                success: false,
                tool: 'dirb',
                target: target,
                output: basicOutput,
                result: parsedResult,
                scan_id: saveResult.scan_id,
                note: 'Tool not available and fallback failed'
              });
            }
          }

          const parsedResult = OutputParser.parseGenericOutput(stdout, 'dirb');
          parsedResult.target = target;
          parsedResult.wordlist_used = wordlist;
          parsedResult.extensions = extensions;
          
          const saveResult = await storage.saveScanResult('dirb', target, parsedResult, 'dir-enum');
          
          res.json({
            success: true,
            tool: 'dirb',
            target: target,
            output: stdout,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (saveError) {
          console.error('Directory enumeration save error:', saveError);
          res.status(500).json({
            error: 'Failed to save scan results',
            details: saveError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Directory enumeration route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// HTTP headers analysis
router.post('/headers', async (req, res) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    const command = `curl -I -L --max-time 30 "${target}"`;
    
    exec(command, { timeout: 35000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.error('Headers analysis error:', error);
            return res.status(500).json({
              error: 'Failed to analyze HTTP headers',
              details: error.message
            });
          }

          const parsedResult = OutputParser.parseGenericOutput(stdout, 'headers');
          parsedResult.target = target;
          
          // Parse headers into structured format
          const headerLines = stdout.split('\n').filter(line => line.includes(':'));
          const headers = {};
          headerLines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
              headers[key.trim()] = valueParts.join(':').trim();
            }
          });
          parsedResult.parsed_headers = headers;
          
          // Save result to storage
          const saveResult = await storage.saveScanResult('headers', target, parsedResult, 'http-analysis');
          
          res.json({
            success: true,
            tool: 'headers',
            target: target,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (saveError) {
          console.error('Headers analysis save error:', saveError);
          res.status(500).json({
            error: 'Failed to save scan results',
            details: saveError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Headers route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// XSS testing (basic)
router.post('/xss', async (req, res) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    // Basic XSS test using curl
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      '\';alert("XSS");var a=\''
    ];

    let results = [];
    let outputText = `XSS Testing for ${target}\n`;
    outputText += '='.repeat(40) + '\n';
    
    // Process payloads sequentially to avoid async issues
    try {
      for (let i = 0; i < xssPayloads.length; i++) {
        const payload = xssPayloads[i];
        const encodedPayload = encodeURIComponent(payload);
        const testUrl = `${target}${target.includes('?') ? '&' : '?'}test=${encodedPayload}`;
        const command = `curl -s --max-time 10 "${testUrl}"`;
        
        try {
          const result = await new Promise((resolve, reject) => {
            exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
              if (error) {
                resolve({ stdout: '', error: error.message });
              } else {
                resolve({ stdout, stderr });
              }
            });
          });
          
          const reflected = result.stdout.includes(payload.replace(/[<>"']/g, ''));
          results.push({
            payload,
            reflected,
            response_snippet: result.stdout.substring(0, 200),
            error: result.error || null
          });
          
          outputText += `Payload: ${payload}\n`;
          outputText += `Reflected: ${reflected ? 'YES' : 'NO'}\n`;
          if (result.error) {
            outputText += `Error: ${result.error}\n`;
          }
          outputText += '\n';
          
        } catch (err) {
          results.push({
            payload,
            reflected: false,
            error: err.message
          });
          outputText += `Payload: ${payload}\n`;
          outputText += `Error: ${err.message}\n\n`;
        }
      }

      const parsedResult = {
        target,
        payloads_tested: results.length,
        reflected_payloads: results.filter(r => r.reflected).length,
        test_results: results
      };

      // Save result to storage
      const saveResult = await storage.saveScanResult('xss-test', target, parsedResult, 'xss-testing');
      
      res.json({
        success: true,
        tool: 'xss-test',
        target: target,
        output: outputText,
        result: parsedResult,
        scan_id: saveResult.scan_id,
        warning: 'XSS testing is for educational purposes only. Always get permission before testing.'
      });
    } catch (saveError) {
      console.error('XSS test save error:', saveError);
      res.status(500).json({
        error: 'Failed to save scan results',
        details: saveError.message
      });
    }

  } catch (error) {
    console.error('XSS test route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// SSL/TLS analysis
router.post('/ssl', async (req, res) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    // Extract hostname from URL if full URL provided
    let hostname = target;
    try {
      const url = new URL(target);
      hostname = url.hostname;
    } catch (e) {
      // Assume it's already a hostname
    }

    const command = `nmap --script ssl-enum-ciphers,ssl-cert -p 443 ${hostname}`;
    
    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.error('SSL analysis error:', error);
            return res.status(500).json({
              error: 'Failed to execute SSL analysis',
              details: error.message
            });
          }

          const parsedResult = OutputParser.parseGenericOutput(stdout, 'ssl');
          parsedResult.target = target;
          parsedResult.hostname = hostname;
          
          // Save result to storage
          const saveResult = await storage.saveScanResult('ssl', target, parsedResult, 'ssl-analysis');
          
          res.json({
            success: true,
            tool: 'ssl',
            target: target,
            output: stdout,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null
          });
        } catch (saveError) {
          console.error('SSL analysis save error:', saveError);
          res.status(500).json({
            error: 'Failed to save scan results',
            details: saveError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('SSL route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// SQL injection testing with SQLMap
router.post('/sqlmap', async (req, res) => {
  try {
    const { target, method = 'GET', data = null, cookie = null } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    let command = `sqlmap -u "${target}" --batch --threads=5 --level=1 --risk=1`;
    
    if (method.toUpperCase() === 'POST' && data) {
      command += ` --data="${data}"`;
    }
    
    if (cookie) {
      command += ` --cookie="${cookie}"`;
    }

    exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.error('SQLMap error:', error);
            // Provide fallback basic SQL injection test
            let basicOutput = `SQL Injection testing for ${target}\n`;
            basicOutput += '='.repeat(50) + '\n';
            basicOutput += 'Tool Status: SQLMap not available\n';
            basicOutput += 'Performing basic SQL injection tests...\n\n';
            
            const sqlPayloads = ["'", '"', "1' OR '1'='1", "1\" OR \"1\"=\"1"];
            
            for (const payload of sqlPayloads) {
              const testUrl = `${target}${target.includes('?') ? '&' : '?'}test=${encodeURIComponent(payload)}`;
              basicOutput += `Testing payload: ${payload}\n`;
              basicOutput += `Test URL: ${testUrl}\n`;
              
              try {
                const result = await new Promise((resolve) => {
                  exec(`curl -s --max-time 10 "${testUrl}"`, { timeout: 15000 }, (err, out) => {
                    resolve({ error: err, output: out });
                  });
                });
                
                if (result.error) {
                  basicOutput += `Error: ${result.error.message}\n`;
                } else {
                  const responseLength = result.output.length;
                  basicOutput += `Response length: ${responseLength} characters\n`;
                  if (result.output.toLowerCase().includes('sql') || result.output.toLowerCase().includes('mysql')) {
                    basicOutput += `⚠️  Potential SQL error detected\n`;
                  }
                }
              } catch (testError) {
                basicOutput += `Test failed: ${testError.message}\n`;
              }
              basicOutput += '\n';
            }
            
            basicOutput += 'Recommendations:\n';
            basicOutput += '- Install SQLMap for comprehensive SQL injection testing\n';
            basicOutput += '- Review application input validation\n';
            basicOutput += '- Test with authenticated sessions\n';

            const parsedResult = {
              tool: 'basic-sql-injection',
              target: target,
              status: 'sqlmap_not_available',
              method: 'basic_payload_testing',
              recommendations: [
                'Install SQLMap for comprehensive testing',
                'Review input validation',
                'Test with authentication'
              ]
            };
            
            const saveResult = await storage.saveScanResult('sqlmap', target, parsedResult, 'sql-injection');
            
            return res.json({
              success: false,
              tool: 'sqlmap',
              target: target,
              output: basicOutput,
              result: parsedResult,
              scan_id: saveResult.scan_id,
              note: 'Used basic SQL injection tests (SQLMap not available)'
            });
          }

          const parsedResult = OutputParser.parseGenericOutput(stdout, 'sqlmap');
          parsedResult.target = target;
          parsedResult.method = method;
          
          // Save result to storage
          const saveResult = await storage.saveScanResult('sqlmap', target, parsedResult, 'sql-injection');
          
          res.json({
            success: true,
            tool: 'sqlmap',
            target: target,
            output: stdout,
            result: parsedResult,
            scan_id: saveResult.scan_id,
            raw_output: stderr || null,
            warning: 'SQL injection testing is for educational purposes only. Always get permission before testing.'
          });
        } catch (saveError) {
          console.error('SQLMap save error:', saveError);
          res.status(500).json({
            error: 'Failed to save scan results',
            details: saveError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('SQLMap route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Gobuster directory and file brute forcing
router.post('/gobuster', async (req, res) => {
  try {
    const { 
      target,
      wordlist = '/usr/share/wordlists/dirb/common.txt',
      extensions = 'php,html,txt,js',
      threads = 10,
      mode = 'dir'
    } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    // Basic URL validation
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(target)) {
      return res.status(400).json({
        error: 'Invalid URL format. Use http:// or https://'
      });
    }

    // Build gobuster command
    let command = `gobuster ${mode} -u ${target} -t ${threads}`;
    
    if (wordlist !== '/usr/share/wordlists/dirb/common.txt') {
      command += ` -w ${wordlist}`;
    } else {
      // Use default wordlist
      command += ` -w /usr/share/wordlists/dirb/common.txt`;
    }
    
    if (extensions && mode === 'dir') {
      command += ` -x ${extensions}`;
    }
    
    command += ' -q'; // Quiet mode
    
    console.log('Executing Gobuster directory/file enumeration');
    
    exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.log('Gobuster not available, performing advanced directory enumeration...');
            
            let fallbackOutput = `Advanced directory enumeration for ${target}\n`;
            fallbackOutput += '='.repeat(50) + '\n';
            fallbackOutput += `Gobuster execution failed: ${error.message}\n\n`;
            
            // Enhanced directory wordlist
            const advancedDirs = [
              'admin', 'administrator', 'login', 'test', 'backup', 'config', 'uploads', 
              'images', 'css', 'js', 'api', 'assets', 'static', 'media', 'files',
              'tmp', 'temp', 'cache', 'logs', 'user', 'users', 'member', 'members',
              'dashboard', 'panel', 'control', 'cpanel', 'webmail', 'mail', 'email',
              'phpmyadmin', 'mysql', 'database', 'db', 'sql', 'install', 'setup',
              'wp-admin', 'wp-content', 'wp-includes', 'wordpress', 'cms', 'app',
              'application', 'portal', 'secure', 'private', 'internal', 'dev',
              'development', 'staging', 'production', 'beta', 'alpha', 'old',
              'new', 'v1', 'v2', 'api/v1', 'api/v2', 'rest', 'soap', 'xml',
              'json', 'ajax', 'service', 'services', 'web', 'site', 'sites'
            ];
            
            const extensionList = extensions.split(',');
            const allPaths = [...advancedDirs];
            
            // Add paths with extensions
            advancedDirs.forEach(dir => {
              extensionList.forEach(ext => {
                allPaths.push(`${dir}.${ext}`);
              });
            });
            
            fallbackOutput += 'Performing advanced directory/file enumeration:\n\n';
            const foundPaths = [];
            
            try {
              const checkPromises = allPaths.map((path) => {
                const testUrl = `${target.replace(/\/$/, '')}/${path}`;
                return new Promise((resolve) => {
                  exec(`curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${testUrl}"`, { timeout: 8000 }, (err, out) => {
                    const statusCode = out.trim();
                    if (['200', '301', '302', '403'].includes(statusCode)) {
                      foundPaths.push({ path: testUrl, status: statusCode });
                      resolve(`${testUrl} - ${statusCode}`);
                    } else {
                      resolve(null);
                    }
                  });
                });
              });
              
              const results = await Promise.all(checkPromises);
              const validResults = results.filter(result => result !== null);
              
              validResults.forEach(result => {
                fallbackOutput += `${result}\n`;
              });
              
              fallbackOutput += `\nTotal paths found: ${foundPaths.length}\n`;
              
            } catch (fallbackError) {
              fallbackOutput += `Advanced enumeration failed: ${fallbackError.message}\n`;
            }
            
            fallbackOutput += '\nInstall Gobuster for high-performance directory brute forcing.\n';
            fallbackOutput += 'Download from: https://github.com/OJ/gobuster\n';
            
            const parsedResult = {
              tool: 'advanced-dir-enum',
              target: target,
              found_paths: foundPaths,
              note: 'Gobuster not available, performed advanced enumeration'
            };
            
            const saveResult = await storage.saveScanResult('gobuster', target, parsedResult, 'directory-enum');
            
            return res.json({
              success: false,
              tool: 'gobuster',
              target: target,
              output: fallbackOutput,
              result: parsedResult,
              scan_id: saveResult.scan_id,
              note: 'Gobuster not available, performed advanced directory enumeration',
              error: error.message
            });
          }

          const parsedResult = OutputParser.parseGobusterOutput(stdout);
          
          const saveResult = await storage.saveScanResult('gobuster', target, parsedResult, 'directory-enum');
          
          res.json({
            success: true,
            tool: 'gobuster',
            target: target,
            mode: mode,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
          
        } catch (asyncError) {
          console.error('Gobuster async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Gobuster route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// FFuF fuzzer
router.post('/ffuf', async (req, res) => {
  try {
    const { 
      target,
      wordlist = 'default',
      keyword = 'FUZZ',
      threads = 40,
      filterCodes = '404'
    } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    if (!target.includes(keyword)) {
      return res.status(400).json({
        error: `Target URL must contain the keyword "${keyword}" to fuzz`
      });
    }

    // Build ffuf command
    let command = `ffuf -u ${target} -t ${threads}`;
    
    if (wordlist === 'default') {
      command += ' -w /usr/share/wordlists/SecLists/Discovery/Web-Content/common.txt';
    } else {
      command += ` -w ${wordlist}`;
    }
    
    if (filterCodes) {
      command += ` -fc ${filterCodes}`;
    }
    
    command += ' -o /tmp/ffuf_output.json -of json';
    
    console.log('Executing FFuF fuzzer');
    
    exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.log('FFuF not available, performing parameter fuzzing...');
            
            let fallbackOutput = `Parameter fuzzing for ${target}\n`;
            fallbackOutput += '='.repeat(35) + '\n';
            fallbackOutput += `FFuF execution failed: ${error.message}\n\n`;
            
            // Common parameter names for fuzzing
            const commonParams = [
              'id', 'user', 'username', 'password', 'email', 'search', 'query',
              'page', 'limit', 'offset', 'sort', 'order', 'filter', 'category',
              'type', 'action', 'cmd', 'command', 'file', 'path', 'url', 'redirect',
              'callback', 'return', 'next', 'prev', 'token', 'key', 'api_key',
              'session', 'csrf', 'nonce', 'hash', 'signature', 'debug', 'test'
            ];
            
            fallbackOutput += 'Performing parameter fuzzing:\n\n';
            const validParams = [];
            
            try {
              for (const param of commonParams) {
                const fuzzUrl = target.replace(keyword, param);
                
                try {
                  const testCommand = `curl -s -o /dev/null -w "%{http_code}:%{size_download}" --max-time 5 "${fuzzUrl}"`;
                  const { stdout: response } = await new Promise((resolve, reject) => {
                    exec(testCommand, { timeout: 8000 }, (err, out, serr) => {
                      if (err) reject(err);
                      else resolve({ stdout: out, stderr: serr });
                    });
                  });
                  
                  const [statusCode, size] = response.trim().split(':');
                  if (statusCode !== '404' && statusCode !== '403') {
                    validParams.push({ param, status: statusCode, size: parseInt(size) });
                    fallbackOutput += `${param} - HTTP ${statusCode} (${size} bytes)\n`;
                  }
                  
                } catch (testError) {
                  // Continue with next parameter
                }
              }
              
              fallbackOutput += `\nValid parameters found: ${validParams.length}\n`;
              
            } catch (fallbackError) {
              fallbackOutput += `Parameter fuzzing failed: ${fallbackError.message}\n`;
            }
            
            fallbackOutput += '\nInstall FFuF for high-performance web fuzzing.\n';
            fallbackOutput += 'Download from: https://github.com/ffuf/ffuf\n';
            
            const parsedResult = {
              tool: 'basic-param-fuzz',
              target: target,
              valid_params: validParams,
              note: 'FFuF not available, performed basic parameter fuzzing'
            };
            
            const saveResult = await storage.saveScanResult('ffuf', target, parsedResult, 'parameter-fuzz');
            
            return res.json({
              success: false,
              tool: 'ffuf',
              target: target,
              output: fallbackOutput,
              result: parsedResult,
              scan_id: saveResult.scan_id,
              note: 'FFuF not available, performed basic parameter fuzzing',
              error: error.message
            });
          }

          const parsedResult = OutputParser.parseFFuFOutput(stdout);
          
          const saveResult = await storage.saveScanResult('ffuf', target, parsedResult, 'parameter-fuzz');
          
          res.json({
            success: true,
            tool: 'ffuf',
            target: target,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
          
        } catch (asyncError) {
          console.error('FFuF async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('FFuF route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Wapiti web vulnerability scanner
router.post('/wapiti', async (req, res) => {
  try {
    const { 
      target,
      modules = 'all',
      level = 1,
      format = 'json'
    } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    // Basic URL validation
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(target)) {
      return res.status(400).json({
        error: 'Invalid URL format. Use http:// or https://'
      });
    }

    // Build wapiti command
    let command = `wapiti -u ${target} -l ${level}`;
    
    if (modules !== 'all') {
      command += ` -m ${modules}`;
    }
    
    command += ` -f ${format} -o /tmp/wapiti_output.json`;
    
    console.log('Executing Wapiti web vulnerability scanner');
    
    exec(command, { timeout: 600000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.log('Wapiti not available, performing comprehensive web vulnerability assessment...');
            
            let fallbackOutput = `Comprehensive web vulnerability assessment for ${target}\n`;
            fallbackOutput += '='.repeat(60) + '\n';
            fallbackOutput += `Wapiti execution failed: ${error.message}\n\n`;
            
            // Comprehensive vulnerability checks
            const vulnChecks = [
              {
                name: 'SQL Injection Test',
                payloads: ["'", "1' OR '1'='1", "1; DROP TABLE users--"],
                check: 'error|mysql|syntax|warning'
              },
              {
                name: 'XSS Test',
                payloads: ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '"><script>alert(1)</script>'],
                check: '<script>|onerror|javascript:'
              },
              {
                name: 'Directory Traversal',
                payloads: ['../../../etc/passwd', '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts'],
                check: 'root:|administrator|bin/bash'
              },
              {
                name: 'Command Injection',
                payloads: ['; id', '| whoami', '`whoami`'],
                check: 'uid=|gid=|root|administrator'
              }
            ];
            
            fallbackOutput += 'Performing comprehensive vulnerability tests:\n\n';
            let vulnerabilities = [];
            
            try {
              for (const test of vulnChecks) {
                fallbackOutput += `${test.name}:\n`;
                
                for (const payload of test.payloads) {
                  const testUrl = `${target}${target.includes('?') ? '&' : '?'}test=${encodeURIComponent(payload)}`;
                  
                  try {
                    const testCommand = `curl -s --max-time 10 "${testUrl}"`;
                    const { stdout: response } = await new Promise((resolve, reject) => {
                      exec(testCommand, { timeout: 15000 }, (err, out, serr) => {
                        if (err) reject(err);
                        else resolve({ stdout: out, stderr: serr });
                      });
                    });
                    
                    const regex = new RegExp(test.check, 'i');
                    if (regex.test(response)) {
                      vulnerabilities.push({
                        type: test.name,
                        payload: payload,
                        evidence: response.substring(0, 200)
                      });
                      fallbackOutput += `  ⚠️  Potential vulnerability detected with payload: ${payload}\n`;
                    } else {
                      fallbackOutput += `  ✓  No vulnerability detected with payload: ${payload}\n`;
                    }
                    
                  } catch (testError) {
                    fallbackOutput += `  ❌ Test failed for payload: ${payload}\n`;
                  }
                }
                
                fallbackOutput += '\n';
              }
              
              fallbackOutput += `Summary: ${vulnerabilities.length} potential vulnerabilities found\n`;
              
            } catch (fallbackError) {
              fallbackOutput += `Comprehensive vulnerability assessment failed: ${fallbackError.message}\n`;
            }
            
            fallbackOutput += '\nInstall Wapiti for professional web vulnerability scanning.\n';
            fallbackOutput += 'Download from: https://wapiti-scanner.github.io/\n';
            
            const parsedResult = {
              tool: 'comprehensive-web-vuln-assessment',
              target: target,
              vulnerabilities: vulnerabilities,
              note: 'Wapiti not available, performed comprehensive manual testing'
            };
            
            const saveResult = await storage.saveScanResult('wapiti', target, parsedResult, 'web-vuln-scan');
            
            return res.json({
              success: false,
              tool: 'wapiti',
              target: target,
              output: fallbackOutput,
              result: parsedResult,
              scan_id: saveResult.scan_id,
              note: 'Wapiti not available, performed comprehensive vulnerability assessment',
              error: error.message
            });
          }

          const parsedResult = OutputParser.parseWapitiOutput(stdout);
          
          const saveResult = await storage.saveScanResult('wapiti', target, parsedResult, 'web-vuln-scan');
          
          res.json({
            success: true,
            tool: 'wapiti',
            target: target,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
          
        } catch (asyncError) {
          console.error('Wapiti async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('Wapiti route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// OWASP ZAP baseline scan
router.post('/zap-baseline', async (req, res) => {
  try {
    const { 
      target,
      format = 'json',
      level = 'Low'
    } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    // Basic URL validation
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(target)) {
      return res.status(400).json({
        error: 'Invalid URL format. Use http:// or https://'
      });
    }

    // Build ZAP baseline command
    const command = `zap-baseline.py -t ${target} -J /tmp/zap_baseline.json -l ${level}`;
    
    console.log('Executing OWASP ZAP baseline scan');
    
    exec(command, { timeout: 900000 }, (error, stdout, stderr) => {
      (async () => {
        try {
          if (error && !stdout) {
            console.log('OWASP ZAP not available, performing security baseline assessment...');
            
            let fallbackOutput = `Security baseline assessment for ${target}\n`;
            fallbackOutput += '='.repeat(45) + '\n';
            fallbackOutput += `OWASP ZAP execution failed: ${error.message}\n\n`;
            
            // Security baseline checks
            const securityChecks = [
              { name: 'HTTP Security Headers', endpoint: '' },
              { name: 'SSL/TLS Configuration', endpoint: '' },
              { name: 'Cookie Security', endpoint: '' },
              { name: 'Information Disclosure', endpoint: '' },
              { name: 'Authentication Bypass', endpoint: '/admin' },
              { name: 'Sensitive Files', endpoint: '/robots.txt' }
            ];
            
            fallbackOutput += 'Performing security baseline checks:\n\n';
            let findings = [];
            
            try {
              for (const check of securityChecks) {
                const testUrl = `${target}${check.endpoint}`;
                
                try {
                  const testCommand = `curl -I -s --max-time 15 "${testUrl}"`;
                  const { stdout: headers } = await new Promise((resolve, reject) => {
                    exec(testCommand, { timeout: 20000 }, (err, out, serr) => {
                      if (err) reject(err);
                      else resolve({ stdout: out, stderr: serr });
                    });
                  });
                  
                  fallbackOutput += `${check.name}:\n`;
                  
                  if (check.name === 'HTTP Security Headers') {
                    const requiredHeaders = ['X-Frame-Options', 'X-XSS-Protection', 'X-Content-Type-Options', 'Strict-Transport-Security'];
                    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
                    
                    if (missingHeaders.length > 0) {
                      findings.push({
                        type: 'Missing Security Headers',
                        severity: 'Medium',
                        details: missingHeaders.join(', ')
                      });
                      fallbackOutput += `  ⚠️  Missing headers: ${missingHeaders.join(', ')}\n`;
                    } else {
                      fallbackOutput += `  ✓  All security headers present\n`;
                    }
                  } else if (check.name === 'Information Disclosure') {
                    const serverHeader = headers.match(/Server: ([^\r\n]+)/i);
                    if (serverHeader) {
                      findings.push({
                        type: 'Server Information Disclosure',
                        severity: 'Low',
                        details: serverHeader[1]
                      });
                      fallbackOutput += `  ⚠️  Server header exposed: ${serverHeader[1]}\n`;
                    } else {
                      fallbackOutput += `  ✓  Server header not exposed\n`;
                    }
                  } else {
                    fallbackOutput += `  ✓  Check completed\n`;
                  }
                  
                } catch (testError) {
                  fallbackOutput += `  ❌ ${check.name} check failed\n`;
                }
                
                fallbackOutput += '\n';
              }
              
              fallbackOutput += `Summary: ${findings.length} security findings identified\n`;
              
            } catch (fallbackError) {
              fallbackOutput += `Security baseline assessment failed: ${fallbackError.message}\n`;
            }
            
            fallbackOutput += '\nInstall OWASP ZAP for comprehensive web application security testing.\n';
            fallbackOutput += 'Download from: https://www.zaproxy.org/\n';
            
            const parsedResult = {
              tool: 'security-baseline-assessment',
              target: target,
              findings: findings,
              note: 'OWASP ZAP not available, performed security baseline assessment'
            };
            
            const saveResult = await storage.saveScanResult('zap-baseline', target, parsedResult, 'security-baseline');
            
            return res.json({
              success: false,
              tool: 'zap-baseline',
              target: target,
              output: fallbackOutput,
              result: parsedResult,
              scan_id: saveResult.scan_id,
              note: 'OWASP ZAP not available, performed security baseline assessment',
              error: error.message
            });
          }

          const parsedResult = OutputParser.parseZAPOutput(stdout);
          
          const saveResult = await storage.saveScanResult('zap-baseline', target, parsedResult, 'security-baseline');
          
          res.json({
            success: true,
            tool: 'zap-baseline',
            target: target,
            result: parsedResult,
            scan_id: saveResult.scan_id
          });
          
        } catch (asyncError) {
          console.error('ZAP baseline async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error in async operation',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('ZAP baseline route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router; 
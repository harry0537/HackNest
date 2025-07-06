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

// SSL test route
router.post('/ssl-test', async (req, res) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    // Extract hostname from URL
    let hostname = target;
    try {
      const url = new URL(target);
      hostname = url.hostname;
    } catch (urlError) {
      // If URL parsing fails, assume it's just a hostname
      hostname = target.replace(/^https?:\/\//, '').split('/')[0];
    }

    const command = `echo | openssl s_client -connect ${hostname}:443 -servername ${hostname} 2>/dev/null | openssl x509 -noout -text`;
    
    console.log('Executing SSL certificate analysis');
    
    const result = await executeCommand(command, { timeout: 30000 });
    
    if (result.error && !result.stdout) {
      // Fallback to basic SSL check
      let fallbackOutput = `SSL Certificate analysis for ${hostname}\n`;
      fallbackOutput += '='.repeat(40) + '\n';
      fallbackOutput += `OpenSSL command failed: ${result.error.message}\n\n`;
      
      try {
        const basicResult = await executeCommand(`curl -I -s --max-time 10 "https://${hostname}"`, { timeout: 15000 });
        if (basicResult.stdout) {
          fallbackOutput += 'Basic HTTPS connectivity: SUCCESS\n';
          fallbackOutput += 'Note: Install OpenSSL for detailed certificate analysis\n';
        } else {
          fallbackOutput += 'HTTPS connectivity: FAILED\n';
        }
      } catch (fallbackError) {
        fallbackOutput += `Basic SSL check failed: ${fallbackError.message}\n`;
      }
      
      const parsedResult = {
        tool: 'basic-ssl-check',
        target: hostname,
        note: 'OpenSSL not available, performed basic check'
      };
      
      const saveResult = await storage.saveScanResult('ssl-test', hostname, parsedResult, 'ssl-analysis');
      
      return res.json({
        success: false,
        tool: 'ssl-test',
        target: hostname,
        output: fallbackOutput,
        result: parsedResult,
        scan_id: saveResult.scan_id,
        note: 'OpenSSL not available, performed basic SSL check'
      });
    }

    const parsedResult = OutputParser.parseSSLOutput(result.stdout);
    parsedResult.target = hostname;
    
    const saveResult = await storage.saveScanResult('ssl-test', hostname, parsedResult, 'ssl-analysis');
    
    res.json({
      success: true,
      tool: 'ssl-test',
      target: hostname,
      output: result.stdout,
      result: parsedResult,
      scan_id: saveResult.scan_id
    });

  } catch (error) {
    console.error('SSL test error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Nikto web vulnerability scanner
router.post('/nikto', async (req, res) => {
  try {
    const { 
      target,
      options = '-h',
      format = 'txt'
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

    // Build nikto command
    let command = `nikto ${options} ${target}`;
    
    if (format === 'xml') {
      command += ' -Format xml';
    }
    
    console.log('Executing Nikto web vulnerability scanner');
    
    const result = await executeCommand(command, { timeout: 300000 });
    
    if (result.error && !result.stdout) {
      console.log('Nikto not available, performing basic web vulnerability checks...');
      
      // Fallback to basic web vulnerability checking
      let fallbackOutput = `Basic web vulnerability assessment for ${target}\n`;
      fallbackOutput += '='.repeat(50) + '\n';
      fallbackOutput += `Nikto execution failed: ${result.error.message}\n\n`;
      
      // Basic checks using curl
      const checks = [
        { name: 'Server Headers', url: target, check: 'server' },
        { name: 'Directory Listings', url: `${target}/`, check: 'Index of' },
        { name: 'Admin Panels', url: `${target}/admin`, check: 'admin' },
        { name: 'Config Files', url: `${target}/config.php`, check: 'config' }
      ];
      
      fallbackOutput += 'Performing basic vulnerability checks:\n\n';
      
      try {
        for (const check of checks) {
          try {
            const testResult = await executeCommand(`curl -s -I --max-time 10 "${check.url}"`, { timeout: 15000 });
            if (testResult.stdout.toLowerCase().includes(check.check)) {
              fallbackOutput += `${check.name}: Potential issue found\n`;
            } else {
              fallbackOutput += `${check.name}: No obvious issues\n`;
            }
          } catch (testError) {
            fallbackOutput += `${check.name}: Check failed\n`;
          }
        }
      } catch (fallbackError) {
        fallbackOutput += `Basic vulnerability assessment failed: ${fallbackError.message}\n`;
      }
      
      fallbackOutput += '\nInstall Nikto for comprehensive web vulnerability scanning.\n';
      fallbackOutput += 'Download from: https://cirt.net/Nikto2\n';
      
      const parsedResult = {
        tool: 'basic-web-vuln',
        target: target,
        note: 'Nikto not available, performed basic checks'
      };
      
      const saveResult = await storage.saveScanResult('nikto', target, parsedResult, 'web-vuln');
      
      return res.json({
        success: false,
        tool: 'nikto',
        target: target,
        output: fallbackOutput,
        result: parsedResult,
        scan_id: saveResult.scan_id,
        note: 'Nikto not available, performed basic vulnerability checks',
        error: result.error.message
      });
    }

    const parsedResult = OutputParser.parseNiktoOutput(result.stdout);
    
    const saveResult = await storage.saveScanResult('nikto', target, parsedResult, 'web-vuln');
    
    res.json({
      success: true,
      tool: 'nikto',
      target: target,
      output: result.stdout,
      result: parsedResult,
      scan_id: saveResult.scan_id,
      raw_output: result.stderr || null
    });
    
  } catch (error) {
    console.error('Nikto route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// DIRB directory brute forcer
router.post('/dirb', async (req, res) => {
  try {
    const { 
      target,
      wordlist = '/usr/share/wordlists/dirb/common.txt',
      extensions = '',
      options = ''
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

    // Build dirb command
    let command = `dirb ${target}`;
    
    if (wordlist !== '/usr/share/wordlists/dirb/common.txt') {
      command += ` ${wordlist}`;
    }
    
    if (extensions) {
      command += ` -X ${extensions}`;
    }
    
    if (options) {
      command += ` ${options}`;
    }
    
    console.log('Executing DIRB directory enumeration');
    
    const result = await executeCommand(command, { timeout: 300000 });
    
    if (result.error && !result.stdout) {
      console.log('DIRB not available, performing directory enumeration...');
      
      // Fallback to basic directory enumeration
      let fallbackOutput = `Directory enumeration for ${target}\n`;
      fallbackOutput += '='.repeat(40) + '\n';
      fallbackOutput += `DIRB execution failed: ${result.error.message}\n\n`;
      
      // Common directories to check
      const commonDirs = [
        'admin', 'administrator', 'login', 'test', 'backup', 'config', 'uploads', 
        'images', 'css', 'js', 'api', 'assets', 'static', 'media', 'files'
      ];
      
      fallbackOutput += 'Performing basic directory checks:\n\n';
      const foundDirs = [];
      
      try {
        for (const dir of commonDirs) {
          const dirUrl = `${target.replace(/\/$/, '')}/${dir}/`;
          try {
            const dirResult = await executeCommand(`curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${dirUrl}"`, { timeout: 8000 });
            const statusCode = dirResult.stdout.trim();
            if (['200', '301', '302', '403'].includes(statusCode)) {
              foundDirs.push({ directory: dir, status: statusCode });
              fallbackOutput += `${dir}/ - ${statusCode}\n`;
            }
          } catch (testError) {
            // Continue with next directory
          }
        }
        
        fallbackOutput += `\nDirectories found: ${foundDirs.length}\n`;
        
      } catch (fallbackError) {
        fallbackOutput += `Directory enumeration failed: ${fallbackError.message}\n`;
      }
      
      fallbackOutput += '\nInstall DIRB for comprehensive directory brute forcing.\n';
      fallbackOutput += 'Available in most Linux distributions.\n';
      
      const parsedResult = {
        tool: 'basic-dir-enum',
        target: target,
        found_directories: foundDirs,
        note: 'DIRB not available, performed basic enumeration'
      };
      
      const saveResult = await storage.saveScanResult('dirb', target, parsedResult, 'directory-enum');
      
      return res.json({
        success: false,
        tool: 'dirb',
        target: target,
        output: fallbackOutput,
        result: parsedResult,
        scan_id: saveResult.scan_id,
        note: 'DIRB not available, performed basic directory enumeration',
        error: result.error.message
      });
    }

    const parsedResult = OutputParser.parseDirbOutput(result.stdout);
    
    const saveResult = await storage.saveScanResult('dirb', target, parsedResult, 'directory-enum');
    
    res.json({
      success: true,
      tool: 'dirb',
      target: target,
      output: result.stdout,
      result: parsedResult,
      scan_id: saveResult.scan_id
    });
    
  } catch (error) {
    console.error('DIRB route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// SQLMap SQL injection testing  
router.post('/sqlmap', async (req, res) => {
  try {
    const { 
      target,
      method = 'GET',
      data = '',
      cookie = '',
      userAgent = 'Mozilla/5.0',
      level = 1,
      risk = 1,
      technique = 'B'
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

    // Build sqlmap command
    let command = `sqlmap -u "${target}" --level=${level} --risk=${risk} --technique=${technique} --batch --no-cast`;
    
    if (method === 'POST' && data) {
      command += ` --data="${data}"`;
    }
    
    if (cookie) {
      command += ` --cookie="${cookie}"`;
    }
    
    command += ` --user-agent="${userAgent}"`;
    command += ' --timeout=30 --retries=2';
    
    console.log('Executing SQLMap SQL injection scanner');
    
    const result = await executeCommand(command, { timeout: 300000 });
    
    if (result.error && !result.stdout) {
      console.error('SQLMap error:', result.error);
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
          const testResult = await executeCommand(`curl -s --max-time 10 "${testUrl}"`, { timeout: 15000 });
          
          if (testResult.error) {
            basicOutput += `Error: ${testResult.error.message}\n`;
          } else {
            const responseLength = testResult.stdout.length;
            basicOutput += `Response length: ${responseLength} characters\n`;
            if (testResult.stdout.toLowerCase().includes('sql') || testResult.stdout.toLowerCase().includes('mysql')) {
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

    const parsedResult = OutputParser.parseGenericOutput(result.stdout, 'sqlmap');
    parsedResult.target = target;
    parsedResult.method = method;
    
    // Save result to storage
    const saveResult = await storage.saveScanResult('sqlmap', target, parsedResult, 'sql-injection');
    
    res.json({
      success: true,
      tool: 'sqlmap',
      target: target,
      output: result.stdout,
      result: parsedResult,
      scan_id: saveResult.scan_id,
      raw_output: result.stderr || null,
      warning: 'SQL injection testing is for educational purposes only. Always get permission before testing.'
    });
    
  } catch (error) {
    console.error('SQLMap route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;

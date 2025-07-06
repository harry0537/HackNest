const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
const OutputParser = require('../utils/parser');
const storage = require('../utils/storage');
const PlatformUtils = require('../utils/platform');

// Port scanning using netcat (available in most environments)
router.post('/portscan', async (req, res) => {
  try {
    const { target, ports = '21,22,23,25,53,80,110,111,135,139,143,443,993,995,1723,3306,3389,5900,8080' } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    const validation = PlatformUtils.validateTarget(target, 'hostname');
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    const portList = ports.split(',').slice(0, 20); // Limit to 20 ports for serverless
    const results = [];
    
    // Test each port
    for (const port of portList) {
      const portNum = parseInt(port.trim());
      if (portNum > 0 && portNum <= 65535) {
        try {
          // Use netcat or telnet for port testing
          const command = process.platform === 'win32' 
            ? `powershell -Command "Test-NetConnection -ComputerName ${target} -Port ${portNum} -InformationLevel Quiet"`
            : `timeout 3 bash -c "</dev/tcp/${target}/${portNum}" 2>/dev/null && echo "open" || echo "closed"`;
          
          const { stdout } = await new Promise((resolve, reject) => {
            exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
              resolve({ stdout: stdout || 'closed', stderr, error });
            });
          });

          const isOpen = stdout.toLowerCase().includes('true') || stdout.toLowerCase().includes('open');
          results.push({
            port: portNum,
            state: isOpen ? 'open' : 'closed',
            service: getCommonService(portNum)
          });
        } catch (error) {
          results.push({
            port: portNum,
            state: 'filtered',
            service: getCommonService(portNum)
          });
        }
      }
    }

    const scanResult = {
      target: target,
      scan_type: 'basic-port-scan',
      ports_scanned: portList.length,
      open_ports: results.filter(r => r.state === 'open'),
      all_results: results,
      timestamp: new Date().toISOString(),
      environment: 'serverless'
    };

    // Save result to storage
    const saveResult = await storage.saveScanResult('portscan', target, scanResult, 'port-scan');

    res.json({
      success: true,
      tool: 'portscan',
      target: target,
      result: scanResult,
      scan_id: saveResult.scan_id,
      note: 'Basic port scanning using native network tools'
    });

  } catch (error) {
    console.error('Port scan error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// HTTP service detection
router.post('/http-detect', async (req, res) => {
  try {
    const { target, ports = '80,443,8080,8443' } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    const portList = ports.split(',').slice(0, 10);
    const results = [];

    for (const port of portList) {
      const portNum = parseInt(port.trim());
      const protocol = (portNum === 443 || portNum === 8443) ? 'https' : 'http';
      const url = `${protocol}://${target}:${portNum}`;

      try {
        const command = `curl -I -s --max-time 10 --connect-timeout 5 "${url}"`;
        
        const { stdout, error } = await new Promise((resolve) => {
          exec(command, { timeout: 12000 }, (error, stdout, stderr) => {
            resolve({ stdout, stderr, error });
          });
        });

        if (!error && stdout) {
          const headers = {};
          const lines = stdout.split('\n');
          const statusLine = lines[0] || '';
          
          lines.slice(1).forEach(line => {
            if (line.includes(':')) {
              const [key, ...valueParts] = line.split(':');
              headers[key.trim().toLowerCase()] = valueParts.join(':').trim();
            }
          });

          results.push({
            port: portNum,
            status: 'open',
            service: 'http',
            protocol: protocol,
            status_line: statusLine.trim(),
            server: headers.server || 'Unknown',
            headers: headers
          });
        }
      } catch (err) {
        // Port likely closed or filtered
      }
    }

    const scanResult = {
      target: target,
      scan_type: 'http-service-detection',
      services_found: results,
      timestamp: new Date().toISOString()
    };

    const saveResult = await storage.saveScanResult('http-detect', target, scanResult, 'service-detection');

    res.json({
      success: true,
      tool: 'http-detect',
      target: target,
      result: scanResult,
      scan_id: saveResult.scan_id
    });

  } catch (error) {
    console.error('HTTP detection error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// SSL/TLS information gathering
router.post('/ssl-info', async (req, res) => {
  try {
    const { target, port = 443 } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target is required'
      });
    }

    // Use openssl to get SSL info (if available)
    const command = `echo | openssl s_client -connect ${target}:${port} -servername ${target} 2>/dev/null | openssl x509 -noout -text 2>/dev/null`;
    
    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      (async () => {
        try {
      let sslInfo = {
        target: target,
        port: port,
        timestamp: new Date().toISOString()
      };

      if (error || !stdout) {
        // Fallback: basic SSL test with curl
        const fallbackCommand = `curl -I -s --max-time 10 https://${target}:${port}`;
        exec(fallbackCommand, { timeout: 12000 }, async (fallbackError, fallbackStdout) => {
          sslInfo.ssl_available = !fallbackError && fallbackStdout;
          sslInfo.method = 'basic-test';
          sslInfo.note = 'Limited SSL information available in serverless environment';

          const saveResult = await storage.saveScanResult('ssl-info', target, sslInfo, 'ssl-analysis');
          
          res.json({
            success: true,
            tool: 'ssl-info',
            target: target,
            result: sslInfo,
            scan_id: saveResult.scan_id
          });
        });
      } else {
        // Parse OpenSSL output
        sslInfo.certificate_info = 'Available';
        sslInfo.raw_output = stdout;
        sslInfo.method = 'openssl';

        const saveResult = await storage.saveScanResult('ssl-info', target, sslInfo, 'ssl-analysis');
        
        res.json({
          success: true,
          tool: 'ssl-info',
          target: target,
          result: sslInfo,
          scan_id: saveResult.scan_id
        });
      }
        } catch (asyncError) {
          console.error('SSL info async error:', asyncError);
          res.status(500).json({
            error: 'Internal server error',
            details: asyncError.message
          });
        }
      })();
    });

  } catch (error) {
    console.error('SSL info error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get available scan tools for serverless environment
router.get('/available', (req, res) => {
  const tools = [
    {
      name: 'Basic Port Scan',
      endpoint: '/portscan',
      description: 'Test common ports using native network tools',
      estimated_time: '30 seconds - 2 minutes',
      serverless_compatible: true
    },
    {
      name: 'HTTP Service Detection',
      endpoint: '/http-detect',
      description: 'Detect HTTP/HTTPS services and gather headers',
      estimated_time: '15-30 seconds',
      serverless_compatible: true
    },
    {
      name: 'SSL/TLS Information',
      endpoint: '/ssl-info',
      description: 'Gather SSL certificate and connection information',
      estimated_time: '10-20 seconds',
      serverless_compatible: true
    }
  ];

  res.json({
    success: true,
    environment: 'serverless',
    note: 'Limited tools available in serverless environment. Full security tools require dedicated infrastructure.',
    available_tools: tools
  });
});

// Helper function to get common service names
function getCommonService(port) {
  const services = {
    21: 'ftp',
    22: 'ssh',
    23: 'telnet',
    25: 'smtp',
    53: 'dns',
    80: 'http',
    110: 'pop3',
    111: 'rpcbind',
    135: 'msrpc',
    139: 'netbios-ssn',
    143: 'imap',
    443: 'https',
    993: 'imaps',
    995: 'pop3s',
    1723: 'pptp',
    3306: 'mysql',
    3389: 'rdp',
    5900: 'vnc',
    8080: 'http-proxy'
  };
  return services[port] || 'unknown';
}

module.exports = router; 
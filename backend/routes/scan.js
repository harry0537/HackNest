const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
const OutputParser = require('../utils/parser');
const storage = require('../utils/storage');

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
    
    exec(command, { timeout: 300000 }, async (error, stdout, stderr) => {
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
    
    exec(command, { timeout: 1800000 }, async (error, stdout, stderr) => {
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
    
    exec(command, { timeout: 900000 }, async (error, stdout, stderr) => { // 15 minute timeout
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
    
    exec(command, { timeout: 600000 }, async (error, stdout, stderr) => {
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

module.exports = router; 
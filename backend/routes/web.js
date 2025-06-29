const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
const OutputParser = require('../utils/parser');
const storage = require('../utils/storage');

// Nikto web vulnerability scanner
router.post('/nikto', async (req, res) => {
  try {
    const { target, ssl = false, port = null } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    // Basic URL validation
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(target)) {
      return res.status(400).json({
        error: 'Invalid URL format'
      });
    }

    let command = `nikto -h ${target}`;
    
    if (ssl) {
      command += ' -ssl';
    }
    
    if (port) {
      command += ` -p ${port}`;
    }
    
    command += ' -Format txt';

    exec(command, { timeout: 300000 }, async (error, stdout, stderr) => {
      if (error && !stdout) {
        console.error('Nikto error:', error);
        return res.status(500).json({
          error: 'Failed to execute Nikto scan',
          details: error.message
        });
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
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
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
    
    exec(command, { timeout: 60000 }, async (error, stdout, stderr) => {
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
    });

  } catch (error) {
    console.error('WhatWeb route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Directory enumeration with dirb
router.post('/dirb', async (req, res) => {
  try {
    const { target, wordlist = '/usr/share/dirb/wordlists/common.txt', extensions = null } = req.body;

    if (!target) {
      return res.status(400).json({
        error: 'Target URL is required'
      });
    }

    let command = `dirb ${target}`;
    
    if (wordlist && wordlist !== 'default') {
      command += ` ${wordlist}`;
    }
    
    if (extensions) {
      command += ` -X ${extensions}`;
    }
    
    command += ' -r -S';

    exec(command, { timeout: 300000 }, async (error, stdout, stderr) => {
      if (error && !stdout) {
        console.error('Dirb error:', error);
        return res.status(500).json({
          error: 'Failed to execute Dirb scan',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseGenericOutput(stdout, 'dirb');
      parsedResult.target = target;
      parsedResult.wordlist_used = wordlist;
      parsedResult.extensions = extensions;
      
      // Save result to storage
      const saveResult = await storage.saveScanResult('dirb', target, parsedResult, 'dir-enum');
      
      res.json({
        success: true,
        tool: 'dirb',
        target: target,
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
    });

  } catch (error) {
    console.error('Dirb route error:', error);
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
    
    exec(command, { timeout: 35000 }, async (error, stdout, stderr) => {
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
    });

  } catch (error) {
    console.error('Headers route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router; 
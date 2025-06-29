const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
const OutputParser = require('../utils/parser');
const storage = require('../utils/storage');
const PlatformUtils = require('../utils/platform');

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
    
    exec(command, { timeout: 30000 }, async (error, stdout, stderr) => {
      if (error) {
        console.error('Whois error:', error);
        return res.status(500).json({
          error: 'Failed to execute whois command',
          details: error.message
        });
      }

      const parsedResult = OutputParser.parseWhoisOutput(stdout);
      
      // Save result to storage
      const saveResult = await storage.saveScanResult('whois', target, parsedResult, 'recon');
      
      res.json({
        success: true,
        tool: 'whois',
        target: target,
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
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
    
    exec(command, { timeout: 15000 }, async (error, stdout, stderr) => {
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
    
    exec(command, { timeout: 15000 }, async (error, stdout, stderr) => {
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
    
    exec(command, { timeout: 20000 }, async (error, stdout, stderr) => {
      // Ping may return non-zero exit code for unreachable hosts, but still provide useful info
      const parsedResult = OutputParser.parseGenericOutput(stdout, 'ping');
      parsedResult.target = target;
      parsedResult.ping_count = count;
      parsedResult.success = !error || stdout.includes('bytes=') || stdout.includes('bytes from');
      
      // Save result to storage
      const saveResult = await storage.saveScanResult('ping', target, parsedResult, 'connectivity');
      
      res.json({
        success: true,
        tool: 'ping',
        target: target,
        result: parsedResult,
        scan_id: saveResult.scan_id,
        raw_output: stderr || null
      });
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
    
    exec(command, { timeout: 60000 }, async (error, stdout, stderr) => {
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
    });

  } catch (error) {
    console.error('Traceroute route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router; 
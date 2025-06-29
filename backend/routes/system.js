const express = require('express');
const router = express.Router();
const PlatformUtils = require('../utils/platform');

// System information endpoint
router.get('/info', (req, res) => {
  try {
    const systemInfo = PlatformUtils.getSystemInfo();
    
    res.json({
      success: true,
      system: systemInfo,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('System info error:', error);
    res.status(500).json({
      error: 'Failed to get system information',
      details: error.message
    });
  }
});

// Available tools check
router.get('/tools', (req, res) => {
  try {
    const systemInfo = PlatformUtils.getSystemInfo();
    
    res.json({
      success: true,
      platform: systemInfo.platform,
      availableCommands: systemInfo.availableCommands,
      recommendations: {
        whois: systemInfo.isWindows ? 'Use nslookup instead' : 'Native whois available',
        dns: systemInfo.isWindows ? 'Using nslookup' : 'Using dig',
        traceroute: systemInfo.isWindows ? 'Using tracert' : 'Using traceroute'
      }
    });
  } catch (error) {
    console.error('Tools check error:', error);
    res.status(500).json({
      error: 'Failed to check available tools',
      details: error.message
    });
  }
});

module.exports = router; 
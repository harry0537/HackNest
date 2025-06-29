const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const path = require('path');
const fs = require('fs-extra');

// Get scan history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const tool = req.query.tool || null;
    
    let history = await storage.getScanHistory(limit);
    
    // Filter by tool if specified
    if (tool) {
      history = history.filter(scan => scan.tool === tool);
    }
    
    res.json({
      success: true,
      total: history.length,
      scans: history
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve scan history',
      details: error.message
    });
  }
});

// Get specific scan result
router.get('/scan/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    
    const result = await storage.getScanResult(scanId);
    
    if (!result.success) {
      return res.status(404).json({
        error: 'Scan not found',
        details: result.error
      });
    }
    
    res.json({
      success: true,
      scan: result.data
    });
  } catch (error) {
    console.error('Get scan result error:', error);
    res.status(500).json({
      error: 'Failed to retrieve scan result',
      details: error.message
    });
  }
});

// Delete scan result
router.delete('/scan/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    
    const result = await storage.deleteScanResult(scanId);
    
    if (!result.success) {
      return res.status(404).json({
        error: 'Scan not found',
        details: result.error
      });
    }
    
    res.json({
      success: true,
      message: 'Scan result deleted successfully'
    });
  } catch (error) {
    console.error('Delete scan result error:', error);
    res.status(500).json({
      error: 'Failed to delete scan result',
      details: error.message
    });
  }
});

// Generate report from multiple scans
router.post('/generate', async (req, res) => {
  try {
    const { scan_ids, format = 'json', title = 'HackNest Security Report' } = req.body;
    
    if (!scan_ids || !Array.isArray(scan_ids) || scan_ids.length === 0) {
      return res.status(400).json({
        error: 'At least one scan ID is required'
      });
    }
    
    const validFormats = ['json', 'markdown', 'html'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        error: 'Invalid format',
        valid_formats: validFormats
      });
    }
    
    const result = await storage.generateReport(scan_ids, format);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to generate report',
        details: result.error
      });
    }
    
    res.json({
      success: true,
      report_id: result.report_id,
      file_name: result.file_name,
      download_url: `/api/reports/download/${result.file_name}`,
      format: format
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      details: error.message
    });
  }
});

// Download report file
router.get('/download/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    
    // Validate filename to prevent directory traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({
        error: 'Invalid filename'
      });
    }
    
    const filePath = path.join(__dirname, '../data/results/reports', fileName);
    
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({
        error: 'Report file not found'
      });
    }
    
    // Set appropriate content type based on file extension
    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.json')) {
      contentType = 'application/json';
    } else if (fileName.endsWith('.md')) {
      contentType = 'text/markdown';
    } else if (fileName.endsWith('.html')) {
      contentType = 'text/html';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({
      error: 'Failed to download report',
      details: error.message
    });
  }
});

// Get available reports
router.get('/list', async (req, res) => {
  try {
    const reports = await storage.getReports();
    
    res.json({
      success: true,
      total: reports.length,
      reports: reports
    });
  } catch (error) {
    console.error('List reports error:', error);
    res.status(500).json({
      error: 'Failed to list reports',
      details: error.message
    });
  }
});

// Get scan statistics
router.get('/stats', async (req, res) => {
  try {
    const history = await storage.getScanHistory(1000); // Get more records for stats
    
    const stats = {
      total_scans: history.length,
      tools_used: {},
      scan_types: {},
      recent_activity: {
        last_24_hours: 0,
        last_week: 0,
        last_month: 0
      }
    };
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    history.forEach(scan => {
      // Count tools
      stats.tools_used[scan.tool] = (stats.tools_used[scan.tool] || 0) + 1;
      
      // Count scan types
      stats.scan_types[scan.scan_type] = (stats.scan_types[scan.scan_type] || 0) + 1;
      
      // Count recent activity
      const scanDate = new Date(scan.timestamp);
      if (scanDate > oneDayAgo) {
        stats.recent_activity.last_24_hours++;
      }
      if (scanDate > oneWeekAgo) {
        stats.recent_activity.last_week++;
      }
      if (scanDate > oneMonthAgo) {
        stats.recent_activity.last_month++;
      }
    });
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      details: error.message
    });
  }
});

// Search scans
router.get('/search', async (req, res) => {
  try {
    const { query, tool, scan_type, limit = 50 } = req.query;
    
    let history = await storage.getScanHistory(parseInt(limit));
    
    // Filter by tool
    if (tool) {
      history = history.filter(scan => scan.tool === tool);
    }
    
    // Filter by scan type
    if (scan_type) {
      history = history.filter(scan => scan.scan_type === scan_type);
    }
    
    // Filter by query (search in target)
    if (query) {
      history = history.filter(scan => 
        scan.target.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    res.json({
      success: true,
      total: history.length,
      scans: history
    });
  } catch (error) {
    console.error('Search scans error:', error);
    res.status(500).json({
      error: 'Failed to search scans',
      details: error.message
    });
  }
});

// Export scan data in various formats
router.post('/export', async (req, res) => {
  try {
    const { scan_ids, format = 'csv' } = req.body;
    
    if (!scan_ids || !Array.isArray(scan_ids) || scan_ids.length === 0) {
      return res.status(400).json({
        error: 'At least one scan ID is required'
      });
    }
    
    const validFormats = ['csv', 'xml', 'json'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        error: 'Invalid format',
        valid_formats: validFormats
      });
    }
    
    // Collect scan data
    const scans = [];
    for (const scanId of scan_ids) {
      const result = await storage.getScanResult(scanId);
      if (result.success) {
        scans.push(result.data);
      }
    }
    
    let exportData;
    let contentType;
    let fileName;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (format === 'csv') {
      // Simple CSV export
      const csvRows = ['Tool,Target,Timestamp,Scan Type'];
      scans.forEach(scan => {
        csvRows.push(`"${scan.tool}","${scan.target}","${scan.timestamp}","${scan.scan_type}"`);
      });
      exportData = csvRows.join('\n');
      contentType = 'text/csv';
      fileName = `hacknest_export_${timestamp}.csv`;
    } else if (format === 'xml') {
      // Simple XML export
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<scans>\n';
      scans.forEach(scan => {
        xml += `  <scan>\n`;
        xml += `    <tool>${scan.tool}</tool>\n`;
        xml += `    <target>${scan.target}</target>\n`;
        xml += `    <timestamp>${scan.timestamp}</timestamp>\n`;
        xml += `    <scan_type>${scan.scan_type}</scan_type>\n`;
        xml += `  </scan>\n`;
      });
      xml += '</scans>';
      exportData = xml;
      contentType = 'application/xml';
      fileName = `hacknest_export_${timestamp}.xml`;
    } else {
      // JSON export
      exportData = JSON.stringify(scans, null, 2);
      contentType = 'application/json';
      fileName = `hacknest_export_${timestamp}.json`;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(exportData);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Failed to export data',
      details: error.message
    });
  }
});

module.exports = router; 
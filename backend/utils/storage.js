const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class Storage {
  constructor() {
    // In serverless environment, use /tmp directory
    this.dataDir = process.env.VERCEL ? '/tmp/hacknest-data' : path.join(__dirname, '../data');
    this.resultsDir = path.join(this.dataDir, 'results');
    this.ensureDirectories();
  }

  ensureDirectories() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (!fs.existsSync(this.resultsDir)) {
        fs.mkdirSync(this.resultsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating directories:', error);
      // Fallback to in-memory storage in serverless
      this.inMemoryStorage = new Map();
    }
  }

  async saveScanResult(tool, target, result, scanType) {
    const scanId = uuidv4();
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    
    const scanData = {
      id: scanId,
      tool: tool,
      target: target,
      scan_type: scanType,
      result: result,
      timestamp: timestamp,
      created_at: new Date().toISOString()
    };

    try {
      // Try to save to file system
      const filename = `${scanId}.json`;
      const filepath = path.join(this.resultsDir, filename);
      await fs.writeJson(filepath, scanData, { spaces: 2 });
      
      return {
        success: true,
        scan_id: scanId,
        filename: filename,
        storage_type: 'file'
      };
    } catch (error) {
      console.error('File storage error, using memory:', error);
      // Fallback to in-memory storage
      if (!this.inMemoryStorage) {
        this.inMemoryStorage = new Map();
      }
      this.inMemoryStorage.set(scanId, scanData);
      
      return {
        success: true,
        scan_id: scanId,
        storage_type: 'memory'
      };
    }
  }

  async getScanResult(scanId) {
    try {
      // Try file system first
      const filepath = path.join(this.resultsDir, `${scanId}.json`);
      if (fs.existsSync(filepath)) {
        return await fs.readJson(filepath);
      }
    } catch (error) {
      console.error('Error reading from file:', error);
    }

    // Check in-memory storage
    if (this.inMemoryStorage && this.inMemoryStorage.has(scanId)) {
      return this.inMemoryStorage.get(scanId);
    }

    return null;
  }

  async getRecentScans(limit = 50) {
    const scans = [];

    try {
      // Try to get from file system
      const files = await fs.readdir(this.resultsDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles.slice(0, limit)) {
        try {
          const data = await fs.readJson(path.join(this.resultsDir, file));
          scans.push(data);
        } catch (error) {
          console.error(`Error reading ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Error reading directory:', error);
    }

    // Add from in-memory storage
    if (this.inMemoryStorage) {
      const memoryScans = Array.from(this.inMemoryStorage.values());
      scans.push(...memoryScans);
    }

    // Sort by timestamp and limit
    return scans
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }

  async updateScanHistory(scanData) {
    try {
      const historyFile = path.join(this.resultsDir, 'scan_history.json');
      let history = [];

      if (await fs.pathExists(historyFile)) {
        history = await fs.readJson(historyFile);
      }

      // Add new scan to history
      history.unshift({
        id: scanData.id,
        tool: scanData.tool,
        target: scanData.target,
        scan_type: scanData.scan_type,
        timestamp: scanData.timestamp,
        file_name: scanData.metadata.file_name
      });

      // Keep only last 100 scans in history
      if (history.length > 100) {
        history = history.slice(0, 100);
      }

      await fs.writeJson(historyFile, history, { spaces: 2 });
    } catch (error) {
      console.error('Error updating scan history:', error);
    }
  }

  async getScanHistory(limit = 50) {
    try {
      const historyFile = path.join(this.resultsDir, 'scan_history.json');
      
      if (await fs.pathExists(historyFile)) {
        const history = await fs.readJson(historyFile);
        return history.slice(0, limit);
      }
      
      return [];
    } catch (error) {
      console.error('Error reading scan history:', error);
      return [];
    }
  }

  async deleteScanResult(scanId) {
    try {
      const scanFiles = await fs.readdir(path.join(this.resultsDir, 'scans'));
      const targetFile = scanFiles.find(file => file.includes(scanId));
      
      if (!targetFile) {
        return {
          success: false,
          error: 'Scan not found'
        };
      }

      const filePath = path.join(this.resultsDir, 'scans', targetFile);
      await fs.remove(filePath);

      // Remove from history
      await this.removeFromHistory(scanId);

      return {
        success: true,
        message: 'Scan result deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting scan result:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async removeFromHistory(scanId) {
    try {
      const historyFile = path.join(this.resultsDir, 'scan_history.json');
      
      if (await fs.pathExists(historyFile)) {
        let history = await fs.readJson(historyFile);
        history = history.filter(scan => scan.id !== scanId);
        await fs.writeJson(historyFile, history, { spaces: 2 });
      }
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  }

  async generateReport(scanIds, format = 'json') {
    try {
      const reportId = uuidv4();
      const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
      const reportData = {
        id: reportId,
        generated_at: moment().toISOString(),
        format: format,
        scans: []
      };

      // Collect scan data
      for (const scanId of scanIds) {
        const scanResult = await this.getScanResult(scanId);
        if (scanResult.success) {
          reportData.scans.push(scanResult.data);
        }
      }

      let reportContent;
      let fileName;
      let contentType;

      if (format === 'markdown') {
        reportContent = this.generateMarkdownReport(reportData);
        fileName = `HackNest_Report_${timestamp}.md`;
        contentType = 'text/markdown';
      } else if (format === 'html') {
        reportContent = this.generateHtmlReport(reportData);
        fileName = `HackNest_Report_${timestamp}.html`;
        contentType = 'text/html';
      } else {
        reportContent = JSON.stringify(reportData, null, 2);
        fileName = `HackNest_Report_${timestamp}.json`;
        contentType = 'application/json';
      }

      const reportPath = path.join(this.resultsDir, 'reports', fileName);
      await fs.writeFile(reportPath, reportContent);

      return {
        success: true,
        report_id: reportId,
        file_name: fileName,
        file_path: reportPath,
        content_type: contentType
      };
    } catch (error) {
      console.error('Error generating report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateMarkdownReport(reportData) {
    let markdown = `# HackNest Security Assessment Report\n\n`;
    markdown += `**Generated:** ${moment(reportData.generated_at).format('YYYY-MM-DD HH:mm:ss')}\n`;
    markdown += `**Report ID:** ${reportData.id}\n\n`;

    reportData.scans.forEach((scan, index) => {
      markdown += `## Scan ${index + 1}: ${scan.tool.toUpperCase()}\n\n`;
      markdown += `- **Target:** ${scan.target}\n`;
      markdown += `- **Timestamp:** ${moment(scan.timestamp).format('YYYY-MM-DD HH:mm:ss')}\n\n`;

      if (scan.result.hosts && scan.result.hosts.length > 0) {
        markdown += `### Discovered Hosts\n\n`;
        scan.result.hosts.forEach(host => {
          markdown += `#### ${host.hostname}\n`;
          markdown += `- **Status:** ${host.status}\n`;
          if (host.ports && host.ports.length > 0) {
            markdown += `- **Open Ports:**\n`;
            host.ports.forEach(port => {
              markdown += `  - ${port.port} (${port.service}) - ${port.state}\n`;
            });
          }
          markdown += `\n`;
        });
      }

      markdown += `---\n\n`;
    });

    return markdown;
  }

  generateHtmlReport(reportData) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>HackNest Security Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #2c3e50; }
        .scan-section { border: 1px solid #ddd; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>HackNest Security Report</h1>
        <p>Generated: ${moment(reportData.generated_at).format('YYYY-MM-DD HH:mm:ss')}</p>
        ${reportData.scans.map((scan, index) => `
            <div class="scan-section">
                <h2>Scan ${index + 1}: ${scan.tool.toUpperCase()}</h2>
                <p><strong>Target:</strong> ${scan.target}</p>
                <p><strong>Timestamp:</strong> ${moment(scan.timestamp).format('YYYY-MM-DD HH:mm:ss')}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  async getReports() {
    try {
      const reportsDir = path.join(this.resultsDir, 'reports');
      const files = await fs.readdir(reportsDir);
      
      const reports = await Promise.all(files.map(async (file) => {
        const filePath = path.join(reportsDir, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      }));

      return reports.sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (error) {
      console.error('Error getting reports:', error);
      return [];
    }
  }
}

// Create singleton instance
const storage = new Storage();

module.exports = storage; 
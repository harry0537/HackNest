const moment = require('moment');

class OutputParser {
  static parseNmapOutput(rawOutput) {
    try {
      const lines = rawOutput.split('\n').filter(line => line.trim() !== '');
      const result = {
        scan_info: {},
        hosts: [],
        scan_stats: {},
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
      };

      let currentHost = null;
      let inPortSection = false;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Parse scan info
        if (trimmedLine.includes('Nmap scan report for')) {
          if (currentHost) {
            result.hosts.push(currentHost);
          }
          const hostMatch = trimmedLine.match(/Nmap scan report for (.+)/);
          currentHost = {
            hostname: hostMatch ? hostMatch[1] : 'Unknown',
            ip: '',
            status: 'unknown',
            ports: [],
            services: []
          };
          inPortSection = false;
        }

        // Parse host status
        if (trimmedLine.includes('Host is') && currentHost) {
          const statusMatch = trimmedLine.match(/Host is (.+)/);
          currentHost.status = statusMatch ? statusMatch[1] : 'unknown';
        }

        // Parse ports header
        if (trimmedLine.includes('PORT') && trimmedLine.includes('STATE') && trimmedLine.includes('SERVICE')) {
          inPortSection = true;
          continue;
        }

        // Parse port information
        if (inPortSection && currentHost && trimmedLine.match(/^\d+/)) {
          const portParts = trimmedLine.split(/\s+/);
          if (portParts.length >= 3) {
            const port = {
              port: portParts[0],
              state: portParts[1],
              service: portParts[2] || 'unknown',
              version: portParts.slice(3).join(' ') || ''
            };
            currentHost.ports.push(port);
          }
        }

        // Parse scan statistics
        if (trimmedLine.includes('Nmap done:')) {
          const statsMatch = trimmedLine.match(/(\d+) IP address.*scanned in (.+)/);
          if (statsMatch) {
            result.scan_stats = {
              total_hosts: statsMatch[1],
              scan_time: statsMatch[2]
            };
          }
        }
      }

      // Add the last host
      if (currentHost) {
        result.hosts.push(currentHost);
      }

      return result;
    } catch (error) {
      return {
        error: 'Failed to parse nmap output',
        raw_output: rawOutput,
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
      };
    }
  }

  static parseWhoisOutput(rawOutput) {
    try {
      const lines = rawOutput.split('\n').filter(line => line.trim() !== '');
      const result = {
        domain_info: {},
        registrar_info: {},
        dates: {},
        name_servers: [],
        raw_output: rawOutput,
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
      };

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.includes(':')) {
          const [key, ...valueParts] = trimmedLine.split(':');
          const value = valueParts.join(':').trim();
          
          const lowerKey = key.toLowerCase().trim();
          
          // Domain information
          if (lowerKey.includes('domain name') || lowerKey === 'domain') {
            result.domain_info.name = value;
          } else if (lowerKey.includes('registrant')) {
            result.domain_info.registrant = value;
          } else if (lowerKey.includes('admin')) {
            result.domain_info.admin_contact = value;
          }
          
          // Registrar information
          else if (lowerKey.includes('registrar')) {
            result.registrar_info.name = value;
          } else if (lowerKey.includes('registrar url') || lowerKey.includes('registrar website')) {
            result.registrar_info.url = value;
          }
          
          // Important dates
          else if (lowerKey.includes('creation date') || lowerKey.includes('created')) {
            result.dates.created = value;
          } else if (lowerKey.includes('expir')) {
            result.dates.expires = value;
          } else if (lowerKey.includes('updated')) {
            result.dates.updated = value;
          }
          
          // Name servers
          else if (lowerKey.includes('name server') || lowerKey.includes('nserver')) {
            result.name_servers.push(value);
          }
        }
      }

      return result;
    } catch (error) {
      return {
        error: 'Failed to parse whois output',
        raw_output: rawOutput,
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
      };
    }
  }

  static parseNiktoOutput(rawOutput) {
    try {
      const lines = rawOutput.split('\n').filter(line => line.trim() !== '');
      const result = {
        target: '',
        vulnerabilities: [],
        scan_info: {},
        summary: {},
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
      };

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Parse target
        if (trimmedLine.includes('Target IP:') || trimmedLine.includes('Target Port:')) {
          const targetMatch = trimmedLine.match(/Target.*:\s*(.+)/);
          if (targetMatch) {
            result.target = targetMatch[1];
          }
        }

        // Parse vulnerabilities (typically start with + or -)
        if (trimmedLine.startsWith('+') || trimmedLine.startsWith('-')) {
          const vulnerability = {
            severity: trimmedLine.startsWith('+') ? 'medium' : 'info',
            description: trimmedLine.substring(1).trim(),
            line: trimmedLine
          };
          result.vulnerabilities.push(vulnerability);
        }

        // Parse scan completion info
        if (trimmedLine.includes('items checked') || trimmedLine.includes('Total time')) {
          result.scan_info.details = trimmedLine;
        }
      }

      result.summary = {
        total_issues: result.vulnerabilities.length,
        high_severity: result.vulnerabilities.filter(v => v.severity === 'high').length,
        medium_severity: result.vulnerabilities.filter(v => v.severity === 'medium').length,
        low_severity: result.vulnerabilities.filter(v => v.severity === 'info').length
      };

      return result;
    } catch (error) {
      return {
        error: 'Failed to parse nikto output',
        raw_output: rawOutput,
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
      };
    }
  }

  static parseSqlmapOutput(rawOutput) {
    try {
      const lines = rawOutput.split('\n').filter(line => line.trim() !== '');
      const result = {
        target: '',
        vulnerabilities: [],
        databases: [],
        tables: [],
        injection_points: [],
        scan_info: {},
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
      };

      let inVulnSection = false;
      let inDbSection = false;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Parse target URL
        if (trimmedLine.includes('testing URL')) {
          const urlMatch = trimmedLine.match(/testing URL ['"](.+?)['"]/);
          if (urlMatch) {
            result.target = urlMatch[1];
          }
        }

        // Parse injection points
        if (trimmedLine.includes('Parameter:') && trimmedLine.includes('is vulnerable')) {
          const paramMatch = trimmedLine.match(/Parameter:\s*(.+?)\s/);
          if (paramMatch) {
            result.injection_points.push({
              parameter: paramMatch[1],
              vulnerability_type: 'SQL Injection',
              description: trimmedLine
            });
          }
        }

        // Parse database names
        if (trimmedLine.includes('available databases')) {
          inDbSection = true;
        } else if (inDbSection && trimmedLine.match(/^\[\d+\]/)) {
          const dbMatch = trimmedLine.match(/\[\d+\]\s*(.+)/);
          if (dbMatch) {
            result.databases.push(dbMatch[1].trim());
          }
        }

        // Parse vulnerabilities
        if (trimmedLine.includes('sqlmap identified') || trimmedLine.includes('vulnerable')) {
          result.vulnerabilities.push({
            type: 'SQL Injection',
            severity: 'high',
            description: trimmedLine
          });
        }
      }

      return result;
    } catch (error) {
      return {
        error: 'Failed to parse sqlmap output',
        raw_output: rawOutput,
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
      };
    }
  }

  static parseGenericOutput(rawOutput, toolName) {
    return {
      tool: toolName,
      raw_output: rawOutput,
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      lines: rawOutput.split('\n').filter(line => line.trim() !== '')
    };
  }
}

module.exports = OutputParser; 
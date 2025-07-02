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

  // Parse Hydra password attack output
  static parseHydraOutput(output) {
    const result = {
      tool: 'hydra',
      successful_logins: [],
      failed_attempts: 0,
      total_attempts: 0,
      runtime: '',
      protocol: ''
    };

    if (!output) return result;

    // Extract successful logins
    const loginMatches = output.match(/\[.*\]\s+login:\s+(.*?)\s+password:\s+(.*)/g);
    if (loginMatches) {
      loginMatches.forEach(match => {
        const parts = match.match(/login:\s+(.*?)\s+password:\s+(.*)/);
        if (parts) {
          result.successful_logins.push({
            username: parts[1].trim(),
            password: parts[2].trim()
          });
        }
      });
    }

    // Extract attempt statistics
    const attemptsMatch = output.match(/(\d+) valid passwords found/);
    if (attemptsMatch) {
      result.total_attempts = parseInt(attemptsMatch[1]);
    }

    // Extract protocol
    const protocolMatch = output.match(/starting\s+(\w+)/i);
    if (protocolMatch) {
      result.protocol = protocolMatch[1];
    }

    result.success = result.successful_logins.length > 0;
    result.summary = `Found ${result.successful_logins.length} valid credentials`;

    return result;
  }

  // Parse John the Ripper output
  static parseJohnOutput(output) {
    const result = {
      tool: 'john',
      cracked_passwords: [],
      hash_types: [],
      session_time: '',
      total_hashes: 0
    };

    if (!output) return result;

    // Extract cracked passwords
    const crackedMatches = output.match(/([^:]+):([^:]+):\d+:\d+:::/g);
    if (crackedMatches) {
      crackedMatches.forEach(match => {
        const parts = match.split(':');
        if (parts.length >= 2) {
          result.cracked_passwords.push({
            username: parts[0],
            password: parts[1]
          });
        }
      });
    }

    // Extract session information
    const sessionMatch = output.match(/Session completed in (.+)/);
    if (sessionMatch) {
      result.session_time = sessionMatch[1];
    }

    result.success = result.cracked_passwords.length > 0;
    result.summary = `Cracked ${result.cracked_passwords.length} passwords`;

    return result;
  }

  // Parse Metasploit output
  static parseMetasploitOutput(output) {
    const result = {
      tool: 'metasploit',
      module_results: [],
      exploits_successful: 0,
      vulnerabilities_found: [],
      sessions_created: 0
    };

    if (!output) return result;

    // Extract vulnerability information
    const vulnMatches = output.match(/\[!\].*vulnerable/gi);
    if (vulnMatches) {
      vulnMatches.forEach(vuln => {
        result.vulnerabilities_found.push(vuln.replace(/\[!\]/, '').trim());
      });
    }

    // Extract session information
    const sessionMatches = output.match(/\[\*\].*session.*opened/gi);
    if (sessionMatches) {
      result.sessions_created = sessionMatches.length;
    }

    result.success = result.vulnerabilities_found.length > 0 || result.sessions_created > 0;
    result.summary = `Found ${result.vulnerabilities_found.length} vulnerabilities, ${result.sessions_created} sessions created`;

    return result;
  }

  // Parse Nuclei vulnerability scanner output
  static parseNucleiOutput(output) {
    const result = {
      tool: 'nuclei',
      vulnerabilities: [],
      total_checks: 0,
      severity_breakdown: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      }
    };

    if (!output) return result;

    // Parse JSON output if available
    try {
      const lines = output.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        if (line.startsWith('{')) {
          const vuln = JSON.parse(line);
          result.vulnerabilities.push({
            template: vuln.template || vuln['template-id'],
            severity: vuln.info?.severity || 'unknown',
            matched_at: vuln['matched-at'] || vuln.url,
            description: vuln.info?.description || ''
          });
          
          const severity = vuln.info?.severity?.toLowerCase() || 'unknown';
          if (result.severity_breakdown.hasOwnProperty(severity)) {
            result.severity_breakdown[severity]++;
          }
        }
      });
    } catch (parseError) {
      // Fallback to text parsing
      const vulnMatches = output.match(/\[.*?\]\s+.*?https?:\/\/.*$/gm);
      if (vulnMatches) {
        vulnMatches.forEach(match => {
          result.vulnerabilities.push({
            template: 'unknown',
            severity: 'unknown',
            matched_at: match,
            description: match
          });
        });
      }
    }

    result.total_checks = result.vulnerabilities.length;
    result.success = result.vulnerabilities.length > 0;
    result.summary = `Found ${result.vulnerabilities.length} vulnerabilities`;

    return result;
  }

  // Parse Amass subdomain enumeration output
  static parseAmassOutput(output) {
    const result = {
      tool: 'amass',
      subdomains: [],
      unique_subdomains: 0,
      ip_addresses: new Set()
    };

    if (!output) return result;

    const lines = output.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      // Extract subdomain and IP if present
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 1 && parts[0].includes('.')) {
        const subdomain = parts[0];
        const ip = parts.length > 1 ? parts[1] : '';
        
        result.subdomains.push({
          subdomain: subdomain,
          ip_address: ip
        });
        
        if (ip) {
          result.ip_addresses.add(ip);
        }
      }
    });

    result.unique_subdomains = result.subdomains.length;
    result.success = result.subdomains.length > 0;
    result.summary = `Found ${result.subdomains.length} subdomains`;

    return result;
  }

  // Parse Subfinder output
  static parseSubfinderOutput(output) {
    const result = {
      tool: 'subfinder',
      subdomains: [],
      total_found: 0
    };

    if (!output) return result;

    const lines = output.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      if (line.includes('.') && !line.startsWith('[')) {
        result.subdomains.push(line.trim());
      }
    });

    result.total_found = result.subdomains.length;
    result.success = result.subdomains.length > 0;
    result.summary = `Found ${result.subdomains.length} subdomains`;

    return result;
  }

  // Parse Assetfinder output
  static parseAssetfinderOutput(output) {
    const result = {
      tool: 'assetfinder',
      assets: [],
      total_found: 0
    };

    if (!output) return result;

    const lines = output.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      if (line.includes('.')) {
        result.assets.push(line.trim());
      }
    });

    result.total_found = result.assets.length;
    result.success = result.assets.length > 0;
    result.summary = `Found ${result.assets.length} assets`;

    return result;
  }

  // Parse TheHarvester output
  static parseTheHarvesterOutput(output) {
    const result = {
      tool: 'theharvester',
      emails: [],
      hosts: [],
      ips: [],
      people: []
    };

    if (!output) return result;

    const lines = output.split('\n');
    let currentSection = '';

    lines.forEach(line => {
      line = line.trim();
      
      if (line.includes('Users found:') || line.includes('Emails found:')) {
        currentSection = 'emails';
      } else if (line.includes('Hosts found:')) {
        currentSection = 'hosts';
      } else if (line.includes('IP Addresses found:')) {
        currentSection = 'ips';
      } else if (line.includes('People found:')) {
        currentSection = 'people';
      } else if (line && !line.startsWith('*') && !line.startsWith('-')) {
        switch (currentSection) {
          case 'emails':
            if (line.includes('@')) result.emails.push(line);
            break;
          case 'hosts':
            if (line.includes('.')) result.hosts.push(line);
            break;
          case 'ips':
            if (line.match(/\d+\.\d+\.\d+\.\d+/)) result.ips.push(line);
            break;
          case 'people':
            result.people.push(line);
            break;
        }
      }
    });

    result.success = result.emails.length > 0 || result.hosts.length > 0;
    result.summary = `Found ${result.emails.length} emails, ${result.hosts.length} hosts`;

    return result;
  }

  // Parse Masscan output
  static parseMasscanOutput(output) {
    const result = {
      tool: 'masscan',
      open_ports: [],
      total_ports: 0,
      scan_rate: '',
      hosts_up: 0
    };

    if (!output) return result;

    const lines = output.split('\n');
    lines.forEach(line => {
      // Parse discovered ports
      if (line.includes('Discovered open port')) {
        const portMatch = line.match(/port (\d+)\/(\w+) on ([0-9.]+)/);
        if (portMatch) {
          result.open_ports.push({
            port: portMatch[1],
            protocol: portMatch[2],
            host: portMatch[3]
          });
        }
      }
      
      // Parse scan rate
      if (line.includes('rate:')) {
        const rateMatch = line.match(/rate:\s*([0-9.]+)/);
        if (rateMatch) {
          result.scan_rate = rateMatch[1];
        }
      }
    });

    result.total_ports = result.open_ports.length;
    result.success = result.open_ports.length > 0;
    result.summary = `Found ${result.open_ports.length} open ports`;

    return result;
  }

  // Parse Nmap script output
  static parseNmapScriptOutput(output) {
    const result = {
      tool: 'nmap-scripts',
      script_results: [],
      vulnerabilities: [],
      services: []
    };

    if (!output) return result;

    const lines = output.split('\n');
    let currentScript = '';
    let scriptOutput = [];

    lines.forEach(line => {
      if (line.includes('|_') || line.includes('| ')) {
        const scriptMatch = line.match(/\|\s*([^:]+):/);
        if (scriptMatch) {
          if (currentScript && scriptOutput.length > 0) {
            result.script_results.push({
              script: currentScript,
              output: scriptOutput.join('\n')
            });
          }
          currentScript = scriptMatch[1].trim();
          scriptOutput = [];
        }
        scriptOutput.push(line);
      }
    });

    // Add final script
    if (currentScript && scriptOutput.length > 0) {
      result.script_results.push({
        script: currentScript,
        output: scriptOutput.join('\n')
      });
    }

    result.success = result.script_results.length > 0;
    result.summary = `Executed ${result.script_results.length} scripts`;

    return result;
  }

  // Parse Nmap vulners output
  static parseNmapVulnersOutput(output) {
    const result = {
      tool: 'nmap-vulners',
      vulnerabilities: [],
      cves: [],
      services: []
    };

    if (!output) return result;

    const lines = output.split('\n');
    lines.forEach(line => {
      // Extract CVEs
      const cveMatch = line.match(/(CVE-\d{4}-\d+)/g);
      if (cveMatch) {
        cveMatch.forEach(cve => {
          if (!result.cves.includes(cve)) {
            result.cves.push(cve);
          }
        });
      }

      // Extract vulnerability information
      if (line.includes('VULNERABLE') || line.includes('vulnerable')) {
        result.vulnerabilities.push(line.trim());
      }
    });

    result.success = result.vulnerabilities.length > 0 || result.cves.length > 0;
    result.summary = `Found ${result.cves.length} CVEs, ${result.vulnerabilities.length} vulnerabilities`;

    return result;
  }

  // Parse Gobuster output
  static parseGobusterOutput(output) {
    const result = {
      tool: 'gobuster',
      found_paths: [],
      status_codes: {},
      total_found: 0
    };

    if (!output) return result;

    const lines = output.split('\n');
    lines.forEach(line => {
      // Parse found paths
      const pathMatch = line.match(/^([^\s]+)\s+\(Status:\s*(\d+)\)/);
      if (pathMatch) {
        const path = pathMatch[1];
        const status = pathMatch[2];
        
        result.found_paths.push({
          path: path,
          status_code: status
        });

        if (!result.status_codes[status]) {
          result.status_codes[status] = 0;
        }
        result.status_codes[status]++;
      }
    });

    result.total_found = result.found_paths.length;
    result.success = result.found_paths.length > 0;
    result.summary = `Found ${result.found_paths.length} paths`;

    return result;
  }

  // Parse FFuF output
  static parseFFuFOutput(output) {
    const result = {
      tool: 'ffuf',
      results: [],
      total_requests: 0,
      filtered: 0
    };

    if (!output) return result;

    try {
      // Try to parse JSON output
      const jsonData = JSON.parse(output);
      if (jsonData.results) {
        result.results = jsonData.results.map(item => ({
          url: item.url,
          status: item.status,
          length: item.length,
          words: item.words,
          lines: item.lines
        }));
      }
      
      result.total_requests = jsonData.commandline?.split('-w').length || 0;
    } catch (parseError) {
      // Fallback to text parsing
      const lines = output.split('\n');
      lines.forEach(line => {
        if (line.includes('Status:') && line.includes('Size:')) {
          const match = line.match(/Status:\s*(\d+).*Size:\s*(\d+)/);
          if (match) {
            result.results.push({
              status: match[1],
              length: match[2],
              url: line
            });
          }
        }
      });
    }

    result.success = result.results.length > 0;
    result.summary = `Found ${result.results.length} valid responses`;

    return result;
  }

  // Parse Wapiti output
  static parseWapitiOutput(output) {
    const result = {
      tool: 'wapiti',
      vulnerabilities: [],
      anomalies: [],
      total_scanned: 0
    };

    if (!output) return result;

    try {
      // Try to parse JSON output
      const jsonData = JSON.parse(output);
      if (jsonData.vulnerabilities) {
        Object.keys(jsonData.vulnerabilities).forEach(vulnType => {
          jsonData.vulnerabilities[vulnType].forEach(vuln => {
            result.vulnerabilities.push({
              type: vulnType,
              method: vuln.method,
              path: vuln.path,
              parameter: vuln.parameter,
              info: vuln.info
            });
          });
        });
      }
    } catch (parseError) {
      // Fallback to text parsing
      const lines = output.split('\n');
      let currentVuln = '';
      
      lines.forEach(line => {
        if (line.includes('vulnerability') || line.includes('anomaly')) {
          result.vulnerabilities.push({
            type: 'unknown',
            description: line.trim()
          });
        }
      });
    }

    result.success = result.vulnerabilities.length > 0;
    result.summary = `Found ${result.vulnerabilities.length} vulnerabilities`;

    return result;
  }

  // Parse OWASP ZAP output
  static parseZAPOutput(output) {
    const result = {
      tool: 'zap-baseline',
      alerts: [],
      risk_breakdown: {
        high: 0,
        medium: 0,
        low: 0,
        informational: 0
      },
      total_alerts: 0
    };

    if (!output) return result;

    try {
      // Parse JSON output
      const jsonData = JSON.parse(output);
      if (jsonData.site && jsonData.site[0] && jsonData.site[0].alerts) {
        jsonData.site[0].alerts.forEach(alert => {
          result.alerts.push({
            name: alert.name,
            risk: alert.riskdesc?.split(' ')[0]?.toLowerCase() || 'unknown',
            confidence: alert.confidence,
            description: alert.desc,
            solution: alert.solution,
            instances: alert.instances?.length || 0
          });

          const risk = alert.riskdesc?.split(' ')[0]?.toLowerCase();
          if (result.risk_breakdown.hasOwnProperty(risk)) {
            result.risk_breakdown[risk]++;
          }
        });
      }
    } catch (parseError) {
      // Fallback to text parsing
      const lines = output.split('\n');
      lines.forEach(line => {
        if (line.includes('RISK-') || line.includes('WARN-')) {
          result.alerts.push({
            name: 'Unknown Alert',
            risk: 'unknown',
            description: line.trim()
          });
        }
      });
    }

    result.total_alerts = result.alerts.length;
    result.success = result.alerts.length > 0;
    result.summary = `Found ${result.alerts.length} security alerts`;

    return result;
  }
}

module.exports = OutputParser; 
/**
 * Platform-specific utilities for command execution
 */

class PlatformUtils {
  static isWindows() {
    return process.platform === 'win32';
  }

  static getWhoisCommand(target) {
    return this.isWindows() 
      ? `nslookup ${target}` 
      : `whois ${target}`;
  }

  static getPingCommand(target, count = 4) {
    return this.isWindows()
      ? `ping -n ${count} ${target}`
      : `ping -c ${count} ${target}`;
  }

  static getTracerouteCommand(target, maxHops = 30) {
    return this.isWindows()
      ? `tracert -h ${maxHops} ${target}`
      : `traceroute -m ${maxHops} ${target}`;
  }

  static getDNSCommand(target, recordType = 'A') {
    return this.isWindows()
      ? `nslookup -type=${recordType} ${target}`
      : `dig ${target} ${recordType}`;
  }

  static getNmapCommand(target, options = {}) {
    const { ports = '1-1000', scanType = 'syn', timing = 'T4' } = options;
    
    // Basic nmap command that should work on most systems
    let cmd = `nmap -${timing}`;
    
    if (scanType === 'syn') {
      cmd += ' -sS';
    } else if (scanType === 'tcp') {
      cmd += ' -sT';
    }
    
    if (ports) {
      cmd += ` -p ${ports}`;
    }
    
    cmd += ` ${target}`;
    return cmd;
  }

  static validateTarget(target, type = 'domain') {
    if (!target || typeof target !== 'string') {
      return { valid: false, error: 'Target is required and must be a string' };
    }

    if (type === 'domain') {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
      if (!domainRegex.test(target)) {
        return { valid: false, error: 'Invalid domain format' };
      }
    } else if (type === 'ip') {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(target)) {
        return { valid: false, error: 'Invalid IP address format' };
      }
    } else if (type === 'hostname') {
      const hostnameRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
      if (!hostnameRegex.test(target)) {
        return { valid: false, error: 'Invalid hostname format' };
      }
    }

    return { valid: true };
  }

  static getSystemInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      isWindows: this.isWindows(),
      availableCommands: {
        whois: !this.isWindows(),
        nslookup: true,
        ping: true,
        traceroute: !this.isWindows(),
        tracert: this.isWindows(),
        dig: !this.isWindows(),
        nmap: true // Assuming nmap is installed
      }
    };
  }
}

module.exports = PlatformUtils; 
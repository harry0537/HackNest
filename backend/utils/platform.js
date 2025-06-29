/**
 * Platform-specific utilities for command execution
 */

class PlatformUtils {
  static isWindows() {
    return process.platform === 'win32';
  }

  static getWhoisCommand(target) {
    // Always use nslookup in serverless/Vercel environment for better compatibility
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return `nslookup ${target}`;
    }
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
    // Always use nslookup in serverless environment for better compatibility
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return `nslookup -type=${recordType} ${target}`;
    }
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
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      isWindows: this.isWindows(),
      isServerless: isServerless,
      environment: process.env.VERCEL ? 'Vercel' : process.env.AWS_LAMBDA_FUNCTION_NAME ? 'AWS Lambda' : 'Standard',
      availableCommands: {
        whois: !this.isWindows() && !isServerless,
        nslookup: true,
        ping: true,
        traceroute: !this.isWindows() && !isServerless,
        tracert: this.isWindows(),
        dig: !this.isWindows() && !isServerless,
        nmap: false // Not available in serverless
      }
    };
  }
}

module.exports = PlatformUtils; 
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

  // Windows-specific network commands
  static getNetstatCommand(options = {}) {
    if (!this.isWindows()) return null;
    
    const { showAll = true, showPID = true, showNumeric = true } = options;
    let cmd = 'netstat';
    
    if (showAll) cmd += ' -a';
    if (showPID) cmd += ' -o';
    if (showNumeric) cmd += ' -n';
    
    return cmd;
  }

  static getIPConfigCommand(detailed = false) {
    if (!this.isWindows()) return null;
    return detailed ? 'ipconfig /all' : 'ipconfig';
  }

  static getArpCommand(target = null) {
    if (!this.isWindows()) return 'arp -a';
    return target ? `arp -a ${target}` : 'arp -a';
  }

  static getRouteCommand() {
    return this.isWindows() ? 'route print' : 'route -n';
  }

  // Windows PowerShell security commands
  static getPowerShellCommand(script) {
    if (!this.isWindows()) return null;
    return `powershell -ExecutionPolicy Bypass -Command "${script}"`;
  }

  static getWindowsFirewallCommand() {
    if (!this.isWindows()) return null;
    return this.getPowerShellCommand('Get-NetFirewallRule | Where-Object {$_.Enabled -eq \'True\'} | Select-Object DisplayName,Direction,Action,Profile');
  }

  static getWindowsServicesCommand() {
    if (!this.isWindows()) return null;
    return this.getPowerShellCommand('Get-Service | Where-Object {$_.Status -eq \'Running\'} | Select-Object Name,Status,StartType');
  }

  static getWindowsProcessesCommand() {
    if (!this.isWindows()) return null;
    return this.getPowerShellCommand('Get-Process | Select-Object ProcessName,Id,CPU,WorkingSet | Sort-Object CPU -Descending');
  }

  static getWindowsHotfixCommand() {
    if (!this.isWindows()) return null;
    return this.getPowerShellCommand('Get-HotFix | Select-Object HotFixID,Description,InstalledOn | Sort-Object InstalledOn -Descending');
  }

  static getWindowsSharesCommand() {
    if (!this.isWindows()) return null;
    return this.getPowerShellCommand('Get-SmbShare | Select-Object Name,Path,Description');
  }

  static getWindowsUserAccountsCommand() {
    if (!this.isWindows()) return null;
    return this.getPowerShellCommand('Get-LocalUser | Select-Object Name,Enabled,LastLogon,PasswordLastSet');
  }

  static getWindowsGroupsCommand() {
    if (!this.isWindows()) return null;
    return this.getPowerShellCommand('Get-LocalGroup | Select-Object Name,Description');
  }

  // Windows network security commands
  static getNetshCommand(subcommand) {
    if (!this.isWindows()) return null;
    return `netsh ${subcommand}`;
  }

  static getWindowsNetworkProfileCommand() {
    if (!this.isWindows()) return null;
    return this.getNetshCommand('wlan show profiles');
  }

  static getWindowsWiFiPasswordCommand(profileName) {
    if (!this.isWindows()) return null;
    return this.getNetshCommand(`wlan show profile \\"${profileName}\\" key=clear`);
  }

  static getWindowsOpenPortsCommand() {
    if (!this.isWindows()) return null;
    return this.getPowerShellCommand('Get-NetTCPConnection | Where-Object {$_.State -eq \'Listen\'} | Select-Object LocalAddress,LocalPort,OwningProcess');
  }

  // Windows system enumeration
  static getSystemInfoCommand() {
    return this.isWindows() ? 'systeminfo' : 'uname -a';
  }

  static getWindowsVersionCommand() {
    if (!this.isWindows()) return null;
    return this.getPowerShellCommand('Get-ComputerInfo | Select-Object WindowsProductName,WindowsVersion,TotalPhysicalMemory');
  }

  static getWindowsInstalledSoftwareCommand() {
    if (!this.isWindows()) return null;
    return this.getPowerShellCommand('Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName,DisplayVersion,Publisher,InstallDate');
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
        // Network Tools
        whois: !this.isWindows() && !isServerless,
        nslookup: true,
        ping: true,
        traceroute: !this.isWindows() && !isServerless,
        tracert: this.isWindows(),
        dig: !this.isWindows() && !isServerless,
        nmap: false, // Not available in serverless
        netstat: this.isWindows(),
        ipconfig: this.isWindows(),
        arp: true,
        route: true,
        
        // Windows-specific Tools
        powershell: this.isWindows() && !isServerless,
        systeminfo: this.isWindows() && !isServerless,
        netsh: this.isWindows() && !isServerless,
        
        // Windows Security Tools
        windowsFirewall: this.isWindows() && !isServerless,
        windowsServices: this.isWindows() && !isServerless,
        windowsProcesses: this.isWindows() && !isServerless,
        windowsHotfix: this.isWindows() && !isServerless,
        windowsShares: this.isWindows() && !isServerless,
        windowsUsers: this.isWindows() && !isServerless,
        windowsGroups: this.isWindows() && !isServerless,
        windowsNetworkProfile: this.isWindows() && !isServerless,
        windowsOpenPorts: this.isWindows() && !isServerless,
        windowsVersion: this.isWindows() && !isServerless,
        windowsInstalledSoftware: this.isWindows() && !isServerless
      }
    };
  }
}

module.exports = PlatformUtils; 
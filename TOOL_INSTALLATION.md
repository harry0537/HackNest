# 🛡️ HackNest Security Tools Installation Guide

This guide explains how to install all the penetration testing tools needed for HackNest to work at full capacity.

## 🚀 Quick Installation (Recommended)

### Option 1: Automated Installer (Windows)

Run the provided PowerShell installer as Administrator:

```powershell
# Download and run the installer
.\install-tools.ps1 -InstallEssential

# Or install everything
.\install-tools.ps1 -InstallAll
```

### Option 2: Manual Installation

Follow the manual installation steps below for your operating system.

## 📋 Required Tools Overview

### Essential Tools (Always Required)
- **Nmap** - Network port scanner
- **Python 3.x** - For Python-based tools
- **Node.js** - For JavaScript tools  
- **Go** - For Go-based tools
- **Curl** - HTTP client

### Reconnaissance Tools
- **Subfinder** - Subdomain discovery
- **Assetfinder** - Asset discovery
- **Nuclei** - Vulnerability scanner
- **TheHarvester** - Email & subdomain harvesting

### Web Application Tools
- **Gobuster** - Directory brute forcing
- **FFuF** - Web fuzzing
- **SQLMap** - SQL injection testing
- **Nikto** - Web server scanner

### Exploitation Tools
- **Metasploit** - Exploitation framework
- **Hydra** - Password brute forcing
- **John the Ripper** - Password cracking

## 🔧 Manual Installation by Platform

### Windows

#### 1. Install Package Managers

**Chocolatey (Recommended):**
```powershell
# Run as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### 2. Install Core Languages

```powershell
# Essential languages
choco install python nodejs golang -y

# Refresh environment
refreshenv
```

#### 3. Install Security Tools

**Via Chocolatey:**
```powershell
choco install nmap wireshark curl wget git -y
```

**Python Tools:**
```powershell
pip install sqlmap dirsearch theHarvester dnspython requests beautifulsoup4
```

**Go Tools:**
```powershell
go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest
go install github.com/OJ/gobuster/v3@latest
go install github.com/ffuf/ffuf@latest
go install github.com/tomnomnom/assetfinder@latest
```

### Linux (Ubuntu/Debian)

#### 1. Update Package Manager
```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. Install Core Tools
```bash
# Essential packages
sudo apt install -y python3 python3-pip nodejs npm golang-go curl wget git nmap

# Python tools
pip3 install sqlmap dirsearch theHarvester dnspython requests beautifulsoup4

# Additional tools
sudo apt install -y nikto hydra john masscan
```

#### 3. Install Go Tools
```bash
# Set up Go environment
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# Install Go security tools
go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest
go install github.com/OJ/gobuster/v3@latest
go install github.com/ffuf/ffuf@latest
go install github.com/tomnomnom/assetfinder@latest
```

### macOS

#### 1. Install Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. Install Core Tools
```bash
# Essential tools
brew install python3 node go nmap curl wget git

# Python tools
pip3 install sqlmap dirsearch theHarvester dnspython requests beautifulsoup4

# Additional tools
brew install nikto hydra john-jumbo masscan
```

#### 3. Install Go Tools
```bash
# Same as Linux Go tools installation
export PATH=$PATH:$HOME/go/bin

go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest
go install github.com/OJ/gobuster/v3@latest
go install github.com/ffuf/ffuf@latest
go install github.com/tomnomnom/assetfinder@latest
```

## 🎯 Specialized Tool Installation

### Metasploit Framework

**Windows:**
```powershell
# Download from official site
# https://windows.metasploit.com/metasploitframework-latest.msi
```

**Linux:**
```bash
curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall
chmod 755 msfinstall
./msfinstall
```

### Burp Suite (Optional)

Download from: https://portswigger.net/burp/communitydownload

### OWASP ZAP (Optional)

```bash
# All platforms
Download from: https://www.zaproxy.org/download/
```

## 📁 Portable Installation for HackNest

### Creating a Portable Tools Package

1. **Create Tools Directory:**
```powershell
# Windows
New-Item -Path "C:\HackNest\Tools" -ItemType Directory -Force

# Linux/macOS  
mkdir -p ~/HackNest/Tools
```

2. **Download Portable Versions:**

**Nmap Portable:**
- Download from: https://nmap.org/download.html
- Extract to: `C:\HackNest\Tools\nmap\`

**Python Portable:**
- Download from: https://www.python.org/downloads/windows/
- Use embeddable zip version
- Extract to: `C:\HackNest\Tools\python\`

**Node.js Portable:**
- Download from: https://nodejs.org/en/download/
- Use zip version
- Extract to: `C:\HackNest\Tools\nodejs\`

3. **Configure HackNest to Use Portable Tools:**

Edit `backend/utils/platform.js` to include portable tool paths:

```javascript
const PORTABLE_TOOLS_PATH = process.env.HACKNEST_TOOLS_PATH || 'C:\\HackNest\\Tools';

const getToolPath = (toolName) => {
  const portablePath = path.join(PORTABLE_TOOLS_PATH, toolName);
  if (fs.existsSync(portablePath)) {
    return portablePath;
  }
  return toolName; // Fallback to system PATH
};
```

## 🔍 Verification

### Test Tool Installation

Run this verification script:

```powershell
# Windows PowerShell
$tools = @("nmap", "python", "node", "go", "subfinder", "nuclei", "gobuster", "sqlmap")

foreach ($tool in $tools) {
    if (Get-Command $tool -ErrorAction SilentlyContinue) {
        Write-Host "✅ $tool is installed" -ForegroundColor Green
    } else {
        Write-Host "❌ $tool is missing" -ForegroundColor Red
    }
}
```

```bash
# Linux/macOS
tools=("nmap" "python3" "node" "go" "subfinder" "nuclei" "gobuster" "sqlmap")

for tool in "${tools[@]}"; do
    if command -v $tool &> /dev/null; then
        echo "✅ $tool is installed"
    else
        echo "❌ $tool is missing"
    fi
done
```

## 🚀 Advanced Setup: Docker Integration

### Create HackNest Docker Image

```dockerfile
# Dockerfile for HackNest with all tools
FROM kalilinux/kali-rolling

# Install essential tools
RUN apt-get update && apt-get install -y \
    nmap \
    python3 \
    python3-pip \
    nodejs \
    npm \
    golang-go \
    curl \
    wget \
    git \
    nikto \
    hydra \
    john \
    masscan \
    sqlmap

# Install Go tools
RUN go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest && \
    go install github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest && \
    go install github.com/OJ/gobuster/v3@latest && \
    go install github.com/ffuf/ffuf@latest

# Install Python tools
RUN pip3 install theHarvester dnspython requests beautifulsoup4

# Copy HackNest application
COPY . /app
WORKDIR /app

# Install dependencies
RUN cd backend && npm install
RUN cd frontend && npm install

EXPOSE 3000 3001

CMD ["npm", "run", "dev"]
```

## 🛠️ Troubleshooting

### Common Issues

**1. Tools not found in PATH:**
```powershell
# Windows: Add to system PATH
$env:PATH += ";C:\HackNest\Tools"
```

**2. Permission denied:**
```bash
# Linux/macOS: Fix permissions
chmod +x /path/to/tool
```

**3. Go tools not working:**
```bash
# Ensure GOPATH is set
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
```

**4. Python module errors:**
```bash
# Reinstall with user flag
pip3 install --user package_name
```

## 📖 Tool-Specific Configuration

### Nuclei Templates

```bash
# Update Nuclei templates
nuclei -update-templates
```

### SQLMap Configuration

```bash
# Create config directory
mkdir ~/.sqlmap
```

### Subfinder Configuration

```bash
# Add API keys for better results
echo 'shodan: ["your-api-key"]' > ~/.config/subfinder/config.yaml
```

## 🎯 Integration with HackNest

### Environment Variables

Set these environment variables for HackNest:

```bash
# Tool paths
export HACKNEST_TOOLS_PATH="/path/to/tools"
export NMAP_PATH="/usr/bin/nmap"
export PYTHON_PATH="/usr/bin/python3"

# API keys (optional)
export SHODAN_API_KEY="your-key"
export VIRUSTOTAL_API_KEY="your-key"
```

### HackNest Configuration

Edit `backend/config/tools.json`:

```json
{
  "toolPaths": {
    "nmap": "nmap",
    "python": "python3",
    "subfinder": "subfinder",
    "nuclei": "nuclei",
    "gobuster": "gobuster",
    "sqlmap": "sqlmap"
  },
  "fallbacks": {
    "subfinder": "Basic DNS enumeration",
    "nuclei": "Manual vulnerability checks",
    "gobuster": "Manual directory enumeration"
  },
  "portable": true,
  "portableBasePath": "C:\\HackNest\\Tools"
}
```

## 🔄 Keeping Tools Updated

### Update Script

```powershell
# Windows update script
Write-Host "Updating HackNest security tools..." -ForegroundColor Cyan

# Update Chocolatey packages
choco upgrade all -y

# Update Python packages
pip list --outdated --format=freeze | %{$_.split('==')[0]} | %{pip install --upgrade $_}

# Update Go tools
go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest
go install github.com/OJ/gobuster/v3@latest

# Update Nuclei templates
nuclei -update-templates

Write-Host "Tools updated successfully!" -ForegroundColor Green
```

---

## 📞 Support

If you encounter issues with tool installation:

1. Check the [HackNest Issues](https://github.com/your-repo/issues) page
2. Ensure you're running as Administrator (Windows) or with sudo (Linux/macOS)
3. Verify your internet connection for downloading tools
4. Check antivirus software isn't blocking security tools

**Remember:** Some antivirus software may flag penetration testing tools as malicious. You may need to add exceptions for your tools directory. 
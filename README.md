# HackNest - Comprehensive Penetration Testing Platform

## 🛡️ Overview

HackNest is a comprehensive, methodology-driven penetration testing platform that transforms individual security tools into a structured, wizard-based assessment framework. Built with React frontend and Node.js backend, it supports 4 industry-standard penetration testing methodologies with 26+ integrated security tools.

## ✨ Key Features

### 🎯 Framework-Based Testing
- **PTES (Penetration Testing Execution Standard)** - 5 phases
- **OWASP Testing Guide v4.2** - Web application focused
- **NIST SP 800-115** - Government standard methodology  
- **SANS Penetration Testing** - Industry best practices

### 🔧 Integrated Security Tools (26+)

**Reconnaissance & OSINT:**
- WHOIS, DNS enumeration, Amass, Subfinder, Assetfinder, TheHarvester

**Network Scanning:**  
- Nmap (multiple modes), Masscan, UDP scanning, Service detection

**Web Application Testing:**
- Nikto, Gobuster, FFuF, Wapiti, OWASP ZAP, HTTP security analysis

**Exploitation & Attacks:**
- SQLMap, XSS testing, Hydra, John the Ripper, Metasploit, Nuclei

**Windows Security Tools:**
- PowerShell-based enumeration, Services, Processes, Firewall analysis

### 🎭 Smart Fallback System
Every tool includes intelligent fallback methods when not installed:
- Basic implementations using native system commands
- Alternative discovery techniques
- Educational guidance for tool installation

### 📊 Professional Reporting
- Framework-compliant HTML reports
- Executive summaries with risk assessments
- Phase-by-phase execution details
- Vulnerability categorization and recommendations

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Git
- Windows PowerShell (for Windows-specific tools)

### Installation
```bash
git clone https://github.com/your-username/HackNest.git
cd HackNest
npm install
```

### Running HackNest

#### Option 1: Using PowerShell Script (Recommended for Windows)
```powershell
.\start-windows-powershell.ps1
```

#### Option 2: Using Batch Files
```cmd
# Development mode (separate terminals)
start-dev.bat

# Desktop application
start-desktop.bat
```

#### Option 3: Manual Setup
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend  
cd frontend
npm run dev

# Access: http://localhost:3000
```

#### Option 4: Desktop Application
```bash
npm run electron:dev
```

## 🛠️ Recent Major Updates & Bug Fixes

### ✅ Critical Syntax Fixes
- **Fixed 44+ async exec callback syntax errors** across all backend route files
- **Resolved PowerShell compatibility issues** with && operators  
- **Fixed React context re-rendering** issues in SimplePentestContext
- **Enhanced error handling** with proper try/catch blocks

### 🔧 Infrastructure Improvements
- **Comprehensive fallback system** for all 26+ tools
- **Enhanced Windows PowerShell integration** 
- **Improved batch file compatibility**
- **Professional startup scripts** with user choice menus

### 📈 Framework Enhancements  
- **Tool priority ordering** within each framework phase
- **Real-time activity monitoring** with execution feedback
- **Intelligent data handoff** between assessment phases
- **Enhanced progress tracking** and phase completion guidance

### 🎨 User Experience
- **Visual framework selection** with methodology cards
- **Step-by-step wizard interface** with clear guidance
- **Professional tool glossary** with installation guides
- **Toast notifications** with next action pointers

## 📋 Methodology Overview

### PTES Framework (5 Phases)
1. **Pre-Engagement** - Target definition and scope
2. **Intelligence Gathering** - OSINT and reconnaissance  
3. **Threat Modeling** - Network discovery and enumeration
4. **Exploitation** - Vulnerability testing and exploitation
5. **Post-Exploitation** - Advanced techniques and reporting

### OWASP Testing Guide v4.2 (5 Phases)  
1. **Information Gathering** - Target reconnaissance
2. **Fingerprinting** - Technology identification
3. **Configuration Testing** - Infrastructure assessment
4. **Vulnerability Testing** - Security weakness identification
5. **Report Generation** - OWASP-compliant documentation

### NIST SP 800-115 (5 Phases)
1. **Planning** - Assessment preparation
2. **Discovery** - Asset identification  
3. **Enumeration** - Service and application analysis
4. **Vulnerability Assessment** - Security evaluation
5. **Reporting** - NIST-compliant documentation

### SANS Methodology (5 Phases)
1. **Reconnaissance** - Information gathering
2. **Scanning & Enumeration** - Network and service discovery
3. **Vulnerability Identification** - Security weakness detection  
4. **Exploitation** - Attack execution
5. **Reporting** - Findings documentation

## 🔍 Tool Integration Details

### Network Scanning Tools
- **Nmap**: Quick scan, full scan, service detection, script scanning, vulnerability detection
- **Masscan**: High-speed port scanning (10M packets/sec capability)
- **UDP Scan**: Comprehensive UDP service discovery

### Web Application Testing
- **Nikto**: Web server vulnerability scanning
- **Gobuster**: High-performance directory/file enumeration  
- **FFuF**: Advanced web fuzzing for parameters/paths
- **Wapiti**: Comprehensive web vulnerability assessment
- **OWASP ZAP**: Security baseline scanning

### Exploitation Framework
- **SQLMap**: Advanced SQL injection testing
- **XSS Testing**: Cross-site scripting vulnerability assessment
- **Hydra**: Password brute force attacks (SSH, HTTP, FTP)
- **John the Ripper**: Password cracking (MD5, NTLM, etc.)
- **Metasploit**: Professional exploitation framework
- **Nuclei**: Template-based vulnerability scanning

## 📁 Project Structure

```
HackNest/
├── backend/                 # Node.js/Express API server
│   ├── routes/             # API endpoints for each tool category
│   ├── utils/              # Parser and platform utilities  
│   ├── data/               # Scan results and reports storage
│   └── server.js           # Main server file
├── frontend/               # React/Vite frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── context/        # React context for state management
│   │   └── utils/          # API and utility functions
│   └── dist/               # Built frontend files
├── electron/               # Desktop application wrapper
└── docs/                   # Documentation and guides
```

## 🔧 API Endpoints

### Reconnaissance
- `POST /api/recon/whois` - WHOIS information gathering
- `POST /api/recon/dns` - DNS enumeration  
- `POST /api/recon/amass` - Advanced subdomain enumeration
- `POST /api/recon/subfinder` - Passive subdomain discovery

### Network Scanning  
- `POST /api/scan/quick` - Fast port scanning
- `POST /api/scan/service` - Service version detection
- `POST /api/scan/masscan` - High-speed port scanning

### Web Application Testing
- `POST /api/web/nikto` - Web vulnerability scanning
- `POST /api/web/gobuster` - Directory enumeration
- `POST /api/web/headers` - HTTP security analysis

### Exploitation
- `POST /api/exploit/sqlmap` - SQL injection testing
- `POST /api/exploit/hydra` - Password attacks
- `POST /api/exploit/nuclei` - Vulnerability scanning

## 🛡️ Security Considerations

- **Educational Purpose**: HackNest is designed for authorized security testing only
- **Permission Required**: Always obtain explicit authorization before testing
- **Responsible Disclosure**: Follow responsible disclosure practices for found vulnerabilities
- **Legal Compliance**: Ensure compliance with local laws and regulations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Documentation**: Check the `/docs` folder for detailed guides
- **Community**: Join discussions in GitHub Discussions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

HackNest is intended for authorized security testing and educational purposes only. Users are responsible for ensuring they have proper authorization before conducting any security assessments. The developers are not responsible for any misuse of this tool.

---

**🎯 HackNest**: Transforming individual security tools into comprehensive, methodology-driven penetration testing platform. 
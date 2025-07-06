# HackNest Security Tools Installer
# Automatically installs all required penetration testing tools for HackNest
# Run as Administrator for best results

param(
    [switch]$InstallAll,
    [switch]$InstallEssential,
    [string]$ToolsPath = "C:\HackNest\Tools"
)

function Write-Status {
    param($Message, $Type = "Info")
    switch ($Type) {
        "Error" { Write-Host " $Message" -ForegroundColor Red }
        "Success" { Write-Host " $Message" -ForegroundColor Green }
        "Warning" { Write-Host " $Message" -ForegroundColor Yellow }
        default { Write-Host "ℹ $Message" -ForegroundColor Cyan }
    }
}

function Install-Chocolatey {
    Write-Status "Checking for Chocolatey package manager..."
    
    if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Status "Installing Chocolatey package manager..." "Info"
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        refreshenv
        Write-Status "Chocolatey installed successfully!" "Success"
    } else {
        Write-Status "Chocolatey already installed" "Success"
    }
}

function Install-EssentialTools {
    Write-Status "Installing essential penetration testing tools..." "Info"
    
    # Create tools directory
    if (!(Test-Path $ToolsPath)) {
        New-Item -Path $ToolsPath -ItemType Directory -Force | Out-Null
        Write-Status "Created tools directory: $ToolsPath" "Success"
    }
    
    # Essential tools via Chocolatey
    $tools = @("nmap", "python", "nodejs", "golang", "curl", "wget", "git")
    
    foreach ($tool in $tools) {
        try {
            Write-Status "Installing $tool..." "Info"
            choco install $tool -y --force
            Write-Status "$tool installed successfully!" "Success"
        } catch {
            Write-Status "Failed to install $tool" "Warning"
        }
    }
    
    # Refresh environment to pick up new tools
    refreshenv
    
    # Install Python security packages
    if (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Status "Installing Python security packages..." "Info"
        pip install requests beautifulsoup4 dnspython colorama sqlmap dirsearch --quiet
    }
    
    # Install Go security tools
    if (Get-Command go -ErrorAction SilentlyContinue) {
        Write-Status "Installing Go security tools..." "Info"
        go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
        go install github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest
        go install github.com/OJ/gobuster/v3@latest
        go install github.com/ffuf/ffuf@latest
    }
}

function Update-PathEnvironment {
    Write-Status "Updating system PATH..." "Info"
    
    # Add Go bin to PATH
    $goBin = "$env:USERPROFILE\go\bin"
    if (Test-Path $goBin) {
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($currentPath -notlike "*$goBin*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$goBin", "User")
            $env:PATH += ";$goBin"
            Write-Status "Added Go tools to PATH" "Success"
        }
    }
}

function Test-ToolInstallation {
    Write-Status "Testing tool installations..." "Info"
    
    $tools = @("nmap", "python", "node", "go", "subfinder", "nuclei", "gobuster")
    $successful = 0
    
    foreach ($tool in $tools) {
        if (Get-Command $tool -ErrorAction SilentlyContinue) {
            Write-Status "$tool is working" "Success"
            $successful++
        } else {
            Write-Status "$tool not found" "Warning"
        }
    }
    
    Write-Status "Tool installation: $successful/$($tools.Count) tools working" "Info"
}

# Main Installation
Write-Host @"
  HackNest Security Tools Installer
=====================================
Installing penetration testing tools for HackNest platform.

Installation Path: $ToolsPath
"@ -ForegroundColor Cyan

if ($InstallAll -or $InstallEssential) {
    Install-Chocolatey
    Install-EssentialTools
    Update-PathEnvironment
    Test-ToolInstallation
    
    Write-Status "Installation completed!" "Success"
    Write-Status "Restart your terminal to use the new tools." "Info"
} else {
    Write-Host @"
Usage:
    .\install-tools.ps1 -InstallEssential    # Install essential tools
    .\install-tools.ps1 -InstallAll          # Install all tools
    
Example: .\install-tools.ps1 -InstallEssential
"@ -ForegroundColor Yellow
}

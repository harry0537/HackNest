import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Radar, 
  Globe, 
  Shield,
  Monitor,
  Terminal,
  Zap,
  Database,
  Lock,
  Network,
  FileText,
  Settings,
  Play,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Wifi,
  Eye,
  Command,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const ToolsDashboard = () => {
  const [toolStatus, setToolStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkToolAvailability();
  }, []);

  const checkToolAvailability = async () => {
    try {
      const response = await fetch('/api/system/tools/status');
      const data = await response.json();
      
      if (data.success) {
        setToolStatus(data.tools);
      }
    } catch (error) {
      console.error('Failed to check tool status:', error);
      toast.error('Failed to load tool status');
    } finally {
      setLoading(false);
    }
  };

  const toolCategories = [
    {
      id: 'reconnaissance',
      name: 'Reconnaissance & Discovery',
      icon: Search,
      color: 'blue',
      description: 'Information gathering and target enumeration',
      tools: [
        {
          name: 'WHOIS Lookup',
          description: 'Domain registration and ownership information',
          path: '/recon',
          icon: Globe,
          systemTool: null,
          type: 'built-in'
        },
        {
          name: 'DNS Enumeration',
          description: 'DNS records and subdomain discovery',
          path: '/recon',
          icon: Network,
          systemTool: 'nslookup',
          type: 'built-in'
        },
        {
          name: 'Subfinder',
          description: 'Passive subdomain discovery tool',
          path: '/recon',
          icon: Search,
          systemTool: 'subfinder',
          type: 'external'
        },
        {
          name: 'Network Ping',
          description: 'Host connectivity testing',
          path: '/recon',
          icon: Activity,
          systemTool: 'ping',
          type: 'built-in'
        },
        {
          name: 'Traceroute',
          description: 'Network path discovery',
          path: '/recon',
          icon: Network,
          systemTool: 'traceroute',
          type: 'built-in'
        }
      ]
    },
    {
      id: 'scanning',
      name: 'Port Scanning & Service Detection',
      icon: Radar,
      color: 'purple',
      description: 'Network and service enumeration',
      tools: [
        {
          name: 'Nmap Quick Scan',
          description: 'Fast TCP port scanner',
          path: '/scan',
          icon: Radar,
          systemTool: 'nmap',
          type: 'external'
        },
        {
          name: 'Nmap Service Detection',
          description: 'Service version detection',
          path: '/scan',
          icon: Settings,
          systemTool: 'nmap',
          type: 'external'
        },
        {
          name: 'Nmap Script Scanning',
          description: 'NSE vulnerability scripts',
          path: '/scan',
          icon: Command,
          systemTool: 'nmap',
          type: 'external'
        },
        {
          name: 'Nuclei Scanner',
          description: 'Fast vulnerability scanner',
          path: '/scan',
          icon: Zap,
          systemTool: 'nuclei',
          type: 'external'
        }
      ]
    },
    {
      id: 'web',
      name: 'Web Application Testing',
      icon: Globe,
      color: 'green',
      description: 'Web vulnerability assessment tools',
      tools: [
        {
          name: 'Nikto Scanner',
          description: 'Web server vulnerability scanner',
          path: '/web',
          icon: Shield,
          systemTool: 'nikto',
          type: 'external'
        },
        {
          name: 'Directory Enumeration',
          description: 'Hidden directory discovery',
          path: '/web',
          icon: FileText,
          systemTool: 'gobuster',
          type: 'external'
        },
        {
          name: 'HTTP Headers Analysis',
          description: 'Security headers examination',
          path: '/web',
          icon: Eye,
          systemTool: 'curl',
          type: 'built-in'
        },
        {
          name: 'SSL Certificate Analysis',
          description: 'TLS/SSL configuration testing',
          path: '/web',
          icon: Lock,
          systemTool: 'curl',
          type: 'built-in'
        },
        {
          name: 'WhatWeb Fingerprinting',
          description: 'Web application fingerprinting',
          path: '/web',
          icon: Search,
          systemTool: 'whatweb',
          type: 'external'
        }
      ]
    },
    {
      id: 'exploitation',
      name: 'Exploitation & Vulnerability Testing',
      icon: Shield,
      color: 'red',
      description: 'Security testing and exploitation tools',
      tools: [
        {
          name: 'SQLMap',
          description: 'Automatic SQL injection testing',
          path: '/exploit',
          icon: Database,
          systemTool: 'sqlmap',
          type: 'external'
        },
        {
          name: 'XSS Testing',
          description: 'Cross-site scripting detection',
          path: '/exploit',
          icon: Shield,
          systemTool: null,
          type: 'built-in'
        },
        {
          name: 'Hydra',
          description: 'Network login brute forcer',
          path: '/exploit',
          icon: Lock,
          systemTool: 'hydra',
          type: 'external'
        },
        {
          name: 'John the Ripper',
          description: 'Password hash cracking',
          path: '/exploit',
          icon: Lock,
          systemTool: 'john',
          type: 'external'
        }
      ]
    },
    {
      id: 'windows',
      name: 'Windows Security Testing',
      icon: Monitor,
      color: 'yellow',
      description: 'Windows-specific security enumeration',
      tools: [
        {
          name: 'System Information',
          description: 'Windows system enumeration',
          path: '/windows',
          icon: Monitor,
          systemTool: 'systeminfo',
          type: 'built-in'
        },
        {
          name: 'Network Configuration',
          description: 'Network interface analysis',
          path: '/windows',
          icon: Network,
          systemTool: 'ipconfig',
          type: 'built-in'
        },
        {
          name: 'Active Services',
          description: 'Running services enumeration',
          path: '/windows',
          icon: Settings,
          systemTool: 'sc',
          type: 'built-in'
        },
        {
          name: 'User Accounts',
          description: 'User and group enumeration',
          path: '/windows',
          icon: Shield,
          systemTool: 'net',
          type: 'built-in'
        },
        {
          name: 'Wi-Fi Profiles',
          description: 'Wireless network profiles',
          path: '/windows',
          icon: Wifi,
          systemTool: 'netsh',
          type: 'built-in'
        }
      ]
    },
    {
      id: 'automation',
      name: 'Automation & Workflows',
      icon: Zap,
      color: 'orange',
      description: 'Automated testing and batch operations',
      tools: [
        {
          name: 'Automated Workflow',
          description: 'Multi-phase automated testing',
          path: '/automated',
          icon: Zap,
          systemTool: null,
          type: 'built-in'
        },
        {
          name: 'Pentest Wizard',
          description: 'Guided penetration testing',
          path: '/wizard',
          icon: Shield,
          systemTool: null,
          type: 'built-in'
        },
        {
          name: 'Workflow Dashboard',
          description: 'Test orchestration and management',
          path: '/workflow',
          icon: Settings,
          systemTool: null,
          type: 'built-in'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-blue-500/20 rounded-full">
              <Terminal className="h-16 w-16 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Security Tools Dashboard</h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Comprehensive collection of penetration testing and security assessment tools organized by category. 
            Click any tool to access its interface and start testing.
          </p>
        </div>

        {/* Tool Categories */}
        <div className="space-y-8">
          {toolCategories.map((category) => {
            const IconComponent = category.icon;
            
            return (
              <div key={category.id} className="rounded-lg border-2 border-gray-700 bg-gray-800/50 p-6">
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <IconComponent className="h-8 w-8 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                    <p className="text-gray-300">{category.description}</p>
                  </div>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.tools.map((tool, index) => {
                    const ToolIcon = tool.icon;
                    
                    return (
                      <Link
                        key={index}
                        to={tool.path}
                        className="group bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-700 rounded-lg group-hover:bg-gray-600 transition-colors">
                              <ToolIcon className="h-5 w-5 text-gray-300" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                                {tool.name}
                              </h3>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-4">
                          {tool.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                            {tool.type === 'built-in' ? 'Built-in' : 'External'}
                          </span>
                          
                          <div className="flex items-center gap-1 text-blue-400 group-hover:text-blue-300 transition-colors">
                            <span className="text-sm font-medium">Access</span>
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Need Help Getting Started?</h3>
              <p className="text-gray-400">Use our guided wizard for comprehensive testing workflows.</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/wizard"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Shield className="h-4 w-4" />
                Launch Pentest Wizard
              </Link>
              <Link
                to="/automated"
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Zap className="h-4 w-4" />
                Automated Testing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsDashboard;

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Radar, 
  Globe, 
  Shield,
  Monitor,
  Terminal,
  Zap,
  GitBranch,
  ArrowRight
} from 'lucide-react';

const AdvancedTools = () => {
  const toolCategories = [
    {
      name: 'Reconnaissance',
      icon: Search,
      path: '/recon',
      description: 'WHOIS, DNS, Network discovery',
      tools: ['WHOIS Lookup', 'DNS Enumeration', 'Subdomain Discovery', 'Network Mapping']
    },
    {
      name: 'Port Scanning',
      icon: Radar,
      path: '/scan',
      description: 'Nmap scanning and enumeration',
      tools: ['Quick Scan', 'Full TCP Scan', 'Service Detection', 'Script Scanning']
    },
    {
      name: 'Web Testing',
      icon: Globe,
      path: '/web',
      description: 'Web vulnerability assessment',
      tools: ['Nikto Scanner', 'Directory Enumeration', 'HTTP Headers', 'SSL Analysis']
    },
    {
      name: 'Exploitation',
      icon: Shield,
      path: '/exploit',
      description: 'SQLMap and exploit testing',
      tools: ['SQL Injection Testing', 'XSS Detection', 'Authentication Bypass', 'Database Enumeration']
    },
    {
      name: 'Windows Security',
      icon: Monitor,
      path: '/windows',
      description: 'Windows-specific security tools',
      tools: ['System Information', 'Network Config', 'Services Enum', 'User Accounts']
    },
    {
      name: 'Automated Workflow',
      icon: Zap,
      path: '/automated',
      description: 'Batch processing and automation',
      tools: ['Multi-target Scanning', 'Scheduled Tests', 'Bulk Operations', 'Chain Workflows']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-orange-500/20 rounded-full">
              <Terminal className="h-16 w-16 text-orange-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Advanced Tools</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Direct access to individual security testing modules for expert users who prefer manual control over automated workflows.
          </p>
        </div>

        {/* Recommendation Notice */}
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <GitBranch className="h-6 w-6 text-blue-400 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">👨‍💻 Expert Mode</h3>
              <p className="text-blue-100 mb-4">
                These tools provide granular control for experienced penetration testers. 
                For guided testing with integrated workflows, we recommend using the <strong>Pentest Wizard</strong>.
              </p>
              <Link 
                to="/wizard"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Shield className="h-4 w-4" />
                Use Guided Wizard Instead
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Tool Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolCategories.map((category, index) => (
            <Link
              key={index}
              to={category.path}
              className="group bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-orange-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/10"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                  <category.icon className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white group-hover:text-orange-300 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-400">{category.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-300 mb-3">Available Tools:</p>
                <div className="grid grid-cols-1 gap-1">
                  {category.tools.map((tool, toolIndex) => (
                    <div key={toolIndex} className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-1 h-1 rounded-full bg-orange-400"></div>
                      <span>{tool}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-orange-400 group-hover:text-orange-300 transition-colors">
                <span className="text-sm font-medium">Access Tools</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Warning Footer */}
        <div className="mt-12 p-6 bg-red-900/20 border border-red-600/30 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-300 mb-3">⚠️ Security Testing Disclaimer</h3>
            <p className="text-red-100">
              These are professional penetration testing tools. Only use them on systems you own or have explicit 
              written permission to test. Unauthorized security testing is illegal and may result in criminal charges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTools; 
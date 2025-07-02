import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Zap,
  Wrench,
  FileText,
  Shield
} from 'lucide-react'

function Sidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { 
      path: '/', 
      icon: Home, 
      label: 'Dashboard',
      description: 'System overview and quick start'
    },
    { 
      path: '/wizard', 
      icon: Zap, 
      label: 'Pentest Wizard',
      description: 'Guided penetration testing'
    },
    { 
      path: '/advanced', 
      icon: Wrench, 
      label: 'Advanced Tools',
      description: 'Individual security modules'
    },
    { 
      path: '/reports', 
      icon: FileText, 
      label: 'Reports',
      description: 'Scan history and exports'
    }
  ];

  return (
    <div style={{
      width: '280px',
      backgroundColor: '#111827',
      borderRight: '1px solid #374151',
      height: '100vh',
      position: 'sticky',
      top: 0,
      left: 0
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid #374151'
      }}>
        <div className="flex items-center gap-3">
          <div style={{
            backgroundColor: '#dc2626',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 style={{
              color: '#ffffff',
              fontSize: '20px',
              fontWeight: '700',
              margin: '0',
              lineHeight: '1.2'
            }}>
              HackNest
            </h1>
            <p style={{
              color: '#9ca3af',
              fontSize: '12px',
              margin: '0',
              fontWeight: '500'
            }}>
              Security Toolkit
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '16px 0' }}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                margin: '2px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                backgroundColor: active ? '#1f2937' : 'transparent',
                border: active ? '1px solid #374151' : '1px solid transparent',
                transition: 'all 0.2s ease-in-out',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                  e.currentTarget.style.borderColor = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute',
                  left: '-1px',
                  top: '0',
                  bottom: '0',
                  width: '3px',
                  backgroundColor: '#dc2626',
                  borderRadius: '0 2px 2px 0'
                }} />
              )}
              
              <IconComponent 
                className="h-5 w-5" 
                style={{ 
                  color: active ? '#dc2626' : '#9ca3af',
                  transition: 'color 0.2s ease-in-out'
                }} 
              />
              
              <div>
                <div style={{
                  color: active ? '#ffffff' : '#d1d5db',
                  fontSize: '14px',
                  fontWeight: '600',
                  lineHeight: '1.2'
                }}>
                  {item.label}
                </div>
                <div style={{
                  color: '#6b7280',
                  fontSize: '11px',
                  fontWeight: '500',
                  marginTop: '2px'
                }}>
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        padding: '16px 20px',
        borderTop: '1px solid #374151',
        backgroundColor: '#0f172a'
      }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              System Status
            </div>
            <div style={{
              color: '#10b981',
              fontSize: '11px',
              fontWeight: '500'
            }}>
              ● Online & Ready
            </div>
          </div>
          <div style={{
            backgroundColor: '#059669',
            width: '8px',
            height: '8px',
            borderRadius: '50%'
          }} />
        </div>
      </div>
    </div>
  )
}

export default Sidebar 
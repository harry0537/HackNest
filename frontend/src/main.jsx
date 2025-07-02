import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

// Use HashRouter for Electron file:// protocol compatibility
const rootElement = document.getElementById('root');

if (rootElement) {
  console.log('HackNest: Starting React app...');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HashRouter>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #475569'
            },
            success: {
              iconTheme: {
                primary: '#56d364',
                secondary: '#1e293b'
              }
            },
            error: {
              iconTheme: {
                primary: '#f85149',
                secondary: '#1e293b'
              }
            }
          }}
        />
      </HashRouter>
    </React.StrictMode>,
  );
  console.log('HackNest: React app initialized');
} else {
  console.error('HackNest: Root element not found!');
  document.body.innerHTML = '<div style="color: white; padding: 20px; font-family: Arial;">Error: Could not find root element. Please refresh the page.</div>';
} 
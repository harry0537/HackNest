const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('windowAPI', {
  // Platform information
  isElectron: true,
  platform: process.platform,
  
  // Platform detection helper
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // File dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Menu events (listen only)
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-scan', callback);
    ipcRenderer.on('menu-export-report', callback);
    ipcRenderer.on('menu-navigate', callback);
  },
  
  // Remove all listeners for menu actions
  removeAllMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu-new-scan');
    ipcRenderer.removeAllListeners('menu-export-report');
    ipcRenderer.removeAllListeners('menu-navigate');
  }
});

// Console logging for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('HackNest Electron preload script loaded');
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
} 
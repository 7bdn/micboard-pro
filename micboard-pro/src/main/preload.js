const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  quit: () => ipcRenderer.send('window-quit'),

  // File dialogs
  openAudioFiles: () => ipcRenderer.invoke('open-audio-files'),
  openAudioFolder: () => ipcRenderer.invoke('open-audio-folder'),
  readAudioFile: (filePath) => ipcRenderer.invoke('read-audio-file', filePath),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),

  // Settings store
  storeGet: (key, def) => ipcRenderer.invoke('store-get', key, def),
  storeSet: (key, val) => ipcRenderer.invoke('store-set', key, val),
  storeDelete: (key) => ipcRenderer.invoke('store-delete', key),
  getAllSettings: () => ipcRenderer.invoke('get-all-settings'),

  // Export/Import
  exportSettings: () => ipcRenderer.invoke('export-settings'),
  importSettings: () => ipcRenderer.invoke('import-settings'),

  // Hotkeys
  registerHotkey: (data) => ipcRenderer.invoke('register-hotkey', data),
  unregisterHotkey: (acc) => ipcRenderer.invoke('unregister-hotkey', acc),
  unregisterAllHotkeys: () => ipcRenderer.invoke('unregister-all-hotkeys'),

  // Events from main
  onHotkeyTriggered: (cb) => ipcRenderer.on('hotkey-triggered', (_, id) => cb(id)),
  onStopAll: (cb) => ipcRenderer.on('stop-all', () => cb()),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // App info
  getVersion: () => ipcRenderer.invoke('get-app-version'),

  // Platform
  platform: process.platform
});

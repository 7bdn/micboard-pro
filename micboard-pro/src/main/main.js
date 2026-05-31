const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

const store = new Store();
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let tray;
let audioEngine;
let dbManager;

// ─── Window Creation ───────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    },
    show: false
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.on('minimize', () => {
    if (store.get('minimizeToTray', true)) {
      mainWindow.hide();
    }
  });
}

// ─── System Tray ───────────────────────────────────────────────────────────────
function createTray() {
  const trayIconPath = path.join(__dirname, '../../assets/tray.png');
  const fallbackPath = path.join(__dirname, '../../assets/icon.ico');
  const iconPath = fs.existsSync(trayIconPath) ? trayIconPath : fallbackPath;

  try {
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'MicBoard Pro', enabled: false },
      { type: 'separator' },
      { label: 'Show', click: () => { mainWindow?.show(); } },
      { label: 'Stop All Sounds', click: () => { mainWindow?.webContents.send('stop-all'); } },
      { type: 'separator' },
      { label: 'Quit', click: () => { app.quit(); } }
    ]);
    tray.setToolTip('MicBoard Pro');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => { mainWindow?.show(); });
  } catch (e) {
    console.log('Tray creation skipped:', e.message);
  }
}

// ─── IPC Handlers ──────────────────────────────────────────────────────────────

// Window controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.hide());
ipcMain.on('window-quit', () => app.quit());

// File dialogs
ipcMain.handle('open-audio-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Add Sound Files',
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections']
  });
  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle('open-audio-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Sound Folder',
    properties: ['openDirectory']
  });
  if (result.canceled) return [];
  const folder = result.filePaths[0];
  const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];
  try {
    const files = fs.readdirSync(folder)
      .filter(f => audioExts.includes(path.extname(f).toLowerCase()))
      .map(f => path.join(folder, f));
    return files;
  } catch { return []; }
});

// Store/Settings
ipcMain.handle('store-get', (_, key, def) => store.get(key, def));
ipcMain.handle('store-set', (_, key, val) => { store.set(key, val); return true; });
ipcMain.handle('store-delete', (_, key) => { store.delete(key); return true; });
ipcMain.handle('get-all-settings', () => store.store);

// File info
ipcMain.handle('get-file-info', async (_, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      name: path.basename(filePath),
      ext: path.extname(filePath).toLowerCase()
    };
  } catch {
    return { exists: false };
  }
});

// Read audio file as base64
ipcMain.handle('read-audio-file', async (_, filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const mimeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', m4a: 'audio/mp4', aac: 'audio/aac' };
    const mime = mimeMap[ext] || 'audio/mpeg';
    return `data:${mime};base64,${data.toString('base64')}`;
  } catch { return null; }
});

// Export/Import settings
ipcMain.handle('export-settings', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Settings',
    defaultPath: 'micboard-settings.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (!result.canceled) {
    fs.writeFileSync(result.filePath, JSON.stringify(store.store, null, 2));
    return true;
  }
  return false;
});

ipcMain.handle('import-settings', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Settings',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (!result.canceled) {
    try {
      const data = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf-8'));
      Object.entries(data).forEach(([k, v]) => store.set(k, v));
      return true;
    } catch { return false; }
  }
  return false;
});

// Global hotkeys registration
ipcMain.handle('register-hotkey', (_, { accelerator, id }) => {
  try {
    globalShortcut.register(accelerator, () => {
      mainWindow?.webContents.send('hotkey-triggered', id);
    });
    return true;
  } catch { return false; }
});

ipcMain.handle('unregister-hotkey', (_, accelerator) => {
  try { globalShortcut.unregister(accelerator); return true; }
  catch { return false; }
});

ipcMain.handle('unregister-all-hotkeys', () => {
  globalShortcut.unregisterAll();
  return true;
});

// Get audio devices (using Web Audio API from renderer)
ipcMain.handle('get-app-version', () => app.getVersion());

// ─── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    globalShortcut.unregisterAll();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

const { app, BrowserWindow, ipcMain, globalShortcut, screen, Menu, Tray, desktopCapturer } = require('electron');
const path = require('path');
const Store = require('electron-store');
const screenshot = require('screenshot-desktop');
const LLMService = require('./llm-service');

// Initialize store for settings
const store = new Store();
const llmService = new LLMService();

class StealthAIAssistant {
  constructor() {
    this.mainWindow = null;
    this.overlayWindow = null;
    this.tray = null;
    this.isStealthMode = false;
    this.isListening = false;
    this.permissions = {
      screenCapture: false,
      audioCapture: false,
      automation: false
    };
  }

  async createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 400,
      height: 600,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        webSecurity: false
      }
    });

    // Load the renderer
    if (process.env.NODE_ENV === 'development') {
      await this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
      await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Hide window initially
    this.mainWindow.hide();
  }

  createOverlayWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    this.overlayWindow = new BrowserWindow({
      width,
      height,
      x: 0,
      y: 0,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      clickThrough: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    this.overlayWindow.loadFile(path.join(__dirname, '../renderer/overlay.html'));
    this.overlayWindow.hide();
  }

  createTray() {
    // Create tray icon (invisible in stealth mode)
    this.tray = new Tray(path.join(__dirname, '../assets/tray-icon.png'));
    
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Show Assistant', 
        click: () => this.toggleMainWindow() 
      },
      { 
        label: 'Stealth Mode', 
        type: 'checkbox',
        checked: this.isStealthMode,
        click: () => this.toggleStealthMode() 
      },
      { 
        label: 'Settings', 
        click: () => this.showSettings() 
      },
      { type: 'separator' },
      { 
        label: 'Quit', 
        click: () => app.quit() 
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Stealth AI Assistant');
  }

  setupGlobalShortcuts() {
    // Global shortcuts for stealth operation
    globalShortcut.register('Ctrl+Shift+Alt+A', () => {
      this.toggleMainWindow();
    });

    globalShortcut.register('Ctrl+Shift+Alt+S', () => {
      this.toggleStealthMode();
    });

    globalShortcut.register('Ctrl+Shift+Alt+L', () => {
      this.toggleListening();
    });

    globalShortcut.register('Ctrl+Shift+Alt+C', () => {
      this.captureScreen();
    });
  }

  setupIPC() {
    // IPC handlers for renderer communication
    ipcMain.handle('get-permissions', () => this.permissions);
    
    ipcMain.handle('request-permission', async (event, permission) => {
      return await this.requestPermission(permission);
    });

    ipcMain.handle('capture-screen', async () => {
      if (!this.permissions.screenCapture) {
        throw new Error('Screen capture permission not granted');
      }
      return await this.captureScreen();
    });

    ipcMain.handle('toggle-stealth', () => {
      this.toggleStealthMode();
      return this.isStealthMode;
    });

    ipcMain.handle('send-to-llm', async (event, { provider, message, context }) => {
      return await this.sendToLLM(provider, message, context);
    });

    ipcMain.handle('get-settings', () => {
      return store.get('settings', {
        theme: 'dark',
        opacity: 0.9,
        position: 'top-right',
        autoHide: true,
        stealthByDefault: false
      });
    });

    ipcMain.handle('save-settings', (event, settings) => {
      store.set('settings', settings);
      return true;
    });
  }

  async requestPermission(permission) {
    // In a real app, this would show a permission dialog
    console.log(`Permission requested: ${permission}`);
    this.permissions[permission] = true;
    return true;
  }

  async captureScreen() {
    try {
      const img = await screenshot({ format: 'png' });
      return img.toString('base64');
    } catch (error) {
      console.error('Screen capture failed:', error);
      throw error;
    }
  }

  toggleMainWindow() {
    if (this.isStealthMode) return; // Don't show in stealth mode
    
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  toggleStealthMode() {
    this.isStealthMode = !this.isStealthMode;
    
    if (this.isStealthMode) {
      this.mainWindow.hide();
      this.tray.setImage(path.join(__dirname, '../assets/tray-icon-stealth.png'));
    } else {
      this.tray.setImage(path.join(__dirname, '../assets/tray-icon.png'));
    }

    // Update tray menu
    this.createTray();
    
    console.log(`Stealth mode: ${this.isStealthMode ? 'ON' : 'OFF'}`);
  }

  toggleListening() {
    this.isListening = !this.isListening;
    
    if (this.isListening && this.permissions.audioCapture) {
      this.startListening();
    } else {
      this.stopListening();
    }
  }

  startListening() {
    // Audio capture and speech-to-text would be implemented here
    console.log('Started listening...');
    
    if (this.overlayWindow) {
      this.overlayWindow.webContents.send('listening-started');
      this.overlayWindow.show();
    }
  }

  stopListening() {
    console.log('Stopped listening...');
    
    if (this.overlayWindow) {
      this.overlayWindow.webContents.send('listening-stopped');
      this.overlayWindow.hide();
    }
  }

  async sendToLLM(provider, message, context = {}) {
    try {
      await llmService.checkUsageLimits(provider);
      
      // If there's a screenshot in context, use image analysis
      if (context.screenshot) {
        const result = await llmService.analyzeImage(provider, context.screenshot, message);
        await llmService.trackUsage(provider);
        return result;
      }
      
      // Regular text message
      const result = await llmService.sendMessage(provider, message, context);
      await llmService.trackUsage(provider);
      return result;
    } catch (error) {
      console.error('LLM Service error:', error);
      return {
        response: error.message || "Sorry, I encountered an error. Please try again.",
        provider,
        error: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  showSettings() {
    // Create settings window
    const settingsWindow = new BrowserWindow({
      width: 600,
      height: 800,
      parent: this.mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    settingsWindow.loadFile(path.join(__dirname, '../renderer/settings.html'));
  }

  async initialize() {
    await this.createMainWindow();
    this.createOverlayWindow();
    this.createTray();
    this.setupGlobalShortcuts();
    this.setupIPC();

    // Load saved settings
    const settings = store.get('settings', {});
    if (settings.stealthByDefault) {
      this.toggleStealthMode();
    }

    console.log('Stealth AI Assistant initialized');
  }
}

// App event handlers
app.whenReady().then(async () => {
  const assistant = new StealthAIAssistant();
  await assistant.initialize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const assistant = new StealthAIAssistant();
    assistant.initialize();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
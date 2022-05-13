const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');
const path = require('path');
const log = require('electron-log');
const contextMenu = require('electron-context-menu');

contextMenu({
  showSearchWithGoogle: false,
  showCopyImageAddress: false,
  showSaveLinkAs: false,
  showServices: false,
});
/* Menu */
const isMac = process.platform === 'darwin';

const template = [
  // { role: 'appMenu' }
  ...(isMac
    ? [
      {
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
    ]
    : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac
        ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
          },
        ]
        : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
    ],
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac
        ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' },
        ]
        : [{ role: 'close' }]),
    ],
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'About',
        click: async () => {
          dialog.showMessageBox({
            title: `About ARSReclama`,
            message: `App Version: ${app.getVersion()}`,
            buttons: ['Dismiss'],
          });
        },
      },
    ],
  },
];

const gotTheLock = app.requestSingleInstanceLock();

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 973,
    height: 850,
    minHeight: 850,
    minWidth: 973,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: false,
    },
  });

  let url = `file://${path.join(__dirname, '/build/index.html')}`;

  if (isDev) {
    // parces default port
    url = 'http://localhost:1234';
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadURL(url);
  mainWindow.on('closed', () => (mainWindow = null));
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  if (!mainWindow)
    app.on('ready', () => {
      createWindow();
    });
}

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ipcMain.on('app_version', (event) => {
// 	console.log(app.getVersion());
// 	event.sender.send('app_version', { version: app.getVersion() });
// });

setTimeout(function () {
  // console.log('We are checking for updates and notifying user...');
  autoUpdater.checkForUpdatesAndNotify();
}, 10000);

setInterval(function () {
  // console.log('We are checking for updates and notifying user...');
  autoUpdater.checkForUpdatesAndNotify();
}, 60000);

autoUpdater.on('update-available', () => {
  // mainWindow.webContents.send('update_available');
});
autoUpdater.on('update-downloaded', () => {
  // mainWindow.webContents.send('update_downloaded');
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: 'Update your application',
    detail: 'A new version has been downloaded. Restart the application to apply the updates.',
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
  });
});
ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

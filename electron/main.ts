import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { URL } from 'url';
import './ipc';
import { ensureDataDirectories } from './utils/paths';

const isDev = process.env.VITE_DEV_SERVER_URL;

async function createWindow() {
  await ensureDataDirectories();
  const win = new BrowserWindow({
    width: 1300,
    height: 900,
    backgroundColor: '#f8fafc',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL as string);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexHtml = new URL('../dist/index.html', `file://${__dirname}/`).toString();
    await win.loadURL(indexHtml);
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});

app.whenReady().then(() => {
  const userDataPath = app.getPath('userData');
  process.env.APP_USER_DATA = userDataPath;
  ipcMain.handle('paths:userData', () => userDataPath);
  void createWindow();
});

ipcMain.handle('app:openPath', async (_event, targetPath: string) => {
  return shell.openPath(targetPath);
});

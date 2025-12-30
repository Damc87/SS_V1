import { contextBridge, ipcRenderer } from 'electron';
import type { IpcChannels } from './types/ipc';

const api: IpcChannels = {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),
};

contextBridge.exposeInMainWorld('electron', api);

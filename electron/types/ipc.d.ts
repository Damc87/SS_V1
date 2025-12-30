import type { IpcRendererEvent } from 'electron';

export type MainChannels =
  | 'projects:list'
  | 'projects:create'
  | 'projects:update'
  | 'projects:delete'
  | 'projects:setActive'
  | 'projects:getActive'
  | 'phases:list'
  | 'phases:create'
  | 'phases:update'
  | 'phases:delete'
  | 'subphases:create'
  | 'subphases:update'
  | 'subphases:delete'
  | 'subphases:list'
  | 'phases:reorder'
  | 'contractors:list'
  | 'contractors:create'
  | 'contractors:update'
  | 'contractors:delete'
  | 'costs:list'
  | 'costs:create'
  | 'costs:update'
  | 'costs:delete'
  | 'documents:attachPdf'
  | 'documents:listByProject'
  | 'documents:open'
  | 'documents:delete'
  | 'export:csv'
  | 'import:csv'
  | 'export:backup'
  | 'import:backup'
  | 'paths:userData'
  | 'app:openPath';

export type IpcChannels = {
  invoke: (channel: MainChannels, ...args: any[]) => Promise<any>;
  on: (channel: MainChannels, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
  removeListener: (channel: MainChannels, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
};

declare global {
  interface Window {
    electron: IpcChannels;
  }
}

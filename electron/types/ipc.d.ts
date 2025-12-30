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
  | 'documents:attach'
  | 'documents:listByProject'
  | 'documents:open'
  | 'documents:delete'
  | 'export:csv'
  | 'import:csv'
  | 'export:backup'
  | 'import:backup'
  | 'paths:userData'
  | 'app:openPath';

declare global {
  interface Window {
    api: {
      projects: {
        list: () => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: string, data: any) => Promise<any>;
        remove: (id: string) => Promise<void>;
        setActive: (id: string) => Promise<string | null>;
        getActive: () => Promise<string | null>;
      };
      phases: {
        list: () => Promise<any>;
        create: (name: string) => Promise<any>;
        update: (id: string, name: string) => Promise<any>;
        remove: (id: string) => Promise<void>;
        reorder: (order: string[]) => Promise<any>;
        subphases: {
          list: (phaseId: string) => Promise<any>;
          create: (phaseId: string, name: string) => Promise<any>;
          update: (id: string, name: string) => Promise<any>;
          remove: (id: string) => Promise<void>;
        };
      };
      contractors: {
        list: () => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: string, data: any) => Promise<any>;
        remove: (id: string) => Promise<void>;
      };
      costs: {
        list: (filters: Record<string, unknown>) => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: string, data: any) => Promise<any>;
        remove: (id: string) => Promise<void>;
      };
      documents: {
        attach: (payload: { projectId: string; costId?: string; filePath: string }) => Promise<any>;
        listByProject: (projectId: string) => Promise<any>;
        open: (storedPath: string) => Promise<any>;
        remove: (id: string) => Promise<void>;
      };
      export: {
        csv: (projectId?: string) => Promise<string>;
        backup: () => Promise<string | null>;
      };
      import: {
        csv: (csv: string) => Promise<any>;
        backup: () => Promise<boolean | null>;
      };
      paths: {
        userData: () => Promise<string>;
      };
      app: {
        openPath: (targetPath: string) => Promise<string>;
      };
      on: (channel: MainChannels, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
      removeListener: (channel: MainChannels, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
    };
  }
}

import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type { Cost, Contractor, CostInput, CostListResult, Document, Phase, Project, Subphase } from './types/models';

type Listener = (event: IpcRendererEvent, ...args: any[]) => void;

const invoke = <T>(channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args) as Promise<T>;

const api = {
  projects: {
    list: () => invoke<Project[]>('projects:list'),
    create: (data: Omit<Project, 'id' | 'created_at'>) => invoke<Project>('projects:create', data),
    update: (id: string, data: Partial<Omit<Project, 'id' | 'created_at'>>) => invoke<Project | null>('projects:update', id, data),
    remove: (id: string) => invoke<void>('projects:delete', id),
    setActive: (id: string) => invoke<string | null>('projects:setActive', id),
    getActive: () => invoke<string | null>('projects:getActive'),
  },
  phases: {
    list: () => invoke<Phase[]>('phases:list'),
    create: (name: string) => invoke<Phase>('phases:create', name),
    update: (id: string, payload: string | { name?: string; budget_planned?: number }) => invoke<Phase | null>('phases:update', id, payload),
    remove: (id: string) => invoke<void>('phases:delete', id),
    reorder: (order: string[]) => invoke<Phase[]>('phases:reorder', order),
    subphases: {
      list: (phaseId: string) => invoke<Subphase[]>('subphases:list', phaseId),
      create: (phaseId: string, name: string) => invoke<Subphase>('subphases:create', phaseId, name),
      update: (id: string, name: string) => invoke<Subphase | null>('subphases:update', id, name),
      remove: (id: string) => invoke<void>('subphases:delete', id),
    },
  },
  contractors: {
    list: () => invoke<Contractor[]>('contractors:list'),
    create: (data: Omit<Contractor, 'id' | 'created_at'>) => invoke<Contractor>('contractors:create', data),
    update: (id: string, data: Partial<Omit<Contractor, 'id' | 'created_at'>>) => invoke<Contractor | null>('contractors:update', id, data),
    remove: (id: string) => invoke<void>('contractors:delete', id),
  },
  costs: {
    list: (filters: Record<string, unknown>) => invoke<CostListResult>('costs:list', filters),
    create: (data: CostInput) => invoke<Cost>('costs:create', data),
    update: (id: string, data: Partial<CostInput>) => invoke<Cost | null>('costs:update', id, data),
    remove: (id: string) => invoke<void>('costs:delete', id),
    duplicate: (id: string) => invoke<Cost | null>('costs:duplicate', id),
    bulkCreate: (entries: CostInput[]) => invoke<Cost[]>('costs:bulkCreate', entries),
    planVsActual: (projectId: string) => invoke<any>('costs:planVsActual', projectId),
  },
  documents: {
    attach: (payload: { projectId: string; costId?: string; filePath: string }) => invoke<Document>('documents:attach', payload),
    listByProject: (projectId: string) => invoke<Document[]>('documents:listByProject', projectId),
    open: (storedPath: string) => invoke<string>('documents:open', storedPath),
    remove: (id: string) => invoke<void>('documents:delete', id),
  },
  export: {
    csv: (projectId?: string, filters?: Record<string, unknown>) => invoke<string>('export:csv', projectId, filters),
    backup: () => invoke<string | null>('export:backup'),
  },
  import: {
    csv: (csv: string, projectId: string) => invoke<any>('import:csv', csv, projectId),
    backup: () => invoke<boolean | null>('import:backup'),
  },
  paths: {
    userData: () => invoke<string>('paths:userData'),
  },
  app: {
    openPath: (targetPath: string) => invoke<string>('app:openPath', targetPath),
  },
  on: (channel: string, listener: Listener) => ipcRenderer.on(channel, listener),
  removeListener: (channel: string, listener: Listener) => ipcRenderer.removeListener(channel, listener),
};

contextBridge.exposeInMainWorld('api', api);

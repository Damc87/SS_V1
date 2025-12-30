import type { Contractor, Cost, Document, Phase, Project, Subphase } from './types';

declare global {
  interface Window {
    api: {
      projects: {
        list: () => Promise<Project[]>;
        create: (data: Omit<Project, 'id' | 'created_at'>) => Promise<Project>;
        update: (id: string, data: Partial<Omit<Project, 'id' | 'created_at'>>) => Promise<Project | null>;
        remove: (id: string) => Promise<void>;
        setActive: (id: string) => Promise<string | null>;
        getActive: () => Promise<string | null>;
      };
      phases: {
        list: () => Promise<Phase[]>;
        create: (name: string) => Promise<Phase>;
        update: (id: string, name: string) => Promise<Phase | null>;
        remove: (id: string) => Promise<void>;
        reorder: (order: string[]) => Promise<Phase[]>;
        subphases: {
          list: (phaseId: string) => Promise<Subphase[]>;
          create: (phaseId: string, name: string) => Promise<Subphase>;
          update: (id: string, name: string) => Promise<Subphase | null>;
          remove: (id: string) => Promise<void>;
        };
      };
      contractors: {
        list: () => Promise<Contractor[]>;
        create: (data: Omit<Contractor, 'id' | 'created_at'>) => Promise<Contractor>;
        update: (id: string, data: Partial<Omit<Contractor, 'id' | 'created_at'>>) => Promise<Contractor | null>;
        remove: (id: string) => Promise<void>;
      };
      costs: {
        list: (filters: Record<string, unknown>) => Promise<Cost[]>;
        create: (data: Omit<Cost, 'id' | 'created_at'>) => Promise<Cost>;
        update: (id: string, data: Partial<Omit<Cost, 'id' | 'created_at' | 'project_id'>>) => Promise<Cost | null>;
        remove: (id: string) => Promise<void>;
      };
      documents: {
        attach: (payload: { projectId: string; costId?: string; filePath: string }) => Promise<Document>;
        listByProject: (projectId: string) => Promise<Document[]>;
        open: (storedPath: string) => Promise<string>;
        remove: (id: string) => Promise<void>;
      };
      export: {
        csv: (projectId?: string) => Promise<string>;
        backup: () => Promise<string | null>;
      };
      import: {
        csv: (csv: string) => Promise<Cost[]>;
        backup: () => Promise<boolean | null>;
      };
      paths: {
        userData: () => Promise<string>;
      };
      app: {
        openPath: (targetPath: string) => Promise<string>;
      };
    };
  }
}

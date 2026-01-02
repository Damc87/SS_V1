import type { Contractor, Cost, CostInput, CostListResult, Document, Phase, Project, Subphase } from './types';

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
        update: (id: string, payload: string | { name?: string; budget_planned?: number }) => Promise<Phase | null>;
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
        list: (filters: Record<string, unknown>) => Promise<CostListResult>;
        create: (data: CostInput) => Promise<Cost>;
        update: (id: string, data: Partial<CostInput>) => Promise<Cost | null>;
        remove: (id: string) => Promise<void>;
        duplicate: (id: string) => Promise<Cost | null>;
        bulkCreate: (entries: CostInput[]) => Promise<Cost[]>;
        planVsActual: (projectId: string) => Promise<any>;
      };
      documents: {
        attach: (payload: { projectId: string; costId?: string; filePath: string }) => Promise<Document>;
        listByProject: (projectId: string) => Promise<Document[]>;
        open: (storedPath: string) => Promise<string>;
        remove: (id: string) => Promise<void>;
      };
      export: {
        csv: (projectId?: string, filters?: Record<string, unknown>) => Promise<string>;
        backup: () => Promise<string | null>;
      };
      import: {
        csv: (csv: string, projectId: string) => Promise<any>;
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

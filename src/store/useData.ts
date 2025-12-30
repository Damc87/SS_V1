import { create } from 'zustand';
import type { Project, Phase, Subphase, Contractor, Cost, Document } from '../types';

export type DataState = {
  projects: Project[];
  activeProjectId: string | null;
  phases: Phase[];
  subphases: Record<string, Subphase[]>;
  contractors: Contractor[];
  costs: Cost[];
  documents: Document[];
  loading: boolean;
  loadAll: () => Promise<void>;
  setActiveProject: (id: string) => Promise<void>;
  addProject: (payload: Pick<Project, 'name' | 'description'>) => Promise<Project>;
  addCost: (payload: Omit<Cost, 'id' | 'created_at'>) => Promise<Cost>;
  refreshDocuments: (projectId: string) => Promise<void>;
  addPhase: (name: string) => Promise<void>;
};

export const useData = create<DataState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  phases: [],
  subphases: {},
  contractors: [],
  costs: [],
  documents: [],
  loading: false,
  loadAll: async () => {
    set({ loading: true });
    const [projects, phases, contractors, activeProjectId] = await Promise.all([
      window.api.projects.list(),
      window.api.phases.list(),
      window.api.contractors.list(),
      window.api.projects.getActive(),
    ]);
    const subphases: Record<string, Subphase[]> = {};
    await Promise.all(
      phases.map(async (p: Phase) => {
        subphases[p.id] = await window.api.phases.subphases.list(p.id);
      })
    );

    set({ projects, phases, contractors, subphases, activeProjectId: activeProjectId ?? null, loading: false });

    const current = activeProjectId ?? projects[0]?.id;
    if (current) {
      await get().setActiveProject(current);
    }
  },
  setActiveProject: async (id: string) => {
    await window.api.projects.setActive(id);
    const costs = await window.api.costs.list({ projectId: id });
    const documents = await window.api.documents.listByProject(id);
    set({ activeProjectId: id, costs, documents });
  },
  addProject: async (payload) => {
    const project = await window.api.projects.create(payload);
    await get().loadAll();
    return project;
  },
  addCost: async (payload) => {
    const cost = await window.api.costs.create(payload);
    const costs = await window.api.costs.list({ projectId: payload.project_id });
    set({ costs });
    return cost;
  },
  refreshDocuments: async (projectId) => {
    const documents = await window.api.documents.listByProject(projectId);
    set({ documents });
  },
  addPhase: async (name: string) => {
    await window.api.phases.create(name);
    const phases = await window.api.phases.list();
    const subphases: Record<string, Subphase[]> = {};
    await Promise.all(
      phases.map(async (p: Phase) => {
        subphases[p.id] = await window.api.phases.subphases.list(p.id);
      })
    );
    set({ phases, subphases });
  },
}));

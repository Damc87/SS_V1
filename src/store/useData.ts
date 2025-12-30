import { create } from 'zustand';
import { toast } from 'sonner';
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
  error?: string | null;
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
  error: null,
  loadAll: async () => {
    set({ loading: true, error: null });
    try {
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
    } catch (error) {
      console.error('loadAll failed', error);
      toast.error('Nalaganje podatkov ni uspelo.');
      set({ loading: false, error: (error as Error)?.message ?? 'Napaka' });
    }
  },
  setActiveProject: async (id: string) => {
    try {
      await window.api.projects.setActive(id);
      const costs = await window.api.costs.list({ projectId: id });
      const documents = await window.api.documents.listByProject(id);
      set({ activeProjectId: id, costs, documents, error: null });
    } catch (error) {
      console.error('setActiveProject failed', error);
      toast.error('Aktivacija projekta ni uspela.');
      set({ error: (error as Error)?.message ?? 'Napaka' });
    }
  },
  addProject: async (payload) => {
    try {
      const project = await window.api.projects.create(payload);
      await get().loadAll();
      return project;
    } catch (error) {
      console.error('addProject failed', error);
      toast.error('Shranjevanje projekta ni uspelo.');
      throw error;
    }
  },
  addCost: async (payload) => {
    try {
      const cost = await window.api.costs.create(payload);
      const costs = await window.api.costs.list({ projectId: payload.project_id });
      set({ costs });
      return cost;
    } catch (error) {
      console.error('addCost failed', error);
      toast.error('Shranjevanje stroška ni uspelo.');
      throw error;
    }
  },
  refreshDocuments: async (projectId) => {
    try {
      const documents = await window.api.documents.listByProject(projectId);
      set({ documents });
    } catch (error) {
      console.error('refreshDocuments failed', error);
      toast.error('Osvežitev dokumentov ni uspela.');
    }
  },
  addPhase: async (name) => {
    try {
      await window.api.phases.create(name);
      const phases = await window.api.phases.list();
      const subphases: Record<string, Subphase[]> = {};
      await Promise.all(
        phases.map(async (p: Phase) => {
          subphases[p.id] = await window.api.phases.subphases.list(p.id);
        })
      );
      set({ phases, subphases, error: null });
    } catch (error) {
      console.error('addPhase failed', error);
      toast.error('Dodajanje faze ni uspelo.');
      set({ error: (error as Error)?.message ?? 'Napaka' });
    }
  },
}));

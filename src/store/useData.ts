import { create } from 'zustand';
import { toast } from 'sonner';
import type { Project, Phase, Subphase, Contractor, Cost, CostInput, CostListResult, Document } from '../types';

export type DataState = {
  projects: Project[];
  activeProjectId: string | null;
  phases: Phase[];
  subphases: Record<string, Subphase[]>;
  contractors: Contractor[];
  costs: Cost[];
  costTotal: number;
  documents: Document[];
  loading: boolean;
  error?: string | null;
  loadAll: () => Promise<void>;
  setActiveProject: (id: string) => Promise<void>;
  addProject: (payload: Pick<Project, 'name' | 'description'>) => Promise<Project>;
  refreshCosts: (filters?: Record<string, unknown>) => Promise<void>;
  createCost: (payload: CostInput) => Promise<Cost>;
  updateCost: (id: string, patch: Partial<CostInput>) => Promise<Cost | null>;
  deleteCost: (id: string) => Promise<void>;
  duplicateCost: (id: string) => Promise<Cost | null>;
  importCosts: (csv: string, projectId: string) => Promise<any>;
  exportCosts: (projectId?: string, filters?: Record<string, unknown>) => Promise<string>;
  phasePlanVsActual: (projectId?: string) => Promise<any>;
  refreshDocuments: (projectId: string) => Promise<void>;
  addPhase: (name: string) => Promise<void>;
  updatePhaseBudget: (id: string, budget: number) => Promise<void>;
};

export const useData = create<DataState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  phases: [],
  subphases: {},
  contractors: [],
  costs: [],
  costTotal: 0,
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
      const { items, total } = (await window.api.costs.list({ projectId: id })) as CostListResult;
      const documents = await window.api.documents.listByProject(id);
      set({ activeProjectId: id, costs: items, costTotal: total, documents, error: null });
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
  refreshCosts: async (filters = {}) => {
    const projectId = (filters as any).projectId ?? get().activeProjectId;
    if (!projectId) return;
    try {
      const { items, total } = (await window.api.costs.list({ ...filters, projectId })) as CostListResult;
      set({ costs: items, costTotal: total });
    } catch (error) {
      console.error('refreshCosts failed', error);
      toast.error('Osvežitev stroškov ni uspela.');
      set({ error: (error as Error)?.message ?? 'Napaka' });
    }
  },
  createCost: async (payload) => {
    try {
      const cost = await window.api.costs.create(payload);
      await get().refreshCosts({ projectId: payload.project_id });
      return cost;
    } catch (error) {
      console.error('createCost failed', error);
      toast.error('Shranjevanje stroška ni uspelo.');
      throw error;
    }
  },
  updateCost: async (id, patch) => {
    try {
      const updated = await window.api.costs.update(id, patch);
      if (updated) {
        set((state) => ({ costs: state.costs.map((c) => (c.id === id ? updated : c)) }));
      }
      return updated;
    } catch (error) {
      console.error('updateCost failed', error);
      toast.error('Posodobitev stroška ni uspela.');
      throw error;
    }
  },
  deleteCost: async (id) => {
    try {
      await window.api.costs.remove(id);
      set((state) => ({ costs: state.costs.filter((c) => c.id !== id) }));
    } catch (error) {
      console.error('deleteCost failed', error);
      toast.error('Brisanje stroška ni uspelo.');
      throw error;
    }
  },
  duplicateCost: async (id) => {
    try {
      const copy = await window.api.costs.duplicate(id);
      if (copy) {
        set((state) => ({ costs: [copy, ...state.costs] }));
      }
      return copy;
    } catch (error) {
      console.error('duplicateCost failed', error);
      toast.error('Podvajanje stroška ni uspelo.');
      throw error;
    }
  },
  importCosts: async (csv, projectId) => {
    try {
      const result = await window.api.import.csv(csv, projectId);
      if (result?.created?.length) {
        await get().refreshCosts({ projectId });
      }
      return result;
    } catch (error) {
      console.error('importCosts failed', error);
      toast.error('Uvoz CSV ni uspel.');
      throw error;
    }
  },
  exportCosts: async (projectId, filters = {}) => {
    try {
      return await window.api.export.csv(projectId, filters);
    } catch (error) {
      console.error('exportCosts failed', error);
      toast.error('Izvoz CSV ni uspel.');
      throw error;
    }
  },
  phasePlanVsActual: async (projectId) => {
    const current = projectId ?? get().activeProjectId;
    if (!current) return [];
    try {
      return await window.api.costs.planVsActual(current);
    } catch (error) {
      console.error('phasePlanVsActual failed', error);
      return [];
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
  updatePhaseBudget: async (id, budget) => {
    try {
      await window.api.phases.update(id, { budget_planned: budget });
      const phases = await window.api.phases.list();
      set({ phases });
    } catch (error) {
      console.error('updatePhaseBudget failed', error);
      toast.error('Posodobitev plana ni uspela.');
    }
  },
}));

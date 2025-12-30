import { create } from 'zustand';
import { ipc } from '../lib/ipc';

export type Project = {
  id: string;
  name: string;
};

export const useProjects = create<{ projects: Project[]; load: () => Promise<void> }>((set) => ({
  projects: [],
  load: async () => {
    const data = await ipc['projects:list']();
    set({ projects: data });
  },
}));

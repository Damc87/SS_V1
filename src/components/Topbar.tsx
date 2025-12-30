import { Search, Plus, Upload, Download, ChevronDown } from 'lucide-react';
import { useData } from '../store/useData';
import { useMemo, useState } from 'react';
import { CostModal } from '../features/costs/CostModal';
import { motion, AnimatePresence } from 'framer-motion';

export function Topbar() {
  const { projects, activeProjectId, setActiveProject } = useData();
  const [openCost, setOpenCost] = useState(false);
  const activeProject = useMemo(() => projects.find((p) => p.id === activeProjectId), [projects, activeProjectId]);

  return (
    <div className="h-16 px-8 border-b border-border bg-white/80 backdrop-blur flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            className="appearance-none pr-8 pl-4 py-2 rounded-lg border border-border bg-white shadow-sm text-sm font-medium min-w-[200px]"
            value={activeProjectId ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) return;
              void setActiveProject(value);
            }}
          >
            {!projects.length && <option value="">Ni projektov</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm text-slate-600">
          <Search size={16} />
          <input className="bg-transparent outline-none" placeholder="Hitro iskanje" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="px-4 py-2 rounded-lg bg-primary text-white font-medium flex items-center gap-2 shadow-soft"
          onClick={() => setOpenCost(true)}
        >
          <Plus size={16} /> Nov strošek
        </button>
        <button className="px-3 py-2 rounded-lg border border-border bg-white text-sm flex items-center gap-2">
          <Upload size={16} /> Uvoz
        </button>
        <button className="px-3 py-2 rounded-lg border border-border bg-white text-sm flex items-center gap-2">
          <Download size={16} /> Izvoz
        </button>
      </div>

      <AnimatePresence>{openCost && <CostModal open={openCost} onClose={() => setOpenCost(false)} projectId={activeProject?.id} />}</AnimatePresence>
    </div>
  );
}

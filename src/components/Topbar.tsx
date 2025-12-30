import { useMemo, useState } from 'react';
import { Search, Plus, Sparkles, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../store/useData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';

export function Topbar() {
  const { projects, activeProjectId, setActiveProject, addProject } = useData();
  const [openProject, setOpenProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const activeProject = useMemo(() => projects.find((p) => p.id === activeProjectId), [projects, activeProjectId]);

  const handleCreateProject = async () => {
    if (!projectName) {
      toast.error('Vnesite ime projekta.');
      return;
    }
    try {
      const project = await addProject({ name: projectName, description: projectDescription });
      await setActiveProject(project.id);
      toast.success('Projekt ustvarjen.');
      setProjectName('');
      setProjectDescription('');
      setOpenProject(false);
    } catch {
      // toasts handled globally
    }
  };

  return (
    <div className="sticky top-0 z-20 border-b border-border/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="hidden text-xs font-medium text-slate-500 sm:flex sm:flex-col">
            <span>Aktivni projekt</span>
            <div className="flex items-center gap-2 text-sm text-slate-900">
              <ShieldCheck className="h-4 w-4" />
              {activeProject?.name ?? 'Ni izbranega projekta'}
            </div>
          </div>
          <div className="min-w-[220px]">
            <Select
              value={activeProjectId ?? (projects.length ? projects[0]?.id ?? '' : 'none')}
              onValueChange={(value) => {
                if (value === 'none') return;
                void setActiveProject(value);
              }}
              disabled={!projects.length}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ni projektov" />
              </SelectTrigger>
              <SelectContent>
                {!projects.length && <SelectItem value="none">Ni projektov</SelectItem>}
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="hidden items-center gap-2 rounded-xl bg-white/70 px-3 py-2 shadow-inner sm:flex">
            <Search className="h-4 w-4 text-slate-400" />
            <Input className="h-9 w-64 border-none bg-transparent px-1 text-sm" placeholder="Globalno iskanje (placeholder)" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={openProject} onOpenChange={setOpenProject}>
            <DialogTrigger asChild>
              <Button variant="primary" size="md" className="shadow-card">
                <Plus className="h-4 w-4" />
                Nov projekt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nov projekt</DialogTitle>
                <DialogDescription>Placeholder obrazec za dodajanje projekta</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Ime projekta" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                <Input placeholder="Opis (opcijsko)" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} />
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setOpenProject(false)}>
                  Prekliči
                </Button>
                <Button onClick={handleCreateProject}>Shrani</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <motion.div whileHover={{ y: -1 }} className="hidden sm:block">
            <Button variant="secondary" size="md" className="gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Hitra dejanja
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

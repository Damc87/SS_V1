import { useMemo, useState } from 'react';
import { Search, Plus, Sparkles, ShieldCheck, X, Sun, Moon, MonitorSmartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../store/useData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import { useTheme } from '../store/useTheme';
import { cn } from '../lib/utils';

export function Topbar() {
  const { projects, activeProjectId, setActiveProject, addProject } = useData();
  const [openProject, setOpenProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [query, setQuery] = useState('');
  const { mode, setMode } = useTheme();

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

  const themeOptions: { id: 'system' | 'light' | 'dark'; icon: JSX.Element; label: string }[] = [
    { id: 'system', icon: <MonitorSmartphone className="h-4 w-4" />, label: 'Sistem' },
    { id: 'light', icon: <Sun className="h-4 w-4" />, label: 'Svetlo' },
    { id: 'dark', icon: <Moon className="h-4 w-4" />, label: 'Temno' },
  ];

  return (
    <div className="sticky top-0 z-20 border-b border-border/60 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4">
          <div className="hidden text-[11px] font-medium text-muted-foreground sm:flex sm:flex-col">
            <span className="uppercase tracking-[0.08em] text-[10px] text-muted-foreground/70">Aktivni projekt</span>
            <div className="flex items-center gap-2 text-sm text-foreground font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" />
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
          <div className="hidden items-center gap-2 rounded-2xl border border-border/70 bg-elevated/70 px-3 py-2 shadow-inner sm:flex focus-within:ring-2 focus-within:ring-[var(--color-focus-ring)]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-72 border-none bg-transparent px-1 text-sm placeholder:text-muted-foreground"
              placeholder="Išči po projektih, stroških ali izvajalcih..."
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-muted"
                aria-label="Počisti iskanje"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1 rounded-full border border-border/70 bg-elevated/80 px-1.5 py-1 shadow-inner sm:flex">
            {themeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setMode(option.id)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground',
                  mode === option.id && 'bg-surface shadow-soft text-foreground border border-border/80'
                )}
                aria-pressed={mode === option.id}
              >
                {option.icon}
                <span className="hidden md:inline">{option.label}</span>
              </button>
            ))}
          </div>
          <Dialog open={openProject} onOpenChange={setOpenProject}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
                <Button variant="primary" size="md" className="shadow-card">
                  <Plus className="h-4 w-4" />
                  Nov projekt
                </Button>
              </motion.div>
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
            <Button variant="secondary" size="md" className="gap-2 shadow-soft/60">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Hitra dejanja
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

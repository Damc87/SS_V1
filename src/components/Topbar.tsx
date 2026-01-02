import { useMemo } from 'react';
import { RefreshCcw, ShieldCheck, Sun, Moon, MonitorSmartphone, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../store/useData';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useTheme } from '../store/useTheme';
import { cn } from '../lib/utils';

export function Topbar() {
  const { projects, activeProjectId, refreshAll } = useData();
  const { mode, setMode, resolved } = useTheme();

  const activeProject = useMemo(() => projects.find((p) => p.id === activeProjectId), [projects, activeProjectId]);

  const themeOptions: { id: 'system' | 'light' | 'dark'; icon: JSX.Element; label: string }[] = [
    { id: 'system', icon: <MonitorSmartphone className="h-4 w-4" />, label: 'Sistem' },
    { id: 'light', icon: <Sun className="h-4 w-4" />, label: 'Svetlo' },
    { id: 'dark', icon: <Moon className="h-4 w-4" />, label: 'Temno' },
  ];

  const handleRefresh = async () => {
    await refreshAll();
    toast.success('Osveženo.');
  };

  return (
    <div className="sticky top-0 z-30 border-b border-border/70 bg-surface/80 backdrop-blur-xl shadow-[0_16px_60px_-38px_rgba(0,0,0,0.45)]">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-8">
        <div className="flex h-[84px] items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">Nadzorna plošča</span>
            <div className="text-lg font-semibold text-foreground">Gradbeni nadzor</div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div whileHover={{ y: -1 }}>
              <Button variant="secondary" size="md" className="gap-2 shadow-soft" onClick={handleRefresh}>
                <RefreshCcw className="h-4 w-4" />
                Osveži
              </Button>
            </motion.div>
            <div className="flex items-center gap-1 rounded-full border border-border/70 bg-elevated/80 px-1.5 py-1 shadow-inner">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setMode(option.id)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground hover:bg-muted/80',
                    mode === option.id && 'bg-surface shadow-soft text-foreground border border-border/70'
                  )}
                  aria-pressed={mode === option.id}
                >
                  {option.icon}
                  <span className="hidden md:inline">{option.label}</span>
                  {mode === option.id && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 shadow-inner">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold text-foreground">{activeProject?.name ?? 'Ni aktivnega projekta'}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-elevated/70 text-xs font-semibold text-muted-foreground shadow-inner">
              {mode === 'system' ? <MonitorSmartphone className="h-4 w-4 text-primary" /> : resolved === 'dark' ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

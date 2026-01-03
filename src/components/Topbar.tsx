import { useMemo } from 'react';
import { RefreshCcw, Sun, Moon, MonitorSmartphone, Check, FolderKanban, Sparkles } from 'lucide-react';
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

  const modeIcon = mode === 'system' ? <MonitorSmartphone className="h-4 w-4" /> : resolved === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;

  return (
    <div className="sticky top-0 z-30 border-b border-border/60 bg-[#0b0f1a]/80 backdrop-blur-xl shadow-[0_26px_80px_-50px_rgba(0,0,0,0.8)]">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-8">
        <div className="flex h-20 items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-white/4 via-white/2 to-white/5 px-3 py-2 shadow-soft">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee] via-[#22d3ee] to-[#6366f1] text-background shadow-card ring-1 ring-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">Nadzorna plošča</p>
              <p className="text-lg font-semibold text-foreground">Premium Dark · Neon</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <motion.div whileHover={{ y: -1 }}>
              <Button
                variant="secondary"
                size="md"
                className="gap-2 rounded-2xl border border-accent/30 bg-gradient-to-r from-white/5 via-accent/10 to-white/5 text-foreground shadow-soft"
                onClick={handleRefresh}
              >
                <RefreshCcw className="h-4 w-4 text-accent" />
                <span className="hidden sm:inline">Osveži</span>
              </Button>
            </motion.div>

            <div className="flex items-center gap-1 rounded-full border border-border/70 bg-white/5 px-1.5 py-1 shadow-inner">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setMode(option.id)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground hover:bg-white/10',
                    mode === option.id && 'bg-white/15 text-foreground ring-1 ring-border/70 shadow-soft'
                  )}
                  aria-pressed={mode === option.id}
                >
                  {option.icon}
                  <span className="hidden md:inline">{option.label}</span>
                  {mode === option.id && <Check className="h-3.5 w-3.5 text-accent" />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-full border border-accent/35 bg-gradient-to-r from-white/6 via-accent/10 to-white/4 px-4 py-2 text-sm font-semibold text-foreground shadow-soft">
              <FolderKanban className="h-4 w-4 text-accent" />
              <span className="truncate max-w-[220px]">{activeProject?.name ?? 'Ni aktivnega projekta'}</span>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-white/5 text-muted-foreground shadow-inner">
              {modeIcon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

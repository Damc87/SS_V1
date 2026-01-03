import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, FileText, Gauge, Layers, Settings, Users, FileArchive, FolderKanban, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge, to: '/' },
  { id: 'projects', label: 'Projekti', icon: FolderKanban, to: '/projekti' },
  { id: 'phases', label: 'Faze', icon: Layers, to: '/faze' },
  { id: 'costs', label: 'Stroški', icon: FileText, to: '/stroski' },
  { id: 'contractors', label: 'Izvajalci', icon: Users, to: '/izvajalci' },
  { id: 'documents', label: 'Dokumenti', icon: FileArchive, to: '/dokumenti' },
  { id: 'settings', label: 'Nastavitve', icon: Settings, to: '/nastavitve' },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 220 : 340 }}
      transition={{ duration: 0.18, ease: [0.33, 1, 0.68, 1] }}
      className="relative z-20 shrink-0 overflow-hidden border-r border-border/80 bg-[#0b0f1a]/85 backdrop-blur-2xl shadow-[0_22px_80px_-38px_rgba(0,0,0,0.55)]"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-card ring-1 ring-border/70">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-foreground">Gradnja</div>
            <div className="text-xs text-muted-foreground">SaaS nadzorna plošča</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted" onClick={onToggle} aria-label="Preklopi stransko vrstico">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <div className="mx-4 mb-2 h-px rounded-full bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden />
      <nav className="flex flex-col gap-1 px-3 pb-4" aria-label="Glavna navigacija">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-[1px] hover:bg-white/5',
                isActive
                  ? 'border border-[rgba(var(--neon-lime),0.4)] bg-[rgba(var(--neon-lime),0.08)] text-[rgb(var(--neon-lime))] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.75)]'
                  : 'border border-transparent text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute left-0 h-5 w-1 rounded-full bg-[rgba(var(--neon-lime),0.9)] transition',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                  )}
                />
                <item.icon
                  className={cn(
                    'h-5 w-5 text-muted-foreground/80 transition-colors duration-300',
                    isActive && 'text-[rgb(var(--neon-lime))] drop-shadow-[0_0_10px_rgba(var(--neon-lime),0.7)]'
                  )}
                />
                <span className={cn('truncate transition-colors duration-300', isActive ? 'text-[rgb(var(--neon-lime))]' : 'text-foreground')}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-5 text-xs text-muted-foreground/80">{collapsed ? 'Lokalno' : 'Lokalni način'}</div>
    </motion.aside>
  );
}

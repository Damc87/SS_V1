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
      animate={{ width: collapsed ? 82 : 280 }}
      transition={{ duration: 0.18, ease: [0.33, 1, 0.68, 1] }}
      className="relative z-20 border-r border-border/80 bg-surface/90 backdrop-blur-xl shadow-[0_22px_80px_-38px_rgba(0,0,0,0.55)]"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-card ring-1 ring-border/70">
            <Building2 className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">Gradnja</div>
              <div className="text-xs text-muted-foreground">SaaS nadzorna plošča</div>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted" onClick={onToggle} aria-label="Preklopi stransko vrstico">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <div className="mx-4 mb-2 h-px rounded-full bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden />
      <nav className="flex flex-col gap-1 px-3 pb-4">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:-translate-y-[1px] hover:bg-muted/70',
                isActive
                  ? 'bg-primary/10 text-foreground shadow-soft border border-primary/25 hover:bg-primary/12 dark:bg-primary/15'
                  : 'border border-transparent',
                collapsed && 'justify-center px-2'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute left-0 h-5 w-1 rounded-full bg-primary transition',
                    collapsed ? '-left-1.5' : '-left-2',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                  )}
                />
                <item.icon className="h-5 w-5" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-5 text-xs text-muted-foreground/80">{collapsed ? 'Lokalno' : 'Lokalni način'}</div>
    </motion.aside>
  );
}

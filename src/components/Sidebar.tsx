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
      animate={{ width: collapsed ? 80 : 260 }}
      className="relative z-20 border-r border-border/80 bg-white/85 backdrop-blur shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]"
    >
      <div className="flex items-center justify-between gap-3 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-card">
            <Building2 className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-semibold text-slate-900">Gradnja</div>
              <div className="text-xs text-slate-500">Premium pregled</div>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full text-slate-500" onClick={onToggle}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-muted',
                isActive && 'bg-slate-900 text-white shadow-soft hover:bg-slate-900',
                collapsed && 'justify-center'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-5 text-xs text-slate-400">{collapsed ? 'Lokalno' : 'Lokalni način'}</div>
    </motion.aside>
  );
}

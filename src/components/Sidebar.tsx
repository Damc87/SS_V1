import { Home, FileText, Layers, Users, FileArchive, Settings, Palette } from 'lucide-react';
import clsx from 'clsx';

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'costs', label: 'Stroški', icon: FileText },
  { id: 'phases', label: 'Faze', icon: Layers },
  { id: 'contractors', label: 'Izvajalci', icon: Users },
  { id: 'documents', label: 'Dokumenti', icon: FileArchive },
  { id: 'settings', label: 'Nastavitve', icon: Settings },
  { id: 'style-guide', label: 'Style Guide', icon: Palette },
];

export function Sidebar({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <aside className="w-60 bg-white shadow-card border-r border-border flex flex-col">
      <div className="px-6 py-5 text-lg font-semibold tracking-tight">Gradnja – Stroški</div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <button
            key={item.id}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition',
              active === item.id ? 'bg-primary text-white shadow-soft' : 'hover:bg-muted text-slate-700'
            )}
            onClick={() => onChange(item.id)}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-6 py-4 text-xs text-slate-500">Lokalno</div>
    </aside>
  );
}

import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useData } from '../../store/useData';

export function ContractorsPage() {
  const { contractors } = useData();
  const [filter, setFilter] = useState('');
  const filtered = contractors.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      <Card title="Izvajalci" subtitle="Upravljanje izvajalcev">
        <div className="flex items-center gap-3 mb-4">
          <input className="border border-border rounded-xl px-3 py-2" placeholder="Išči" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <button className="px-4 py-2 rounded-xl bg-primary text-white shadow-soft">Dodaj izvajalca</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="border border-border rounded-2xl p-3 bg-white shadow-soft/40">
              <div className="font-semibold">{c.name}</div>
              {c.email && <div className="text-sm text-slate-600">{c.email}</div>}
              {c.phone && <div className="text-sm text-slate-600">{c.phone}</div>}
            </div>
          ))}
          {!filtered.length && <div className="text-slate-500 text-sm">Ni izvajalcev.</div>}
        </div>
      </Card>
    </div>
  );
}

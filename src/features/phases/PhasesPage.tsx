import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useData } from '../../store/useData';

export function PhasesPage() {
  const { phases, addPhase } = useData();
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    await addPhase(newName);
    setNewName('');
  };

  return (
    <div className="space-y-4">
      <Card title="Faze" subtitle="Šifrant faz in podfaz">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input className="border border-border rounded-xl px-3 py-2" placeholder="Dodaj fazo" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <button className="px-4 py-2 rounded-xl bg-primary text-white shadow-soft" disabled={!newName} onClick={handleAdd}>
              Dodaj
            </button>
          </div>
          <ul className="space-y-2">
            {phases.map((p) => (
              <li key={p.id} className="rounded-xl border border-border px-3 py-2 flex items-center justify-between bg-white">
                <div className="font-medium">{p.name}</div>
                <span className="text-xs text-slate-500">Vrstni red: {p.order_no}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}

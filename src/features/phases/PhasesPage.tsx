import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';

export function PhasesPage() {
  const { phases, addPhase } = useData();
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    await addPhase(newName);
    setNewName('');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardDescription>Faze</CardDescription>
          <CardTitle>Šifrant faz in podfaz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input className="sm:max-w-sm" placeholder="Dodaj fazo" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button variant="primary" disabled={!newName} onClick={handleAdd}>
              Dodaj
            </Button>
          </div>
          {!phases.length ? (
            <EmptyState title="Ni faz" description="Dodajte novo fazo, da lahko sledite stroškom." icon={<Flag className="h-5 w-5" />} />
          ) : (
            <ul className="grid gap-2 md:grid-cols-2">
              {phases.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-white px-3 py-3 text-sm shadow-inner">
                  <div className="font-medium text-slate-900">{p.name}</div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs text-slate-500">Vrstni red: {p.order_no}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

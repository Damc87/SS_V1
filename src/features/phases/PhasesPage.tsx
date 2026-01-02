import { useEffect, useState } from 'react';
import { Flag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';

export function PhasesPage() {
  const { phases, addPhase, updatePhaseBudget } = useData();
  const [newName, setNewName] = useState('');
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const draft: Record<string, string> = {};
    phases.forEach((p) => {
      draft[p.id] = p.budget_planned?.toString() ?? '';
    });
    setBudgetDrafts(draft);
  }, [phases]);

  const handleAdd = async () => {
    await addPhase(newName);
    setNewName('');
  };

  const handleBudgetSave = async (id: string) => {
    const value = Number(budgetDrafts[id] ?? 0);
    await updatePhaseBudget(id, value);
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardDescription>Faze</CardDescription>
          <CardTitle>Šifrant faz in podfaz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input className="sm:max-w-sm" placeholder="Dodaj fazo" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button variant="primary" disabled={!newName} onClick={handleAdd} className="shadow-soft">
              Dodaj
            </Button>
          </div>
          {!phases.length ? (
            <EmptyState title="Ni faz" description="Dodajte novo fazo, da lahko sledite stroškom." icon={<Flag className="h-5 w-5" />} />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {phases.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-elevated/70 px-4 py-3 text-sm shadow-inner"
                >
                  <div className="font-semibold text-foreground">{p.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Vrstni red: {p.order_no}</span>
                    <div className="flex items-center gap-2 rounded-xl bg-background px-2 py-1">
                      <Input
                        type="number"
                        min={0}
                        step="100"
                        className="h-9 w-28"
                        value={budgetDrafts[p.id] ?? ''}
                        onChange={(e) => setBudgetDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      />
                      <Button size="sm" variant="secondary" onClick={() => handleBudgetSave(p.id)}>
                        Shrani plan
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { PhoneCall } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';

export function ContractorsPage() {
  const { contractors } = useData();
  const [filter, setFilter] = useState('');
  const filtered = contractors.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardDescription>Izvajalci</CardDescription>
          <CardTitle>Upravljanje izvajalcev</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input className="sm:max-w-xs" placeholder="Išči" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <Button variant="secondary" className="shadow-soft">
              Dodaj izvajalca
            </Button>
          </div>
          {!filtered.length ? (
            <EmptyState title="Ni izvajalcev" description="Dodajte izvajalca in kontaktne podatke za popolnejši pregled." icon={<PhoneCall className="h-5 w-5" />} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((c) => (
                <div key={c.id} className="rounded-2xl border border-border/70 bg-elevated/80 p-4 shadow-inner">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-base font-semibold text-foreground">{c.name}</div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-foreground">ID {c.id.slice(0, 4)}</span>
                  </div>
                  {c.email && <div className="text-sm text-muted-foreground">{c.email}</div>}
                  {c.phone && <div className="text-sm text-muted-foreground">{c.phone}</div>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

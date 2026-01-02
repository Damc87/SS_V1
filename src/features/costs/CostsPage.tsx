import { useMemo } from 'react';
import { useData } from '../../store/useData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/EmptyState';
import { ReceiptText } from 'lucide-react';

export function CostsPage() {
  const { costs, phases, contractors } = useData();

  const decorated = useMemo(() => {
    return costs.map((c) => ({
      ...c,
      phaseName: phases.find((p) => p.id === c.phase_id)?.name,
      contractorName: contractors.find((x) => x.id === c.contractor_id)?.name,
    }));
  }, [costs, phases, contractors]);

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardDescription>Stroški</CardDescription>
          <CardTitle>Pregled in osnovni filtri</CardTitle>
        </CardHeader>
        <CardContent>
          {!decorated.length ? (
            <EmptyState title="Ni stroškov" description="Ko dodate prvi strošek, se bo prikazal tukaj." icon={<ReceiptText className="h-5 w-5" />} />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border/80 shadow-inner">
              <table className="min-w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.08em] font-semibold">Datum</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.08em] font-semibold">Naziv</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.08em] font-semibold">Faza</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.08em] font-semibold">Izvajalec</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.08em] font-semibold">Status</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-[0.08em] font-semibold">Bruto</th>
                  </tr>
                </thead>
                <tbody>
                  {decorated.map((c) => (
                    <tr key={c.id} className="border-t border-border/70 hover:bg-muted/50">
                      <td className="px-4 py-3 text-foreground/90">{c.date}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{c.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.phaseName ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.contractorName ?? '—'}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{c.status}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">€ {c.amount_gross.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

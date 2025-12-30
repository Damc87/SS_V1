import { useMemo } from 'react';
import { useData } from '../../store/useData';
import { Card } from '../../components/ui/Card';

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
    <div className="space-y-4">
      <Card title="Stroški" subtitle="Pregled in osnovni filtri">
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-slate-600">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Datum</th>
                <th className="text-left px-3 py-2 font-medium">Naziv</th>
                <th className="text-left px-3 py-2 font-medium">Faza</th>
                <th className="text-left px-3 py-2 font-medium">Izvajalec</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-right px-3 py-2 font-medium">Bruto</th>
              </tr>
            </thead>
            <tbody>
              {decorated.map((c) => (
                <tr key={c.id} className="border-t border-border/70">
                  <td className="px-3 py-2">{c.date}</td>
                  <td className="px-3 py-2">{c.title}</td>
                  <td className="px-3 py-2">{c.phaseName ?? '—'}</td>
                  <td className="px-3 py-2">{c.contractorName ?? '—'}</td>
                  <td className="px-3 py-2 capitalize">{c.status}</td>
                  <td className="px-3 py-2 text-right font-semibold">€ {c.amount_gross.toFixed(2)}</td>
                </tr>
              ))}
              {!decorated.length && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-500" colSpan={6}>
                    Ni še stroškov. Dodajte prvega s klikom na "Nov strošek".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { CostsByPhaseChart } from './CostsByPhaseChart';
import { TopContractorsChart } from './TopContractorsChart';
import { CumulatedLineChart } from './CumulatedLineChart';
import { useData } from '../../store/useData';
import { ProjectsPanel } from '../projects/ProjectsPanel';
import { cn } from '../../lib/utils';

export function Dashboard() {
  const { costs, contractors, phases, loading } = useData();
  const hasCosts = costs.length > 0;

  const summary = useMemo(() => {
    const total = costs.reduce((acc, c) => acc + c.amount_gross, 0);
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    const thisMonth = costs.filter((c) => c.date.startsWith(month)).reduce((acc, c) => acc + c.amount_gross, 0);
    const contractorTotals = contractors.map((c) => ({
      id: c.id,
      name: c.name,
      total: costs.filter((cost) => cost.contractor_id === c.id).reduce((acc, cost) => acc + cost.amount_gross, 0),
    }));
    const phaseTotals = phases.map((p) => ({
      id: p.id,
      name: p.name,
      total: costs.filter((cost) => cost.phase_id === p.id).reduce((acc, cost) => acc + cost.amount_gross, 0),
    }));
    const topContractor = contractorTotals.sort((a, b) => b.total - a.total)[0];
    const expensivePhase = phaseTotals.sort((a, b) => b.total - a.total)[0];

    return {
      total,
      thisMonth,
      topContractor: topContractor?.name ?? 'Ni podatkov',
      topContractorValue: topContractor?.total ?? 0,
      expensivePhase: expensivePhase?.name ?? 'Ni podatkov',
      expensivePhaseValue: expensivePhase?.total ?? 0,
    };
  }, [costs, contractors, phases]);

  const kpis = [
    {
      label: 'Skupaj stroški',
      value: `€ ${summary.total.toFixed(2)}`,
      hint: 'Kumulativno',
      accent: 'text-primary',
    },
    {
      label: 'Ta mesec',
      value: `€ ${summary.thisMonth.toFixed(2)}`,
      hint: 'Mesečni odmik',
      accent: 'text-success',
    },
    {
      label: 'Največji izvajalec',
      value: summary.topContractor,
      hint: `€ ${summary.topContractorValue.toFixed(2)}`,
      accent: 'text-warning',
    },
    {
      label: 'Najdražja faza',
      value: summary.expensivePhase,
      hint: `€ ${summary.expensivePhaseValue.toFixed(2)}`,
      accent: 'text-danger',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="relative overflow-hidden">
            <div className="absolute right-4 top-4 h-10 w-10 rounded-2xl bg-primary/10 blur-2xl" aria-hidden />
            <CardHeader className="space-y-3">
              <CardDescription className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{kpi.label}</CardDescription>
              <div className="space-y-1">
                {loading ? (
                  <div className="h-8 w-32 rounded-lg skeleton" />
                ) : (
                  <CardTitle className="text-3xl leading-tight">{kpi.value}</CardTitle>
                )}
                <p className={cn('text-sm font-semibold', kpi.accent)}>{loading || !hasCosts ? '—' : kpi.hint}</p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 glass">
          <CardHeader>
            <CardDescription>Stroški po fazah</CardDescription>
            <CardTitle>Plan vs. realizacija</CardTitle>
          </CardHeader>
          <CardContent>
            <CostsByPhaseChart />
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader>
            <CardDescription>Top izvajalci</CardDescription>
            <CardTitle>Po bruto znesku</CardTitle>
          </CardHeader>
          <CardContent>
            <TopContractorsChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Kumulativa</CardDescription>
          <CardTitle>Mesečni trend</CardTitle>
        </CardHeader>
        <CardContent>
          <CumulatedLineChart />
        </CardContent>
      </Card>

      <ProjectsPanel />
    </div>
  );
}

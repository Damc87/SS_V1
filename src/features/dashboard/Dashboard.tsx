import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { CostsByPhaseChart } from './CostsByPhaseChart';
import { TopContractorsChart } from './TopContractorsChart';
import { CumulatedLineChart } from './CumulatedLineChart';
import { useData } from '../../store/useData';
import { ProjectsPanel } from '../projects/ProjectsPanel';

export function Dashboard() {
  const { costs, contractors, phases } = useData();

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Skupaj stroški</CardDescription>
            <CardTitle className="text-2xl">€ {summary.total.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Ta mesec</CardDescription>
            <CardTitle className="text-2xl">€ {summary.thisMonth.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Največji izvajalec</CardDescription>
            <CardTitle className="text-lg">
              {summary.topContractor} <span className="text-sm text-slate-500">€ {summary.topContractorValue.toFixed(2)}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Najdražja faza</CardDescription>
            <CardTitle className="text-lg">
              {summary.expensivePhase} <span className="text-sm text-slate-500">€ {summary.expensivePhaseValue.toFixed(2)}</span>
            </CardTitle>
          </CardHeader>
        </Card>
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

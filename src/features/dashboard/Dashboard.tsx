import { useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { CostsByPhaseChart } from './CostsByPhaseChart';
import { TopContractorsChart } from './TopContractorsChart';
import { CumulatedLineChart } from './CumulatedLineChart';
import { useData } from '../../store/useData';
import { ProjectsPanel } from '../projects/ProjectsPanel';

export function Dashboard() {
  const { costs } = useData();

  const summary = useMemo(() => {
    const total = costs.reduce((acc, c) => acc + c.amount_gross, 0);
    const paid = costs.filter((c) => c.status === 'placano').reduce((acc, c) => acc + c.amount_gross, 0);
    const pending = total - paid;
    const invoices = costs.length;
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    const thisMonth = costs.filter((c) => c.date.startsWith(month)).reduce((acc, c) => acc + c.amount_gross, 0);
    return { total, paid, pending, invoices, thisMonth };
  }, [costs]);

  const kpis = [
    { label: 'Skupaj', value: `€${summary.total.toFixed(2)}` },
    { label: 'Neplačano', value: `€${summary.pending.toFixed(2)}` },
    { label: 'Plačano', value: `€${summary.paid.toFixed(2)}` },
    { label: 'Ta mesec', value: `€${summary.thisMonth.toFixed(2)}` },
    { label: 'Št. računov', value: `${summary.invoices}` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} title={kpi.label} subtitle="">
            <div className="text-2xl font-semibold tracking-tight">{kpi.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Stroški po fazah" subtitle="Plan vs realizacija">
          <CostsByPhaseChart />
        </Card>
        <Card title="Top izvajalci" subtitle="Po bruto znesku">
          <TopContractorsChart />
        </Card>
        <Card title="Kumulativa" subtitle="Mesečno">
          <CumulatedLineChart />
        </Card>
      </div>

      <ProjectsPanel />
    </div>
  );
}

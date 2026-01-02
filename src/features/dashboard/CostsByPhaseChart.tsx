import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';

export function CostsByPhaseChart() {
  const { costs, phases } = useData();
  const data = useMemo(() => {
    const values = phases.map((p) => ({
      name: p.name,
      value: costs.filter((c) => c.phase_id === p.id).reduce((acc, c) => acc + c.amount_gross, 0),
    }));
    return values;
  }, [costs, phases]);
  const hasData = data.some((item) => item.value > 0);

  if (!hasData) {
    return <EmptyState title="Ni podatkov – dodaj prvi strošek" description="Graf se bo izrisal, ko bodo na voljo stroški." className="h-64 flex items-center" />;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="var(--color-text-secondary)" />
          <YAxis tickLine={false} axisLine={false} stroke="var(--color-text-secondary)" />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: `1px solid var(--color-border)`,
              borderRadius: 16,
              boxShadow: 'var(--shadow-soft)',
            }}
            cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
          />
          <Bar dataKey="value" fill="var(--color-accent)" radius={[12, 12, 12, 12]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

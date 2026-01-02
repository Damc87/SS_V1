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
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.4} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="rgb(var(--text2))" />
          <YAxis tickLine={false} axisLine={false} stroke="rgb(var(--text2))" />
          <Tooltip
            contentStyle={{
              background: 'rgb(var(--surface))',
              border: `1px solid rgb(var(--border))`,
              borderRadius: 16,
              boxShadow: 'var(--shadow)',
            }}
            cursor={{ fill: 'rgb(var(--muted))', opacity: 0.3 }}
          />
          <Bar dataKey="value" fill="rgb(var(--accent))" radius={[12, 12, 12, 12]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

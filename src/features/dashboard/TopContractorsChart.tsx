import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';

export function TopContractorsChart() {
  const { costs, contractors } = useData();
  const data = useMemo(() => {
    const decorated = contractors
      .map((c) => ({
        name: c.name,
        value: costs.filter((cost) => cost.contractor_id === c.id).reduce((acc, cost) => acc + cost.amount_gross, 0),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    return decorated;
  }, [contractors, costs]);
  const hasData = data.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        title="Ni podatkov – dodaj prvi strošek"
        description="Ko bodo stroški povezani z izvajalci, se bodo prikazali tukaj."
        className="h-64 flex items-center"
      />
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.4} />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={140} axisLine={false} tickLine={false} stroke="rgb(var(--text2))" />
          <Tooltip
            contentStyle={{
              background: 'rgb(var(--surface))',
              border: `1px solid rgb(var(--border))`,
              borderRadius: 16,
              boxShadow: 'var(--shadow)',
            }}
            cursor={{ fill: 'rgb(var(--muted))', opacity: 0.28 }}
          />
          <Bar dataKey="value" fill="rgb(var(--accent))" radius={[12, 12, 12, 12]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

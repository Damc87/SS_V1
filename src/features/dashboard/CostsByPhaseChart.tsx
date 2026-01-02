import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';

export function CostsByPhaseChart() {
  const { costs, phases } = useData();
  const data = useMemo(() => {
    const values = [...phases]
      .sort((a, b) => a.order_no - b.order_no)
      .map((p) => ({
        name: p.name,
        value: costs.filter((c) => !c.is_archived && c.phase_id === p.id).reduce((acc, c) => acc + c.amount_gross, 0),
      }));
    return values;
  }, [costs, phases]);
  const hasData = data.some((item) => item.value > 0);

  if (!data.length) {
    return (
      <EmptyState
        title="Ni podatkov – dodaj prvi strošek"
        description="Graf se bo izrisal, ko bodo na voljo stroški."
        className="h-64 flex items-center"
      />
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={28} margin={{ top: 10, bottom: 12, left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" opacity={0.28} vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="rgb(var(--text2))" interval={0} angle={-12} textAnchor="end" height={60} />
          <YAxis tickLine={false} axisLine={false} stroke="rgb(var(--text2))" />
          <Tooltip
            contentStyle={{
              background: 'rgba(var(--surface),0.95)',
              border: `1px solid rgb(var(--border))`,
              borderRadius: 16,
              boxShadow: 'var(--shadow)',
            }}
            formatter={(value: number) => [`€ ${value.toLocaleString('sl-SI', { minimumFractionDigits: 2 })}`, 'Stroški']}
            cursor={{ fill: 'rgb(var(--muted))', opacity: 0.18 }}
          />
          <Bar dataKey="value" fill={hasData ? 'rgba(var(--accent),0.72)' : 'rgba(var(--accent),0.25)'} radius={[14, 14, 10, 10]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

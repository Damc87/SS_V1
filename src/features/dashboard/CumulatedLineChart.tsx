import { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';

export function CumulatedLineChart() {
  const { costs } = useData();
  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    costs.forEach((c) => {
      const month = c.date.slice(0, 7);
      totals[month] = (totals[month] || 0) + c.amount_gross;
    });
    const entries = Object.entries(totals).sort(([a], [b]) => (a > b ? 1 : -1));
    let running = 0;
    return entries.map(([month, value]) => {
      running += value;
      return { name: month, value: running };
    });
  }, [costs]);
  const hasData = data.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        title="Ni podatkov – dodaj prvi strošek"
        description="Ko bodo stroški na voljo, se bo prikazal trend kumulative."
        className="h-64 flex items-center"
      />
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
          />
          <Line type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 5, fill: 'var(--color-surface)' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

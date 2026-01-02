import { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';

export function CumulatedLineChart() {
  const { costs } = useData();
  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    costs.filter((c) => !c.is_archived).forEach((c) => {
      const month = (c.invoice_month || c.invoice_date.slice(0, 7)).slice(0, 7);
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
          />
          <Line type="monotone" dataKey="value" stroke="rgb(var(--accent))" strokeWidth={3} dot={{ r: 5, fill: 'rgb(var(--surface))' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

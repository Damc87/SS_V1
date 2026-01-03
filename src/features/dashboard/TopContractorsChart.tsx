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
        value: costs.filter((cost) => !cost.is_archived && cost.contractor_id === c.id).reduce((acc, cost) => acc + cost.amount_gross, 0),
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
          <defs>
            <linearGradient id="contractorGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#74f2b2" stopOpacity={0.95} />
              <stop offset="45%" stopColor="#4ad9a8" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#19b97a" stopOpacity={0.82} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 8" stroke="rgba(255,255,255,0.08)" opacity={0.5} horizontal={false} />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={140} axisLine={false} tickLine={false} stroke="rgb(var(--text2))" tick={{ fontSize: 12, fill: 'rgba(var(--text2),0.9)' }} />
          <Tooltip
            contentStyle={{
              background: 'linear-gradient(150deg, rgba(12,14,26,0.96), rgba(22,32,48,0.94))',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 16,
              boxShadow: '0 20px 90px rgba(0,0,0,0.55)',
              backdropFilter: 'blur(14px)',
            }}
            cursor={{ fill: 'rgba(74,242,178,0.08)', opacity: 0.4 }}
          />
          <Bar dataKey="value" fill="url(#contractorGradient)" radius={[14, 14, 10, 10]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

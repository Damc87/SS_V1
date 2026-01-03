import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
      .slice(0, 8);
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
        <BarChart data={data} layout="vertical" margin={{ top: 0, bottom: 0, left: 0, right: 16 }}>
          <CartesianGrid strokeDasharray="2 10" stroke="rgba(255,255,255,0.07)" opacity={0.6} horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={150}
            axisLine={false}
            tickLine={false}
            stroke="rgb(var(--text2))"
            tick={{ fontSize: 12, fill: 'rgba(var(--text2),0.8)' }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(13,17,32,0.9)',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 14,
              boxShadow: '0 18px 80px rgba(0,0,0,0.55)',
              backdropFilter: 'blur(14px)',
            }}
            formatter={(value: number) => [`€ ${value.toLocaleString('sl-SI', { minimumFractionDigits: 2 })}`, 'Skupaj']}
            cursor={{ fill: 'rgba(34,211,238,0.08)', opacity: 0.4 }}
          />
          <Bar dataKey="value" radius={[16, 16, 12, 12]} barSize={18}>
            {data.map((item) => (
              <Cell key={item.name} fill="rgba(56, 189, 248, 0.6)" stroke="rgba(56, 189, 248, 0.9)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

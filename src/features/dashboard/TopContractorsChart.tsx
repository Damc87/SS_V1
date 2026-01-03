import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';

export function TopContractorsChart() {
  const { costs, contractors } = useData();
  const pastelYellow = 'rgba(var(--pastel-yellow), 0.92)';
  const labelFont = {
    fontSize: 13,
    fill: pastelYellow,
    fontFamily: '"Space Grotesk", "Inter", system-ui, -apple-system, sans-serif',
  };
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
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, bottom: 0, left: 0, right: 16 }}>
          <CartesianGrid strokeDasharray="3 7" stroke="rgba(var(--pastel-yellow),0.2)" strokeWidth={1.05} opacity={0.85} horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={170}
            axisLine={false}
            tickLine={false}
            stroke="rgb(var(--pastel-yellow))"
            tick={labelFont}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(13,17,32,0.9)',
              border: `1px solid rgba(var(--pastel-yellow),0.18)`,
              borderRadius: 14,
              boxShadow: '0 18px 80px rgba(0,0,0,0.55)',
              backdropFilter: 'blur(14px)',
            }}
            formatter={(value: number) => [`€ ${value.toLocaleString('sl-SI', { minimumFractionDigits: 2 })}`, 'Skupaj']}
            labelStyle={{ color: pastelYellow, fontWeight: 700 }}
            cursor={{ fill: 'rgba(var(--pastel-yellow),0.08)', opacity: 0.8 }}
          />
          <Bar dataKey="value" radius={[0, 0, 0, 0]} barSize={20}>
            {data.map((item) => (
              <Cell
                key={item.name}
                fill="rgba(var(--neon-lime),0.6)"
                stroke="rgba(var(--neon-lime),0.9)"
                strokeWidth={1.4}
                style={{ filter: 'drop-shadow(0 0 10px rgba(var(--neon-lime),0.4))' }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

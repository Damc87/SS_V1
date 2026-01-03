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
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={26} margin={{ top: 12, bottom: 24, left: 12, right: 12 }}>
          <defs>
            <linearGradient id="phaseBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe77a" stopOpacity={0.95} />
              <stop offset="45%" stopColor="#f7c948" stopOpacity={0.86} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.78} />
            </linearGradient>
            <linearGradient id="phaseGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.04)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 10" stroke="url(#phaseGlow)" opacity={0.52} vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            stroke="rgb(var(--text2))"
            interval={0}
            angle={-14}
            textAnchor="end"
            height={64}
            tick={{ fontSize: 12, fill: 'rgba(var(--text2),0.92)' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            stroke="rgb(var(--text2))"
            tick={{ fontSize: 12, fill: 'rgba(var(--text2),0.92)' }}
            tickFormatter={(value: number) => value.toLocaleString('sl-SI', { maximumFractionDigits: 0 })}
          />
          <Tooltip
            contentStyle={{
              background: 'linear-gradient(150deg, rgba(12,14,26,0.96), rgba(22,32,48,0.94))',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 16,
              boxShadow: '0 20px 90px rgba(0,0,0,0.55)',
              backdropFilter: 'blur(14px)',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.74)', fontWeight: 600 }}
            formatter={(value: number) => [`€ ${value.toLocaleString('sl-SI', { minimumFractionDigits: 2 })}`, 'Stroški faze']}
            cursor={{ fill: 'rgba(255,231,122,0.08)', opacity: 0.5 }}
          />
          <Bar
            dataKey="value"
            fill={hasData ? 'url(#phaseBarGradient)' : 'rgba(var(--accent),0.28)'}
            radius={[16, 16, 12, 12]}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
            background={{ fill: 'rgba(255,255,255,0.03)', radius: 14 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

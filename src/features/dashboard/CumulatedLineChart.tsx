import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, bottom: 12, left: 8, right: 8 }}>
          <defs>
            <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4cc9f0" stopOpacity={0.6} />
              <stop offset="65%" stopColor="#3f37c9" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#111729" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="gridGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.03)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 10" stroke="url(#gridGlow)" opacity={0.55} vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="rgb(var(--text2))" tick={{ fontSize: 12, fill: 'rgba(var(--text2),0.9)' }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            stroke="rgb(var(--text2))"
            tick={{ fontSize: 12, fill: 'rgba(var(--text2),0.9)' }}
            tickFormatter={(value: number) => `€ ${value.toLocaleString('sl-SI', { maximumFractionDigits: 0 })}`}
          />
          <Tooltip
            contentStyle={{
              background: 'linear-gradient(150deg, rgba(12,14,26,0.96), rgba(22,32,48,0.94))',
              border: `1px solid rgba(255,255,255,0.1)`,
              borderRadius: 16,
              boxShadow: '0 20px 90px rgba(0,0,0,0.55)',
              backdropFilter: 'blur(14px)',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.78)', fontWeight: 600 }}
            formatter={(value: number) => [`€ ${value.toLocaleString('sl-SI', { minimumFractionDigits: 2 })}`, 'Kumulativa']} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="rgba(141, 200, 255, 0.9)"
            strokeWidth={3}
            fill="url(#cumulativeGradient)"
            fillOpacity={1}
            dot={{ r: 4, fill: 'rgba(255,255,255,0.95)', strokeWidth: 0 }}
            activeDot={{ r: 7, fill: '#6ab9ff', stroke: 'rgba(255,255,255,0.92)', strokeWidth: 2 }}
          />
          <Line type="monotone" dataKey="value" stroke="rgba(255,255,255,0.35)" strokeWidth={1.1} dot={false} strokeDasharray="3 8" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

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
              <stop offset="0%" stopColor="#c084fc" stopOpacity={0.95} />
              <stop offset="48%" stopColor="#7dd3fc" stopOpacity={0.75} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.28} />
            </linearGradient>
            <linearGradient id="gridGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.02)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 10" stroke="url(#gridGlow)" opacity={0.55} vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="rgb(var(--text2))" />
          <YAxis
            tickLine={false}
            axisLine={false}
            stroke="rgb(var(--text2))"
            tickFormatter={(value: number) => `€ ${value.toLocaleString('sl-SI', { maximumFractionDigits: 0 })}`}
          />
          <Tooltip
            contentStyle={{
              background: 'linear-gradient(135deg, rgba(20,24,44,0.95), rgba(26,32,60,0.9))',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 16,
              boxShadow: '0 15px 80px rgba(0,0,0,0.45)',
              backdropFilter: 'blur(12px)',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}
            formatter={(value: number) => [`€ ${value.toLocaleString('sl-SI', { minimumFractionDigits: 2 })}`, 'Kumulativa']} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth={3}
            fill="url(#cumulativeGradient)"
            fillOpacity={1}
            dot={{ r: 4, fill: 'rgba(255,255,255,0.95)', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#0ea5e9', stroke: 'rgba(255,255,255,0.9)', strokeWidth: 2 }}
          />
          <Line type="monotone" dataKey="value" stroke="rgba(208,180,254,0.9)" strokeWidth={1.2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

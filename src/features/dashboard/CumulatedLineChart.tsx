import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';

export function CumulatedLineChart() {
  const { costs } = useData();
  const pastelYellow = 'rgb(var(--pastel-yellow))';
  const neonYellow = 'rgb(var(--pastel-yellow))';
  const labelFont = {
    fontSize: 12,
    fill: pastelYellow,
    fontWeight: 600,
    fontFamily: '"Space Grotesk", "Inter", system-ui, -apple-system, sans-serif',
  };

  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    costs.filter((c) => !c.is_archived).forEach((c) => {
      const month = (c.invoice_month ?? c.invoice_date?.slice(0, 7))?.slice(0, 7);
      if (!month) return;
      totals[month] = (totals[month] || 0) + c.amount_gross;
    });
    const entries = Object.entries(totals).sort(([a], [b]) => (a > b ? 1 : -1));
    return entries.map(([month, value]) => {
      const date = new Date(`${month}-01T00:00:00Z`);
      const label = Number.isNaN(date.getTime())
        ? month
        : Intl.DateTimeFormat('sl-SI', { month: 'short', year: '2-digit' }).format(date);

      return { name: label, value };
    });
  }, [costs]);

  const hasData = costs.some((c) => !c.is_archived) && data.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        title="Ni podatkov – dodaj prvi strošek"
        description="Ko bodo stroški na voljo, se bo prikazal mesečni pregled."
        className="h-64 flex items-center"
      />
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, bottom: 18, left: 8, right: 8 }} barCategoryGap="18%">
          <defs>
            <linearGradient id="gridGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(var(--pastel-yellow),0.22)" />
              <stop offset="50%" stopColor="rgba(var(--pastel-yellow),0.12)" />
              <stop offset="100%" stopColor="rgba(var(--pastel-yellow),0.28)" />
            </linearGradient>
            <linearGradient id="monthlyBars" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(var(--pastel-yellow),0.95)" />
              <stop offset="85%" stopColor="rgba(var(--pastel-yellow),0.35)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="url(#gridGlow)" opacity={0.9} vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="rgb(var(--pastel-yellow))" tick={labelFont} tickMargin={10} />
          <YAxis
            tickLine={false}
            axisLine={false}
            stroke="rgb(var(--pastel-yellow))"
            tick={labelFont}
            tickFormatter={(value: number) => `€ ${value.toLocaleString('sl-SI', { maximumFractionDigits: 0 })}`}
          />
          <Tooltip
            contentStyle={{
              background: 'linear-gradient(150deg, rgba(12,14,26,0.96), rgba(22,32,48,0.94))',
              border: `1px solid rgba(var(--pastel-yellow),0.2)`,
              borderRadius: 16,
              boxShadow: '0 20px 90px rgba(0,0,0,0.55)',
              backdropFilter: 'blur(14px)',
            }}
            labelStyle={{ color: neonYellow, fontWeight: 700 }}
            formatter={(value: number) => [`€ ${value.toLocaleString('sl-SI', { minimumFractionDigits: 2 })}`, 'Mesečno']} />
          <Bar dataKey="value" fill="url(#monthlyBars)" radius={[0, 0, 0, 0]} barSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

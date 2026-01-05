import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';
import { animation, baseColors, GlassTooltip, gridStyle, neonPalette, tickLabel, withAlpha } from './chartTheme';
import { formatEUR } from '../../lib/utils';

export function CumulatedLineChart() {
  const { costs } = useData();

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
    <div className="relative h-80">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_18%_22%,rgba(126,160,255,0.15),transparent_32%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_82%_12%,rgba(244,114,182,0.16),transparent_32%)]" aria-hidden />
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, bottom: 14, left: 6, right: 6 }}>
          <defs>
            <linearGradient id="monthlyArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={withAlpha(neonPalette[0], 0.9)} />
              <stop offset="70%" stopColor={withAlpha(neonPalette[0], 0.35)} />
              <stop offset="100%" stopColor={withAlpha(neonPalette[0], 0.05)} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={tickLabel}
            padding={{ left: data.length === 1 ? 48 : 18, right: data.length === 1 ? 48 : 18 }}
            tickMargin={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={tickLabel}
            tickFormatter={(value: number) => formatEUR(value)}
            width={82}
          />
          <Tooltip
            cursor={{ stroke: baseColors.axis, strokeWidth: 0.6, opacity: 0.3 }}
            content={
              <GlassTooltip<number, string>
                valueFormatter={(value) => formatEUR(value ?? 0)}
                labelFormatter={(label) => String(label ?? '')}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={withAlpha(neonPalette[0], 0.95)}
            fill="url(#monthlyArea)"
            fillOpacity={0.85}
            strokeWidth={2.4}
            dot={false}
            activeDot={{ r: 6, fill: withAlpha(neonPalette[0], 0.95), strokeWidth: 0 }}
            {...animation}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

import { useCallback, useMemo } from 'react';
import type { TickProps } from 'recharts';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Text, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';
import { animation, formatCurrency, GlassTooltip, gridStyle, neonPalette, tickLabel, withAlpha } from './chartTheme';

export function TopContractorsChart() {
  const { costs, contractors } = useData();
  const sanitizeName = useCallback((value: unknown) => {
    const text = typeof value === 'string' ? value : value == null ? '' : String(value);
    return text.replace(/\[object Object\],?\s*/gi, '').trim();
  }, []);

  const data = useMemo(() => {
    const decorated = contractors
      .map((c) => ({
        name: sanitizeName(c.name),
        value: costs.filter((cost) => !cost.is_archived && cost.contractor_id === c.id).reduce((acc, cost) => acc + cost.amount_gross, 0),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    return decorated;
  }, [contractors, costs, sanitizeName]);
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

  const AxisTick = (props: TickProps) => {
    const label = sanitizeName(props.payload?.value);
    const truncated = label.length > 20 ? `${label.slice(0, 19)}…` : label;
    return (
      <Text {...props} className="select-none" style={{ ...tickLabel, fontSize: 13 }}>
        <title>{label}</title>
        {truncated}
      </Text>
    );
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 6, bottom: 6, left: 0, right: 18 }} barCategoryGap={14}>
          <defs>
            {data.map((item, idx) => (
              <linearGradient key={item.name} id={`contractor-${idx}-gradient`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={withAlpha(neonPalette[idx % neonPalette.length], 0.9)} />
                <stop offset="100%" stopColor={withAlpha(neonPalette[(idx + 2) % neonPalette.length], 0.4)} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridStyle} strokeWidth={1} vertical={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={180}
            axisLine={false}
            tickLine={false}
            tick={<AxisTick />}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={
              <GlassTooltip<number, string>
                valueFormatter={(value) => formatCurrency(value ?? 0)}
                labelFormatter={(label) => sanitizeName(label)}
              />
            }
          />
          <Bar dataKey="value" radius={[999, 999, 999, 999]} barSize={22} {...animation}>
            {data.map((item, idx) => (
              <Cell
                key={item.name}
                fill={`url(#contractor-${idx}-gradient)`}
                stroke={withAlpha(neonPalette[idx % neonPalette.length], 0.95)}
                strokeWidth={1.25}
                fillOpacity={0.85}
                className="transition-all duration-200"
                style={{ filter: `drop-shadow(0 10px 20px ${withAlpha(neonPalette[idx % neonPalette.length], 0.25)})` }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

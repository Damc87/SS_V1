import { useMemo, useState } from 'react';
import type { TickProps } from 'recharts';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Text, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';
import { animation, baseColors, getPhaseColor, GlassTooltip, gridStyle, tickLabel, toLabel, withAlpha } from './chartTheme';
import { formatEUR } from '../../lib/utils';

const pastelGold = '#F4E29C';

export function CostsByPhaseChart() {
  const { costs, phases, subphases } = useData();
  const [activePhase, setActivePhase] = useState<string | null>(null);

  const subphaseToMain = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(subphases).forEach((list) => {
      list.forEach((sp) => map.set(sp.id, sp.main_phase_id));
    });
    return map;
  }, [subphases]);

  const data = useMemo(() => {
    const activeCosts = costs.filter((c) => !c.is_archived);
    const items = [...phases]
      .sort((a, b) => a.order_no - b.order_no)
      .map((p) => ({
        fazaId: p.id,
        naziv: p.name ?? p.naziv ?? p.ime ?? '',
        bruto: activeCosts
          .filter((c) => {
            const mainPhaseId = (c.subphase_id && subphaseToMain.get(c.subphase_id)) || c.phase_id;
            return mainPhaseId === p.id;
          })
          .reduce((acc, c) => acc + c.amount_gross, 0),
        color: getPhaseColor(p.id),
      }));
    return items.map((entry) => ({
      fazaId: entry.fazaId,
      fazaNaziv: toLabel(entry.naziv || entry.ime || entry.name || '').trim(),
      znesek: Number(entry.bruto ?? entry.znesek ?? entry.value ?? 0),
      color: entry.color,
    }));
  }, [costs, phases, subphaseToMain]);
  if (!data.length) {
    return (
      <EmptyState
        title="Ni podatkov – dodaj prvi strošek"
        description="Graf se bo izrisal, ko bodo na voljo stroški."
        className="h-64 flex items-center"
      />
    );
  }

  const truncateLabel = (value: string, max = 14) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

  const AxisTick = (props: TickProps) => {
    const label = toLabel(props.payload?.value).trim();
    return (
      <Text
        {...props}
        x={props.x}
        y={props.y}
        verticalAnchor="start"
        textAnchor="middle"
        className="select-none"
        style={tickLabel}
      >
        <title>{String(label)}</title>
        {truncateLabel(label)}
      </Text>
    );
  };

  return (
    <div className="relative h-80">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_20%,rgba(139,233,253,0.08),transparent_35%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_85%_10%,rgba(167,139,250,0.12),transparent_30%)]" aria-hidden />
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barSize={36}
          barGap={8}
          margin={{ top: 18, bottom: 22, left: 4, right: 4 }}
          onMouseLeave={() => setActivePhase(null)}
        >
          <defs>
            {data.map((entry) => (
              <linearGradient key={entry.fazaId} id={`phase-${entry.fazaId}-gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={withAlpha(pastelGold, 0.95)} />
                <stop offset="100%" stopColor={withAlpha(pastelGold, 0.35)} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridStyle} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="fazaNaziv"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={<AxisTick />}
            height={56}
            tickMargin={14}
            padding={{ left: 14, right: 14 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            stroke={baseColors.axis}
            tick={tickLabel}
            tickFormatter={(value: number) => formatEUR(value)}
            width={72}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            content={
              <GlassTooltip<number, string>
                valueFormatter={(value) => formatEUR(value ?? 0)}
                labelFormatter={(label, item) => toLabel(item?.payload?.fazaNaziv ?? label).trim()}
              />
            }
          />
          <Bar
            dataKey="znesek"
            radius={[10, 10, 6, 6]}
            background={{ fill: 'rgba(255,255,255,0.02)', radius: [10, 10, 6, 6] }}
            {...animation}
          >
            {data.map((entry) => {
              const isMuted = entry.znesek === 0;
              const isActive = activePhase === entry.fazaId && !isMuted;
              return (
                <Cell
                  key={entry.fazaId}
                  fill={`url(#phase-${entry.fazaId}-gradient)`}
                  fillOpacity={isMuted ? 0.2 : isActive ? 0.95 : 0.78}
                  stroke={withAlpha(pastelGold, isMuted ? 0.35 : isActive ? 0.9 : 0.65)}
                  strokeWidth={isActive ? 2 : 1.2}
                  className="transition-all duration-200"
                  style={{
                    filter: isMuted
                      ? 'none'
                      : isActive
                      ? `drop-shadow(0 8px 22px ${withAlpha(pastelGold, 0.36)})`
                      : `drop-shadow(0 6px 16px ${withAlpha(pastelGold, 0.22)})`,
                  }}
                  onMouseEnter={() => setActivePhase(entry.fazaId)}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

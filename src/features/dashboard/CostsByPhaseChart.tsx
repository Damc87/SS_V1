import { useMemo } from 'react';
import type { TooltipProps } from 'recharts';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';
import { buildPhaseColorMap, getPhaseColor, withAlpha } from '../../lib/phaseColors';

export function CostsByPhaseChart() {
  const { costs, phases, subphases } = useData();

  const subphaseToMain = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(subphases).forEach((list) => {
      list.forEach((sp) => map.set(sp.id, sp.main_phase_id));
    });
    return map;
  }, [subphases]);

  const colorMap = useMemo(() => buildPhaseColorMap(phases), [phases]);

  const data = useMemo(() => {
    const activeCosts = costs.filter((c) => !c.is_archived);
    const values = [...phases]
      .sort((a, b) => a.order_no - b.order_no)
      .map((p) => ({
        name: p.name,
        id: p.id,
        value: activeCosts
          .filter((c) => {
            const mainPhaseId = (c.subphase_id && subphaseToMain.get(c.subphase_id)) || c.phase_id;
            return mainPhaseId === p.id;
          })
          .reduce((acc, c) => acc + c.amount_gross, 0),
        color: colorMap[p.id] ?? getPhaseColor(p.id, p.order_no),
      }));
    return values;
  }, [colorMap, costs, phases, subphaseToMain]);
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

  const tooltipContent = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
      <div className="glass rounded-2xl border border-border/70 px-3 py-2 text-xs shadow-card">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/80">{item.payload.name}</div>
        <div className="text-sm font-semibold text-foreground">{`€ ${Number(item.value ?? 0).toLocaleString('sl-SI', { minimumFractionDigits: 2 })}`}</div>
      </div>
    );
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={30} margin={{ top: 12, bottom: 24, left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="2 12" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            stroke="rgb(var(--text2))"
            interval={0}
            angle={-14}
            textAnchor="end"
            height={64}
            tick={{ fontSize: 12, fill: 'rgba(var(--text2),0.75)' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            stroke="rgb(var(--text2))"
            tick={{ fontSize: 12, fill: 'rgba(var(--text2),0.75)' }}
            tickFormatter={(value: number) => `€ ${value.toLocaleString('sl-SI', { maximumFractionDigits: 0 })}`}
          />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={tooltipContent} />
          <Bar dataKey="value" radius={[18, 18, 14, 14]} background={{ fill: 'rgba(255,255,255,0.02)', radius: 14 }}>
            {data.map((entry) => (
              <Cell key={entry.id} fill={withAlpha(entry.color, hasData ? 0.6 : 0.35)} stroke={withAlpha(entry.color, 0.9)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

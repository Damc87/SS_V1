import type { TooltipPayload, TooltipProps } from 'recharts';
import { formatEUR } from '../../lib/utils';

const baseColors = {
  background: '#0B0F1A',
  card: 'rgba(17,24,39,0.55)',
  grid: 'rgba(255,255,255,0.06)',
  axis: 'rgba(255,255,255,0.55)',
};

const neonPalette = ['#8BE9FD', '#A78BFA', '#7CF5D2', '#7EA0FF', '#FFB86C', '#F472B6'];

const hashString = (value: string) => value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

const sanitizeLabel = (value: unknown) => {
  const text = typeof value === 'string' ? value : value == null ? '' : String(value);
  return text.replace(/\[object Object\],?\s*/gi, '').replace(/\s{2,}/g, ' ').trim();
};

const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getPhaseColor = (phaseId: string) => {
  const base = hashString(phaseId);
  return neonPalette[Math.abs(base) % neonPalette.length];
};

const tickLabel = {
  fontSize: 12,
  fill: baseColors.axis,
  fontWeight: 600,
  fontFamily: '"Space Grotesk", "Inter", system-ui, -apple-system, sans-serif',
};

const gridStyle = {
  stroke: baseColors.grid,
  strokeDasharray: '3 12',
};

const animation = {
  animationDuration: 820,
  animationEasing: 'ease-out' as const,
};

const tooltipStyles = {
  contentStyle: {
    backgroundColor: 'rgba(15,23,42,0.85)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 16,
    boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
    backdropFilter: 'blur(12px)',
    color: '#F8FAFC',
  },
};

type GlassTooltipProps<TValue extends number = number, TName extends string = string> = TooltipProps<TValue, TName> & {
  labelFormatter?: (label?: string | number, item?: TooltipPayload<TValue, TName>) => string;
  valueFormatter?: (value?: TValue, item?: TooltipPayload<TValue, TName>) => string;
};

function GlassTooltip<TValue extends number = number, TName extends string = string>({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
}: GlassTooltipProps<TValue, TName>) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const title = labelFormatter ? labelFormatter(label, item) : (item?.payload?.name as string) || String(label ?? '');
  const valueText = valueFormatter ? valueFormatter(item?.value as TValue, item) : String(item?.value ?? '');

  return (
    <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.85)] px-3.5 py-3 text-xs text-slate-100 shadow-[0_22px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="text-[11px] font-semibold text-white/80">{title}</div>
      <div className="text-sm font-bold text-white">{valueText}</div>
    </div>
  );
}

export {
  animation,
  baseColors,
  formatEUR,
  getPhaseColor,
  GlassTooltip,
  gridStyle,
  neonPalette,
  tickLabel,
  tooltipStyles,
  withAlpha,
  sanitizeLabel,
};

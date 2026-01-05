import { useMemo } from 'react';
import { Activity, BadgeEuro, Building2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { CostsByPhaseChart } from './CostsByPhaseChart';
import { TopContractorsChart } from './TopContractorsChart';
import { CumulatedLineChart } from './CumulatedLineChart';
import { useData } from '../../store/useData';
import { cn, formatEUR } from '../../lib/utils';
import { GlassCard } from './GlassCard';

export function Dashboard() {
  const { costs, contractors, phases, loading, subphases } = useData();
  const hasCosts = costs.length > 0;
  const activeCosts = useMemo(() => costs.filter((c) => !c.is_archived), [costs]);

  const subphaseMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(subphases).forEach((list) => {
      list.forEach((sp) => map.set(sp.id, sp.main_phase_id));
    });
    return map;
  }, [subphases]);

  const phaseTotals = useMemo(() => {
    const sorted = [...phases].sort((a, b) => a.order_no - b.order_no);
    return sorted.map((phase) => ({
      id: phase.id,
      name: phase.name,
      total: activeCosts
        .filter((cost) => {
          const mainPhaseId = (cost.subphase_id && subphaseMap.get(cost.subphase_id)) || cost.phase_id;
          return mainPhaseId === phase.id;
        })
        .reduce((acc, c) => acc + c.amount_gross, 0),
    }));
  }, [activeCosts, phases, subphaseMap]);

  const summary = useMemo(() => {
    const total = activeCosts.reduce((acc, c) => acc + c.amount_gross, 0);
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    const thisMonth = activeCosts.filter((c) => (c.invoice_month || c.invoice_date).startsWith(month)).reduce((acc, c) => acc + c.amount_gross, 0);
    const contractorTotals = contractors.map((c) => ({
      id: c.id,
      name: c.name,
      total: activeCosts.filter((cost) => cost.contractor_id === c.id).reduce((acc, cost) => acc + cost.amount_gross, 0),
    }));
    const topContractor = contractorTotals.sort((a, b) => b.total - a.total)[0];
    const expensivePhase = [...phaseTotals].sort((a, b) => b.total - a.total)[0];

    return {
      total,
      thisMonth,
      topContractor: topContractor?.name ?? 'Ni podatkov',
      topContractorValue: topContractor?.total ?? 0,
      expensivePhase: expensivePhase?.name ?? 'Ni podatkov',
      expensivePhaseValue: expensivePhase?.total ?? 0,
    };
  }, [activeCosts, contractors, phaseTotals]);

  const kpis = [
    {
      label: 'Skupaj stroški',
      value: formatEUR(summary.total),
      hint: 'Kumulativno',
      accent: 'text-primary',
    },
    {
      label: 'Ta mesec',
      value: formatEUR(summary.thisMonth),
      hint: 'Mesečni odmik',
      accent: 'text-success',
    },
    {
      label: 'Največji izvajalec',
      value: summary.topContractor,
      hint: formatEUR(summary.topContractorValue),
      accent: 'text-warning',
    },
    {
      label: 'Najdražja faza',
      value: summary.expensivePhase,
      hint: formatEUR(summary.expensivePhaseValue),
      accent: 'text-danger',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-r from-white/5 via-primary/10 to-white/5 px-6 py-5 shadow-soft">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(34,211,238,0.15),transparent_35%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,rgba(99,102,241,0.18),transparent_32%)]" aria-hidden />
        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Building2 className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] text-muted-foreground/70">Stanje projekta</p>
            <p className="text-2xl font-semibold text-foreground">Pregled stroškov in izvajalcev</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <Card className="relative overflow-hidden glass-strong neon-border">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-white/5" aria-hidden />
              <CardHeader className="relative space-y-4">
                <CardDescription className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80">{kpi.label}</CardDescription>
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-foreground ring-1 ring-white/10', kpi.accent)}>
                    {kpi.label === 'Skupaj stroški' && <BadgeEuro className="h-5 w-5" />}
                    {kpi.label === 'Ta mesec' && <TrendingUp className="h-5 w-5" />}
                    {kpi.label === 'Najdražja faza' && <Activity className="h-5 w-5" />}
                    {kpi.label === 'Največji izvajalec' && <Building2 className="h-5 w-5" />}
                  </div>
                  <div className="space-y-1">
                    {loading ? <div className="h-10 w-32 rounded-lg skeleton" /> : <CardTitle className="text-3xl leading-tight text-foreground">{kpi.value}</CardTitle>}
                    <p className={cn('text-sm font-semibold text-muted-foreground/80', kpi.accent)}>{loading || !hasCosts ? '—' : kpi.hint}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[7fr_3fr]">
        <GlassCard delay={0.18} className="h-full">
          <CardHeader>
            <CardDescription>Stroški po fazah</CardDescription>
            <CardTitle>Realizacija po glavnih fazah</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <CostsByPhaseChart />
          </CardContent>
        </GlassCard>

        <GlassCard delay={0.24} className="h-full">
          <CardHeader>
            <CardDescription>Top izvajalci</CardDescription>
            <CardTitle>Bruto znesek (top 8)</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <TopContractorsChart />
          </CardContent>
        </GlassCard>
      </div>

      <GlassCard delay={0.26}>
        <CardHeader>
          <CardDescription>Mesečni pregled</CardDescription>
          <CardTitle>Mesečne vrednosti</CardTitle>
        </CardHeader>
        <CardContent>
          <CumulatedLineChart />
        </CardContent>
      </GlassCard>
    </div>
  );
}

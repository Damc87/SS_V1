import { useMemo, useState } from 'react';
import { Plus, ReceiptText, Trash2, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { EmptyState } from '../../components/EmptyState';
import { useData } from '../../store/useData';
import type { Cost, CostInput } from '../../types';

type CostDraft = {
  subphase_id: string;
  contractor_id: string;
  description: string;
  price: number | '';
};

const formatCurrency = (value: number) => value.toLocaleString('sl-SI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

export function CostsPage() {
  const navigate = useNavigate();
  const { activeProjectId, costs, phases, subphases, contractors, createCost, updateCost, deleteCost } = useData();

  const projectCosts = useMemo(() => costs.filter((c) => c.project_id === activeProjectId), [costs, activeProjectId]);
  const projectPhases = useMemo(() => {
    const filtered = phases.filter((p) => !p.project_id || p.project_id === activeProjectId);
    return [...filtered].sort((a, b) => a.order_no - b.order_no);
  }, [phases, activeProjectId]);
  const subphaseOptions = useMemo(() => {
    return projectPhases.flatMap((phase) => {
      const subs = [...(subphases[phase.id] ?? [])].sort((a, b) => a.order_no - b.order_no);
      return subs.map((sub) => ({
        id: sub.id,
        label: `${phase.order_no}. ${phase.name} › ${phase.order_no}.${sub.order_no} ${sub.name}`,
        mainPhaseId: phase.id,
      }));
    });
  }, [projectPhases, subphases]);
  const projectContractors = useMemo(
    () => contractors.filter((c) => !c.project_id || c.project_id === activeProjectId),
    [contractors, activeProjectId]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cost | null>(null);
  const [draft, setDraft] = useState<CostDraft>({ subphase_id: '', contractor_id: '', description: '', price: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetDraft = () => {
    setDraft({ subphase_id: '', contractor_id: '', description: '', price: '' });
    setErrors({});
  };

  const startCreate = () => {
    resetDraft();
    setEditing(null);
    setDialogOpen(true);
  };

  const startEdit = (cost: Cost) => {
    setEditing(cost);
    setDraft({
      subphase_id: cost.subphase_id,
      contractor_id: cost.contractor_id,
      description: cost.description ?? '',
      price: cost.amount_gross ?? cost.unit_price ?? 0,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validateDraft = () => {
    const validation: Record<string, string> = {};
    if (!draft.subphase_id) validation.subphase_id = 'Izberite fazo';
    if (!draft.contractor_id) validation.contractor_id = 'Izberite izvajalca';
    const priceValue = draft.price === '' ? 0 : Number(draft.price);
    if (!Number.isFinite(priceValue) || priceValue < 0) validation.price = 'Cena mora biti ≥ 0';
    setErrors(validation);
    return Object.keys(validation).length === 0;
  };

  const handleSave = async () => {
    if (!activeProjectId) {
      toast.error('Najprej izberite projekt.');
      return;
    }
    if (!validateDraft()) return;
    const priceValue = Number(draft.price || 0);
    const selectedSubphase = subphaseOptions.find((s) => s.id === draft.subphase_id);
    const payload: CostInput = {
      project_id: activeProjectId,
      phase_id: selectedSubphase?.mainPhaseId ?? '',
      subphase_id: draft.subphase_id,
      contractor_id: draft.contractor_id,
      description: draft.description ?? '',
      qty: 1,
      unit: 'kos',
      unit_price: priceValue,
      amount_net: priceValue,
      amount_gross: priceValue,
      vat_rate: 0,
      payment_status: 'unpaid',
      date: new Date().toISOString().slice(0, 10),
    };
    try {
      if (editing) {
        await updateCost(editing.id, payload);
        toast.success('Strošek posodobljen');
      } else {
        await createCost(payload);
        toast.success('Strošek dodan');
      }
      setDialogOpen(false);
      setEditing(null);
      resetDraft();
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Shranjevanje ni uspelo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Želite izbrisati ta strošek?')) return;
    try {
      await deleteCost(id);
      toast.success('Strošek izbrisan');
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Brisanje ni uspelo');
    }
  };

  const missingPhases = !projectPhases.length;
  const missingContractors = !projectContractors.length;
  const missingSubphases = !subphaseOptions.length;
  const needsSetup = missingPhases || missingContractors || missingSubphases;

  const formatPhase = (phaseId: string, subphaseId: string) => {
    const main = projectPhases.find((p) => p.id === phaseId);
    const sub = subphases[phaseId]?.find((s) => s.id === subphaseId);
    if (main && sub) return `${main.order_no}. ${main.name} › ${main.order_no}.${sub.order_no} ${sub.name}`;
    if (main) return main.name;
    return '—';
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardDescription>Stroški</CardDescription>
            <CardTitle>Upravljanje stroškov po projektu</CardTitle>
          </div>
          <Button variant="primary" onClick={startCreate} className="shadow-soft" disabled={needsSetup}>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj strošek
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {needsSetup ? (
            <EmptyState
              title="Najprej dodajte faze, podfaze in izvajalce"
              description="Za dodajanje stroškov potrebujete glavno fazo s podfazo ter vsaj enega izvajalca."
              icon={<ReceiptText className="h-5 w-5" />}
              action={
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => navigate('/faze')}>
                    Dodaj faze
                  </Button>
                  <Button variant="secondary" onClick={() => navigate('/izvajalci')}>
                    Dodaj izvajalce
                  </Button>
                </div>
              }
            />
          ) : !projectCosts.length ? (
            <EmptyState
              title="Ni stroškov"
              description="Dodajte prvi strošek za ta projekt."
              icon={<ReceiptText className="h-5 w-5" />}
              action={
                <Button variant="primary" onClick={startCreate} className="shadow-soft">
                  Dodaj strošek
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-surface/90 shadow-inner">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/70 text-muted-foreground">
                  <tr>
                    {['Št.', 'Faza', 'Izvajalec', 'Opis', 'Cena (EUR)', ''].map((header) => (
                      <th key={header} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectCosts.map((cost, index) => (
                    <tr key={cost.id} className={`border-t border-border/50 ${index % 2 === 0 ? 'bg-muted/30' : ''} hover:bg-muted/50`}>
                      <td className="px-4 py-3 font-semibold text-foreground/80">{index + 1}</td>
                      <td className="px-4 py-3 text-foreground">{formatPhase(cost.phase_id, cost.subphase_id)}</td>
                      <td className="px-4 py-3 text-foreground">{projectContractors.find((c) => c.id === cost.contractor_id)?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-foreground">{cost.description || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(cost.amount_gross ?? cost.unit_price)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(cost)} title="Uredi">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(cost.id)} title="Izbriši">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Uredi strošek' : 'Nov strošek'}</DialogTitle>
            <DialogDescription>Vnesite podatke o strošku. Faza in izvajalec sta obvezna, cena mora biti večja ali enaka 0.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="space-y-1 text-sm font-semibold text-foreground">
              Faza (glavna › podfaza)
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={draft.subphase_id}
                onChange={(e) => setDraft((prev) => ({ ...prev, subphase_id: e.target.value }))}
              >
                <option value="">Izberi podfazo</option>
                {subphaseOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.subphase_id && <p className="text-xs text-destructive">{errors.subphase_id}</p>}
            </label>
            <label className="space-y-1 text-sm font-semibold text-foreground">
              Izvajalec
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={draft.contractor_id}
                onChange={(e) => setDraft((prev) => ({ ...prev, contractor_id: e.target.value }))}
              >
                <option value="">Izberi izvajalca</option>
                {projectContractors.map((ctr) => (
                  <option key={ctr.id} value={ctr.id}>
                    {ctr.name}
                  </option>
                ))}
              </select>
              {errors.contractor_id && <p className="text-xs text-destructive">{errors.contractor_id}</p>}
            </label>
            <label className="space-y-1 text-sm font-semibold text-foreground">
              Opis (neobvezno)
              <Input placeholder="Opis stroška" value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm font-semibold text-foreground">
              Cena (EUR)
              <Input
                type="number"
                min={0}
                step="0.01"
                value={draft.price}
                onChange={(e) => setDraft((prev) => ({ ...prev, price: e.target.value === '' ? '' : Number(e.target.value) }))}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </label>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Prekliči
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Shrani
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

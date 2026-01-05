import { useMemo, useState } from 'react';
import { Archive, Check, Edit3, FileText, Plus, RefreshCcw, Trash2, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { EmptyState } from '../../components/EmptyState';
import { useData } from '../../store/useData';
import type { Cost, CostInput, Subphase } from '../../types';
import { formatEUR } from '../../lib/utils';

type FileWithPath = File & { path?: string };

type CostDraft = {
  phase_id: string;
  subphase_id: string;
  contractor_id: string;
  description: string;
  amount_gross: string;
  invoice_date: string;
  invoice_month: string;
  invoice_no: string;
  pdf?: FileWithPath | null;
};

const today = new Date().toISOString().slice(0, 10);

const deriveMonth = (date: string, existing?: string) => (existing && existing.length >= 4 ? existing : date.slice(0, 7));

export function CostsPage() {
  const navigate = useNavigate();
  const { activeProjectId, costs, phases, subphases, contractors, createCost, updateCost, archiveCost, deleteCost, attachCostPdf } = useData();

  const projectPhases = useMemo(() => {
    const filtered = phases.filter((p) => !p.project_id || p.project_id === activeProjectId);
    return [...filtered].sort((a, b) => a.order_no - b.order_no);
  }, [phases, activeProjectId]);
  const projectSubphases = useMemo(() => {
    return projectPhases.reduce<Record<string, Subphase[]>>((acc, phase) => {
      acc[phase.id] = [...(subphases[phase.id] ?? [])].sort((a, b) => a.order_no - b.order_no);
      return acc;
    }, {});
  }, [projectPhases, subphases]);
  const projectContractors = useMemo(
    () => contractors.filter((c) => (!c.project_id || c.project_id === activeProjectId) && !c.is_archived),
    [contractors, activeProjectId]
  );
  const projectCosts = useMemo(() => costs.filter((c) => c.project_id === activeProjectId), [costs, activeProjectId]);

  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState<CostDraft>({
    phase_id: '',
    subphase_id: '',
    contractor_id: '',
    description: '',
    amount_gross: '',
    invoice_date: today,
    invoice_month: today.slice(0, 7),
    invoice_no: '',
    pdf: null,
  });
  const [editDraft, setEditDraft] = useState<CostDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCosts = useMemo(
    () => projectCosts.filter((c) => (showArchived ? c.is_archived : !c.is_archived)),
    [projectCosts, showArchived]
  );

  const validate = (draft: CostDraft) => {
    const validation: Record<string, string> = {};
    if (!draft.subphase_id) validation.subphase_id = 'Podfaza je obvezna';
    if (!draft.contractor_id) validation.contractor_id = 'Izvajalec je obvezen';
    if (!draft.invoice_date) validation.invoice_date = 'Datum računa je obvezen';
    const amount = Number(draft.amount_gross || 0);
    if (!Number.isFinite(amount) || amount < 0) validation.amount_gross = 'Znesek mora biti ≥ 0';
    setErrors(validation);
    return Object.keys(validation).length === 0;
  };

  const resetNewDraft = () =>
    setNewDraft({
      phase_id: '',
      subphase_id: '',
      contractor_id: '',
      description: '',
      amount_gross: '',
      invoice_date: today,
      invoice_month: today.slice(0, 7),
      invoice_no: '',
      pdf: null,
    });

  const handleAdd = async () => {
    if (!activeProjectId) {
      toast.error('Najprej izberite projekt.');
      return;
    }
    if (!validate(newDraft)) return;
    const amount = Number(newDraft.amount_gross || 0);
    const payload: CostInput = {
      project_id: activeProjectId,
      phase_id: newDraft.phase_id,
      subphase_id: newDraft.subphase_id,
      contractor_id: newDraft.contractor_id,
      description: newDraft.description,
      amount_gross: amount,
      invoice_date: newDraft.invoice_date,
      invoice_month: deriveMonth(newDraft.invoice_date, newDraft.invoice_month),
      invoice_no: newDraft.invoice_no,
      is_archived: false,
    };
    try {
      const created = await createCost(payload);
      const pdfPath = newDraft.pdf?.path;
      if (newDraft.pdf && pdfPath) {
        await attachCostPdf(created.id, pdfPath);
      }
      toast.success('Strošek dodan.');
      resetNewDraft();
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Shranjevanje ni uspelo.');
    }
  };

  const startEdit = (cost: Cost) => {
    setEditingId(cost.id);
    setEditDraft({
      phase_id: cost.phase_id,
      subphase_id: cost.subphase_id,
      contractor_id: cost.contractor_id,
      description: cost.description,
      amount_gross: String(cost.amount_gross ?? ''),
      invoice_date: cost.invoice_date,
      invoice_month: cost.invoice_month,
      invoice_no: cost.invoice_no ?? '',
      pdf: null,
    });
    setErrors({});
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft) return;
    if (!validate(editDraft)) return;
    const amount = Number(editDraft.amount_gross || 0);
    const payload: Partial<CostInput> = {
      phase_id: editDraft.phase_id,
      subphase_id: editDraft.subphase_id,
      contractor_id: editDraft.contractor_id,
      description: editDraft.description,
      amount_gross: amount,
      invoice_date: editDraft.invoice_date,
      invoice_month: deriveMonth(editDraft.invoice_date, editDraft.invoice_month),
      invoice_no: editDraft.invoice_no,
    };
    try {
      await updateCost(editingId, payload);
      const pdfPath = editDraft.pdf?.path;
      if (editDraft.pdf && pdfPath) {
        await attachCostPdf(editingId, pdfPath);
      }
      toast.success('Strošek posodobljen.');
      setEditingId(null);
      setEditDraft(null);
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Posodobitev ni uspela.');
    }
  };

  const handleArchiveToggle = async (id: string, next: boolean) => {
    try {
      await archiveCost(id, next);
      toast.success(next ? 'Strošek arhiviran.' : 'Strošek obnovljen.');
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Sprememba arhiva ni uspela.');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Trajno izbrišem strošek? (če ni arhiviran, bo najprej arhiviran)');
    if (!confirmed) return;
    try {
      await deleteCost(id);
      toast.success('Strošek odstranjen.');
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Brisanje ni uspelo.');
    }
  };

  const handlePdfOpen = async (cost: Cost) => {
    if (!cost.pdf_attachment?.stored_path) return;
    await window.api.costs.openPdf(cost.pdf_attachment.stored_path);
  };

  const phaseName = (phaseId: string) => projectPhases.find((p) => p.id === phaseId)?.name ?? '—';
  const subphaseName = (phaseId: string, subphaseId: string) =>
    projectSubphases[phaseId]?.find((s) => s.id === subphaseId)?.name ?? '—';
  const contractorName = (id: string) => projectContractors.find((c) => c.id === id)?.name ?? '—';

  const missingPhases = !projectPhases.length;
  const missingContractors = !projectContractors.length;
  const missingSubphases = projectPhases.every((p) => (projectSubphases[p.id] ?? []).length === 0);
  const needsSetup = missingPhases || missingContractors || missingSubphases;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardDescription>Stroški</CardDescription>
          <CardTitle>Pregled in urejanje stroškov</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" className="h-4 w-4 rounded border-border" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Prikaži arhiv
          </label>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => toast.info('Osveži z gumbom v zgornji vrstici.')}>
            <RefreshCcw className="h-4 w-4" />
            Osveži
          </Button>
        </div>
      </div>

      {needsSetup ? (
        <EmptyState
          title="Najprej dodajte faze, podfaze in izvajalce"
          description="Za dodajanje stroškov potrebujete glavno fazo s podfazo ter vsaj enega izvajalca."
          icon={<FileText className="h-5 w-5" />}
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
      ) : (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card className="glass xl:col-span-1 overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardDescription>Seznam stroškov</CardDescription>
                <CardTitle className="text-xl">{showArchived ? 'Arhivirani stroški' : 'Aktivni stroški'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/70 text-muted-foreground">
                    <tr>
                      {['Št.', 'Glavna faza', 'Podfaza', 'Izvajalec', 'Opis', 'Datum računa', 'Mesec', 'Št. računa', 'Znesek', 'PDF', 'Akcije'].map(
                        (header) => (
                          <th key={header} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em]">
                            {header}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCosts.map((cost, index) => {
                      const isEditing = editingId === cost.id && editDraft;
                      return (
                        <tr key={cost.id} className="border-t border-border/60 hover:bg-muted/50">
                          <td className="px-3 py-2 font-semibold text-foreground/80">{index + 1}</td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <select
                                className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm"
                                value={editDraft?.phase_id ?? ''}
                                onChange={(e) =>
                                  setEditDraft((prev) =>
                                    prev ? { ...prev, phase_id: e.target.value, subphase_id: '' } : prev
                                  )
                                }
                              >
                                <option value="">Izberi</option>
                                {projectPhases.map((phase) => (
                                  <option key={phase.id} value={phase.id}>
                                    {phase.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              phaseName(cost.phase_id)
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <select
                                className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm"
                                value={editDraft?.subphase_id ?? ''}
                                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, subphase_id: e.target.value } : prev))}
                              >
                                <option value="">Izberi</option>
                                {(projectSubphases[editDraft?.phase_id ?? cost.phase_id] ?? []).map((sub) => (
                                  <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              subphaseName(cost.phase_id, cost.subphase_id)
                            )}
                            {isEditing && errors.subphase_id && <p className="text-xs text-destructive">{errors.subphase_id}</p>}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <select
                                className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm"
                                value={editDraft?.contractor_id ?? ''}
                                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, contractor_id: e.target.value } : prev))}
                              >
                                <option value="">Izberi</option>
                                {projectContractors.map((ctr) => (
                                  <option key={ctr.id} value={ctr.id}>
                                    {ctr.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              contractorName(cost.contractor_id)
                            )}
                            {isEditing && errors.contractor_id && <p className="text-xs text-destructive">{errors.contractor_id}</p>}
                          </td>
                          <td className="px-3 py-2 text-foreground">
                            {isEditing ? (
                              <Input
                                value={editDraft?.description ?? ''}
                                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                              />
                            ) : (
                              cost.description || '—'
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                type="date"
                                value={editDraft?.invoice_date ?? ''}
                                onChange={(e) =>
                                  setEditDraft((prev) =>
                                    prev
                                      ? { ...prev, invoice_date: e.target.value, invoice_month: deriveMonth(e.target.value, prev.invoice_month) }
                                      : prev
                                  )
                                }
                              />
                            ) : (
                              cost.invoice_date
                            )}
                            {isEditing && errors.invoice_date && <p className="text-xs text-destructive">{errors.invoice_date}</p>}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                value={editDraft?.invoice_month ?? ''}
                                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, invoice_month: e.target.value } : prev))}
                              />
                            ) : (
                              cost.invoice_month
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                value={editDraft?.invoice_no ?? ''}
                                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, invoice_no: e.target.value } : prev))}
                              />
                            ) : (
                              cost.invoice_no || '—'
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">{formatEUR(cost.amount_gross)}</td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-primary">
                                <UploadCloud className="h-4 w-4" />
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, pdf: e.target.files?.[0] ?? null } : prev))}
                                />
                                PDF
                              </label>
                            ) : cost.pdf_attachment ? (
                              <Button size="sm" variant="secondary" onClick={() => handlePdfOpen(cost)}>
                                Odpri
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <Button size="sm" variant="primary" onClick={saveEdit} className="gap-1">
                                  <Check className="h-4 w-4" />
                                  Shrani
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                  Prekliči
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => startEdit(cost)} title="Uredi">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleArchiveToggle(cost.id, !cost.is_archived)} title="Arhiviraj/obnovi">
                                  <Archive className="h-4 w-4" />
                                </Button>
                                {cost.is_archived && (
                                  <Button size="sm" variant="ghost" onClick={() => handleDelete(cost.id)} title="Trajno izbriši">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!filteredCosts.length && (
                      <tr>
                        <td className="px-4 py-8 text-center text-sm text-muted-foreground" colSpan={11}>
                          Ni zapisov v tem pogledu.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardDescription>Nov strošek</CardDescription>
              <CardTitle>Hiter vnos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold text-foreground">
                  Glavna faza
                  <select
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    value={newDraft.phase_id}
                    onChange={(e) =>
                      setNewDraft((prev) => ({
                        ...prev,
                        phase_id: e.target.value,
                        subphase_id: '',
                      }))
                    }
                  >
                    <option value="">Izberi fazo</option>
                    {projectPhases.map((phase) => (
                      <option key={phase.id} value={phase.id}>
                        {phase.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-semibold text-foreground">
                  Podfaza
                  <select
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    value={newDraft.subphase_id}
                    onChange={(e) => setNewDraft((prev) => ({ ...prev, subphase_id: e.target.value }))}
                  >
                    <option value="">Izberi podfazo</option>
                    {(projectSubphases[newDraft.phase_id] ?? []).map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                  {errors.subphase_id && <p className="text-xs text-destructive">{errors.subphase_id}</p>}
                </label>
              </div>
              <label className="space-y-1 text-sm font-semibold text-foreground">
                Izvajalec
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={newDraft.contractor_id}
                  onChange={(e) => setNewDraft((prev) => ({ ...prev, contractor_id: e.target.value }))}
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
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold text-foreground">
                  Opis
                  <Input placeholder="Opis" value={newDraft.description} onChange={(e) => setNewDraft((prev) => ({ ...prev, description: e.target.value }))} />
                </label>
                <label className="space-y-1 text-sm font-semibold text-foreground">
                  Znesek (EUR)
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newDraft.amount_gross}
                    onChange={(e) => setNewDraft((prev) => ({ ...prev, amount_gross: e.target.value }))}
                  />
                  {errors.amount_gross && <p className="text-xs text-destructive">{errors.amount_gross}</p>}
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="space-y-1 text-sm font-semibold text-foreground">
                  Datum računa
                  <Input
                    type="date"
                    value={newDraft.invoice_date}
                    onChange={(e) =>
                      setNewDraft((prev) => ({
                        ...prev,
                        invoice_date: e.target.value,
                        invoice_month: deriveMonth(e.target.value, prev.invoice_month),
                      }))
                    }
                  />
                  {errors.invoice_date && <p className="text-xs text-destructive">{errors.invoice_date}</p>}
                </label>
                <label className="space-y-1 text-sm font-semibold text-foreground">
                  Mesec
                  <Input value={newDraft.invoice_month} onChange={(e) => setNewDraft((prev) => ({ ...prev, invoice_month: e.target.value }))} />
                </label>
                <label className="space-y-1 text-sm font-semibold text-foreground">
                  Št. računa
                  <Input value={newDraft.invoice_no} onChange={(e) => setNewDraft((prev) => ({ ...prev, invoice_no: e.target.value }))} />
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/50 px-4 py-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary">
                  <UploadCloud className="h-4 w-4" />
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setNewDraft((prev) => ({ ...prev, pdf: e.target.files?.[0] ?? null }))}
                  />
                  Pripni PDF
                </label>
                {newDraft.pdf && <span className="text-xs text-muted-foreground">{newDraft.pdf.name}</span>}
              </div>
              <Button
                variant="primary"
                className="w-full justify-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-soft transition hover:brightness-105"
                onClick={handleAdd}
              >
                <Plus className="mr-2 h-4 w-4" />
                Dodaj strošek
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

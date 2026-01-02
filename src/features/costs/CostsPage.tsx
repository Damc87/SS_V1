import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  Filter,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../../store/useData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';
import type { Cost, CostInput, PaymentStatus } from '../../types';

type SortField = 'date' | 'amount_gross' | 'phase' | 'contractor';

const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: 'Plačano',
  unpaid: 'Neplačano',
  partial: 'Delno',
};

const formatCurrency = (value: number) => value.toLocaleString('sl-SI', { style: 'currency', currency: 'EUR' });

const computeAmounts = (draft: Partial<CostInput>) => {
  const qty = Number(draft.qty ?? 0);
  const unitPrice = Number(draft.unit_price ?? 0);
  const vat = Number(draft.vat_rate ?? 0);
  const net = Number.isFinite(qty * unitPrice) ? qty * unitPrice : 0;
  const gross = net * (1 + vat / 100);
  return { net, gross };
};

const defaultDraft = (projectId?: string): CostInput => ({
  project_id: projectId ?? '',
  date: new Date().toISOString().slice(0, 10),
  phase_id: '',
  contractor_id: '',
  description: '',
  qty: 1,
  unit: 'kos',
  unit_price: 0,
  vat_rate: 22,
  payment_status: 'unpaid',
  invoice_no: '',
  note: '',
});

export function CostsPage() {
  const navigate = useNavigate();
  const {
    costs,
    phases,
    contractors,
    activeProjectId,
    createCost,
    updateCost,
    deleteCost,
    duplicateCost,
    exportCosts,
    importCosts,
  } = useData();

  const [filters, setFilters] = useState({ search: '', dateFrom: '', dateTo: '', phaseId: '', contractorId: '', status: '' });
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({ field: 'date', direction: 'desc' });
  const [newCost, setNewCost] = useState<CostInput>(() => defaultDraft(activeProjectId ?? undefined));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Cost | null>(null);
  const [validation, setValidation] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(true);
  const newDescriptionRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNewCost(defaultDraft(activeProjectId ?? undefined));
  }, [activeProjectId]);

  const filteredPhases = useMemo(
    () => phases.filter((p) => !p.project_id || p.project_id === activeProjectId),
    [phases, activeProjectId]
  );
  const filteredContractors = useMemo(
    () => contractors.filter((c) => !c.project_id || c.project_id === activeProjectId),
    [contractors, activeProjectId]
  );

  const resolvePhaseId = (value: string) => {
    const match = filteredPhases.find((p) => p.id === value || p.name.toLowerCase() === value.toLowerCase());
    return match?.id ?? '';
  };

  const resolveContractorId = (value: string) => {
    const match = filteredContractors.find((c) => c.id === value || c.name.toLowerCase() === value.toLowerCase());
    return match?.id ?? '';
  };

  const filteredCosts = useMemo(() => {
    const search = filters.search.toLowerCase();
    let list = [...costs];
    list = list.filter((c) => {
      if (filters.dateFrom && c.date < filters.dateFrom) return false;
      if (filters.dateTo && c.date > filters.dateTo) return false;
      if (filters.phaseId && c.phase_id !== filters.phaseId) return false;
      if (filters.contractorId && c.contractor_id !== filters.contractorId) return false;
      if (filters.status && c.payment_status !== filters.status) return false;
      if (search && !`${c.description} ${c.invoice_no ?? ''}`.toLowerCase().includes(search)) return false;
      return true;
    });

    list.sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      if (sort.field === 'amount_gross') return (a.amount_gross - b.amount_gross) * dir;
      if (sort.field === 'phase') {
        const aName = phases.find((p) => p.id === a.phase_id)?.name ?? '';
        const bName = phases.find((p) => p.id === b.phase_id)?.name ?? '';
        return aName.localeCompare(bName) * dir;
      }
      if (sort.field === 'contractor') {
        const aName = contractors.find((p) => p.id === a.contractor_id)?.name ?? '';
        const bName = contractors.find((p) => p.id === b.contractor_id)?.name ?? '';
        return aName.localeCompare(bName) * dir;
      }
      return (a.date < b.date ? 1 : -1) * dir;
    });
    return list;
  }, [contractors, costs, filters, phases, sort]);

  const totals = useMemo(
    () => ({
      net: filteredCosts.reduce((acc, c) => acc + c.amount_net, 0),
      gross: filteredCosts.reduce((acc, c) => acc + c.amount_gross, 0),
      count: filteredCosts.length,
    }),
    [filteredCosts]
  );

  const newAmounts = computeAmounts(newCost);
  const editAmounts = editDraft ? computeAmounts(editDraft) : null;

  const setSortField = (field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const validateDraft = (draft: Partial<CostInput>) => {
    const errors: Record<string, string> = {};
    if (!draft.phase_id) errors.phase_id = 'Izberite fazo';
    if (!draft.contractor_id) errors.contractor_id = 'Izberite izvajalca';
    if (!draft.description) errors.description = 'Opis je obvezen';
    return errors;
  };

  const handleSaveNew = async () => {
    if (!activeProjectId) {
      toast.error('Najprej izberite projekt.');
      return;
    }
    const errors = validateDraft(newCost);
    if (Object.keys(errors).length) {
      setValidation(errors);
      return;
    }
    try {
      await createCost({
        ...newCost,
        project_id: activeProjectId,
        amount_net: newAmounts.net,
        amount_gross: newAmounts.gross,
      });
      setValidation({});
      const reset = defaultDraft(activeProjectId);
      setNewCost(reset);
      newDescriptionRef.current?.focus();
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Shranjevanje ni uspelo');
    }
  };

  const handleSaveEdit = async () => {
    if (!editDraft) return;
    const errors = validateDraft(editDraft);
    if (Object.keys(errors).length) {
      setValidation(errors);
      return;
    }
    try {
      await updateCost(editDraft.id, {
        ...editDraft,
        amount_net: editAmounts?.net,
        amount_gross: editAmounts?.gross,
      });
      setEditingId(null);
      setEditDraft(null);
      setValidation({});
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Posodobitev ni uspela');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Želite izbrisati ta strošek?')) return;
    await deleteCost(id);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateCost(id);
    toast.success('Strošek podvojen');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
    setValidation({});
  };

  const handleTogglePaid = async (cost: Cost) => {
    const next: PaymentStatus = cost.payment_status === 'paid' ? 'unpaid' : 'paid';
    await updateCost(cost.id, { payment_status: next });
  };

  const handleImport = () => {
    importRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeProjectId) return;
    const content = await file.text();
    const result = await importCosts(content, activeProjectId);
    if (result.missingPhases?.length || result.missingContractors?.length) {
      toast.error(`Manjkajoče faze/izvajalci: ${[...(result.missingPhases ?? []), ...(result.missingContractors ?? [])].join(', ')}`);
    } else {
      toast.success(`Uvoženih ${result.created?.length ?? 0} vnosov`);
    }
    event.target.value = '';
  };

  const handleExport = async () => {
    if (!activeProjectId) return;
    const csv = await exportCosts(activeProjectId, {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      phaseId: filters.phaseId,
      contractorId: filters.contractorId,
      paymentStatus: filters.status,
      search: filters.search,
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stroski.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditing = (cost: Cost) => {
    setEditingId(cost.id);
    setEditDraft(cost);
    setValidation({});
  };

  const handleNewKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveNew();
    }
    if (e.key === 'Escape') {
      setNewCost(defaultDraft(activeProjectId ?? undefined));
      setValidation({});
    }
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const renderStatusPill = (status: PaymentStatus) => {
    const colors =
      status === 'paid' ? 'bg-emerald-100 text-emerald-700' : status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
    return <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', colors)}>{paymentStatusLabels[status]}</span>;
  };

  const showEmptySetup = !filteredPhases.length || !filteredContractors.length;

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardDescription>Stroški</CardDescription>
            <CardTitle>Hitro upravljanje stroškov na projektu</CardTitle>
          </div>
          <div className="flex gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 shadow-inner">
              <span className="text-xs uppercase tracking-[0.12em]">Skupaj</span>
              <strong className="text-foreground">{formatCurrency(totals.gross)}</strong>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 shadow-inner">
              <span className="text-xs uppercase tracking-[0.12em]">Neto</span>
              <strong className="text-foreground">{formatCurrency(totals.net)}</strong>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 shadow-inner">
              <span className="text-xs uppercase tracking-[0.12em]">Postavke</span>
              <strong className="text-foreground">{totals.count}</strong>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showEmptySetup ? (
            <EmptyState
              title="Najprej dodajte faze in izvajalce"
              description="Za dodajanje stroškov potrebujete vsaj eno fazo in enega izvajalca."
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
          ) : (
            <>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" className="shadow-soft" onClick={() => newDescriptionRef.current?.focus()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj vrstico
                  </Button>
                  <Button variant="secondary" className="shadow-soft" onClick={handleImport}>
                    <Upload className="mr-2 h-4 w-4" />
                    Uvoz CSV
                  </Button>
                  <Button variant="secondary" className="shadow-soft" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Izvoz CSV
                  </Button>
                  <Button variant="ghost" onClick={() => setShowFilters((p) => !p)}>
                    <Filter className="mr-2 h-4 w-4" />
                    Filtri
                  </Button>
                </div>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Išči po opisu ali računu"
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>

              {showFilters && (
                <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/60 p-3 shadow-inner md:grid-cols-5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Datum od
                    <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))} />
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Datum do
                    <Input type="date" value={filters.dateTo} onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))} />
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Faza
                    <select
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      value={filters.phaseId}
                      onChange={(e) => setFilters((prev) => ({ ...prev, phaseId: e.target.value }))}
                    >
                      <option value="">Vse</option>
                      {filteredPhases.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Izvajalec
                    <select
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      value={filters.contractorId}
                      onChange={(e) => setFilters((prev) => ({ ...prev, contractorId: e.target.value }))}
                    >
                      <option value="">Vsi</option>
                      {filteredContractors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Status
                    <select
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      value={filters.status}
                      onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">Vsi</option>
                      <option value="paid">Plačano</option>
                      <option value="unpaid">Neplačano</option>
                      <option value="partial">Delno</option>
                    </select>
                  </label>
                </div>
              )}

              <div className="overflow-hidden rounded-3xl border border-border/80 bg-surface/90 shadow-inner">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/70 text-muted-foreground">
                    <tr>
                      {[
                        { key: 'date', label: 'Datum' },
                        { key: 'phase', label: 'Faza' },
                        { key: 'contractor', label: 'Izvajalec' },
                        { key: 'description', label: 'Opis' },
                        { key: 'qty', label: 'Količina' },
                        { key: 'unit', label: 'Enota' },
                        { key: 'unit_price', label: 'Cena/enoto' },
                        { key: 'vat_rate', label: 'DDV %' },
                        { key: 'amount_net', label: 'Neto' },
                        { key: 'amount_gross', label: 'Bruto' },
                        { key: 'status', label: 'Status' },
                        { key: 'actions', label: '' },
                      ].map((col) => (
                        <th key={col.key} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em]">
                          {['description', 'qty', 'unit', 'unit_price', 'vat_rate', 'actions'].includes(col.key) ? (
                            col.label
                          ) : (
                            <button className="flex items-center gap-1" onClick={() => setSortField(col.key as SortField)}>
                              {col.label}
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-muted/60">
                      <td className="px-3 py-2">
                        <Input type="date" value={newCost.date} onKeyDown={handleNewKeyDown} onChange={(e) => setNewCost((prev) => ({ ...prev, date: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          list="phase-options"
                          className={cn('w-full rounded-xl border px-3 py-2 text-sm', validation.phase_id && 'border-destructive')}
                          value={filteredPhases.find((p) => p.id === newCost.phase_id)?.name ?? ''}
                          onKeyDown={handleNewKeyDown}
                          onChange={(e) => setNewCost((prev) => ({ ...prev, phase_id: resolvePhaseId(e.target.value) }))}
                        />
                        {validation.phase_id && <p className="mt-1 text-xs text-destructive">{validation.phase_id}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          list="contractor-options"
                          className={cn('w-full rounded-xl border px-3 py-2 text-sm', validation.contractor_id && 'border-destructive')}
                          value={filteredContractors.find((c) => c.id === newCost.contractor_id)?.name ?? ''}
                          onKeyDown={handleNewKeyDown}
                          onChange={(e) => setNewCost((prev) => ({ ...prev, contractor_id: resolveContractorId(e.target.value) }))}
                        />
                        {validation.contractor_id && <p className="mt-1 text-xs text-destructive">{validation.contractor_id}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          ref={newDescriptionRef}
                          placeholder="Opis"
                          value={newCost.description}
                          onKeyDown={handleNewKeyDown}
                          onChange={(e) => setNewCost((prev) => ({ ...prev, description: e.target.value }))}
                          className={validation.description ? 'border-destructive' : undefined}
                        />
                        {validation.description && <p className="mt-1 text-xs text-destructive">{validation.description}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={newCost.qty}
                          onKeyDown={handleNewKeyDown}
                          onChange={(e) => setNewCost((prev) => ({ ...prev, qty: Number(e.target.value) }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input value={newCost.unit} onKeyDown={handleNewKeyDown} onChange={(e) => setNewCost((prev) => ({ ...prev, unit: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={newCost.unit_price}
                          onKeyDown={handleNewKeyDown}
                          onChange={(e) => setNewCost((prev) => ({ ...prev, unit_price: Number(e.target.value) }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          value={newCost.vat_rate}
                          onKeyDown={handleNewKeyDown}
                          onChange={(e) => setNewCost((prev) => ({ ...prev, vat_rate: Number(e.target.value) }))}
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-foreground/90">{formatCurrency(newAmounts.net)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-foreground">{formatCurrency(newAmounts.gross)}</td>
                      <td className="px-3 py-2">
                        <select
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                          value={newCost.payment_status}
                          onKeyDown={handleNewKeyDown}
                          onChange={(e) => setNewCost((prev) => ({ ...prev, payment_status: e.target.value as PaymentStatus }))}
                        >
                          <option value="unpaid">Neplačano</option>
                          <option value="partial">Delno</option>
                          <option value="paid">Plačano</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="primary" className="shadow-soft" onClick={handleSaveNew}>
                          Shrani
                        </Button>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {!filteredCosts.length && (
                      <tr>
                        <td colSpan={12}>
                          <EmptyState
                            className="py-10"
                            title="Ni stroškov za prikazane filtre"
                            description="Dodajte novo vrstico v zgornjem vnosu ali prilagodite filtre."
                            icon={<ReceiptText className="h-5 w-5" />}
                          />
                        </td>
                      </tr>
                    )}
                    {filteredCosts.map((c, idx) => {
                      const isEditing = editingId === c.id && editDraft;
                      const draft = isEditing ? editDraft! : c;
                      const amounts = isEditing ? editAmounts : { net: c.amount_net, gross: c.amount_gross };
                      return (
                        <tr key={c.id} className={cn('border-t border-border/60 transition hover:bg-muted/40', idx % 2 === 0 && 'bg-muted/30')}>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                type="date"
                                value={draft.date}
                                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, date: e.target.value } : prev))}
                                onKeyDown={handleEditKeyDown}
                              />
                            ) : (
                              <span className="text-foreground/90">{c.date}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                list="phase-options"
                                className={cn('w-full rounded-xl border px-3 py-2 text-sm', validation.phase_id && 'border-destructive')}
                                value={filteredPhases.find((p) => p.id === draft.phase_id)?.name ?? ''}
                                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, phase_id: resolvePhaseId(e.target.value) } : prev))}
                                onKeyDown={handleEditKeyDown}
                              />
                            ) : (
                              <span className="text-foreground/90">{phases.find((p) => p.id === c.phase_id)?.name ?? '—'}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                list="contractor-options"
                                className={cn('w-full rounded-xl border px-3 py-2 text-sm', validation.contractor_id && 'border-destructive')}
                                value={filteredContractors.find((p) => p.id === draft.contractor_id)?.name ?? ''}
                                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, contractor_id: resolveContractorId(e.target.value) } : prev))}
                                onKeyDown={handleEditKeyDown}
                              />
                            ) : (
                              <span className="text-foreground/90">{contractors.find((p) => p.id === c.contractor_id)?.name ?? '—'}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                value={draft.description}
                                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                                onKeyDown={handleEditKeyDown}
                                className={validation.description ? 'border-destructive' : undefined}
                              />
                            ) : (
                              <span className="font-semibold text-foreground">{c.description}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={draft.qty}
                                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, qty: Number(e.target.value) } : prev))}
                                onKeyDown={handleEditKeyDown}
                              />
                            ) : (
                              <span>{c.qty}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input value={draft.unit} onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, unit: e.target.value } : prev))} onKeyDown={handleEditKeyDown} />
                            ) : (
                              <span>{c.unit}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={draft.unit_price}
                                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, unit_price: Number(e.target.value) } : prev))}
                                onKeyDown={handleEditKeyDown}
                              />
                            ) : (
                              <span>{formatCurrency(c.unit_price)}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                step="0.1"
                                value={draft.vat_rate}
                                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, vat_rate: Number(e.target.value) } : prev))}
                                onKeyDown={handleEditKeyDown}
                              />
                            ) : (
                              <span>{c.vat_rate ?? 0}%</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-foreground/90">{formatCurrency(amounts?.net ?? 0)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-foreground">{formatCurrency(amounts?.gross ?? 0)}</td>
                          <td className="px-3 py-2">{renderStatusPill(draft.payment_status)}</td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-1">
                              {isEditing ? (
                                <>
                                  <Button size="sm" variant="secondary" onClick={handleSaveEdit}>
                                    Shrani
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                    Prekliči
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" className="h-9 w-9 p-0" variant="ghost" onClick={() => handleEditing(c)} title="Uredi">
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" className="h-9 w-9 p-0" variant="ghost" onClick={() => handleDuplicate(c.id)} title="Podvoji">
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" className="h-9 w-9 p-0" variant="ghost" onClick={() => handleTogglePaid(c)} title="Plačano / neplačano">
                                    {c.payment_status === 'paid' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                                  </Button>
                                  <Button size="sm" className="h-9 w-9 p-0" variant="ghost" onClick={() => handleDelete(c.id)} title="Izbriši">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <datalist id="phase-options">
        {filteredPhases.map((p) => (
          <option key={p.id} value={p.name} />
        ))}
      </datalist>
      <datalist id="contractor-options">
        {filteredContractors.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>
      <input type="file" ref={importRef} accept=".csv" className="hidden" onChange={handleImportFile} />
    </div>
  );
}

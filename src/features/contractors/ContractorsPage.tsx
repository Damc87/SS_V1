import { useMemo, useState } from 'react';
import { PhoneCall, Plus, Trash2, Edit3, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { EmptyState } from '../../components/EmptyState';
import { useData } from '../../store/useData';
import type { Contractor } from '../../types';

type ContractorDraft = {
  name: string;
  phase_id: string;
};

export function ContractorsPage() {
  const navigate = useNavigate();
  const { activeProjectId, contractors, phases, createContractor, updateContractor, deleteContractor } = useData();
  const projectPhases = useMemo(() => phases.filter((p) => !p.project_id || p.project_id === activeProjectId), [phases, activeProjectId]);
  const projectContractors = useMemo(
    () => contractors.filter((c) => !c.project_id || c.project_id === activeProjectId),
    [contractors, activeProjectId]
  );

  const [filter, setFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contractor | null>(null);
  const [draft, setDraft] = useState<ContractorDraft>({ name: '', phase_id: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = projectContractors.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));

  const resetDraft = () => {
    setDraft({ name: '', phase_id: '' });
    setErrors({});
  };

  const startCreate = () => {
    resetDraft();
    setEditing(null);
    setDialogOpen(true);
  };

  const startEdit = (contractor: Contractor) => {
    setEditing(contractor);
    setDraft({ name: contractor.name, phase_id: contractor.phase_id ?? '' });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const validation: Record<string, string> = {};
    if (!draft.name.trim()) validation.name = 'Naziv je obvezen';
    if (!draft.phase_id) validation.phase_id = 'Faza je obvezna';
    const duplicate = projectContractors.find(
      (c) => c.id !== editing?.id && c.name.toLowerCase() === draft.name.trim().toLowerCase()
    );
    if (duplicate) validation.name = 'Izvajalec s tem nazivom že obstaja';
    setErrors(validation);
    return Object.keys(validation).length === 0;
  };

  const handleSave = async () => {
    if (!activeProjectId) {
      toast.error('Najprej izberite projekt.');
      return;
    }
    if (!validate()) return;
    try {
      if (editing) {
        await updateContractor(editing.id, { name: draft.name.trim(), phase_id: draft.phase_id, project_id: activeProjectId });
        toast.success('Izvajalec posodobljen');
      } else {
        await createContractor({ name: draft.name.trim(), phase_id: draft.phase_id, project_id: activeProjectId });
        toast.success('Izvajalec dodan');
      }
      setDialogOpen(false);
      setEditing(null);
      resetDraft();
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Shranjevanje ni uspelo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Želite izbrisati izvajalca?')) return;
    try {
      await deleteContractor(id);
      toast.success('Izvajalec izbrisan');
    } catch (error) {
      toast.error((error as Error)?.message ?? 'Brisanje ni uspelo');
    }
  };

  const missingPhases = !projectPhases.length;

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardDescription>Izvajalci</CardDescription>
            <CardTitle>Upravljanje izvajalcev po fazah</CardTitle>
          </div>
          <Button variant="primary" className="shadow-soft" onClick={startCreate} disabled={missingPhases}>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj izvajalca
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {missingPhases ? (
            <EmptyState
              title="Najprej dodajte faze"
              description="Za dodelitev izvajalcev je potrebna vsaj ena faza."
              icon={<Flag className="h-5 w-5" />}
              action={
                <Button variant="secondary" onClick={() => navigate('/faze')}>
                  Odpri faze
                </Button>
              }
            />
          ) : !filtered.length ? (
            <EmptyState
              title="Ni izvajalcev"
              description="Dodajte izvajalca in mu dodelite fazo."
              icon={<PhoneCall className="h-5 w-5" />}
              action={
                <Button variant="primary" onClick={startCreate} className="shadow-soft">
                  Dodaj izvajalca
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input className="sm:max-w-xs" placeholder="Išči" value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>
              <div className="overflow-hidden rounded-3xl border border-border/70 bg-surface/90 shadow-inner">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/70 text-muted-foreground">
                    <tr>
                      {['Št.', 'Naziv izvajalca', 'Faza na kateri dela', ''].map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em]">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((contractor, index) => (
                      <tr key={contractor.id} className={`border-t border-border/50 ${index % 2 === 0 ? 'bg-muted/30' : ''} hover:bg-muted/50`}>
                        <td className="px-4 py-3 font-semibold text-foreground/80">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{contractor.name}</td>
                        <td className="px-4 py-3 text-foreground">
                          {projectPhases.find((p) => p.id === contractor.phase_id)?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => startEdit(contractor)} title="Uredi">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(contractor.id)} title="Izbriši">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Uredi izvajalca' : 'Nov izvajalec'}</DialogTitle>
            <DialogDescription>Izpolnite obvezna polja. Naziv in faza sta obvezna, duplikati nazivov niso dovoljeni.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="space-y-1 text-sm font-semibold text-foreground">
              Naziv
              <Input value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Naziv izvajalca" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </label>
            <label className="space-y-1 text-sm font-semibold text-foreground">
              Faza na kateri dela
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={draft.phase_id}
                onChange={(e) => setDraft((prev) => ({ ...prev, phase_id: e.target.value }))}
              >
                <option value="">Izberi fazo</option>
                {projectPhases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
              {errors.phase_id && <p className="text-xs text-destructive">{errors.phase_id}</p>}
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

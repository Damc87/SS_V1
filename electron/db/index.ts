import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ensureDataDirectories, getDataFilePath, getUploadsPath, getDataRoot } from '../utils/paths';
import type { Contractor, Cost, CostInput, Document, PaymentStatus, Phase, Project, Subphase } from '../types/models';

type CostFilters = Partial<{
  projectId: string;
  dateFrom: string;
  dateTo: string;
  phaseId: string;
  contractorId: string;
  status: string;
  paymentStatus: PaymentStatus;
  category: string;
  search: string;
}>;

type CostSort = {
  field: 'date' | 'amount_net' | 'amount_gross' | 'phase' | 'contractor';
  direction: 'asc' | 'desc';
};

type CostListResult = {
  items: Cost[];
  total: number;
};

type DataState = {
  projects: Project[];
  phases: Phase[];
  subphases: Subphase[];
  contractors: Contractor[];
  costs: Cost[];
  documents: Document[];
  meta: {
    activeProjectId: string | null;
  };
};

const defaultPhases = [
  { name: 'Priprava', subs: ['Načrtovanje', 'Dovoljenja'] },
  { name: 'Zemeljska dela', subs: ['Izkop', 'Nasipavanje'] },
  { name: 'Temelji', subs: ['Temeljni pasovi', 'Hidroizolacija'] },
  { name: 'Plošča', subs: ['Opaž', 'Betoniranje'] },
  { name: 'Zidava', subs: ['Nosilne stene', 'Predelne stene'] },
  { name: 'Streha', subs: ['Konstrukcija', 'Kritina'] },
  { name: 'Fasada', subs: ['Toplotna izolacija', 'Zaključni sloj'] },
  { name: 'Okna/Vrata', subs: ['Okna', 'Vrata'] },
  { name: 'Instalacije', subs: ['Elektrika', 'Voda', 'Ogrevanje'] },
  { name: 'Estrihi', subs: ['Podlaga', 'Estrih'] },
  { name: 'Zaključna dela', subs: ['Pleskanje', 'Talne obloge'] },
  { name: 'Zunanja ureditev', subs: ['Dovoz', 'Ograja'] },
];

const normalizeVat = (vat?: number) => {
  if (vat === undefined || vat === null || Number.isNaN(Number(vat))) return 0;
  return Number(vat);
};

const mapLegacyStatus = (status?: string): PaymentStatus => {
  if (status === 'placano' || status === 'paid') return 'paid';
  if (status === 'delno' || status === 'partial') return 'partial';
  return 'unpaid';
};

const calculateAmounts = (qty: number, unitPrice: number, vatRate?: number) => {
  const amount_net = qty * unitPrice;
  const normalizedVat = normalizeVat(vatRate);
  const amount_gross = amount_net * (1 + normalizedVat / 100);
  return { amount_net, amount_gross, vat_rate: normalizedVat };
};

class JsonDatabase {
  private state: DataState | null = null;
  private mutex = Promise.resolve();

  private async init() {
    if (this.state) return;
    await ensureDataDirectories();
    const filePath = getDataFilePath();
    if (fs.existsSync(filePath)) {
      const raw = await fsPromises.readFile(filePath, 'utf-8');
      this.state = JSON.parse(raw) as DataState;
    } else {
      this.state = this.createEmptyState();
      await this.persist();
    }
    this.normalizeState();
    await this.seedPhases();
  }

  private createEmptyState(): DataState {
    return {
      projects: [],
      phases: [],
      subphases: [],
      contractors: [],
      costs: [],
      documents: [],
      meta: { activeProjectId: null },
    };
  }

  private normalizeState() {
    if (!this.state) return;

    this.state.projects = this.state.projects.map((p) => ({
      ...p,
      created_at: p.created_at ?? new Date().toISOString(),
    }));

    this.state.phases = this.state.phases.map((p, idx) => ({
      ...p,
      order_no: p.order_no ?? idx + 1,
      budget_planned: Number((p as any).budget_planned ?? 0),
    }));

    this.state.contractors = this.state.contractors.map((c) => ({
      ...c,
      created_at: c.created_at ?? new Date().toISOString(),
    }));

    this.state.costs = this.state.costs.map((c) => {
      const qty = Number((c as any).qty ?? 1);
      const unit_price = Number((c as any).unit_price ?? c.amount_net ?? 0);
      const { amount_net, amount_gross, vat_rate } = calculateAmounts(qty, unit_price, (c as any).vat_rate ?? c.vat_rate);
      const description = (c as any).description ?? (c as any).title ?? '';
      const payment_status = mapLegacyStatus((c as any).payment_status ?? (c as any).status);
      const created_at = c.created_at ?? new Date().toISOString();
      return {
        ...c,
        phase_id: (c as any).phase_id ?? '',
        contractor_id: (c as any).contractor_id ?? '',
        qty,
        unit_price,
        vat_rate,
        unit: (c as any).unit ?? 'kos',
        description,
        payment_status,
        amount_net: c.amount_net ?? amount_net,
        amount_gross: c.amount_gross ?? amount_gross,
        created_at,
        updated_at: (c as any).updated_at ?? created_at,
      };
    });
  }

  private async persist() {
    await ensureDataDirectories();
    const filePath = getDataFilePath();
    await fsPromises.writeFile(filePath, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const release = this.mutex;
    let resolveRelease: () => void;
    this.mutex = new Promise<void>((resolve) => {
      resolveRelease = resolve;
    });
    await release;
    try {
      return await fn();
    } finally {
      resolveRelease!();
    }
  }

  private async seedPhases() {
    if (!this.state) return;
    if (this.state.phases.length) return;
    const phases: Phase[] = [];
    const subphases: Subphase[] = [];
    defaultPhases.forEach((phase, idx) => {
      const phaseId = uuidv4();
      phases.push({ id: phaseId, name: phase.name, order_no: idx + 1, budget_planned: 0 });
      phase.subs.forEach((sub, subIdx) => {
        subphases.push({ id: uuidv4(), phase_id: phaseId, name: sub, order_no: subIdx + 1 });
      });
    });
    this.state.phases = phases;
    this.state.subphases = subphases;
    await this.persist();
  }

  async getActiveProject() {
    await this.init();
    return this.state!.meta.activeProjectId;
  }

  async setActiveProject(projectId: string) {
    await this.init();
    return this.withLock(async () => {
      const exists = this.state!.projects.find((p) => p.id === projectId);
      if (!exists) return null;
      this.state!.meta.activeProjectId = projectId;
      await this.persist();
      return projectId;
    });
  }

  async listProjects() {
    await this.init();
    return this.state!.projects.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  async createProject(data: Omit<Project, 'id' | 'created_at'>) {
    await this.init();
    return this.withLock(async () => {
      const project: Project = { id: uuidv4(), created_at: new Date().toISOString(), ...data };
      this.state!.projects.push(project);
      if (!this.state!.meta.activeProjectId) {
        this.state!.meta.activeProjectId = project.id;
      }
      await this.persist();
      return project;
    });
  }

  async updateProject(id: string, data: Partial<Omit<Project, 'id' | 'created_at'>>) {
    await this.init();
    return this.withLock(async () => {
      const idx = this.state!.projects.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      this.state!.projects[idx] = { ...this.state!.projects[idx], ...data };
      await this.persist();
      return this.state!.projects[idx];
    });
  }

  async deleteProject(id: string) {
    await this.init();
    return this.withLock(async () => {
      this.state!.projects = this.state!.projects.filter((p) => p.id !== id);
      this.state!.costs = this.state!.costs.filter((c) => c.project_id !== id);
      this.state!.documents = this.state!.documents.filter((d) => d.project_id !== id);
      if (this.state!.meta.activeProjectId === id) {
        this.state!.meta.activeProjectId = this.state!.projects[0]?.id ?? null;
      }
      await this.persist();
    });
  }

  async listPhases() {
    await this.init();
    return [...this.state!.phases].sort((a, b) => a.order_no - b.order_no);
  }

  async createPhase(name: string) {
    await this.init();
    return this.withLock(async () => {
      const order_no = (this.state!.phases.reduce((max, p) => Math.max(max, p.order_no), 0) || 0) + 1;
      const phase: Phase = { id: uuidv4(), name, order_no, budget_planned: 0 };
      this.state!.phases.push(phase);
      await this.persist();
      return phase;
    });
  }

  async updatePhase(id: string, payload: string | { name?: string; budget_planned?: number }) {
    await this.init();
    return this.withLock(async () => {
      const phase = this.state!.phases.find((p) => p.id === id);
      if (!phase) return null;
      if (typeof payload === 'string') {
        phase.name = payload;
      } else {
        phase.name = payload.name ?? phase.name;
        if (payload.budget_planned !== undefined) {
          phase.budget_planned = Number(payload.budget_planned);
        }
      }
      await this.persist();
      return phase;
    });
  }

  async deletePhase(id: string) {
    await this.init();
    return this.withLock(async () => {
      this.state!.phases = this.state!.phases.filter((p) => p.id !== id);
      this.state!.subphases = this.state!.subphases.filter((s) => s.phase_id !== id);
      await this.persist();
    });
  }

  async reorderPhases(order: string[]) {
    await this.init();
    return this.withLock(async () => {
      order.forEach((phaseId, idx) => {
        const phase = this.state!.phases.find((p) => p.id === phaseId);
        if (phase) phase.order_no = idx + 1;
      });
      await this.persist();
      return this.listPhases();
    });
  }

  async listSubphases(phaseId: string) {
    await this.init();
    return this.state!.subphases.filter((s) => s.phase_id === phaseId).sort((a, b) => a.order_no - b.order_no);
  }

  async createSubphase(phaseId: string, name: string) {
    await this.init();
    return this.withLock(async () => {
      const next = (this.state!.subphases.filter((s) => s.phase_id === phaseId).reduce((max, s) => Math.max(max, s.order_no), 0) || 0) + 1;
      const sub: Subphase = { id: uuidv4(), phase_id: phaseId, name, order_no: next };
      this.state!.subphases.push(sub);
      await this.persist();
      return sub;
    });
  }

  async updateSubphase(id: string, name: string) {
    await this.init();
    return this.withLock(async () => {
      const sub = this.state!.subphases.find((s) => s.id === id);
      if (!sub) return null;
      sub.name = name;
      await this.persist();
      return sub;
    });
  }

  async deleteSubphase(id: string) {
    await this.init();
    return this.withLock(async () => {
      this.state!.subphases = this.state!.subphases.filter((s) => s.id !== id);
      await this.persist();
    });
  }

  async listContractors() {
    await this.init();
    return [...this.state!.contractors].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  async createContractor(data: Omit<Contractor, 'id' | 'created_at'>) {
    await this.init();
    return this.withLock(async () => {
      const contractor: Contractor = { id: uuidv4(), created_at: new Date().toISOString(), ...data };
      this.state!.contractors.push(contractor);
      await this.persist();
      return contractor;
    });
  }

  async updateContractor(id: string, data: Partial<Omit<Contractor, 'id' | 'created_at'>>) {
    await this.init();
    return this.withLock(async () => {
      const idx = this.state!.contractors.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      this.state!.contractors[idx] = { ...this.state!.contractors[idx], ...data };
      await this.persist();
      return this.state!.contractors[idx];
    });
  }

  async deleteContractor(id: string) {
    await this.init();
    return this.withLock(async () => {
      this.state!.contractors = this.state!.contractors.filter((c) => c.id !== id);
      await this.persist();
    });
  }

  async listCosts(params: CostFilters & { sort?: CostSort; page?: number; pageSize?: number } = {}): Promise<CostListResult> {
    await this.init();
    const { sort, page, pageSize, ...filters } = params;
    let costs = [...this.state!.costs];

    costs = costs.filter((c) => {
      if (filters.projectId && c.project_id !== filters.projectId) return false;
      if (filters.dateFrom && c.date < filters.dateFrom) return false;
      if (filters.dateTo && c.date > filters.dateTo) return false;
      if (filters.phaseId && c.phase_id !== filters.phaseId) return false;
      if (filters.contractorId && c.contractor_id !== filters.contractorId) return false;
      if (filters.status && c.payment_status !== mapLegacyStatus(filters.status)) return false;
      if (filters.paymentStatus && c.payment_status !== filters.paymentStatus) return false;
      if (filters.category && c.category !== filters.category) return false;
      if (filters.search) {
        const haystack = `${c.description ?? ''} ${c.title ?? ''} ${c.invoice_no ?? ''}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });

    const sorting = sort ?? { field: 'date', direction: 'desc' };
    costs.sort((a, b) => {
      const dir = sorting.direction === 'asc' ? 1 : -1;
      switch (sorting.field) {
        case 'amount_net':
          return (a.amount_net - b.amount_net) * dir;
        case 'amount_gross':
          return (a.amount_gross - b.amount_gross) * dir;
        case 'phase': {
          const phaseA = this.state!.phases.find((p) => p.id === a.phase_id)?.name ?? '';
          const phaseB = this.state!.phases.find((p) => p.id === b.phase_id)?.name ?? '';
          return phaseA.localeCompare(phaseB) * dir;
        }
        case 'contractor': {
          const cA = this.state!.contractors.find((c) => c.id === a.contractor_id)?.name ?? '';
          const cB = this.state!.contractors.find((c) => c.id === b.contractor_id)?.name ?? '';
          return cA.localeCompare(cB) * dir;
        }
        case 'date':
        default:
          return (a.date > b.date ? 1 : -1) * dir;
      }
    });

    const total = costs.length;
    if (pageSize) {
      const start = ((page ?? 1) - 1) * pageSize;
      costs = costs.slice(start, start + pageSize);
    }

    return { items: costs, total };
  }

  private assertRelations(data: Partial<CostInput>) {
    if (!this.state) return;
    if (data.project_id) {
      const hasProject = this.state.projects.some((p) => p.id === data.project_id);
      if (!hasProject) throw new Error('Projekt ne obstaja');
    }
    if (data.phase_id) {
      const hasPhase = this.state.phases.some((p) => p.id === data.phase_id);
      if (!hasPhase) throw new Error('Faza ne obstaja');
    }
    if (data.contractor_id) {
      const hasContractor = this.state.contractors.some((c) => c.id === data.contractor_id);
      if (!hasContractor) throw new Error('Izvajalec ne obstaja');
    }
  }

  async createCost(data: CostInput) {
    await this.init();
    return this.withLock(async () => {
      if (!data.project_id) throw new Error('Projekt je obvezen');
      if (!data.phase_id || !data.contractor_id) throw new Error('Faza in izvajalec sta obvezna');
      this.assertRelations(data);
      const timestamp = new Date().toISOString();
      const qty = Number(data.qty ?? 1);
      const unit_price = Number(data.unit_price ?? data.amount_net ?? 0);
      const { amount_net, amount_gross, vat_rate } = calculateAmounts(qty, unit_price, data.vat_rate);
      const description = data.description ?? data.title ?? '';
      const cost: Cost = {
        id: uuidv4(),
        project_id: data.project_id,
        date: data.date ?? timestamp.slice(0, 10),
        phase_id: data.phase_id,
        subphase_id: data.subphase_id,
        contractor_id: data.contractor_id,
        description,
        title: data.title ?? description,
        category: data.category,
        qty,
        unit: data.unit ?? '',
        unit_price,
        vat_rate,
        amount_net: data.amount_net ?? amount_net,
        amount_gross: data.amount_gross ?? amount_gross,
        payment_status: data.payment_status ?? 'unpaid',
        invoice_no: data.invoice_no,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        note: data.note ?? data.notes,
        notes: data.notes ?? data.note,
        payment_status_history: data.payment_status ? [data.payment_status] : [],
        created_at: timestamp,
        updated_at: timestamp,
      };
      this.state!.costs.push(cost);
      await this.persist();
      return cost;
    });
  }

  async updateCost(id: string, data: Partial<CostInput>) {
    await this.init();
    return this.withLock(async () => {
      const idx = this.state!.costs.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      this.assertRelations(data);

      const existing = this.state!.costs[idx];
      const phase_id = data.phase_id ?? existing.phase_id;
      const contractor_id = data.contractor_id ?? existing.contractor_id;
      if (!phase_id || !contractor_id) throw new Error('Faza in izvajalec sta obvezna');
      const qty = Number(data.qty ?? existing.qty);
      const unit_price = Number(data.unit_price ?? existing.unit_price);
      const { amount_net, amount_gross, vat_rate } = calculateAmounts(qty, unit_price, data.vat_rate ?? existing.vat_rate);
      const nextStatusHistory = data.payment_status ? [...(existing.payment_status_history ?? []), data.payment_status] : existing.payment_status_history;

      const updated: Cost = {
        ...existing,
        ...data,
        phase_id,
        contractor_id,
        qty,
        unit_price,
        vat_rate,
        amount_net: data.amount_net ?? amount_net,
        amount_gross: data.amount_gross ?? amount_gross,
        payment_status: data.payment_status ?? existing.payment_status,
        payment_status_history: nextStatusHistory,
        description: data.description ?? data.title ?? existing.description ?? existing.title ?? '',
        title: data.title ?? existing.title,
        notes: data.notes ?? existing.notes,
        note: data.note ?? data.notes ?? existing.note,
        updated_at: new Date().toISOString(),
      };
      this.state!.costs[idx] = updated;
      await this.persist();
      return updated;
    });
  }

  async deleteCost(id: string) {
    await this.init();
    return this.withLock(async () => {
      this.state!.costs = this.state!.costs.filter((c) => c.id !== id);
      await this.persist();
    });
  }

  async duplicateCost(id: string) {
    await this.init();
    return this.withLock(async () => {
      const existing = this.state!.costs.find((c) => c.id === id);
      if (!existing) return null;
      const timestamp = new Date().toISOString();
      const copy: Cost = {
        ...existing,
        id: uuidv4(),
        created_at: timestamp,
        updated_at: timestamp,
      };
      this.state!.costs.push(copy);
      await this.persist();
      return copy;
    });
  }

  async bulkCreateCosts(entries: CostInput[]) {
    await this.init();
    const created: Cost[] = [];
    await this.withLock(async () => {
      for (const entry of entries) {
        if (!entry.project_id) throw new Error('Projekt je obvezen');
        if (!entry.phase_id || !entry.contractor_id) throw new Error('Faza in izvajalec sta obvezna');
        this.assertRelations(entry);
        const timestamp = new Date().toISOString();
        const qty = Number(entry.qty ?? 1);
        const unit_price = Number(entry.unit_price ?? entry.amount_net ?? 0);
        const { amount_net, amount_gross, vat_rate } = calculateAmounts(qty, unit_price, entry.vat_rate);
        const description = entry.description ?? entry.title ?? '';
        const cost: Cost = {
          id: uuidv4(),
          project_id: entry.project_id,
          date: entry.date ?? timestamp.slice(0, 10),
          phase_id: entry.phase_id,
          subphase_id: entry.subphase_id,
          contractor_id: entry.contractor_id,
          description,
          title: entry.title ?? description,
          category: entry.category,
          qty,
          unit: entry.unit ?? '',
          unit_price,
          vat_rate,
          amount_net: entry.amount_net ?? amount_net,
          amount_gross: entry.amount_gross ?? amount_gross,
          payment_status: entry.payment_status ?? 'unpaid',
          invoice_no: entry.invoice_no,
          invoice_date: entry.invoice_date,
          due_date: entry.due_date,
          note: entry.note ?? entry.notes,
          notes: entry.notes ?? entry.note,
          payment_status_history: entry.payment_status ? [entry.payment_status] : [],
          created_at: timestamp,
          updated_at: timestamp,
        };
        created.push(cost);
        this.state!.costs.push(cost);
      }
      await this.persist();
    });
    return created;
  }

  async attachDocument(doc: Omit<Document, 'id' | 'created_at'>) {
    await this.init();
    return this.withLock(async () => {
      const record: Document = { id: uuidv4(), created_at: new Date().toISOString(), ...doc };
      this.state!.documents.push(record);
      await this.persist();
      return record;
    });
  }

  async listDocuments(projectId: string) {
    await this.init();
    return this.state!.documents.filter((d) => d.project_id === projectId).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  async deleteDocument(id: string) {
    await this.init();
    return this.withLock(async () => {
      const doc = this.state!.documents.find((d) => d.id === id);
      if (doc && fs.existsSync(doc.stored_path)) {
        fs.unlinkSync(doc.stored_path);
      }
      this.state!.documents = this.state!.documents.filter((d) => d.id !== id);
      await this.persist();
    });
  }

  async exportCostsCsv(projectId?: string, filters: CostFilters = {}) {
    await this.init();
    const { items } = await this.listCosts({ ...filters, projectId });
    const header = ['date', 'phase', 'contractor', 'description', 'qty', 'unit', 'unitPrice', 'vatRate', 'amountNet', 'amountGross', 'status', 'invoiceNo', 'note'];
    const lines = [header.join(',')];
    const formatValue = (value: unknown) => {
      if (value === undefined || value === null) return '';
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return value;
    };

    items.forEach((c) => {
      const phaseName = this.state!.phases.find((p) => p.id === c.phase_id)?.name ?? '';
      const contractorName = this.state!.contractors.find((ctr) => ctr.id === c.contractor_id)?.name ?? '';
      const row = [
        c.date,
        phaseName,
        contractorName,
        c.description?.replace(/"/g, '""') ?? '',
        c.qty,
        c.unit ?? '',
        c.unit_price,
        c.vat_rate ?? 0,
        c.amount_net,
        c.amount_gross,
        c.payment_status,
        c.invoice_no ?? '',
        c.note ?? c.notes ?? '',
      ].map((v) => formatValue(v));
      lines.push(row.join(','));
    });
    return lines.join('\n');
  }

  async importCostsCsv(csv: string, projectId: string) {
    await this.init();
    const [headerLine, ...rows] = csv.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(',').map((h) => h.trim());
    const imported: Cost[] = [];
    const pending: CostInput[] = [];
    const missingPhases = new Set<string>();
    const missingContractors = new Set<string>();

    rows.forEach((line) => {
      const values = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());
      const entry: Record<string, string> = {};
      headers.forEach((h, idx) => {
        entry[h] = values[idx];
      });
      const phaseName = entry.phase?.toLowerCase();
      const contractorName = entry.contractor?.toLowerCase();
      const phase = this.state!.phases.find((p) => p.name.toLowerCase() === phaseName);
      const contractor = this.state!.contractors.find((c) => c.name.toLowerCase() === contractorName);
      if (!phase) missingPhases.add(entry.phase || 'Neznana faza');
      if (!contractor) missingContractors.add(entry.contractor || 'Neznan izvajalec');
      if (!phase || !contractor) return;

      pending.push({
        project_id: projectId,
        date: entry.date,
        phase_id: phase?.id ?? '',
        contractor_id: contractor?.id ?? '',
        description: entry.description ?? entry.title ?? '',
        qty: Number(entry.qty ?? 1),
        unit: entry.unit ?? '',
        unit_price: Number(entry.unitPrice ?? entry.unit_price ?? 0),
        vat_rate: Number(entry.vatRate ?? entry.vat_rate ?? 0),
        amount_net: entry.amountNet ? Number(entry.amountNet) : undefined,
        amount_gross: entry.amountGross ? Number(entry.amountGross) : undefined,
        payment_status: mapLegacyStatus(entry.status),
        invoice_no: entry.invoiceNo ?? '',
        note: entry.note ?? entry.notes ?? '',
      });
    });

    if (missingPhases.size || missingContractors.size) {
      return { created: [], missingPhases: Array.from(missingPhases), missingContractors: Array.from(missingContractors) };
    }

    const created = await this.bulkCreateCosts(pending);
    imported.push(...created);

    return { created: imported, missingPhases: [], missingContractors: [] };
  }

  async exportBackup(targetPath: string) {
    await this.init();
    await this.withLock(async () => {
      await this.persist();
      const uploads = getUploadsPath();
      const archive = require('archiver')('zip');
      const output = fs.createWriteStream(targetPath);
      const promise = new Promise<void>((resolve, reject) => {
        output.on('close', () => resolve());
        archive.on('error', (err: Error) => reject(err));
      });
      archive.pipe(output);
      archive.file(getDataFilePath(), { name: 'data.json' });
      if (fs.existsSync(uploads)) {
        archive.directory(uploads, 'uploads');
      }
      archive.finalize();
      await promise;
    });
    return targetPath;
  }

  async importBackup(zipPath: string) {
    await this.withLock(async () => {
      await ensureDataDirectories();
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipPath);
      const dataEntry = zip.getEntry('data.json');
      if (dataEntry) {
        const json = dataEntry.getData().toString('utf-8');
        this.state = JSON.parse(json);
      } else {
        this.state = this.createEmptyState();
      }
      const uploads = getUploadsPath();
      zip.extractAllTo(getDataRoot(), true);
      await this.seedPhases();
      await this.persist();
    });
  }

  async phasePlanVsActual(projectId: string) {
    await this.init();
    const { items } = await this.listCosts({ projectId });
    return this.state!.phases.map((p) => ({
      phase_id: p.id,
      phase_name: p.name,
      planned: Number((p as any).budget_planned ?? 0),
      actual: items.filter((c) => c.phase_id === p.id).reduce((acc, cost) => acc + cost.amount_gross, 0),
    }));
  }

  async saveDocumentFile(sourcePath: string) {
    await ensureDataDirectories();
    const uploads = getUploadsPath();
    const fileName = path.basename(sourcePath);
    const storedName = `${Date.now()}-${fileName}`;
    const targetPath = path.join(uploads, storedName);
    fs.copyFileSync(sourcePath, targetPath);
    const stats = fs.statSync(targetPath);
    return { storedName, targetPath, size: stats.size };
  }
}

let instance: JsonDatabase | null = null;
export const getDb = () => {
  if (!instance) instance = new JsonDatabase();
  return instance;
};

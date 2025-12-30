import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ensureDataDirectories, getDataFilePath, getUploadsPath, getDataRoot } from '../utils/paths';
import type { Contractor, Cost, Document, Phase, Project, Subphase } from '../types/models';

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
      phases.push({ id: phaseId, name: phase.name, order_no: idx + 1 });
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
      const phase: Phase = { id: uuidv4(), name, order_no };
      this.state!.phases.push(phase);
      await this.persist();
      return phase;
    });
  }

  async updatePhase(id: string, name: string) {
    await this.init();
    return this.withLock(async () => {
      const phase = this.state!.phases.find((p) => p.id === id);
      if (!phase) return null;
      phase.name = name;
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

  async listCosts(filters: Partial<{ projectId: string; dateFrom: string; dateTo: string; phaseId: string; contractorId: string; status: string; category: string; search: string }>) {
    await this.init();
    return this.state!.costs
      .filter((c) => {
        if (filters.projectId && c.project_id !== filters.projectId) return false;
        if (filters.dateFrom && c.date < filters.dateFrom) return false;
        if (filters.dateTo && c.date > filters.dateTo) return false;
        if (filters.phaseId && c.phase_id !== filters.phaseId) return false;
        if (filters.contractorId && c.contractor_id !== filters.contractorId) return false;
        if (filters.status && c.status !== filters.status) return false;
        if (filters.category && c.category !== filters.category) return false;
        if (filters.search && !(c.title.includes(filters.search) || (c.invoice_no ?? '').includes(filters.search))) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  async createCost(data: Omit<Cost, 'id' | 'created_at'>) {
    await this.init();
    return this.withLock(async () => {
      const cost: Cost = { id: uuidv4(), created_at: new Date().toISOString(), ...data };
      this.state!.costs.push(cost);
      await this.persist();
      return cost;
    });
  }

  async updateCost(id: string, data: Partial<Omit<Cost, 'id' | 'created_at' | 'project_id'>>) {
    await this.init();
    return this.withLock(async () => {
      const idx = this.state!.costs.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      this.state!.costs[idx] = { ...this.state!.costs[idx], ...data };
      await this.persist();
      return this.state!.costs[idx];
    });
  }

  async deleteCost(id: string) {
    await this.init();
    return this.withLock(async () => {
      this.state!.costs = this.state!.costs.filter((c) => c.id !== id);
      await this.persist();
    });
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

  async exportCostsCsv(projectId?: string) {
    await this.init();
    const costs = await this.listCosts({ projectId });
    const header = [
      'id',
      'project_id',
      'date',
      'phase_id',
      'subphase_id',
      'contractor_id',
      'title',
      'category',
      'amount_net',
      'vat_rate',
      'amount_gross',
      'status',
      'invoice_no',
      'invoice_date',
      'due_date',
      'notes',
      'created_at',
    ];
    const lines = [header.join(',')];
    costs.forEach((c) => {
      const row = header.map((key) => {
        const value = (c as Record<string, unknown>)[key];
        if (value === undefined || value === null) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return value;
      });
      lines.push(row.join(','));
    });
    return lines.join('\n');
  }

  async importCostsCsv(csv: string) {
    await this.init();
    const [headerLine, ...rows] = csv.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(',');
    const imported: Cost[] = [];
    await this.withLock(async () => {
      rows.forEach((line) => {
        const values = line.split(',').map((v) => v.replace(/^"|"$/g, ''));
        const entry: Record<string, unknown> = {};
        headers.forEach((h, idx) => {
          entry[h] = values[idx];
        });
        entry.amount_net = Number(entry.amount_net);
        entry.amount_gross = Number(entry.amount_gross);
        entry.vat_rate = Number(entry.vat_rate);
        if (!entry.id) entry.id = uuidv4();
        if (!entry.created_at) entry.created_at = new Date().toISOString();
        this.state!.costs.push(entry as Cost);
        imported.push(entry as Cost);
      });
      await this.persist();
    });
    return imported;
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

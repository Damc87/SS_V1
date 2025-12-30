import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getDatabasePath, getUploadsPath, ensureDataDirectories } from '../utils/paths';

export type Project = {
  id: string;
  name: string;
  description?: string;
  net_m2?: number;
  gross_m2?: number;
  volume_m3?: number;
  created_at: string;
};

export type Phase = { id: string; name: string; order_no: number };
export type Subphase = { id: string; phase_id: string; name: string; order_no: number };
export type Contractor = {
  id: string;
  name: string;
  tax_id?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
};

export type Cost = {
  id: string;
  project_id: string;
  date: string;
  phase_id?: string;
  subphase_id?: string;
  contractor_id?: string;
  title: string;
  category: string;
  amount_net: number;
  vat_rate: number;
  amount_gross: number;
  status: string;
  invoice_no?: string;
  invoice_date?: string;
  due_date?: string;
  notes?: string;
  created_at: string;
};

export type Document = {
  id: string;
  project_id: string;
  cost_id?: string;
  original_name: string;
  stored_name: string;
  stored_path: string;
  mime: string;
  size: number;
  created_at: string;
};

class DB {
  private db: Database.Database;
  private activeProjectId: string | null = null;

  constructor() {
    ensureDataDirectories();
    const dbPath = getDatabasePath();
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize() {
    const schema = `
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        net_m2 REAL,
        gross_m2 REAL,
        volume_m3 REAL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS phases (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        order_no INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS subphases (
        id TEXT PRIMARY KEY,
        phase_id TEXT NOT NULL,
        name TEXT NOT NULL,
        order_no INTEGER NOT NULL,
        FOREIGN KEY(phase_id) REFERENCES phases(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS contractors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tax_id TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS costs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        date TEXT NOT NULL,
        phase_id TEXT,
        subphase_id TEXT,
        contractor_id TEXT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        amount_net REAL NOT NULL,
        vat_rate REAL NOT NULL,
        amount_gross REAL NOT NULL,
        status TEXT NOT NULL,
        invoice_no TEXT,
        invoice_date TEXT,
        due_date TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        cost_id TEXT,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        stored_path TEXT NOT NULL,
        mime TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `;
    this.db.exec(schema);
    this.seedPhases();
  }

  private seedPhases() {
    const count = this.db.prepare('SELECT COUNT(*) as total FROM phases').get() as { total: number };
    if (count.total > 0) return;
    const phases = [
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
    const insertPhase = this.db.prepare('INSERT INTO phases (id, name, order_no) VALUES (?, ?, ?)');
    const insertSub = this.db.prepare('INSERT INTO subphases (id, phase_id, name, order_no) VALUES (?, ?, ?, ?)');
    phases.forEach((phase, index) => {
      const phaseId = uuidv4();
      insertPhase.run(phaseId, phase.name, index + 1);
      phase.subs.forEach((sub, idx) => insertSub.run(uuidv4(), phaseId, sub, idx + 1));
    });
  }

  getActiveProject() {
    const meta = this.db.prepare('SELECT value FROM meta WHERE key = ?').get('activeProject') as { value: string } | undefined;
    return meta?.value ?? null;
  }

  setActiveProject(projectId: string) {
    const exists = this.db.prepare('SELECT 1 FROM projects WHERE id = ?').get(projectId);
    if (!exists) return null;
    this.db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('activeProject', projectId);
    this.activeProjectId = projectId;
    return projectId;
  }

  listProjects(): Project[] {
    return this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Project[];
  }

  createProject(data: Omit<Project, 'id' | 'created_at'>) {
    const project: Project = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      ...data,
    };
    this.db
      .prepare(
        'INSERT INTO projects (id, name, description, net_m2, gross_m2, volume_m3, created_at) VALUES (@id, @name, @description, @net_m2, @gross_m2, @volume_m3, @created_at)'
      )
      .run(project);
    return project;
  }

  updateProject(id: string, data: Partial<Omit<Project, 'id' | 'created_at'>>) {
    const keys = Object.keys(data) as (keyof Project)[];
    if (!keys.length) return null;
    const setClause = keys.map((k) => `${k}=@${k}`).join(',');
    const stmt = this.db.prepare(`UPDATE projects SET ${setClause} WHERE id=@id`);
    stmt.run({ ...data, id });
    return this.getProject(id);
  }

  getProject(id: string) {
    return this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
  }

  deleteProject(id: string) {
    this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }

  listPhases(): Phase[] {
    return this.db.prepare('SELECT * FROM phases ORDER BY order_no ASC').all() as Phase[];
  }

  createPhase(name: string) {
    const order_no = (this.db.prepare('SELECT COALESCE(MAX(order_no),0)+1 as no FROM phases').get() as { no: number }).no;
    const phase: Phase = { id: uuidv4(), name, order_no };
    this.db.prepare('INSERT INTO phases (id, name, order_no) VALUES (@id, @name, @order_no)').run(phase);
    return phase;
  }

  updatePhase(id: string, name: string) {
    this.db.prepare('UPDATE phases SET name=? WHERE id=?').run(name, id);
    return this.getPhase(id);
  }

  getPhase(id: string) {
    return this.db.prepare('SELECT * FROM phases WHERE id=?').get(id) as Phase | undefined;
  }

  deletePhase(id: string) {
    this.db.prepare('DELETE FROM phases WHERE id=?').run(id);
  }

  reorderPhases(order: string[]) {
    const update = this.db.prepare('UPDATE phases SET order_no=@order_no WHERE id=@id');
    order.forEach((id, idx) => update.run({ id, order_no: idx + 1 }));
    return this.listPhases();
  }

  listSubphases(phaseId: string) {
    return this.db.prepare('SELECT * FROM subphases WHERE phase_id=? ORDER BY order_no ASC').all(phaseId) as Subphase[];
  }

  createSubphase(phaseId: string, name: string) {
    const order_no = (this.db.prepare('SELECT COALESCE(MAX(order_no),0)+1 as no FROM subphases WHERE phase_id=?').get(phaseId) as { no: number }).no;
    const sub: Subphase = { id: uuidv4(), phase_id: phaseId, name, order_no };
    this.db.prepare('INSERT INTO subphases (id, phase_id, name, order_no) VALUES (@id, @phase_id, @name, @order_no)').run(sub);
    return sub;
  }

  updateSubphase(id: string, name: string) {
    this.db.prepare('UPDATE subphases SET name=? WHERE id=?').run(name, id);
    return this.db.prepare('SELECT * FROM subphases WHERE id=?').get(id) as Subphase;
  }

  deleteSubphase(id: string) {
    this.db.prepare('DELETE FROM subphases WHERE id=?').run(id);
  }

  listContractors(): Contractor[] {
    return this.db.prepare('SELECT * FROM contractors ORDER BY created_at DESC').all() as Contractor[];
  }

  createContractor(data: Omit<Contractor, 'id' | 'created_at'>) {
    const contractor: Contractor = { id: uuidv4(), created_at: new Date().toISOString(), ...data };
    this.db
      .prepare('INSERT INTO contractors (id, name, tax_id, phone, email, address, created_at) VALUES (@id, @name, @tax_id, @phone, @email, @address, @created_at)')
      .run(contractor);
    return contractor;
  }

  updateContractor(id: string, data: Partial<Omit<Contractor, 'id' | 'created_at'>>) {
    const keys = Object.keys(data) as (keyof Contractor)[];
    if (!keys.length) return null;
    const setClause = keys.map((k) => `${k}=@${k}`).join(',');
    this.db.prepare(`UPDATE contractors SET ${setClause} WHERE id=@id`).run({ ...data, id });
    return this.db.prepare('SELECT * FROM contractors WHERE id=?').get(id) as Contractor;
  }

  deleteContractor(id: string) {
    this.db.prepare('DELETE FROM contractors WHERE id=?').run(id);
  }

  listCosts(filters: Partial<{ projectId: string; dateFrom: string; dateTo: string; phaseId: string; contractorId: string; status: string; category: string; search: string }>) {
    const clauses: string[] = [];
    const params: Record<string, unknown> = {};
    if (filters.projectId) {
      clauses.push('project_id=@projectId');
      params.projectId = filters.projectId;
    }
    if (filters.dateFrom) {
      clauses.push('date>=@dateFrom');
      params.dateFrom = filters.dateFrom;
    }
    if (filters.dateTo) {
      clauses.push('date<=@dateTo');
      params.dateTo = filters.dateTo;
    }
    if (filters.phaseId) {
      clauses.push('phase_id=@phaseId');
      params.phaseId = filters.phaseId;
    }
    if (filters.contractorId) {
      clauses.push('contractor_id=@contractorId');
      params.contractorId = filters.contractorId;
    }
    if (filters.status) {
      clauses.push('status=@status');
      params.status = filters.status;
    }
    if (filters.category) {
      clauses.push('category=@category');
      params.category = filters.category;
    }
    if (filters.search) {
      clauses.push('(title LIKE @search OR invoice_no LIKE @search)');
      params.search = `%${filters.search}%`;
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM costs ${where} ORDER BY date DESC`;
    return this.db.prepare(sql).all(params) as Cost[];
  }

  createCost(data: Omit<Cost, 'id' | 'created_at'>) {
    const cost: Cost = { id: uuidv4(), created_at: new Date().toISOString(), ...data };
    this.db
      .prepare(
        'INSERT INTO costs (id, project_id, date, phase_id, subphase_id, contractor_id, title, category, amount_net, vat_rate, amount_gross, status, invoice_no, invoice_date, due_date, notes, created_at) VALUES (@id, @project_id, @date, @phase_id, @subphase_id, @contractor_id, @title, @category, @amount_net, @vat_rate, @amount_gross, @status, @invoice_no, @invoice_date, @due_date, @notes, @created_at)'
      )
      .run(cost);
    return cost;
  }

  updateCost(id: string, data: Partial<Omit<Cost, 'id' | 'created_at' | 'project_id'>>) {
    const keys = Object.keys(data) as (keyof Cost)[];
    if (!keys.length) return null;
    const setClause = keys.map((k) => `${k}=@${k}`).join(',');
    this.db.prepare(`UPDATE costs SET ${setClause} WHERE id=@id`).run({ ...data, id });
    return this.db.prepare('SELECT * FROM costs WHERE id=?').get(id) as Cost;
  }

  deleteCost(id: string) {
    this.db.prepare('DELETE FROM costs WHERE id=?').run(id);
  }

  attachDocument(doc: Omit<Document, 'id' | 'created_at'>) {
    const record: Document = { id: uuidv4(), created_at: new Date().toISOString(), ...doc };
    this.db
      .prepare(
        'INSERT INTO documents (id, project_id, cost_id, original_name, stored_name, stored_path, mime, size, created_at) VALUES (@id, @project_id, @cost_id, @original_name, @stored_name, @stored_path, @mime, @size, @created_at)'
      )
      .run(record);
    return record;
  }

  listDocuments(projectId: string) {
    return this.db.prepare('SELECT * FROM documents WHERE project_id=? ORDER BY created_at DESC').all(projectId) as Document[];
  }

  deleteDocument(id: string) {
    this.db.prepare('DELETE FROM documents WHERE id=?').run(id);
  }

  exportCostsCsv(projectId?: string) {
    const costs = this.listCosts({ projectId });
    const header = [
      'id','project_id','date','phase_id','subphase_id','contractor_id','title','category','amount_net','vat_rate','amount_gross','status','invoice_no','invoice_date','due_date','notes','created_at'
    ];
    const lines = [header.join(',')];
    costs.forEach((c) => {
      const row = header.map((key) => {
        const value = (c as any)[key];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value ?? '';
      });
      lines.push(row.join(','));
    });
    return lines.join('\n');
  }

  importCostsCsv(csv: string) {
    const [headerLine, ...rows] = csv.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(',');
    const insert = this.db.prepare(
      'INSERT OR REPLACE INTO costs (id, project_id, date, phase_id, subphase_id, contractor_id, title, category, amount_net, vat_rate, amount_gross, status, invoice_no, invoice_date, due_date, notes, created_at) VALUES (@id, @project_id, @date, @phase_id, @subphase_id, @contractor_id, @title, @category, @amount_net, @vat_rate, @amount_gross, @status, @invoice_no, @invoice_date, @due_date, @notes, @created_at)'
    );
    const imported: Cost[] = [];
    rows.forEach((line) => {
      const values = line.split(',').map((v) => v.replace(/^"|"$/g, ''));
      const entry: any = {};
      headers.forEach((h, idx) => {
        entry[h] = values[idx];
      });
      entry.amount_net = Number(entry.amount_net);
      entry.amount_gross = Number(entry.amount_gross);
      entry.vat_rate = Number(entry.vat_rate);
      if (!entry.id) entry.id = uuidv4();
      if (!entry.created_at) entry.created_at = new Date().toISOString();
      insert.run(entry);
      imported.push(entry as Cost);
    });
    return imported;
  }

  exportBackup(targetPath: string) {
    const uploads = getUploadsPath();
    const dbPath = getDatabasePath();
    const archiver = require('archiver');
    const output = fs.createWriteStream(targetPath);
    const archive = archiver('zip');
    return new Promise<string>((resolve, reject) => {
      output.on('close', () => resolve(targetPath));
      archive.on('error', (err: Error) => reject(err));
      archive.pipe(output);
      archive.file(dbPath, { name: 'app.db' });
      archive.directory(uploads, 'uploads');
      archive.finalize();
    });
  }

  async importBackup(zipPath: string) {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    const dbPath = getDatabasePath();
    const uploads = getUploadsPath();
    await ensureDataDirectories();
    zip.extractEntryTo('app.db', path.dirname(dbPath), false, true);
    zip.extractAllTo(uploads, true);
  }
}
let dbInstance: DB | null = null;

export const getDb = () => {
  if (!dbInstance) {
    dbInstance = new DB();
  }
  return dbInstance;
};

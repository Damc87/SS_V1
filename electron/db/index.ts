import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import { ensureDataDirectories, getDatabasePath, getUploadsPath } from '../utils/paths';

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

class Mutex {
  private queue = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release!: () => void;
    const previous = this.queue;
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

class SqlJsDatabase {
  private db: Database | null = null;
  private sqlJs: SqlJsStatic | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private mutex = new Mutex();
  private saveTimer: NodeJS.Timeout | null = null;
  private pendingSave: Promise<void> | null = null;

  private async init() {
    if (this.initialized) return;
    if (!this.initializationPromise) {
      this.initializationPromise = this.mutex.runExclusive(async () => {
        if (this.initialized) return;
        await ensureDataDirectories();
        await this.loadDatabase();
        this.applySchema();
        await this.seedPhases();
        this.initialized = true;
      });
    }
    await this.initializationPromise;
  }

  private async loadDatabase() {
    const wasmBinary = await fsPromises.readFile(require.resolve('sql.js/dist/sql-wasm.wasm'));
    this.sqlJs = await initSqlJs({ wasmBinary });
    const dbPath = getDatabasePath();
    let buffer: Uint8Array | undefined;
    try {
      const file = await fsPromises.readFile(dbPath);
      buffer = new Uint8Array(file);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
    this.db = buffer ? new this.sqlJs.Database(buffer) : new this.sqlJs.Database();
  }

  private applySchema() {
    if (!this.db) return;
    const statements = [
      `CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        net_m2 REAL,
        gross_m2 REAL,
        volume_m3 REAL,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS phases (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        order_no INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS subphases (
        id TEXT PRIMARY KEY,
        phase_id TEXT NOT NULL,
        name TEXT NOT NULL,
        order_no INTEGER NOT NULL,
        FOREIGN KEY(phase_id) REFERENCES phases(id) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS contractors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tax_id TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS costs (
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
      );`,
      `CREATE TABLE IF NOT EXISTS documents (
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
      );`,
      `CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );`,
    ];
    statements.forEach((sql) => this.db?.run(sql));
  }

  private async seedPhases() {
    if (!this.db) return;
    const count = this.getOne<{ total: number }>('SELECT COUNT(*) as total FROM phases');
    if (count?.total && count.total > 0) return;
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

    phases.forEach((phase, index) => {
      const phaseId = uuidv4();
      this.run(
        'INSERT INTO phases (id, name, order_no) VALUES (:id, :name, :order_no)',
        { id: phaseId, name: phase.name, order_no: index + 1 }
      );
      phase.subs.forEach((sub, idx) =>
        this.run(
          'INSERT INTO subphases (id, phase_id, name, order_no) VALUES (:id, :phase_id, :name, :order_no)',
          { id: uuidv4(), phase_id: phaseId, name: sub, order_no: idx + 1 }
        )
      );
    });
    this.schedulePersist();
  }

  private schedulePersist() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.pendingSave = this.persistToDisk().finally(() => {
        this.pendingSave = null;
      });
    }, 300);
  }

  private async persistToDisk() {
    if (!this.db) return;
    const dbPath = getDatabasePath();
    const data = this.db.export();
    await fsPromises.mkdir(path.dirname(dbPath), { recursive: true });
    await fsPromises.writeFile(dbPath, Buffer.from(data));
  }

  private async flushPendingSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.pendingSave) {
      await this.pendingSave;
    } else {
      await this.persistToDisk();
    }
  }

  private mapParams(params?: Record<string, unknown>) {
    if (!params) return undefined;
    return Object.fromEntries(Object.entries(params).map(([key, value]) => [`:${key}`, value ?? null]));
  }

  private getAll<T>(sql: string, params?: Record<string, unknown>): T[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(sql);
    if (params) {
      stmt.bind(this.mapParams(params));
    }
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return rows;
  }

  private getOne<T>(sql: string, params?: Record<string, unknown>): T | undefined {
    if (!this.db) return undefined;
    const stmt = this.db.prepare(sql);
    if (params) {
      stmt.bind(this.mapParams(params));
    }
    const row = stmt.step() ? (stmt.getAsObject() as unknown as T) : undefined;
    stmt.free();
    return row;
  }

  private run(sql: string, params?: Record<string, unknown>) {
    if (!this.db) return;
    if (params) {
      this.db.run(sql, this.mapParams(params));
    } else {
      this.db.run(sql);
    }
  }

  private async withRead<T>(fn: () => T | Promise<T>) {
    await this.init();
    return this.mutex.runExclusive(async () => await fn());
  }

  private async withWrite<T>(fn: () => T | Promise<T>) {
    await this.init();
    return this.mutex.runExclusive(async () => {
      const result = await fn();
      this.schedulePersist();
      return result;
    });
  }

  async getActiveProject() {
    return this.withRead(() => this.getOne<{ value: string }>('SELECT value FROM meta WHERE key = :key', { key: 'activeProject' })?.value ?? null);
  }

  async setActiveProject(projectId: string) {
    return this.withWrite(() => {
      const exists = this.getOne('SELECT 1 FROM projects WHERE id = :id', { id: projectId });
      if (!exists) return null;
      this.run(
        'INSERT INTO meta (key, value) VALUES (:key, :value) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        { key: 'activeProject', value: projectId }
      );
      return projectId;
    });
  }

  async listProjects(): Promise<Project[]> {
    return this.withRead(() => this.getAll<Project>('SELECT * FROM projects ORDER BY created_at DESC'));
  }

  async createProject(data: Omit<Project, 'id' | 'created_at'>) {
    return this.withWrite(() => {
      const project: Project = { id: uuidv4(), created_at: new Date().toISOString(), ...data };
      this.run(
        'INSERT INTO projects (id, name, description, net_m2, gross_m2, volume_m3, created_at) VALUES (:id, :name, :description, :net_m2, :gross_m2, :volume_m3, :created_at)',
        project
      );
      return project;
    });
  }

  async updateProject(id: string, data: Partial<Omit<Project, 'id' | 'created_at'>>) {
    const keys = Object.keys(data) as (keyof Project)[];
    if (!keys.length) return null;
    const setClause = keys.map((key) => `${key} = :${key}`).join(', ');
    return this.withWrite(() => {
      this.run(`UPDATE projects SET ${setClause} WHERE id = :id`, { ...data, id });
      return this.getOne<Project>('SELECT * FROM projects WHERE id = :id', { id });
    });
  }

  async getProject(id: string) {
    return this.withRead(() => this.getOne<Project>('SELECT * FROM projects WHERE id = :id', { id }));
  }

  async deleteProject(id: string) {
    return this.withWrite(() => {
      this.run('DELETE FROM projects WHERE id = :id', { id });
    });
  }

  async listPhases(): Promise<Phase[]> {
    return this.withRead(() => this.getAll<Phase>('SELECT * FROM phases ORDER BY order_no ASC'));
  }

  async createPhase(name: string) {
    return this.withWrite(() => {
      const current = this.getOne<{ no: number }>('SELECT COALESCE(MAX(order_no), 0) + 1 as no FROM phases')?.no ?? 1;
      const phase: Phase = { id: uuidv4(), name, order_no: current };
      this.run('INSERT INTO phases (id, name, order_no) VALUES (:id, :name, :order_no)', phase);
      return phase;
    });
  }

  async updatePhase(id: string, name: string) {
    return this.withWrite(() => {
      this.run('UPDATE phases SET name = :name WHERE id = :id', { id, name });
      return this.getOne<Phase>('SELECT * FROM phases WHERE id = :id', { id });
    });
  }

  async getPhase(id: string) {
    return this.withRead(() => this.getOne<Phase>('SELECT * FROM phases WHERE id = :id', { id }));
  }

  async deletePhase(id: string) {
    return this.withWrite(() => {
      this.run('DELETE FROM phases WHERE id = :id', { id });
    });
  }

  async reorderPhases(order: string[]) {
    return this.withWrite(() => {
      order.forEach((phaseId, idx) => {
        this.run('UPDATE phases SET order_no = :order_no WHERE id = :id', { id: phaseId, order_no: idx + 1 });
      });
      return this.getAll<Phase>('SELECT * FROM phases ORDER BY order_no ASC');
    });
  }

  async listSubphases(phaseId: string) {
    return this.withRead(() => this.getAll<Subphase>('SELECT * FROM subphases WHERE phase_id = :phase_id ORDER BY order_no ASC', { phase_id: phaseId }));
  }

  async createSubphase(phaseId: string, name: string) {
    return this.withWrite(() => {
      const next = this.getOne<{ no: number }>('SELECT COALESCE(MAX(order_no), 0) + 1 as no FROM subphases WHERE phase_id = :phase_id', {
        phase_id: phaseId,
      })?.no ?? 1;
      const sub: Subphase = { id: uuidv4(), phase_id: phaseId, name, order_no: next };
      this.run('INSERT INTO subphases (id, phase_id, name, order_no) VALUES (:id, :phase_id, :name, :order_no)', sub);
      return sub;
    });
  }

  async updateSubphase(id: string, name: string) {
    return this.withWrite(() => {
      this.run('UPDATE subphases SET name = :name WHERE id = :id', { id, name });
      return this.getOne<Subphase>('SELECT * FROM subphases WHERE id = :id', { id })!;
    });
  }

  async deleteSubphase(id: string) {
    return this.withWrite(() => {
      this.run('DELETE FROM subphases WHERE id = :id', { id });
    });
  }

  async listContractors(): Promise<Contractor[]> {
    return this.withRead(() => this.getAll<Contractor>('SELECT * FROM contractors ORDER BY created_at DESC'));
  }

  async createContractor(data: Omit<Contractor, 'id' | 'created_at'>) {
    return this.withWrite(() => {
      const contractor: Contractor = { id: uuidv4(), created_at: new Date().toISOString(), ...data };
      this.run(
        'INSERT INTO contractors (id, name, tax_id, phone, email, address, created_at) VALUES (:id, :name, :tax_id, :phone, :email, :address, :created_at)',
        contractor
      );
      return contractor;
    });
  }

  async updateContractor(id: string, data: Partial<Omit<Contractor, 'id' | 'created_at'>>) {
    const keys = Object.keys(data) as (keyof Contractor)[];
    if (!keys.length) return null;
    const setClause = keys.map((key) => `${key} = :${key}`).join(', ');
    return this.withWrite(() => {
      this.run(`UPDATE contractors SET ${setClause} WHERE id = :id`, { ...data, id });
      return this.getOne<Contractor>('SELECT * FROM contractors WHERE id = :id', { id });
    });
  }

  async deleteContractor(id: string) {
    return this.withWrite(() => {
      this.run('DELETE FROM contractors WHERE id = :id', { id });
    });
  }

  async listCosts(
    filters: Partial<{
      projectId: string;
      dateFrom: string;
      dateTo: string;
      phaseId: string;
      contractorId: string;
      status: string;
      category: string;
      search: string;
    }>
  ) {
    const clauses: string[] = [];
    const params: Record<string, unknown> = {};
    if (filters.projectId) {
      clauses.push('project_id = :projectId');
      params.projectId = filters.projectId;
    }
    if (filters.dateFrom) {
      clauses.push('date >= :dateFrom');
      params.dateFrom = filters.dateFrom;
    }
    if (filters.dateTo) {
      clauses.push('date <= :dateTo');
      params.dateTo = filters.dateTo;
    }
    if (filters.phaseId) {
      clauses.push('phase_id = :phaseId');
      params.phaseId = filters.phaseId;
    }
    if (filters.contractorId) {
      clauses.push('contractor_id = :contractorId');
      params.contractorId = filters.contractorId;
    }
    if (filters.status) {
      clauses.push('status = :status');
      params.status = filters.status;
    }
    if (filters.category) {
      clauses.push('category = :category');
      params.category = filters.category;
    }
    if (filters.search) {
      clauses.push('(title LIKE :search OR invoice_no LIKE :search)');
      params.search = `%${filters.search}%`;
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM costs ${where} ORDER BY date DESC`;
    return this.withRead(() => this.getAll<Cost>(sql, params));
  }

  async createCost(data: Omit<Cost, 'id' | 'created_at'>) {
    return this.withWrite(() => {
      const cost: Cost = { id: uuidv4(), created_at: new Date().toISOString(), ...data };
      this.run(
        `INSERT INTO costs (
          id, project_id, date, phase_id, subphase_id, contractor_id, title, category, amount_net, vat_rate, amount_gross, status, invoice_no, invoice_date, due_date, notes, created_at
        ) VALUES (
          :id, :project_id, :date, :phase_id, :subphase_id, :contractor_id, :title, :category, :amount_net, :vat_rate, :amount_gross, :status, :invoice_no, :invoice_date, :due_date, :notes, :created_at
        )`,
        cost
      );
      return cost;
    });
  }

  async updateCost(id: string, data: Partial<Omit<Cost, 'id' | 'created_at' | 'project_id'>>) {
    const keys = Object.keys(data) as (keyof Cost)[];
    if (!keys.length) return null;
    const setClause = keys.map((key) => `${key} = :${key}`).join(', ');
    return this.withWrite(() => {
      this.run(`UPDATE costs SET ${setClause} WHERE id = :id`, { ...data, id });
      return this.getOne<Cost>('SELECT * FROM costs WHERE id = :id', { id });
    });
  }

  async deleteCost(id: string) {
    return this.withWrite(() => {
      this.run('DELETE FROM costs WHERE id = :id', { id });
    });
  }

  async attachDocument(doc: Omit<Document, 'id' | 'created_at'>) {
    return this.withWrite(() => {
      const record: Document = { id: uuidv4(), created_at: new Date().toISOString(), ...doc };
      this.run(
        'INSERT INTO documents (id, project_id, cost_id, original_name, stored_name, stored_path, mime, size, created_at) VALUES (:id, :project_id, :cost_id, :original_name, :stored_name, :stored_path, :mime, :size, :created_at)',
        record
      );
      return record;
    });
  }

  async listDocuments(projectId: string) {
    return this.withRead(() => this.getAll<Document>('SELECT * FROM documents WHERE project_id = :project_id ORDER BY created_at DESC', { project_id: projectId }));
  }

  async deleteDocument(id: string) {
    return this.withWrite(() => {
      this.run('DELETE FROM documents WHERE id = :id', { id });
    });
  }

  async exportCostsCsv(projectId?: string) {
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
    const [headerLine, ...rows] = csv.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(',');
    return this.withWrite(() => {
      const imported: Cost[] = [];
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
        this.run(
          `INSERT OR REPLACE INTO costs (
            id, project_id, date, phase_id, subphase_id, contractor_id, title, category, amount_net, vat_rate, amount_gross, status, invoice_no, invoice_date, due_date, notes, created_at
          ) VALUES (
            :id, :project_id, :date, :phase_id, :subphase_id, :contractor_id, :title, :category, :amount_net, :vat_rate, :amount_gross, :status, :invoice_no, :invoice_date, :due_date, :notes, :created_at
          )`,
          entry
        );
        imported.push(entry as Cost);
      });
      return imported;
    });
  }

  async exportBackup(targetPath: string) {
    await this.init();
    await this.flushPendingSave();
    const uploads = getUploadsPath();
    const dbPath = getDatabasePath();
    const archiver = require('archiver');
    const output = fs.createWriteStream(targetPath);
    const archive = archiver('zip');
    return new Promise<string>((resolve, reject) => {
      output.on('close', () => resolve(targetPath));
      archive.on('error', (err: Error) => reject(err));
      archive.pipe(output);
      archive.file(dbPath, { name: 'app.sqlite' });
      if (fs.existsSync(uploads)) {
        archive.directory(uploads, 'uploads');
      }
      archive.finalize();
    });
  }

  async importBackup(zipPath: string) {
    await this.init();
    await this.mutex.runExclusive(async () => {
      await this.flushPendingSave();
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipPath);
      const dbPath = getDatabasePath();
      const uploads = getUploadsPath();
      await ensureDataDirectories();
      zip.extractEntryTo('app.sqlite', path.dirname(dbPath), false, true);
      zip.extractEntryTo('uploads/', path.dirname(uploads), false, true);
      await this.loadDatabase();
      this.applySchema();
      await this.seedPhases();
    });
  }
}

let dbInstance: SqlJsDatabase | null = null;

export const getDb = () => {
  if (!dbInstance) {
    dbInstance = new SqlJsDatabase();
  }
  return dbInstance;
};

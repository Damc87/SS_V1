export type PhaseCategory = 'material' | 'delo' | 'stroj' | 'prevoz' | 'ostalo';
export type CostStatus = 'planirano' | 'potrjeno' | 'placano';

export type Project = {
  id: string;
  name: string;
  description?: string;
  net_m2?: number;
  gross_m2?: number;
  volume_m3?: number;
  created_at: string;
};

export type MainPhase = { id: string; name: string; order_no: number; budget_planned?: number; project_id?: string };
export type Phase = MainPhase;
export type Subphase = { id: string; main_phase_id: string; name: string; order_no: number };
export type Contractor = {
  id: string;
  name: string;
  project_id?: string;
  phase_id?: string;
  tax_id?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
};

export type PaymentStatus = 'unpaid' | 'paid' | 'partial';

export type Cost = {
  id: string;
  project_id: string;
  date: string;
  phase_id: string;
  subphase_id: string;
  contractor_id: string;
  description: string;
  title?: string;
  category?: PhaseCategory;
  qty: number;
  unit: string;
  unit_price: number;
  amount_net: number;
  vat_rate?: number;
  amount_gross: number;
  payment_status: PaymentStatus;
  invoice_no?: string;
  invoice_date?: string;
  due_date?: string;
  note?: string;
  notes?: string;
  payment_status_history?: PaymentStatus[];
  created_at: string;
  updated_at: string;
};

export type CostInput = Omit<Cost, 'id' | 'created_at' | 'updated_at' | 'payment_status_history' | 'amount_net' | 'amount_gross' | 'phase_id' | 'subphase_id'> & {
  phase_id?: string;
  subphase_id?: string;
  amount_net?: number;
  amount_gross?: number;
};

export type CostListResult = {
  items: Cost[];
  total: number;
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

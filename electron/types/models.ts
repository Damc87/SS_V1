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
  category: PhaseCategory;
  amount_net: number;
  vat_rate: number;
  amount_gross: number;
  status: CostStatus;
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

export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'completed' | 'overdue';
export type RiskLevel = 'high' | 'medium' | 'low';
export type ClientType = 'NGO' | 'NON_NGO' | 'UNCLASSIFIED';
export type NgoStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface Invoice {
  id: string;
  date: string; // YYYY-MM-DD
  invoice_no: string;
  client_id?: string | null; // Stored as TEXT to preserve leading zeroes
  client_name: string;
  client_type: ClientType;
  ngo_name?: string | null;
  invoice_type: string;
  amount: number; // Invoice Amount
  balance: number; // Balance (As of now)
  return_amount?: number; // Return
  sold_amount?: number; // Sold
  status: string;
  mode_of_payment: string;
  user_name: string;
  clinic_name: string;
  inv_year?: number | null;
  inv_month?: string | null;
  email?: string | null;
  mobile?: string | null;
  home?: string | null;
  staff_id?: string | null;
  clinic_id?: string | null;
  import_batch_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NGO {
  id: string;
  client_id: string; // UNIQUE text identifier
  ngo_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  notes?: string;
  status: NgoStatus;
  created_at?: string;
  updated_at?: string;
}

export interface NGOAnalyticsSummary {
  id: string;
  ngo_name: string;
  client_id: string;
  total_outstanding: number;
  total_amount: number;
  invoice_count: number;
  outstanding_invoice_count: number;
  avg_outstanding: number;
  clinics: string[];
  status: NgoStatus;
}

export interface ImportBatch {
  id: string;
  file_name: string;
  file_size: number;
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  updated_rows: number;
  ngo_count?: number;
  non_ngo_count?: number;
  unclassified_count?: number;
  uploaded_by?: string | null;
  storage_path?: string | null;
  created_at: string;
}

export interface ImportError {
  id: string;
  batch_id: string;
  row_index: number;
  invoice_no?: string;
  raw_data: Record<string, unknown>;
  error_message: string;
  created_at: string;
}

export interface ClinicAnalyticsSummary {
  clinic_name: string;
  total_outstanding: number;
  total_amount: number;
  invoice_count: number;
  outstanding_invoice_count: number;
  avg_outstanding: number;
  percentage_contribution: number;
  unique_clients: number;
  highest_invoice: number;
  risk_level: RiskLevel;
}

export interface StaffPerformanceSummary {
  staff_name: string;
  total_outstanding: number;
  total_amount: number;
  invoice_count: number;
  outstanding_invoice_count: number;
  avg_outstanding: number;
  clinics: string[];
  percentage_contribution: number;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at?: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  task_date: string; // YYYY-MM-DD
  due_time?: string; // HH:mm
  priority: Priority;
  category: string;
  status: TaskStatus;
  completed_at?: string | null;
  notes?: string;
  has_reminder?: boolean;
  subtasks?: Subtask[];
  created_at?: string;
  updated_at?: string;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  user_id: string;
  action: 'created' | 'completed' | 'reopened' | 'updated' | 'carried_forward';
  notes?: string;
  created_at: string;
}

export interface DailyNote {
  id: string;
  user_id: string;
  note_date: string; // YYYY-MM-DD
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface FilterState {
  search: string;
  clientIdSearch?: string;
  clientType: 'all' | 'ngo' | 'non_ngo' | 'unclassified';
  datePreset: 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'financial_year' | 'custom';
  startDate?: string;
  endDate?: string;
  clinics: string[];
  staff: string[];
  statuses: string[];
  invoiceTypes: string[];
  paymentModes: string[];
  minBalance?: number;
  maxBalance?: number;
}

export interface DuplicateInvoiceResolution {
  invoice: Omit<Invoice, 'id'>;
  existingId: string;
  currentBalance: number;
  newBalance: number;
  action: 'skip' | 'update';
}

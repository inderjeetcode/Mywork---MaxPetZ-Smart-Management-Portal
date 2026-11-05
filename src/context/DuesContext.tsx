import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  Invoice,
  NGO,
  NGOAnalyticsSummary,
  ImportBatch,
  FilterState,
  ClinicAnalyticsSummary,
  StaffPerformanceSummary,
  DuplicateInvoiceResolution,
  NgoStatus,
} from '../types';
import { supabase } from '../lib/supabase';
import { SAMPLE_OCTOBER_DUES } from '../services/sampleDataService';
import { subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';

const LOCAL_INVOICES_KEY = 'maxpetz_local_invoices_v2';
const LOCAL_NGOS_KEY = 'maxpetz_local_ngos_v2';
const LOCAL_BATCHES_KEY = 'maxpetz_local_batches_v2';

interface DuesContextType {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  ngos: NGO[];
  importBatches: ImportBatch[];
  loading: boolean;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;

  // Primary 4-Way Outstanding KPIs
  totalOutstanding: number;
  ngoOutstanding: number;
  nonNgoOutstanding: number;
  unclassifiedOutstanding: number;
  totalInvoiceAmount: number;
  outstandingInvoiceCount: number;
  totalClinicsCount: number;
  totalStaffCount: number;
  avgOutstanding: number;
  highestOutstandingClinic: { name: string; amount: number } | null;
  highestOutstandingStaff: { name: string; amount: number } | null;

  // Specific Categorical Summaries
  clinicSummaries: ClinicAnalyticsSummary[];
  staffSummaries: StaffPerformanceSummary[];
  ngoSummaries: NGOAnalyticsSummary[];

  // Distinct Filter Options
  availableClinics: string[];
  availableStaff: string[];
  availableStatuses: string[];
  availableInvoiceTypes: string[];
  availablePaymentModes: string[];

  // NGO Master Operations
  addNgo: (ngo: Omit<NGO, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
  updateNgo: (id: string, updates: Partial<NGO>) => Promise<{ success: boolean; error?: string }>;
  setNgoStatus: (id: string, status: NgoStatus) => Promise<void>;
  unlinkNgoClientId: (id: string) => Promise<void>;

  // Import & Data Management Operations
  checkDuplicates: (newInvoices: Omit<Invoice, 'id'>[]) => {
    duplicates: DuplicateInvoiceResolution[];
    uniqueInvoices: Omit<Invoice, 'id'>[];
  };
  commitImport: (
    invoicesToInsert: Omit<Invoice, 'id'>[],
    invoicesToUpdate: { id: string; data: Partial<Invoice> }[],
    batchMeta: { fileName: string; fileSize: number; totalRows: number; skippedCount: number }
  ) => Promise<{ success: boolean; error?: string }>;
  loadSampleDuesData: () => Promise<void>;
  deleteImportBatch: (batchId: string) => Promise<void>;
  clearAllDuesData: () => Promise<void>;
}

const initialFilters: FilterState = {
  search: '',
  clientIdSearch: '',
  clientType: 'all',
  datePreset: 'all',
  clinics: [],
  staff: [],
  statuses: [],
  invoiceTypes: [],
  paymentModes: [],
};

const DuesContext = createContext<DuesContextType | undefined>(undefined);

export const DuesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Fetch initial records from Supabase with safe local storage fallback
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch NGOs
      const { data: dbNgos, error: ngoErr } = await supabase
        .from('ngo_master')
        .select('*')
        .order('ngo_name', { ascending: true });

      if (!ngoErr && dbNgos) {
        setNgos(dbNgos);
        localStorage.setItem(LOCAL_NGOS_KEY, JSON.stringify(dbNgos));
      } else {
        const savedNgos = localStorage.getItem(LOCAL_NGOS_KEY);
        if (savedNgos) {
          try {
            setNgos(JSON.parse(savedNgos));
          } catch {
            setNgos([]);
          }
        }
      }

      // 2. Fetch Invoices
      const { data: dbInvoices, error: invErr } = await supabase
        .from('invoices')
        .select('*')
        .order('date', { ascending: false });

      const { data: dbBatches } = await supabase
        .from('import_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (!invErr && dbInvoices && dbInvoices.length > 0) {
        setInvoices(dbInvoices);
        if (dbBatches) setImportBatches(dbBatches);
        localStorage.setItem(LOCAL_INVOICES_KEY, JSON.stringify(dbInvoices));
        if (dbBatches) localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(dbBatches));
      } else {
        const savedInvoices = localStorage.getItem(LOCAL_INVOICES_KEY);
        const savedBatches = localStorage.getItem(LOCAL_BATCHES_KEY);
        if (savedInvoices) {
          try {
            setInvoices(JSON.parse(savedInvoices));
          } catch {
            setInvoices([]);
          }
        }
        if (savedBatches) {
          try {
            setImportBatches(JSON.parse(savedBatches));
          } catch {
            setImportBatches([]);
          }
        }
      }
    } catch {
      const savedInvoices = localStorage.getItem(LOCAL_INVOICES_KEY);
      if (savedInvoices) {
        try {
          setInvoices(JSON.parse(savedInvoices));
        } catch {
          setInvoices([]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetFilters = () => setFilters(initialFilters);

  // Distinct filter lists
  const availableClinics = useMemo(() => {
    return Array.from(new Set(invoices.map(i => i.clinic_name).filter(Boolean))).sort();
  }, [invoices]);

  const availableStaff = useMemo(() => {
    return Array.from(new Set(invoices.map(i => i.user_name).filter(Boolean))).sort();
  }, [invoices]);

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(invoices.map(i => i.status).filter(Boolean))).sort();
  }, [invoices]);

  const availableInvoiceTypes = useMemo(() => {
    return Array.from(new Set(invoices.map(i => i.invoice_type).filter(Boolean))).sort();
  }, [invoices]);

  const availablePaymentModes = useMemo(() => {
    return Array.from(new Set(invoices.map(i => i.mode_of_payment).filter(Boolean))).sort();
  }, [invoices]);

  // Global Filtering Logic with Client Type & Client ID search
  const filteredInvoices = useMemo(() => {
    const today = new Date();

    return invoices.filter(inv => {
      // 1. Client Type filter: All, NGO, Non-NGO, Unclassified
      if (filters.clientType !== 'all') {
        const type = inv.client_type || 'UNCLASSIFIED';
        if (filters.clientType === 'ngo' && type !== 'NGO') return false;
        if (filters.clientType === 'non_ngo' && type !== 'NON_NGO') return false;
        if (filters.clientType === 'unclassified' && type !== 'UNCLASSIFIED') return false;
      }

      // 2. Client ID search
      if (filters.clientIdSearch) {
        const qId = filters.clientIdSearch.trim().toLowerCase();
        if (!inv.client_id || !inv.client_id.toLowerCase().includes(qId)) {
          return false;
        }
      }

      // 3. General text search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matches =
          inv.invoice_no.toLowerCase().includes(q) ||
          inv.client_name.toLowerCase().includes(q) ||
          (inv.client_id && inv.client_id.toLowerCase().includes(q)) ||
          inv.clinic_name.toLowerCase().includes(q) ||
          inv.user_name.toLowerCase().includes(q) ||
          (inv.ngo_name && inv.ngo_name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 4. Date presets
      if (filters.datePreset !== 'all' && inv.date) {
        try {
          const invDate = parseISO(inv.date);
          if (filters.datePreset === 'today') {
            const todayStr = today.toISOString().split('T')[0];
            if (inv.date !== todayStr) return false;
          } else if (filters.datePreset === 'yesterday') {
            const ydayStr = subDays(today, 1).toISOString().split('T')[0];
            if (inv.date !== ydayStr) return false;
          } else if (filters.datePreset === 'last_7_days') {
            const start = subDays(today, 7);
            if (!isWithinInterval(invDate, { start, end: today })) return false;
          } else if (filters.datePreset === 'last_30_days') {
            const start = subDays(today, 30);
            if (!isWithinInterval(invDate, { start, end: today })) return false;
          } else if (filters.datePreset === 'this_month') {
            const start = startOfMonth(today);
            const end = endOfMonth(today);
            if (!isWithinInterval(invDate, { start, end })) return false;
          } else if (filters.datePreset === 'last_month') {
            const lastM = subMonths(today, 1);
            const start = startOfMonth(lastM);
            const end = endOfMonth(lastM);
            if (!isWithinInterval(invDate, { start, end })) return false;
          } else if (filters.datePreset === 'financial_year') {
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
            const start = new Date(fyStartYear, 3, 1);
            const end = new Date(fyStartYear + 1, 2, 31);
            if (!isWithinInterval(invDate, { start, end })) return false;
          } else if (filters.datePreset === 'custom') {
            if (filters.startDate && inv.date < filters.startDate) return false;
            if (filters.endDate && inv.date > filters.endDate) return false;
          }
        } catch {
          // Ignore
        }
      }

      // 5. Multi-Select Clinic Filter
      if (filters.clinics.length > 0 && !filters.clinics.includes(inv.clinic_name)) {
        return false;
      }

      // 6. Multi-Select Staff Filter
      if (filters.staff.length > 0 && !filters.staff.includes(inv.user_name)) {
        return false;
      }

      // 7. Status Filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(inv.status)) {
        return false;
      }

      // 8. Invoice Type Filter
      if (filters.invoiceTypes.length > 0 && !filters.invoiceTypes.includes(inv.invoice_type)) {
        return false;
      }

      // 9. Payment Mode Filter
      if (filters.paymentModes.length > 0 && !filters.paymentModes.includes(inv.mode_of_payment)) {
        return false;
      }

      // 10. Balance Thresholds
      if (filters.minBalance !== undefined && inv.balance < filters.minBalance) {
        return false;
      }
      if (filters.maxBalance !== undefined && inv.balance > filters.maxBalance) {
        return false;
      }

      return true;
    });
  }, [invoices, filters]);

  // Executive KPI Calculations with Strict 3-Way Outstanding Distribution
  const {
    totalOutstanding,
    ngoOutstanding,
    nonNgoOutstanding,
    unclassifiedOutstanding,
    totalInvoiceAmount,
    outstandingInvoiceCount,
    totalClinicsCount,
    totalStaffCount,
    avgOutstanding,
    highestOutstandingClinic,
    highestOutstandingStaff,
  } = useMemo(() => {
    let sumTotalOutstanding = 0;
    let sumNgoOutstanding = 0;
    let sumNonNgoOutstanding = 0;
    let sumUnclassifiedOutstanding = 0;
    let sumTotalAmount = 0;

    const outstandingKeys = new Set<string>();
    const clinicsSet = new Set<string>();
    const staffSet = new Set<string>();

    const clinicDuesMap = new Map<string, number>();
    const staffDuesMap = new Map<string, number>();

    filteredInvoices.forEach(inv => {
      const bal = Number(inv.balance) || 0;
      const amt = Number(inv.amount) || 0;

      sumTotalOutstanding += bal;
      sumTotalAmount += amt;

      const cType = inv.client_type || 'UNCLASSIFIED';
      if (cType === 'NGO') {
        sumNgoOutstanding += bal;
      } else if (cType === 'NON_NGO') {
        sumNonNgoOutstanding += bal;
      } else {
        sumUnclassifiedOutstanding += bal;
      }

      if (inv.clinic_name) clinicsSet.add(inv.clinic_name);
      if (inv.user_name) staffSet.add(inv.user_name);

      if (bal > 0) {
        const uniqueKey = `${inv.invoice_no}_${inv.clinic_name}`;
        outstandingKeys.add(uniqueKey);

        if (inv.clinic_name) {
          clinicDuesMap.set(inv.clinic_name, (clinicDuesMap.get(inv.clinic_name) || 0) + bal);
        }
        if (inv.user_name) {
          staffDuesMap.set(inv.user_name, (staffDuesMap.get(inv.user_name) || 0) + bal);
        }
      }
    });

    const outstandingCount = outstandingKeys.size;
    const avg = outstandingCount > 0 ? sumTotalOutstanding / outstandingCount : 0;

    let highestClinic: { name: string; amount: number } | null = null;
    clinicDuesMap.forEach((amt, name) => {
      if (!highestClinic || amt > highestClinic.amount) {
        highestClinic = { name, amount: amt };
      }
    });

    let highestStaff: { name: string; amount: number } | null = null;
    staffDuesMap.forEach((amt, name) => {
      if (!highestStaff || amt > highestStaff.amount) {
        highestStaff = { name, amount: amt };
      }
    });

    return {
      totalOutstanding: sumTotalOutstanding,
      ngoOutstanding: sumNgoOutstanding,
      nonNgoOutstanding: sumNonNgoOutstanding,
      unclassifiedOutstanding: sumUnclassifiedOutstanding,
      totalInvoiceAmount: sumTotalAmount,
      outstandingInvoiceCount: outstandingCount,
      totalClinicsCount: clinicsSet.size,
      totalStaffCount: staffSet.size,
      avgOutstanding: avg,
      highestOutstandingClinic: highestClinic,
      highestOutstandingStaff: highestStaff,
    };
  }, [filteredInvoices]);

  // Clinic Summaries
  const clinicSummaries = useMemo<ClinicAnalyticsSummary[]>(() => {
    const map = new Map<
      string,
      {
        totalOutstanding: number;
        totalAmount: number;
        invoiceCount: number;
        outstandingCount: number;
        clients: Set<string>;
        highestInvoice: number;
      }
    >();

    filteredInvoices.forEach(inv => {
      const clinic = inv.clinic_name || 'Unassigned Clinic';
      const bal = Number(inv.balance) || 0;
      const amt = Number(inv.amount) || 0;

      if (!map.has(clinic)) {
        map.set(clinic, {
          totalOutstanding: 0,
          totalAmount: 0,
          invoiceCount: 0,
          outstandingCount: 0,
          clients: new Set<string>(),
          highestInvoice: 0,
        });
      }

      const c = map.get(clinic)!;
      c.totalOutstanding += bal;
      c.totalAmount += amt;
      c.invoiceCount += 1;
      if (bal > 0) {
        c.outstandingCount += 1;
        if (inv.client_name) c.clients.add(inv.client_name);
        if (bal > c.highestInvoice) c.highestInvoice = bal;
      }
    });

    const result: ClinicAnalyticsSummary[] = [];

    map.forEach((data, clinic_name) => {
      const percentage_contribution =
        totalOutstanding > 0 ? (data.totalOutstanding / totalOutstanding) * 100 : 0;
      const avg_outstanding =
        data.outstandingCount > 0 ? data.totalOutstanding / data.outstandingCount : 0;

      let risk_level: 'high' | 'medium' | 'low' = 'low';
      if (data.totalOutstanding >= 50000 || percentage_contribution >= 25) {
        risk_level = 'high';
      } else if (data.totalOutstanding >= 15000 || percentage_contribution >= 10) {
        risk_level = 'medium';
      }

      result.push({
        clinic_name,
        total_outstanding: data.totalOutstanding,
        total_amount: data.totalAmount,
        invoice_count: data.invoiceCount,
        outstanding_invoice_count: data.outstandingCount,
        avg_outstanding,
        percentage_contribution,
        unique_clients: data.clients.size,
        highest_invoice: data.highestInvoice,
        risk_level,
      });
    });

    return result.sort((a, b) => b.total_outstanding - a.total_outstanding);
  }, [filteredInvoices, totalOutstanding]);

  // Staff Performance Summaries
  const staffSummaries = useMemo<StaffPerformanceSummary[]>(() => {
    const map = new Map<
      string,
      {
        totalOutstanding: number;
        totalAmount: number;
        invoiceCount: number;
        outstandingCount: number;
        clinics: Set<string>;
      }
    >();

    filteredInvoices.forEach(inv => {
      const staff = inv.user_name || 'Unassigned Staff';
      const bal = Number(inv.balance) || 0;
      const amt = Number(inv.amount) || 0;

      if (!map.has(staff)) {
        map.set(staff, {
          totalOutstanding: 0,
          totalAmount: 0,
          invoiceCount: 0,
          outstandingCount: 0,
          clinics: new Set<string>(),
        });
      }

      const s = map.get(staff)!;
      s.totalOutstanding += bal;
      s.totalAmount += amt;
      s.invoiceCount += 1;
      if (inv.clinic_name) s.clinics.add(inv.clinic_name);
      if (bal > 0) s.outstandingCount += 1;
    });

    const result: StaffPerformanceSummary[] = [];

    map.forEach((data, staff_name) => {
      const percentage_contribution =
        totalOutstanding > 0 ? (data.totalOutstanding / totalOutstanding) * 100 : 0;
      const avg_outstanding =
        data.outstandingCount > 0 ? data.totalOutstanding / data.outstandingCount : 0;

      result.push({
        staff_name,
        total_outstanding: data.totalOutstanding,
        total_amount: data.totalAmount,
        invoice_count: data.invoiceCount,
        outstanding_invoice_count: data.outstandingCount,
        avg_outstanding,
        clinics: Array.from(data.clinics),
        percentage_contribution,
      });
    });

    return result.sort((a, b) => b.total_outstanding - a.total_outstanding);
  }, [filteredInvoices, totalOutstanding]);

  // NGO Analytics Summaries
  const ngoSummaries = useMemo<NGOAnalyticsSummary[]>(() => {
    // Map registered NGOs
    const summaryMap = new Map<string, NGOAnalyticsSummary>();

    ngos.forEach(ngo => {
      summaryMap.set(ngo.client_id.trim().toUpperCase(), {
        id: ngo.id,
        ngo_name: ngo.ngo_name,
        client_id: ngo.client_id,
        total_outstanding: 0,
        total_amount: 0,
        invoice_count: 0,
        outstanding_invoice_count: 0,
        avg_outstanding: 0,
        clinics: [],
        status: ngo.status,
      });
    });

    const clinicsPerNgo = new Map<string, Set<string>>();

    filteredInvoices.forEach(inv => {
      if (inv.client_id) {
        const key = inv.client_id.trim().toUpperCase();
        let summary = summaryMap.get(key);

        // If not registered in ngo_master but invoice tagged as NGO
        if (!summary && inv.client_type === 'NGO') {
          summary = {
            id: key,
            ngo_name: inv.ngo_name || inv.client_name,
            client_id: inv.client_id,
            total_outstanding: 0,
            total_amount: 0,
            invoice_count: 0,
            outstanding_invoice_count: 0,
            avg_outstanding: 0,
            clinics: [],
            status: 'ACTIVE',
          };
          summaryMap.set(key, summary);
        }

        if (summary) {
          const bal = Number(inv.balance) || 0;
          const amt = Number(inv.amount) || 0;
          summary.total_outstanding += bal;
          summary.total_amount += amt;
          summary.invoice_count += 1;
          if (bal > 0) summary.outstanding_invoice_count += 1;

          if (!clinicsPerNgo.has(key)) clinicsPerNgo.set(key, new Set<string>());
          if (inv.clinic_name) clinicsPerNgo.get(key)!.add(inv.clinic_name);
        }
      }
    });

    summaryMap.forEach((s, key) => {
      s.clinics = Array.from(clinicsPerNgo.get(key) || []);
      s.avg_outstanding =
        s.outstanding_invoice_count > 0 ? s.total_outstanding / s.outstanding_invoice_count : 0;
    });

    return Array.from(summaryMap.values()).sort((a, b) => b.total_outstanding - a.total_outstanding);
  }, [ngos, filteredInvoices]);

  // NGO Master Operations
  const addNgo = async (ngoData: Omit<NGO, 'id' | 'created_at' | 'updated_at'>) => {
    const cleanClientId = ngoData.client_id.trim();
    if (!cleanClientId) {
      return { success: false, error: 'Client ID is mandatory.' };
    }

    // Check duplicate client_id
    const exists = ngos.some(
      n => n.client_id.trim().toUpperCase() === cleanClientId.toUpperCase()
    );
    if (exists) {
      return { success: false, error: `NGO with Client ID "${cleanClientId}" already exists.` };
    }

    const newNgo: NGO = {
      ...ngoData,
      id: crypto.randomUUID(),
      client_id: cleanClientId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('ngo_master').insert([newNgo]);
    } catch (err) {
      console.warn('Supabase ngo_master insert fallback:', err);
    }

    const next = [...ngos, newNgo];
    setNgos(next);
    localStorage.setItem(LOCAL_NGOS_KEY, JSON.stringify(next));

    return { success: true };
  };

  const updateNgo = async (id: string, updates: Partial<NGO>) => {
    const target = ngos.find(n => n.id === id);
    if (!target) return { success: false, error: 'NGO not found.' };

    const updated = { ...target, ...updates, updated_at: new Date().toISOString() };

    try {
      await supabase.from('ngo_master').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Supabase ngo_master update fallback:', err);
    }

    const next = ngos.map(n => (n.id === id ? updated : n));
    setNgos(next);
    localStorage.setItem(LOCAL_NGOS_KEY, JSON.stringify(next));

    return { success: true };
  };

  const setNgoStatus = async (id: string, status: NgoStatus) => {
    await updateNgo(id, { status });
  };

  const unlinkNgoClientId = async (id: string) => {
    // Unlinks from active NGO master list without deleting historical invoices
    await updateNgo(id, { status: 'ARCHIVED' });
  };

  // Duplicate Check against existing invoices (Key: Invoice No. + Clinic)
  const checkDuplicates = (newInvoices: Omit<Invoice, 'id'>[]) => {
    const existingMap = new Map<string, Invoice>();
    invoices.forEach(inv => {
      const key = `${inv.invoice_no.toLowerCase().trim()}___${inv.clinic_name.toLowerCase().trim()}`;
      existingMap.set(key, inv);
    });

    const duplicates: DuplicateInvoiceResolution[] = [];
    const uniqueInvoices: Omit<Invoice, 'id'>[] = [];

    newInvoices.forEach(newInv => {
      const key = `${newInv.invoice_no.toLowerCase().trim()}___${newInv.clinic_name.toLowerCase().trim()}`;
      const existing = existingMap.get(key);
      if (existing) {
        duplicates.push({
          invoice: newInv,
          existingId: existing.id,
          currentBalance: existing.balance,
          newBalance: newInv.balance,
          action: 'skip',
        });
      } else {
        uniqueInvoices.push(newInv);
      }
    });

    return { duplicates, uniqueInvoices };
  };

  // Commit Import
  const commitImport = async (
    invoicesToInsert: Omit<Invoice, 'id'>[],
    invoicesToUpdate: { id: string; data: Partial<Invoice> }[],
    batchMeta: { fileName: string; fileSize: number; totalRows: number; skippedCount: number }
  ) => {
    try {
      const batchId = crypto.randomUUID();

      let ngoCount = 0;
      let nonNgoCount = 0;
      let unclassifiedCount = 0;

      const preparedInserts: Invoice[] = invoicesToInsert.map(inv => {
        if (inv.client_type === 'NGO') ngoCount++;
        else if (inv.client_type === 'NON_NGO') nonNgoCount++;
        else unclassifiedCount++;

        return {
          ...inv,
          id: crypto.randomUUID(),
          import_batch_id: batchId,
        };
      });

      const newBatch: ImportBatch = {
        id: batchId,
        file_name: batchMeta.fileName,
        file_size: batchMeta.fileSize,
        total_rows: batchMeta.totalRows,
        imported_rows: invoicesToInsert.length,
        skipped_rows: batchMeta.skippedCount,
        updated_rows: invoicesToUpdate.length,
        ngo_count: ngoCount,
        non_ngo_count: nonNgoCount,
        unclassified_count: unclassifiedCount,
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from('import_batches').insert([newBatch]);
        if (preparedInserts.length > 0) {
          await supabase.from('invoices').insert(preparedInserts);
        }
        for (const item of invoicesToUpdate) {
          await supabase.from('invoices').update(item.data).eq('id', item.id);
        }
      } catch (err) {
        console.warn('Supabase write fallback to local storage:', err);
      }

      setInvoices(prev => {
        let updated = [...prev];
        invoicesToUpdate.forEach(u => {
          updated = updated.map(inv => (inv.id === u.id ? { ...inv, ...u.data } : inv));
        });
        const next = [...preparedInserts, ...updated];
        localStorage.setItem(LOCAL_INVOICES_KEY, JSON.stringify(next));
        return next;
      });

      setImportBatches(prev => {
        const next = [newBatch, ...prev];
        localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(next));
        return next;
      });

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Import failed unexpectedly',
      };
    }
  };

  const loadSampleDuesData = async () => {
    await commitImport(SAMPLE_OCTOBER_DUES, [], {
      fileName: 'MaxPetZ_October_Due_17_Columns_Template.xlsx',
      fileSize: 48200,
      totalRows: SAMPLE_OCTOBER_DUES.length,
      skippedCount: 0,
    });
  };

  const deleteImportBatch = async (batchId: string) => {
    try {
      await supabase.from('invoices').delete().eq('import_batch_id', batchId);
      await supabase.from('import_batches').delete().eq('id', batchId);
    } catch {
      // Ignore
    }

    setInvoices(prev => {
      const next = prev.filter(i => i.import_batch_id !== batchId);
      localStorage.setItem(LOCAL_INVOICES_KEY, JSON.stringify(next));
      return next;
    });

    setImportBatches(prev => {
      const next = prev.filter(b => b.id !== batchId);
      localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearAllDuesData = async () => {
    try {
      await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('import_batches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch {
      // Ignore
    }

    setInvoices([]);
    setImportBatches([]);
    localStorage.removeItem(LOCAL_INVOICES_KEY);
    localStorage.removeItem(LOCAL_BATCHES_KEY);
  };

  return (
    <DuesContext.Provider
      value={{
        invoices,
        filteredInvoices,
        ngos,
        importBatches,
        loading,
        filters,
        setFilters,
        resetFilters,
        totalOutstanding,
        ngoOutstanding,
        nonNgoOutstanding,
        unclassifiedOutstanding,
        totalInvoiceAmount,
        outstandingInvoiceCount,
        totalClinicsCount,
        totalStaffCount,
        avgOutstanding,
        highestOutstandingClinic,
        highestOutstandingStaff,
        clinicSummaries,
        staffSummaries,
        ngoSummaries,
        availableClinics,
        availableStaff,
        availableStatuses,
        availableInvoiceTypes,
        availablePaymentModes,
        addNgo,
        updateNgo,
        setNgoStatus,
        unlinkNgoClientId,
        checkDuplicates,
        commitImport,
        loadSampleDuesData,
        deleteImportBatch,
        clearAllDuesData,
      }}
    >
      {children}
    </DuesContext.Provider>
  );
};

export function useDues(): DuesContextType {
  const context = useContext(DuesContext);
  if (!context) {
    throw new Error('useDues must be used within a DuesProvider');
  }
  return context;
}

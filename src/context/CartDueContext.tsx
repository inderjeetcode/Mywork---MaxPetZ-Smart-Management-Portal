import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  CartDueRecord,
  CartDuePayment,
  CartDueAdvanceCredit,
  CartDueAdvanceAllocation,
  CartDueFollowup,
  CartDueImportBatch,
  CartDueFilterState,
  CartDueClientSummary,
  CartDueProviderSummary,
  CartDuePaymentMethod,
  CartDueRecordStatus,
  CartDueNGO,
  CartDueNgoAnalyticsSummary,
  CartDueClientCategory,
  NGO,
} from '../types';
import { supabase } from '../lib/supabase';
import { subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO, startOfDay } from 'date-fns';

const LOCAL_CART_RECORDS_KEY = 'maxpetz_cart_due_records_v1';
const LOCAL_CART_PAYMENTS_KEY = 'maxpetz_cart_due_payments_v1';
const LOCAL_CART_ADVANCES_KEY = 'maxpetz_cart_due_advances_v1';
const LOCAL_CART_ALLOCATIONS_KEY = 'maxpetz_cart_due_allocations_v1';
const LOCAL_CART_FOLLOWUPS_KEY = 'maxpetz_cart_due_followups_v1';
const LOCAL_CART_BATCHES_KEY = 'maxpetz_cart_due_batches_v1';
const LOCAL_CART_NGOS_KEY = 'maxpetz_cart_due_ngos_v1';

interface CartDueContextType {
  records: CartDueRecord[];
  filteredRecords: CartDueRecord[];
  payments: CartDuePayment[];
  advanceCredits: CartDueAdvanceCredit[];
  followups: CartDueFollowup[];
  importBatches: CartDueImportBatch[];
  cartNgos: CartDueNGO[];
  loading: boolean;
  filters: CartDueFilterState;
  setFilters: React.Dispatch<React.SetStateAction<CartDueFilterState>>;
  resetFilters: () => void;

  // 7 Primary Cart Due KPIs
  totalCartOutstanding: number;
  totalCartClients: number;
  totalCartRecords: number;
  todayFollowupsCount: number;
  overdueFollowupsCount: number;
  totalCollectionReceived: number;
  availableAdvanceCredit: number;

  // 3-Way Category Outstanding Distribution (Strict: Total = NGO + Normal + Unclassified)
  totalCartNgoOutstanding: number;
  totalNormalClientOutstanding: number;
  totalUnclassifiedOutstanding: number;
  ngoClientCount: number;
  normalClientCount: number;
  unclassifiedClientCount: number;

  // Analytics & Aggregates
  clientSummaries: CartDueClientSummary[];
  providerSummaries: CartDueProviderSummary[];
  cartNgoSummaries: CartDueNgoAnalyticsSummary[];
  dailyTrends: { date: string; amount: number; count: number }[];
  monthlyTrends: { month: string; amount: number; count: number }[];
  topClients: CartDueClientSummary[];
  followupStatusDistribution: { status: string; count: number; color: string }[];
  availableProviders: string[];
  availableClients: { id: string; name: string }[];

  // Follow-up Pipeline Subsets
  allFollowups: CartDueFollowup[];
  todayFollowups: CartDueFollowup[];
  upcomingFollowups: CartDueFollowup[];
  overdueFollowups: CartDueFollowup[];
  completedFollowups: CartDueFollowup[];

  // NGO Master Management Actions
  addCartNgo: (
    ngoData: Omit<CartDueNGO, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<{ success: boolean; error?: string }>;
  updateCartNgo: (
    id: string,
    updates: Partial<CartDueNGO>
  ) => Promise<{ success: boolean; error?: string }>;
  toggleCartNgoStatus: (id: string) => Promise<void>;
  deleteCartNgo: (id: string) => Promise<void>;
  copyFromDuesNgoMaster: (
    duesNgos: NGO[]
  ) => Promise<{ importedCount: number; skippedCount: number }>;

  // Payment & Advance Actions
  recordPayment: (params: {
    recordId: string;
    amount: number;
    paymentMethod: CartDuePaymentMethod;
    referenceNo?: string;
    notes?: string;
  }) => Promise<{ success: boolean; isExcess?: boolean; excessAmount?: number; error?: string }>;
  addAdvanceCredit: (
    clientId: string,
    clientName: string,
    amount: number,
    paymentMethod: CartDuePaymentMethod,
    notes?: string
  ) => Promise<{ success: boolean }>;
  allocateAdvanceCredit: (
    advanceCreditId: string,
    recordId: string,
    amount: number
  ) => Promise<{ success: boolean; error?: string }>;

  // Follow-up Actions
  addFollowup: (
    followup: Omit<CartDueFollowup, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<CartDueFollowup>;
  updateFollowup: (id: string, updates: Partial<CartDueFollowup>) => Promise<void>;
  completeFollowup: (id: string, notes?: string) => Promise<void>;
  deleteFollowup: (id: string) => Promise<void>;

  // Data Management & Import Operations
  commitImport: (
    recordsToInsert: Omit<CartDueRecord, 'id'>[],
    recordsToUpdate: { id: string; data: Partial<CartDueRecord> }[],
    batchMeta: { fileName: string; fileSize: number; totalRows: number; skippedCount: number }
  ) => Promise<{ success: boolean; error?: string }>;
  deleteBatch: (batchId: string) => Promise<void>;
  deleteSelectedRecords: (ids: string[]) => Promise<void>;
  deleteAllCartDueData: () => Promise<void>;
}

const initialFilters: CartDueFilterState = {
  search: '',
  clientIdSearch: '',
  providerSearch: '',
  clientType: 'all',
  datePreset: 'all',
  providers: [],
  statuses: [],
};

const CartDueContext = createContext<CartDueContextType | undefined>(undefined);

export const CartDueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawRecords, setRawRecords] = useState<CartDueRecord[]>([]);
  const [payments, setPayments] = useState<CartDuePayment[]>([]);
  const [advanceCredits, setAdvanceCredits] = useState<CartDueAdvanceCredit[]>([]);
  const [advanceAllocations, setAdvanceAllocations] = useState<CartDueAdvanceAllocation[]>([]);
  const [followups, setFollowups] = useState<CartDueFollowup[]>([]);
  const [importBatches, setImportBatches] = useState<CartDueImportBatch[]>([]);
  // Cart Due NGO Master starts empty ready for user input (no fake NGOs)
  const [cartNgos, setCartNgos] = useState<CartDueNGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CartDueFilterState>(initialFilters);

  // Initialize data from Supabase or localStorage
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Cart Due NGOs
      const { data: dbNgos, error: ngoErr } = await supabase
        .from('cart_due_ngo_master')
        .select('*')
        .order('ngo_name', { ascending: true });

      if (!ngoErr && dbNgos) {
        setCartNgos(dbNgos);
        localStorage.setItem(LOCAL_CART_NGOS_KEY, JSON.stringify(dbNgos));
      } else {
        const savedNgos = localStorage.getItem(LOCAL_CART_NGOS_KEY);
        if (savedNgos) {
          try {
            setCartNgos(JSON.parse(savedNgos));
          } catch {
            setCartNgos([]);
          }
        } else {
          setCartNgos([]);
        }
      }

      // 2. Fetch Records
      const { data: dbRecords, error: recErr } = await supabase
        .from('cart_due_records')
        .select('*')
        .order('record_date', { ascending: false });

      if (!recErr && dbRecords && dbRecords.length > 0) {
        setRawRecords(dbRecords);
        localStorage.setItem(LOCAL_CART_RECORDS_KEY, JSON.stringify(dbRecords));
      } else {
        const saved = localStorage.getItem(LOCAL_CART_RECORDS_KEY);
        if (saved) {
          try {
            setRawRecords(JSON.parse(saved));
          } catch {
            setRawRecords([]);
          }
        } else {
          setRawRecords([]);
        }
      }

      // 3. Fetch Payments
      const { data: dbPayments, error: payErr } = await supabase
        .from('cart_due_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!payErr && dbPayments) {
        setPayments(dbPayments);
        localStorage.setItem(LOCAL_CART_PAYMENTS_KEY, JSON.stringify(dbPayments));
      } else {
        const saved = localStorage.getItem(LOCAL_CART_PAYMENTS_KEY);
        if (saved) {
          try {
            setPayments(JSON.parse(saved));
          } catch {
            setPayments([]);
          }
        }
      }

      // 4. Fetch Advances
      const { data: dbAdvances } = await supabase.from('cart_due_advance_credits').select('*');
      if (dbAdvances) {
        setAdvanceCredits(dbAdvances);
        localStorage.setItem(LOCAL_CART_ADVANCES_KEY, JSON.stringify(dbAdvances));
      } else {
        const saved = localStorage.getItem(LOCAL_CART_ADVANCES_KEY);
        if (saved) {
          try {
            setAdvanceCredits(JSON.parse(saved));
          } catch {
            setAdvanceCredits([]);
          }
        }
      }

      // 5. Fetch Allocations
      const { data: dbAlloc } = await supabase.from('cart_due_advance_allocations').select('*');
      if (dbAlloc) {
        setAdvanceAllocations(dbAlloc);
        localStorage.setItem(LOCAL_CART_ALLOCATIONS_KEY, JSON.stringify(dbAlloc));
      } else {
        const saved = localStorage.getItem(LOCAL_CART_ALLOCATIONS_KEY);
        if (saved) {
          try {
            setAdvanceAllocations(JSON.parse(saved));
          } catch {
            setAdvanceAllocations([]);
          }
        }
      }

      // 6. Fetch Followups
      const { data: dbFollowups } = await supabase
        .from('cart_due_followups')
        .select('*')
        .order('followup_date', { ascending: false });

      if (dbFollowups) {
        setFollowups(dbFollowups);
        localStorage.setItem(LOCAL_CART_FOLLOWUPS_KEY, JSON.stringify(dbFollowups));
      } else {
        const saved = localStorage.getItem(LOCAL_CART_FOLLOWUPS_KEY);
        if (saved) {
          try {
            setFollowups(JSON.parse(saved));
          } catch {
            setFollowups([]);
          }
        }
      }

      // 7. Fetch Batches
      const { data: dbBatches } = await supabase
        .from('cart_due_import_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbBatches) {
        setImportBatches(dbBatches);
        localStorage.setItem(LOCAL_CART_BATCHES_KEY, JSON.stringify(dbBatches));
      } else {
        const saved = localStorage.getItem(LOCAL_CART_BATCHES_KEY);
        if (saved) {
          try {
            setImportBatches(JSON.parse(saved));
          } catch {
            setImportBatches([]);
          }
        }
      }
    } catch {
      // Local fallback
      const savedRecs = localStorage.getItem(LOCAL_CART_RECORDS_KEY);
      if (savedRecs) {
        try {
          setRawRecords(JSON.parse(savedRecs));
        } catch {
          setRawRecords([]);
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

  // Active NGO Map for exact normalized Client ID matching
  const activeCartNgoMap = useMemo(() => {
    const map = new Map<string, CartDueNGO>();
    cartNgos.forEach(n => {
      if (n.status === 'ACTIVE' && n.client_id) {
        map.set(n.client_id.trim().toUpperCase(), n);
      }
    });
    return map;
  }, [cartNgos]);

  // Dynamic automatic classification:
  // - Missing / blank client_id -> UNCLASSIFIED
  // - Exact normalized match against active Cart Due NGO Master -> NGO
  // - Otherwise -> NORMAL
  const records = useMemo<CartDueRecord[]>(() => {
    return rawRecords.map(r => {
      const rawId = (r.client_id || '').trim();
      if (!rawId) {
        return {
          ...r,
          client_type: 'UNCLASSIFIED',
          ngo_name: null,
        };
      }
      const matchedNgo = activeCartNgoMap.get(rawId.toUpperCase());
      if (matchedNgo) {
        return {
          ...r,
          client_type: 'NGO',
          ngo_name: matchedNgo.ngo_name,
        };
      }
      return {
        ...r,
        client_type: 'NORMAL',
        ngo_name: null,
      };
    });
  }, [rawRecords, activeCartNgoMap]);

  // Available Providers and Clients
  const availableProviders = useMemo(() => {
    return Array.from(new Set(records.map(r => r.provider_name).filter(Boolean))).sort();
  }, [records]);

  const availableClients = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach(r => {
      if (r.client_id && !map.has(r.client_id)) {
        map.set(r.client_id, r.client_name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);

  // Global Filtering for Cart Due
  const filteredRecords = useMemo(() => {
    const today = new Date();

    return records.filter(rec => {
      // Category tab filtering: 'all' | 'ngo' | 'normal' | 'unclassified'
      if (filters.clientType && filters.clientType !== 'all') {
        if (filters.clientType === 'ngo' && rec.client_type !== 'NGO') return false;
        if (filters.clientType === 'normal' && rec.client_type !== 'NORMAL') return false;
        if (filters.clientType === 'unclassified' && rec.client_type !== 'UNCLASSIFIED') return false;
      }

      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          rec.client_name.toLowerCase().includes(q) ||
          rec.client_id.toLowerCase().includes(q) ||
          rec.provider_name.toLowerCase().includes(q) ||
          (rec.ngo_name && rec.ngo_name.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Client ID Search
      if (filters.clientIdSearch) {
        const qId = filters.clientIdSearch.trim().toLowerCase();
        if (!rec.client_id.toLowerCase().includes(qId)) return false;
      }

      // Provider Search
      if (filters.providerSearch) {
        const qP = filters.providerSearch.trim().toLowerCase();
        if (!rec.provider_name.toLowerCase().includes(qP)) return false;
      }

      // Providers list
      if (filters.providers.length > 0 && !filters.providers.includes(rec.provider_name)) {
        return false;
      }

      // Statuses
      if (filters.statuses.length > 0 && !filters.statuses.includes(rec.status)) {
        return false;
      }

      // Date presets
      if (filters.datePreset !== 'all' && rec.record_date) {
        try {
          const recDate = parseISO(rec.record_date);
          if (filters.datePreset === 'today') {
            const todayStr = today.toISOString().split('T')[0];
            if (rec.record_date !== todayStr) return false;
          } else if (filters.datePreset === 'yesterday') {
            const ydayStr = subDays(today, 1).toISOString().split('T')[0];
            if (rec.record_date !== ydayStr) return false;
          } else if (filters.datePreset === 'last_7_days') {
            const start = subDays(today, 7);
            if (!isWithinInterval(recDate, { start, end: today })) return false;
          } else if (filters.datePreset === 'last_30_days') {
            const start = subDays(today, 30);
            if (!isWithinInterval(recDate, { start, end: today })) return false;
          } else if (filters.datePreset === 'this_month') {
            const start = startOfMonth(today);
            const end = endOfMonth(today);
            if (!isWithinInterval(recDate, { start, end })) return false;
          } else if (filters.datePreset === 'last_month') {
            const lastM = subMonths(today, 1);
            const start = startOfMonth(lastM);
            const end = endOfMonth(lastM);
            if (!isWithinInterval(recDate, { start, end })) return false;
          } else if (filters.datePreset === 'custom') {
            if (filters.startDate && rec.record_date < filters.startDate) return false;
            if (filters.endDate && rec.record_date > filters.endDate) return false;
          }
        } catch {
          // ignore date parse err
        }
      }

      // Amount thresholds
      if (filters.minAmount !== undefined && rec.remaining_amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && rec.remaining_amount > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }, [records, filters]);

  // Dynamic category mapping for followups
  const categorizedFollowups = useMemo<CartDueFollowup[]>(() => {
    return followups.map(f => {
      const rawId = (f.client_id || '').trim();
      let cat: CartDueClientCategory = 'UNCLASSIFIED';
      if (rawId) {
        cat = activeCartNgoMap.has(rawId.toUpperCase()) ? 'NGO' : 'NORMAL';
      }
      return {
        ...f,
        client_type: cat,
      };
    });
  }, [followups, activeCartNgoMap]);

  // Follow-up Pipeline Subsets
  const { allFollowups, todayFollowups, upcomingFollowups, overdueFollowups, completedFollowups } =
    useMemo(() => {
      const todayDate = startOfDay(new Date());

      const todayList: CartDueFollowup[] = [];
      const upcomingList: CartDueFollowup[] = [];
      const overdueList: CartDueFollowup[] = [];
      const completedList: CartDueFollowup[] = [];

      categorizedFollowups.forEach(f => {
        if (f.status === 'Completed') {
          completedList.push(f);
          return;
        }

        const targetDate = f.next_followup_date || f.followup_date;
        if (!targetDate) {
          todayList.push(f);
          return;
        }

        try {
          const pDate = startOfDay(parseISO(targetDate));
          if (pDate.getTime() === todayDate.getTime()) {
            todayList.push(f);
          } else if (pDate < todayDate) {
            overdueList.push(f);
          } else {
            upcomingList.push(f);
          }
        } catch {
          todayList.push(f);
        }
      });

      return {
        allFollowups: categorizedFollowups,
        todayFollowups: todayList,
        upcomingFollowups: upcomingList,
        overdueFollowups: overdueList,
        completedFollowups: completedList,
      };
    }, [categorizedFollowups]);

  // Primary Cart Due Total Outstanding & Category Partition
  // Strict rule: Total Cart Due Outstanding = NGO Outstanding + Normal Client Outstanding + Unclassified Outstanding
  const {
    totalCartOutstanding,
    totalCartNgoOutstanding,
    totalNormalClientOutstanding,
    totalUnclassifiedOutstanding,
    ngoClientCount,
    normalClientCount,
    unclassifiedClientCount,
  } = useMemo(() => {
    let total = 0;
    let ngoOut = 0;
    let normalOut = 0;
    let unclassifiedOut = 0;

    const ngoClients = new Set<string>();
    const normalClients = new Set<string>();
    const unclassifiedClients = new Set<string>();

    records.forEach(r => {
      const remaining = Number(r.remaining_amount) || 0;
      total += remaining;

      const normId = (r.client_id || '').trim().toUpperCase();

      if (r.client_type === 'NGO') {
        ngoOut += remaining;
        if (remaining > 0 && normId) ngoClients.add(normId);
      } else if (r.client_type === 'NORMAL') {
        normalOut += remaining;
        if (remaining > 0 && normId) normalClients.add(normId);
      } else {
        unclassifiedOut += remaining;
        if (remaining > 0) unclassifiedClients.add(normId || `anon_${r.id}`);
      }
    });

    return {
      totalCartOutstanding: total,
      totalCartNgoOutstanding: ngoOut,
      totalNormalClientOutstanding: normalOut,
      totalUnclassifiedOutstanding: unclassifiedOut,
      ngoClientCount: ngoClients.size,
      normalClientCount: normalClients.size,
      unclassifiedClientCount: unclassifiedClients.size,
    };
  }, [records]);

  const totalCartClients = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.remaining_amount > 0 && r.client_id) {
        set.add(r.client_id.trim().toUpperCase());
      }
    });
    return set.size;
  }, [records]);

  const totalCartRecords = records.length;
  const todayFollowupsCount = todayFollowups.length;
  const overdueFollowupsCount = overdueFollowups.length;

  // Categorized Payments
  const categorizedPayments = useMemo<CartDuePayment[]>(() => {
    return payments.map(p => {
      const rawId = (p.client_id || '').trim();
      let cat: CartDueClientCategory = 'UNCLASSIFIED';
      if (rawId) {
        cat = activeCartNgoMap.has(rawId.toUpperCase()) ? 'NGO' : 'NORMAL';
      }
      return {
        ...p,
        client_type: cat,
      };
    });
  }, [payments, activeCartNgoMap]);

  const totalCollectionReceived = useMemo(() => {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  const availableAdvanceCredit = useMemo(() => {
    return advanceCredits.reduce((sum, a) => sum + (Number(a.available_credit) || 0), 0);
  }, [advanceCredits]);

  // Client Summaries with client_type and ngo_name
  const clientSummaries = useMemo<CartDueClientSummary[]>(() => {
    const map = new Map<
      string,
      {
        client_name: string;
        client_type: CartDueClientCategory;
        ngo_name?: string | null;
        total_original_due: number;
        total_paid: number;
        remaining_due: number;
        record_count: number;
        open_records_count: number;
        providers: Set<string>;
        last_record_date: string;
      }
    >();

    records.forEach(r => {
      const key = (r.client_id || '').trim().toUpperCase();
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          client_name: r.client_name,
          client_type: r.client_type || 'NORMAL',
          ngo_name: r.ngo_name,
          total_original_due: 0,
          total_paid: 0,
          remaining_due: 0,
          record_count: 0,
          open_records_count: 0,
          providers: new Set<string>(),
          last_record_date: r.record_date,
        });
      }

      const c = map.get(key)!;
      c.total_original_due += Number(r.original_amount) || 0;
      c.total_paid += Number(r.paid_amount) || 0;
      c.remaining_due += Number(r.remaining_amount) || 0;
      c.record_count += 1;
      if (r.remaining_amount > 0) c.open_records_count += 1;
      if (r.provider_name) c.providers.add(r.provider_name);
      if (r.record_date > c.last_record_date) c.last_record_date = r.record_date;
    });

    const creditMap = new Map<string, number>();
    advanceCredits.forEach(a => {
      creditMap.set(a.client_id.trim().toUpperCase(), a.available_credit);
    });

    const followupStatusMap = new Map<string, { status: 'Overdue' | 'Today' | 'Upcoming' | 'None'; lastDate?: string }>();
    followups.forEach(f => {
      const key = f.client_id.trim().toUpperCase();
      const current = followupStatusMap.get(key);
      const isOverdue = overdueFollowups.some(o => o.id === f.id);
      const isToday = todayFollowups.some(t => t.id === f.id);
      const isUpcoming = upcomingFollowups.some(u => u.id === f.id);

      let status: 'Overdue' | 'Today' | 'Upcoming' | 'None' = 'None';
      if (isOverdue) status = 'Overdue';
      else if (isToday) status = 'Today';
      else if (isUpcoming) status = 'Upcoming';

      if (!current || status === 'Overdue') {
        followupStatusMap.set(key, { status, lastDate: f.followup_date });
      }
    });

    const result: CartDueClientSummary[] = [];
    map.forEach((data, client_id) => {
      const followupInfo = followupStatusMap.get(client_id);
      result.push({
        client_id,
        client_name: data.client_name,
        client_type: data.client_type,
        ngo_name: data.ngo_name,
        total_original_due: data.total_original_due,
        total_paid: data.total_paid,
        remaining_due: data.remaining_due,
        available_advance_credit: creditMap.get(client_id) || 0,
        record_count: data.record_count,
        open_records_count: data.open_records_count,
        providers: Array.from(data.providers),
        last_record_date: data.last_record_date,
        last_followup_date: followupInfo?.lastDate,
        followup_status: followupInfo?.status || 'None',
      });
    });

    return result.sort((a, b) => b.remaining_due - a.remaining_due);
  }, [records, advanceCredits, followups, overdueFollowups, todayFollowups, upcomingFollowups]);

  // Provider Summaries with NGO vs Normal breakdown
  const providerSummaries = useMemo<CartDueProviderSummary[]>(() => {
    const map = new Map<
      string,
      {
        total_records: number;
        total_original_amount: number;
        total_paid: number;
        total_outstanding: number;
        ngo_outstanding: number;
        normal_outstanding: number;
        clients: Set<string>;
      }
    >();

    records.forEach(r => {
      const p = r.provider_name || 'General Provider';
      if (!map.has(p)) {
        map.set(p, {
          total_records: 0,
          total_original_amount: 0,
          total_paid: 0,
          total_outstanding: 0,
          ngo_outstanding: 0,
          normal_outstanding: 0,
          clients: new Set<string>(),
        });
      }

      const item = map.get(p)!;
      item.total_records += 1;
      item.total_original_amount += Number(r.original_amount) || 0;
      item.total_paid += Number(r.paid_amount) || 0;
      const rem = Number(r.remaining_amount) || 0;
      item.total_outstanding += rem;
      if (r.client_type === 'NGO') {
        item.ngo_outstanding += rem;
      } else {
        item.normal_outstanding += rem;
      }
      if (r.client_id) item.clients.add(r.client_id);
    });

    const result: CartDueProviderSummary[] = [];
    map.forEach((data, provider_name) => {
      const collection_rate =
        data.total_original_amount > 0 ? (data.total_paid / data.total_original_amount) * 100 : 0;

      result.push({
        provider_name,
        total_records: data.total_records,
        total_original_amount: data.total_original_amount,
        total_paid: data.total_paid,
        total_outstanding: data.total_outstanding,
        ngo_outstanding: data.ngo_outstanding,
        normal_outstanding: data.normal_outstanding,
        unique_clients: data.clients.size,
        collection_rate: Math.round(collection_rate * 10) / 10,
      });
    });

    return result.sort((a, b) => b.total_outstanding - a.total_outstanding);
  }, [records]);

  // Cart Due NGO Analytics Summaries for each registered NGO
  const cartNgoSummaries = useMemo<CartDueNgoAnalyticsSummary[]>(() => {
    return cartNgos.map(ngo => {
      const normId = ngo.client_id.trim().toUpperCase();
      const matchedRecords = records.filter(
        r => (r.client_id || '').trim().toUpperCase() === normId
      );

      let totalOutstanding = 0;
      let totalOriginal = 0;
      let totalPaid = 0;
      let openCount = 0;
      const providers = new Set<string>();

      matchedRecords.forEach(r => {
        totalOutstanding += Number(r.remaining_amount) || 0;
        totalOriginal += Number(r.original_amount) || 0;
        totalPaid += Number(r.paid_amount) || 0;
        if (Number(r.remaining_amount) > 0) openCount += 1;
        if (r.provider_name) providers.add(r.provider_name);
      });

      return {
        id: ngo.id,
        ngo_name: ngo.ngo_name,
        client_id: ngo.client_id,
        total_outstanding: totalOutstanding,
        total_original_amount: totalOriginal,
        total_paid: totalPaid,
        record_count: matchedRecords.length,
        open_record_count: openCount,
        providers: Array.from(providers),
        status: ngo.status,
      };
    });
  }, [cartNgos, records]);

  // Daily Trends
  const dailyTrends = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    records.forEach(r => {
      if (!r.record_date) return;
      const d = r.record_date;
      if (!map.has(d)) map.set(d, { amount: 0, count: 0 });
      const cur = map.get(d)!;
      cur.amount += Number(r.original_amount) || 0;
      cur.count += 1;
    });

    return Array.from(map.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  // Monthly Trends
  const monthlyTrends = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    records.forEach(r => {
      if (!r.record_date) return;
      const m = r.record_date.substring(0, 7); // YYYY-MM
      if (!map.has(m)) map.set(m, { amount: 0, count: 0 });
      const cur = map.get(m)!;
      cur.amount += Number(r.original_amount) || 0;
      cur.count += 1;
    });

    return Array.from(map.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [records]);

  // Top 10 Outstanding Clients
  const topClients = useMemo(() => {
    return clientSummaries.slice(0, 10);
  }, [clientSummaries]);

  // Follow-up Status Distribution
  const followupStatusDistribution = useMemo(() => {
    return [
      { status: "Today's Calls", count: todayFollowups.length, color: '#3B82F6' },
      { status: 'Overdue Calls', count: overdueFollowups.length, color: '#EF4444' },
      { status: 'Upcoming Calls', count: upcomingFollowups.length, color: '#F59E0B' },
      { status: 'Completed', count: completedFollowups.length, color: '#10B981' },
    ];
  }, [todayFollowups, overdueFollowups, upcomingFollowups, completedFollowups]);

  // ==========================================
  // CART DUE NGO MASTER CRUD ACTIONS
  // ==========================================

  const addCartNgo = async (
    ngoData: Omit<CartDueNGO, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanClientId = (ngoData.client_id || '').trim();
    if (!cleanClientId) {
      return { success: false, error: 'Client ID is required' };
    }
    if (!ngoData.ngo_name.trim()) {
      return { success: false, error: 'NGO Name is required' };
    }

    const normKey = cleanClientId.toUpperCase();
    const duplicate = cartNgos.some(n => n.client_id.trim().toUpperCase() === normKey);
    if (duplicate) {
      return { success: false, error: `Client ID "${cleanClientId}" is already registered in Cart Due NGO Master` };
    }

    const newNgo: CartDueNGO = {
      ...ngoData,
      client_id: cleanClientId, // Preserves leading zeros as TEXT
      id: crypto.randomUUID(),
      status: ngoData.status || 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('cart_due_ngo_master').insert([newNgo]);
    } catch (err) {
      console.warn('Supabase cart_due_ngo_master fallback:', err);
    }

    const next = [newNgo, ...cartNgos];
    setCartNgos(next);
    localStorage.setItem(LOCAL_CART_NGOS_KEY, JSON.stringify(next));

    return { success: true };
  };

  const updateCartNgo = async (
    id: string,
    updates: Partial<CartDueNGO>
  ): Promise<{ success: boolean; error?: string }> => {
    const target = cartNgos.find(n => n.id === id);
    if (!target) return { success: false, error: 'Cart Due NGO not found' };

    if (updates.client_id !== undefined) {
      const cleanClientId = updates.client_id.trim();
      if (!cleanClientId) {
        return { success: false, error: 'Client ID cannot be empty' };
      }
      const normKey = cleanClientId.toUpperCase();
      const duplicate = cartNgos.some(
        n => n.id !== id && n.client_id.trim().toUpperCase() === normKey
      );
      if (duplicate) {
        return { success: false, error: `Client ID "${cleanClientId}" already in use by another NGO` };
      }
      updates.client_id = cleanClientId;
    }

    const updated: CartDueNGO = {
      ...target,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('cart_due_ngo_master').update(updates).eq('id', id);
    } catch {
      // ignore
    }

    const next = cartNgos.map(n => (n.id === id ? updated : n));
    setCartNgos(next);
    localStorage.setItem(LOCAL_CART_NGOS_KEY, JSON.stringify(next));

    return { success: true };
  };

  const toggleCartNgoStatus = async (id: string) => {
    const target = cartNgos.find(n => n.id === id);
    if (!target) return;

    const nextStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await updateCartNgo(id, { status: nextStatus });
  };

  const deleteCartNgo = async (id: string) => {
    try {
      await supabase.from('cart_due_ngo_master').delete().eq('id', id);
    } catch {
      // ignore
    }

    const next = cartNgos.filter(n => n.id !== id);
    setCartNgos(next);
    localStorage.setItem(LOCAL_CART_NGOS_KEY, JSON.stringify(next));
  };

  // Copy or sync NGOs from the regular Dues NGO Master
  const copyFromDuesNgoMaster = async (
    duesNgos: NGO[]
  ): Promise<{ importedCount: number; skippedCount: number }> => {
    const existingNormIds = new Set(
      cartNgos.map(n => n.client_id.trim().toUpperCase())
    );

    const toImport: CartDueNGO[] = [];
    let skipped = 0;

    duesNgos.forEach(dn => {
      const cleanId = (dn.client_id || '').trim();
      if (!cleanId) {
        skipped++;
        return;
      }
      const normId = cleanId.toUpperCase();
      if (existingNormIds.has(normId)) {
        skipped++;
        return;
      }

      existingNormIds.add(normId);
      toImport.push({
        id: crypto.randomUUID(),
        client_id: cleanId,
        ngo_name: dn.ngo_name,
        contact_person: dn.contact_person,
        email: dn.email,
        phone: dn.phone,
        notes: dn.notes ? `Copied from Dues NGO Master. ${dn.notes}` : 'Copied from Dues NGO Master',
        status: dn.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    if (toImport.length > 0) {
      try {
        await supabase.from('cart_due_ngo_master').insert(toImport);
      } catch (err) {
        console.warn('Supabase cart_due_ngo_master copy error:', err);
      }

      const next = [...toImport, ...cartNgos];
      setCartNgos(next);
      localStorage.setItem(LOCAL_CART_NGOS_KEY, JSON.stringify(next));
    }

    return { importedCount: toImport.length, skippedCount: skipped };
  };

  // ==========================================
  // PAYMENT & ADVANCE CREDIT ACTIONS
  // ==========================================

  const recordPayment = async (params: {
    recordId: string;
    amount: number;
    paymentMethod: CartDuePaymentMethod;
    referenceNo?: string;
    notes?: string;
  }) => {
    const target = rawRecords.find(r => r.id === params.recordId);
    if (!target) return { success: false, error: 'Cart Due record not found.' };

    const paymentAmount = Number(params.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero.' };
    }

    const currentRemaining = Number(target.remaining_amount);
    let amountAllocatedToDue = paymentAmount;
    let excessAmount = 0;
    let isExcess = false;

    if (paymentAmount > currentRemaining) {
      amountAllocatedToDue = currentRemaining;
      excessAmount = paymentAmount - currentRemaining;
      isExcess = true;
    }

    const nextPaid = (Number(target.paid_amount) || 0) + amountAllocatedToDue;
    const nextRemaining = Math.max(0, currentRemaining - amountAllocatedToDue);
    const nextStatus: CartDueRecordStatus = nextRemaining === 0 ? 'Paid' : 'Partial';

    const updatedRecord: CartDueRecord = {
      ...target,
      paid_amount: nextPaid,
      remaining_amount: nextRemaining,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    const newPayment: CartDuePayment = {
      id: crypto.randomUUID(),
      record_id: target.id,
      client_id: target.client_id,
      client_name: target.client_name,
      amount: paymentAmount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: params.paymentMethod,
      reference_no: params.referenceNo,
      notes: params.notes,
      is_advance_excess: isExcess,
      created_at: new Date().toISOString(),
    };

    // Update in Supabase
    try {
      await supabase
        .from('cart_due_records')
        .update({
          paid_amount: nextPaid,
          remaining_amount: nextRemaining,
          status: nextStatus,
          updated_at: updatedRecord.updated_at,
        })
        .eq('id', target.id);

      await supabase.from('cart_due_payments').insert([newPayment]);
    } catch (err) {
      console.warn('Supabase cart_due_payments fallback:', err);
    }

    // Handle excess advance credit (Hold excess as client advance credit for manual allocation)
    let updatedAdvances = [...advanceCredits];
    if (isExcess && excessAmount > 0) {
      const clientKey = target.client_id.trim().toUpperCase();
      const existingAdvIndex = updatedAdvances.findIndex(
        a => a.client_id.trim().toUpperCase() === clientKey
      );

      if (existingAdvIndex >= 0) {
        const cur = updatedAdvances[existingAdvIndex];
        const nextCredit: CartDueAdvanceCredit = {
          ...cur,
          total_credit: cur.total_credit + excessAmount,
          available_credit: cur.available_credit + excessAmount,
          updated_at: new Date().toISOString(),
        };
        updatedAdvances[existingAdvIndex] = nextCredit;

        try {
          await supabase
            .from('cart_due_advance_credits')
            .update({
              total_credit: nextCredit.total_credit,
              available_credit: nextCredit.available_credit,
              updated_at: nextCredit.updated_at,
            })
            .eq('id', cur.id);
        } catch {
          // ignore
        }
      } else {
        const newAdv: CartDueAdvanceCredit = {
          id: crypto.randomUUID(),
          client_id: target.client_id,
          client_name: target.client_name,
          total_credit: excessAmount,
          used_credit: 0,
          available_credit: excessAmount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        updatedAdvances.push(newAdv);

        try {
          await supabase.from('cart_due_advance_credits').insert([newAdv]);
        } catch {
          // ignore
        }
      }

      setAdvanceCredits(updatedAdvances);
      localStorage.setItem(LOCAL_CART_ADVANCES_KEY, JSON.stringify(updatedAdvances));
    }

    // Update Records State
    const nextRecords = rawRecords.map(r => (r.id === target.id ? updatedRecord : r));
    setRawRecords(nextRecords);
    localStorage.setItem(LOCAL_CART_RECORDS_KEY, JSON.stringify(nextRecords));

    // Update Payments State
    const nextPayments = [newPayment, ...payments];
    setPayments(nextPayments);
    localStorage.setItem(LOCAL_CART_PAYMENTS_KEY, JSON.stringify(nextPayments));

    return { success: true, isExcess, excessAmount };
  };

  const addAdvanceCredit = async (
    clientId: string,
    clientName: string,
    amount: number,
    paymentMethod: CartDuePaymentMethod,
    notes?: string
  ) => {
    const clientKey = clientId.trim().toUpperCase();
    const existingIndex = advanceCredits.findIndex(
      a => a.client_id.trim().toUpperCase() === clientKey
    );

    let nextAdvances = [...advanceCredits];
    if (existingIndex >= 0) {
      const cur = nextAdvances[existingIndex];
      const updated: CartDueAdvanceCredit = {
        ...cur,
        total_credit: cur.total_credit + amount,
        available_credit: cur.available_credit + amount,
        updated_at: new Date().toISOString(),
      };
      nextAdvances[existingIndex] = updated;

      try {
        await supabase
          .from('cart_due_advance_credits')
          .update({
            total_credit: updated.total_credit,
            available_credit: updated.available_credit,
            updated_at: updated.updated_at,
          })
          .eq('id', cur.id);
      } catch {
        // ignore
      }
    } else {
      const newAdv: CartDueAdvanceCredit = {
        id: crypto.randomUUID(),
        client_id: clientId,
        client_name: clientName,
        total_credit: amount,
        used_credit: 0,
        available_credit: amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      nextAdvances = [newAdv, ...nextAdvances];

      try {
        await supabase.from('cart_due_advance_credits').insert([newAdv]);
      } catch {
        // ignore
      }
    }

    setAdvanceCredits(nextAdvances);
    localStorage.setItem(LOCAL_CART_ADVANCES_KEY, JSON.stringify(nextAdvances));

    // Log transaction in cart_due_payments
    const advPayment: CartDuePayment = {
      id: crypto.randomUUID(),
      record_id: 'advance-credit',
      client_id: clientId,
      client_name: clientName,
      amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod,
      notes: notes || 'Direct Advance Credit Deposit',
      is_advance_excess: true,
      created_at: new Date().toISOString(),
    };

    setPayments(prev => {
      const next = [advPayment, ...prev];
      localStorage.setItem(LOCAL_CART_PAYMENTS_KEY, JSON.stringify(next));
      return next;
    });

    return { success: true };
  };

  const allocateAdvanceCredit = async (
    advanceCreditId: string,
    recordId: string,
    amount: number
  ) => {
    const adv = advanceCredits.find(a => a.id === advanceCreditId);
    if (!adv) return { success: false, error: 'Advance credit account not found.' };

    const targetRec = rawRecords.find(r => r.id === recordId);
    if (!targetRec) return { success: false, error: 'Cart Due record not found.' };

    if (amount > adv.available_credit) {
      return { success: false, error: 'Requested amount exceeds available advance credit.' };
    }

    if (amount > targetRec.remaining_amount) {
      return { success: false, error: 'Allocation exceeds the record remaining balance.' };
    }

    // 1. Deduct from advance credit
    const updatedAdv: CartDueAdvanceCredit = {
      ...adv,
      used_credit: adv.used_credit + amount,
      available_credit: adv.available_credit - amount,
      updated_at: new Date().toISOString(),
    };

    // 2. Apply payment to target record
    const nextPaid = targetRec.paid_amount + amount;
    const nextRemaining = targetRec.remaining_amount - amount;
    const nextStatus: CartDueRecordStatus = nextRemaining === 0 ? 'Paid' : 'Partial';

    const updatedRec: CartDueRecord = {
      ...targetRec,
      paid_amount: nextPaid,
      remaining_amount: nextRemaining,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    // 3. Create allocation log
    const allocation: CartDueAdvanceAllocation = {
      id: crypto.randomUUID(),
      advance_credit_id: adv.id,
      client_id: adv.client_id,
      record_id: targetRec.id,
      allocated_amount: amount,
      allocated_date: new Date().toISOString().split('T')[0],
      notes: `Allocated from advance credit to record ${targetRec.sr_no || targetRec.id}`,
    };

    // 4. Create payment record
    const pmt: CartDuePayment = {
      id: crypto.randomUUID(),
      record_id: targetRec.id,
      client_id: targetRec.client_id,
      client_name: targetRec.client_name,
      amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Advance Credit',
      notes: `Allocated from Advance Credit Account #${adv.id.substring(0, 8)}`,
      created_at: new Date().toISOString(),
    };

    // Supabase sync
    try {
      await supabase
        .from('cart_due_advance_credits')
        .update({
          used_credit: updatedAdv.used_credit,
          available_credit: updatedAdv.available_credit,
          updated_at: updatedAdv.updated_at,
        })
        .eq('id', adv.id);

      await supabase
        .from('cart_due_records')
        .update({
          paid_amount: nextPaid,
          remaining_amount: nextRemaining,
          status: nextStatus,
          updated_at: updatedRec.updated_at,
        })
        .eq('id', targetRec.id);

      await supabase.from('cart_due_advance_allocations').insert([allocation]);
      await supabase.from('cart_due_payments').insert([pmt]);
    } catch {
      // ignore
    }

    // State sync
    const nextAdvances = advanceCredits.map(a => (a.id === adv.id ? updatedAdv : a));
    setAdvanceCredits(nextAdvances);
    localStorage.setItem(LOCAL_CART_ADVANCES_KEY, JSON.stringify(nextAdvances));

    const nextRecords = rawRecords.map(r => (r.id === targetRec.id ? updatedRec : r));
    setRawRecords(nextRecords);
    localStorage.setItem(LOCAL_CART_RECORDS_KEY, JSON.stringify(nextRecords));

    const nextAlloc = [allocation, ...advanceAllocations];
    setAdvanceAllocations(nextAlloc);
    localStorage.setItem(LOCAL_CART_ALLOCATIONS_KEY, JSON.stringify(nextAlloc));

    const nextPayments = [pmt, ...payments];
    setPayments(nextPayments);
    localStorage.setItem(LOCAL_CART_PAYMENTS_KEY, JSON.stringify(nextPayments));

    return { success: true };
  };

  // ==========================================
  // FOLLOW-UP CRM ACTIONS
  // ==========================================

  const addFollowup = async (
    followupData: Omit<CartDueFollowup, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CartDueFollowup> => {
    const newFollowup: CartDueFollowup = {
      ...followupData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('cart_due_followups').insert([newFollowup]);
    } catch {
      // ignore
    }

    const next = [newFollowup, ...followups];
    setFollowups(next);
    localStorage.setItem(LOCAL_CART_FOLLOWUPS_KEY, JSON.stringify(next));

    return newFollowup;
  };

  const updateFollowup = async (id: string, updates: Partial<CartDueFollowup>) => {
    const target = followups.find(f => f.id === id);
    if (!target) return;

    const updated: CartDueFollowup = {
      ...target,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('cart_due_followups').update(updates).eq('id', id);
    } catch {
      // ignore
    }

    const next = followups.map(f => (f.id === id ? updated : f));
    setFollowups(next);
    localStorage.setItem(LOCAL_CART_FOLLOWUPS_KEY, JSON.stringify(next));
  };

  const completeFollowup = async (id: string, notes?: string) => {
    const target = followups.find(f => f.id === id);
    if (!target) return;

    const mergedNotes = notes ? `${target.notes}\n[Resolution]: ${notes}` : target.notes;
    await updateFollowup(id, {
      status: 'Completed',
      notes: mergedNotes,
    });
  };

  const deleteFollowup = async (id: string) => {
    try {
      await supabase.from('cart_due_followups').delete().eq('id', id);
    } catch {
      // ignore
    }

    const next = followups.filter(f => f.id !== id);
    setFollowups(next);
    localStorage.setItem(LOCAL_CART_FOLLOWUPS_KEY, JSON.stringify(next));
  };

  // ==========================================
  // IMPORT & BATCH OPERATIONS
  // ==========================================

  const commitImport = async (
    recordsToInsert: Omit<CartDueRecord, 'id'>[],
    recordsToUpdate: { id: string; data: Partial<CartDueRecord> }[],
    batchMeta: { fileName: string; fileSize: number; totalRows: number; skippedCount: number }
  ) => {
    try {
      const batchId = crypto.randomUUID();

      let totalOutstandingBatch = 0;
      let ngoCount = 0;
      let normalCount = 0;
      let unclassifiedCount = 0;

      const preparedInserts: CartDueRecord[] = recordsToInsert.map(r => {
        totalOutstandingBatch += Number(r.original_amount) || 0;
        const normId = (r.client_id || '').trim();
        let cat: CartDueClientCategory = 'UNCLASSIFIED';
        let ngoName: string | null = null;
        if (!normId) {
          unclassifiedCount++;
        } else if (activeCartNgoMap.has(normId.toUpperCase())) {
          cat = 'NGO';
          ngoName = activeCartNgoMap.get(normId.toUpperCase())!.ngo_name;
          ngoCount++;
        } else {
          cat = 'NORMAL';
          normalCount++;
        }

        return {
          ...r,
          id: crypto.randomUUID(),
          client_type: cat,
          ngo_name: ngoName,
          import_batch_id: batchId,
        };
      });

      const newBatch: CartDueImportBatch = {
        id: batchId,
        file_name: batchMeta.fileName,
        file_size: batchMeta.fileSize,
        total_rows: batchMeta.totalRows,
        imported_rows: recordsToInsert.length,
        skipped_rows: batchMeta.skippedCount,
        updated_rows: recordsToUpdate.length,
        total_outstanding_imported: totalOutstandingBatch,
        ngo_count: ngoCount,
        normal_count: normalCount,
        unclassified_count: unclassifiedCount,
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from('cart_due_import_batches').insert([newBatch]);
        if (preparedInserts.length > 0) {
          await supabase.from('cart_due_records').insert(preparedInserts);
        }
        for (const item of recordsToUpdate) {
          await supabase.from('cart_due_records').update(item.data).eq('id', item.id);
        }
      } catch (err) {
        console.warn('Supabase cart_due import fallback to local storage:', err);
      }

      setRawRecords(prev => {
        let updated = [...prev];
        recordsToUpdate.forEach(u => {
          updated = updated.map(r => (r.id === u.id ? { ...r, ...u.data } : r));
        });
        const next = [...preparedInserts, ...updated];
        localStorage.setItem(LOCAL_CART_RECORDS_KEY, JSON.stringify(next));
        return next;
      });

      setImportBatches(prev => {
        const next = [newBatch, ...prev];
        localStorage.setItem(LOCAL_CART_BATCHES_KEY, JSON.stringify(next));
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

  const deleteBatch = async (batchId: string) => {
    try {
      await supabase.from('cart_due_records').delete().eq('import_batch_id', batchId);
      await supabase.from('cart_due_import_batches').delete().eq('id', batchId);
    } catch {
      // ignore
    }

    setRawRecords(prev => {
      const next = prev.filter(r => r.import_batch_id !== batchId);
      localStorage.setItem(LOCAL_CART_RECORDS_KEY, JSON.stringify(next));
      return next;
    });

    setImportBatches(prev => {
      const next = prev.filter(b => b.id !== batchId);
      localStorage.setItem(LOCAL_CART_BATCHES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const deleteSelectedRecords = async (ids: string[]) => {
    if (ids.length === 0) return;

    try {
      await supabase.from('cart_due_records').delete().in('id', ids);
    } catch {
      // ignore
    }

    setRawRecords(prev => {
      const next = prev.filter(r => !ids.includes(r.id));
      localStorage.setItem(LOCAL_CART_RECORDS_KEY, JSON.stringify(next));
      return next;
    });
  };

  // STRICTLY ISOLATED: Deletes ONLY Cart Due data, leaving regular invoices, NGO, tasks 100% untouched
  const deleteAllCartDueData = async () => {
    try {
      await supabase.from('cart_due_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cart_due_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cart_due_advance_credits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cart_due_advance_allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cart_due_followups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cart_due_import_batches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch {
      // ignore
    }

    setRawRecords([]);
    setPayments([]);
    setAdvanceCredits([]);
    setAdvanceAllocations([]);
    setFollowups([]);
    setImportBatches([]);

    localStorage.removeItem(LOCAL_CART_RECORDS_KEY);
    localStorage.removeItem(LOCAL_CART_PAYMENTS_KEY);
    localStorage.removeItem(LOCAL_CART_ADVANCES_KEY);
    localStorage.removeItem(LOCAL_CART_ALLOCATIONS_KEY);
    localStorage.removeItem(LOCAL_CART_FOLLOWUPS_KEY);
    localStorage.removeItem(LOCAL_CART_BATCHES_KEY);
  };

  return (
    <CartDueContext.Provider
      value={{
        records,
        filteredRecords,
        payments: categorizedPayments,
        advanceCredits,
        followups: categorizedFollowups,
        importBatches,
        cartNgos,
        loading,
        filters,
        setFilters,
        resetFilters,
        totalCartOutstanding,
        totalCartClients,
        totalCartRecords,
        todayFollowupsCount,
        overdueFollowupsCount,
        totalCollectionReceived,
        availableAdvanceCredit,
        totalCartNgoOutstanding,
        totalNormalClientOutstanding,
        totalUnclassifiedOutstanding,
        ngoClientCount,
        normalClientCount,
        unclassifiedClientCount,
        clientSummaries,
        providerSummaries,
        cartNgoSummaries,
        dailyTrends,
        monthlyTrends,
        topClients,
        followupStatusDistribution,
        availableProviders,
        availableClients,
        allFollowups,
        todayFollowups,
        upcomingFollowups,
        overdueFollowups,
        completedFollowups,
        addCartNgo,
        updateCartNgo,
        toggleCartNgoStatus,
        deleteCartNgo,
        copyFromDuesNgoMaster,
        recordPayment,
        addAdvanceCredit,
        allocateAdvanceCredit,
        addFollowup,
        updateFollowup,
        completeFollowup,
        deleteFollowup,
        commitImport,
        deleteBatch,
        deleteSelectedRecords,
        deleteAllCartDueData,
      }}
    >
      {children}
    </CartDueContext.Provider>
  );
};

export function useCartDue(): CartDueContextType {
  const context = useContext(CartDueContext);
  if (!context) {
    throw new Error('useCartDue must be used within a CartDueProvider');
  }
  return context;
}

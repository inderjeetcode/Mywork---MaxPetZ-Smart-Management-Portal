import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Check, 
  Eye, 
  Edit2, 
  Power, 
  X, 
  Download, 
  FileSpreadsheet,
  Trash2,
  Copy,
  AlertCircle,
  HelpCircle,
  Phone,
  Mail,
  User,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useCartDue } from '../../context/CartDueContext';
import { useDues } from '../../context/DuesContext';
import { CartDueNGO, CartDueRecord } from '../../types';
import { formatCurrency, formatINR, formatDate, exportToExcel, exportToCSV } from '../../utils/formatters';

export const CartDueNgoManagementView: React.FC = () => {
  const { 
    cartNgos, 
    records, 
    cartNgoSummaries,
    addCartNgo, 
    updateCartNgo, 
    toggleCartNgoStatus, 
    deleteCartNgo,
    copyFromDuesNgoMaster,
    totalCartNgoOutstanding
  } = useCartDue();

  const { ngos: duesNgos } = useDues();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNgo, setEditingNgo] = useState<CartDueNGO | null>(null);
  const [selectedNgoForLedger, setSelectedNgoForLedger] = useState<CartDueNGO | null>(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copySuccessMsg, setCopySuccessMsg] = useState<string | null>(null);
  const [deleteConfirmNgo, setDeleteConfirmNgo] = useState<CartDueNGO | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    ngo_name: '',
    contact_person: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingNgo(null);
    setFormData({
      client_id: '',
      ngo_name: '',
      contact_person: '',
      email: '',
      phone: '',
      notes: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (ngo: CartDueNGO) => {
    setEditingNgo(ngo);
    setFormData({
      client_id: ngo.client_id,
      ngo_name: ngo.ngo_name,
      contact_person: ngo.contact_person || '',
      email: ngo.email || '',
      phone: ngo.phone || '',
      notes: ngo.notes || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanClientId = formData.client_id.trim();
    const cleanNgoName = formData.ngo_name.trim();

    if (!cleanClientId) {
      setFormError('Client ID is mandatory.');
      return;
    }
    if (!cleanNgoName) {
      setFormError('NGO Name is mandatory.');
      return;
    }

    if (editingNgo) {
      const res = await updateCartNgo(editingNgo.id, {
        ngo_name: cleanNgoName,
        contact_person: formData.contact_person.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to update Cart Due NGO');
        return;
      }
    } else {
      const res = await addCartNgo({
        client_id: cleanClientId,
        ngo_name: cleanNgoName,
        contact_person: formData.contact_person.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        status: 'ACTIVE',
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to register Cart Due NGO');
        return;
      }
    }

    setModalOpen(false);
  };

  // Filtered NGOs
  const filteredNgos = useMemo(() => {
    return cartNgos.filter(n => {
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches =
          n.ngo_name.toLowerCase().includes(q) ||
          n.client_id.toLowerCase().includes(q) ||
          (n.contact_person && n.contact_person.toLowerCase().includes(q)) ||
          (n.notes && n.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [cartNgos, searchTerm, statusFilter]);

  // Aggregate stats map per NGO based on Cart Due records
  const statsMap = useMemo(() => {
    const map = new Map<string, (typeof cartNgoSummaries)[0]>();
    cartNgoSummaries.forEach(s => {
      map.set(s.client_id.trim().toUpperCase(), s);
    });
    return map;
  }, [cartNgoSummaries]);

  // Real-time detection in Add NGO Modal of matching existing Cart Due records
  const liveMatchingRecordsInModal = useMemo(() => {
    const rawInput = formData.client_id.trim();
    if (!rawInput) return [];
    const normalized = rawInput.toUpperCase();
    return records.filter(
      r => r.client_id && r.client_id.trim().toUpperCase() === normalized
    );
  }, [formData.client_id, records]);

  const liveModalMatchingOutstanding = useMemo(() => {
    return liveMatchingRecordsInModal.reduce((sum, r) => sum + (Number(r.remaining_amount) || 0), 0);
  }, [liveMatchingRecordsInModal]);

  const liveModalMatchingOriginal = useMemo(() => {
    return liveMatchingRecordsInModal.reduce((sum, r) => sum + (Number(r.original_amount) || 0), 0);
  }, [liveMatchingRecordsInModal]);

  // Copy from Dues NGO Master candidate count
  const copyCandidates = useMemo(() => {
    const existingNormIds = new Set(cartNgos.map(n => n.client_id.trim().toUpperCase()));
    return duesNgos.filter(dn => {
      const clean = (dn.client_id || '').trim();
      return clean && !existingNormIds.has(clean.toUpperCase());
    });
  }, [duesNgos, cartNgos]);

  const handleCopyFromDuesMaster = async () => {
    const res = await copyFromDuesNgoMaster(duesNgos);
    setCopyModalOpen(false);
    setCopySuccessMsg(
      `Successfully copied ${res.importedCount} NGOs from regular Dues Master (${res.skippedCount} skipped as duplicate/invalid).`
    );
    setTimeout(() => setCopySuccessMsg(null), 5000);
  };

  // Selected NGO records for Ledger Drill-down modal
  const selectedNgoRecords = useMemo<CartDueRecord[]>(() => {
    if (!selectedNgoForLedger) return [];
    const norm = selectedNgoForLedger.client_id.trim().toUpperCase();
    return records.filter(r => (r.client_id || '').trim().toUpperCase() === norm);
  }, [selectedNgoForLedger, records]);

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Cart Due NGO Management
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
              {cartNgos.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Register authorized partner NGOs for provider cart dues. Cart Due records are automatically classified as <strong>NGO</strong> via exact normalized <strong>Client ID</strong> matching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy from Dues NGO Master button */}
          <button
            onClick={() => setCopyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Import existing NGOs from regular Dues NGO Master"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-500" />
            <span>Copy from Dues Master</span>
            {copyCandidates.length > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                +{copyCandidates.length}
              </span>
            )}
          </button>

          <button
            onClick={() => exportToCSV(cartNgos, 'MaxPetZ_CartDue_NGO_Master')}
            disabled={cartNgos.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add NGO</span>
          </button>
        </div>
      </div>

      {/* Success alert message if copy occurred */}
      {copySuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{copySuccessMsg}</span>
          </div>
          <button onClick={() => setCopySuccessMsg(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* 2. NGO Master Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Cart NGOs
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
            {cartNgos.length}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {cartNgos.filter(n => n.status === 'ACTIVE').length} active partners
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            NGO Cart Outstanding
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
            {formatCurrency(totalCartNgoOutstanding)}
          </div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">
            Total pending dues from NGOs
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Matched Records
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
            {records.filter(r => r.client_type === 'NGO').length}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Cart rows classified as NGO
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active NGO Clients
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
            {new Set(records.filter(r => r.client_type === 'NGO' && r.remaining_amount > 0).map(r => r.client_id.trim().toUpperCase())).size}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            NGOs with balance &gt; 0
          </div>
        </div>
      </div>

      {/* 3. Search and Status Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by NGO Name, Client ID, or Contact..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Status:</span>
          {(['all', 'ACTIVE', 'INACTIVE'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'all' ? 'All' : st}
            </button>
          ))}
          <span className="text-xs text-slate-400 font-mono ml-2">
            ({filteredNgos.length})
          </span>
        </div>
      </div>

      {/* 4. Cart Due NGO Master Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">NGO Name</th>
                <th className="py-2.5 px-3">Client ID (TEXT)</th>
                <th className="py-2.5 px-3">Contact Details</th>
                <th className="py-2.5 px-3 text-right">Cart Records</th>
                <th className="py-2.5 px-3 text-right">Open Dues</th>
                <th className="py-2.5 px-3 text-right">Cart Outstanding</th>
                <th className="py-2.5 px-3 text-right">Total Original</th>
                <th className="py-2.5 px-3">Providers</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredNgos.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {cartNgos.length === 0
                        ? 'Cart Due NGO Master is empty'
                        : 'No NGOs match your search filter'}
                    </div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      {cartNgos.length === 0
                        ? 'Add real NGO Client IDs using the "Add NGO" button or copy registered NGOs directly from the regular Dues NGO Master.'
                        : 'Try adjusting your search query or status filter.'}
                    </p>
                    {cartNgos.length === 0 && (
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <button
                          onClick={openAddModal}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 inline mr-1" /> Add NGO
                        </button>
                        {duesNgos.length > 0 && (
                          <button
                            onClick={() => setCopyModalOpen(true)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100"
                          >
                            <Copy className="w-3.5 h-3.5 inline mr-1" /> Copy from Dues Master ({duesNgos.length})
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredNgos.map(ngo => {
                  const stat = statsMap.get(ngo.client_id.trim().toUpperCase());
                  const recordCount = stat?.record_count || 0;
                  const openCount = stat?.open_record_count || 0;
                  const outstanding = stat?.total_outstanding || 0;
                  const original = stat?.total_original_amount || 0;
                  const providers = stat?.providers || [];

                  return (
                    <tr key={ngo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{ngo.ngo_name}</span>
                        </div>
                        {ngo.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                            {ngo.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {ngo.client_id}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {ngo.contact_person && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{ngo.contact_person}</span>
                          </div>
                        )}
                        {ngo.phone && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{ngo.phone}</span>
                          </div>
                        )}
                        {ngo.email && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Mail className="w-2.5 h-2.5 text-slate-400" />
                            <span>{ngo.email}</span>
                          </div>
                        )}
                        {!ngo.contact_person && !ngo.phone && !ngo.email && '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {recordCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={openCount > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-400'}>
                          {openCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600 dark:text-red-400">
                        {formatINR(outstanding)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatINR(original)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[140px] truncate" title={providers.join(', ')}>
                        {providers.join(', ') || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => toggleCartNgoStatus(ngo.id)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            ngo.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                          title={`Click to ${ngo.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}`}
                        >
                          {ngo.status}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedNgoForLedger(ngo)}
                            title="View Cart Due Ledger"
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(ngo)}
                            title="Edit NGO Details"
                            className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleCartNgoStatus(ngo.id)}
                            title={ngo.status === 'ACTIVE' ? 'Deactivate NGO' : 'Activate NGO'}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmNgo(ngo)}
                            title="Delete NGO from Cart Due Master"
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add / Edit NGO Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>{editingNgo ? 'Edit Cart Due NGO' : 'Register Cart Due NGO'}</span>
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Client ID * (Mandatory & Unique)
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingNgo)}
                  placeholder="e.g. 001082 or NGO-42"
                  value={formData.client_id}
                  onChange={e => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-60 text-slate-900 dark:text-slate-100"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Stored strictly as TEXT preserving leading zeros. All Cart Due records with this Client ID will automatically be classified as NGO.
                </p>

                {/* Real-time preview of matching records */}
                {!editingNgo && formData.client_id.trim() && (
                  <div className="mt-2 p-2.5 rounded-lg border text-[11px] transition-all bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                    {liveMatchingRecordsInModal.length > 0 ? (
                      <div className="space-y-1">
                        <div className="font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Found {liveMatchingRecordsInModal.length} existing Cart Due records!</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-amber-800 dark:text-amber-300">
                          <span>Outstanding: <strong>{formatINR(liveModalMatchingOutstanding)}</strong></span>
                          <span>·</span>
                          <span>Original: <strong>{formatINR(liveModalMatchingOriginal)}</strong></span>
                        </div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-400">
                          Adding this NGO will immediately update their classification across Cart Due views.
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 dark:text-slate-400">
                        No Cart Due records currently match Client ID "{formData.client_id.trim()}". Any future records with this Client ID will be classified as NGO.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  NGO Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wildlife SOS or Friendicoes"
                  value={formData.ngo_name}
                  onChange={e => setFormData(prev => ({ ...prev, ngo_name: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Contact Person (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={formData.contact_person}
                  onChange={e => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="accounts@ngo.org"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98112..."
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Credit term arrangements, authorized billing limits..."
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-xs"
                >
                  {editingNgo ? 'Save Changes' : 'Register NGO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Copy from Dues NGO Master Modal */}
      {copyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Copy className="w-4 h-4 text-indigo-500" />
                <span>Copy NGOs from Regular Dues Master</span>
              </h3>
              <button onClick={() => setCopyModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-300">
                This copies registered NGOs from your main Dues NGO Master into the <strong>Cart Due NGO Master</strong>.
                It will not overwrite any existing Cart Due NGOs or alter regular Dues data.
              </p>

              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
                <div className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  <span>Candidate NGOs to import:</span>
                  <span className="font-mono text-sm">{copyCandidates.length}</span>
                </div>
                <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Total in Dues Master: {duesNgos.length} · Already in Cart Due: {cartNgos.length}
                </div>
              </div>

              {copyCandidates.length > 0 ? (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {copyCandidates.map(c => (
                    <div key={c.id} className="p-2 flex items-center justify-between text-[11px]">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{c.ngo_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {c.client_id}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  All NGOs from the regular Dues Master are already present in the Cart Due NGO Master.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={copyCandidates.length === 0}
                onClick={handleCopyFromDuesMaster}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
              >
                Copy {copyCandidates.length} NGOs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete NGO Confirmation Modal */}
      {deleteConfirmNgo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl text-xs space-y-4">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">Remove from Cart NGO Master?</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Are you sure you want to remove <strong>{deleteConfirmNgo.ngo_name}</strong> (Client ID: {deleteConfirmNgo.client_id}) from the Cart Due NGO Master?
            </p>
            <p className="text-[11px] text-slate-400">
              Note: This will <strong>not</strong> delete historical cart records or payments. Any existing records will simply revert to Normal client classification.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setDeleteConfirmNgo(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteCartNgo(deleteConfirmNgo.id);
                  setDeleteConfirmNgo(null);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg"
              >
                Remove NGO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. NGO Ledger Drilldown Modal */}
      {selectedNgoForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-xl overflow-hidden text-xs">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{selectedNgoForLedger.ngo_name}</span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                      Client ID: {selectedNgoForLedger.client_id}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {selectedNgoForLedger.status}
                    </span>
                  </h3>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Authorized Cart Due NGO Partner · Normalized matching on Client ID
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedNgoForLedger(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60">
                  <div className="text-[10px] uppercase font-semibold text-red-600 dark:text-red-400">Cart Outstanding</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400 mt-0.5">
                    {formatINR(selectedNgoRecords.reduce((s, r) => s + (Number(r.remaining_amount) || 0), 0))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Original Cart Dues</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                    {formatINR(selectedNgoRecords.reduce((s, r) => s + (Number(r.original_amount) || 0), 0))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Collection Paid</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatINR(selectedNgoRecords.reduce((s, r) => s + (Number(r.paid_amount) || 0), 0))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Total Cart Records</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedNgoRecords.length}
                  </div>
                </div>
              </div>

              {/* Records Table */}
              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Cart Due Records for {selectedNgoForLedger.ngo_name} ({selectedNgoRecords.length})
                </span>
                <button
                  onClick={() => exportToCSV(selectedNgoRecords, `${selectedNgoForLedger.ngo_name}_CartDue_Ledger`)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Sr.No</th>
                      <th className="py-2 px-3">Record Date</th>
                      <th className="py-2 px-3">Client Name</th>
                      <th className="py-2 px-3">Provider</th>
                      <th className="py-2 px-3 text-right">Original (Extension)</th>
                      <th className="py-2 px-3 text-right">Paid</th>
                      <th className="py-2 px-3 text-right">Remaining Due</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedNgoRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No Cart Due records found for this NGO Client ID yet.
                        </td>
                      </tr>
                    ) : (
                      selectedNgoRecords.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-mono text-slate-400">{r.sr_no || idx + 1}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{formatDate(r.record_date)}</td>
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{r.client_name}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{r.provider_name}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">{formatINR(r.original_amount)}</td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatINR(r.paid_amount)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-red-600 dark:text-red-400">{formatINR(r.remaining_amount)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              r.status === 'Paid'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : r.status === 'Partial'
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/40">
              <button
                onClick={() => setSelectedNgoForLedger(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

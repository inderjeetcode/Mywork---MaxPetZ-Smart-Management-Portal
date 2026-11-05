import React, { useState, useMemo } from 'react';
import { 
  Building, 
  Plus, 
  Search, 
  Check, 
  AlertTriangle, 
  Eye, 
  Edit2, 
  Archive, 
  Power, 
  X, 
  Download, 
  Receipt,
  FileSpreadsheet,
  Link2Off,
  Building2,
  Calendar
} from 'lucide-react';
import { useDues } from '../../context/DuesContext';
import { NGO, NgoStatus, Invoice } from '../../types';
import { formatINR, formatDate, exportToExcel, exportToCSV } from '../../utils/formatters';

export const NgoManagementView: React.FC = () => {
  const { ngos, invoices, addNgo, updateNgo, setNgoStatus, unlinkNgoClientId } = useDues();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNgo, setEditingNgo] = useState<NGO | null>(null);
  const [selectedNgoForLedger, setSelectedNgoForLedger] = useState<NGO | null>(null);
  const [ledgerSearch, setLedgerSearch] = useState('');

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

  const openEditModal = (ngo: NGO) => {
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

    if (!formData.client_id.trim()) {
      setFormError('Client ID is mandatory.');
      return;
    }
    if (!formData.ngo_name.trim()) {
      setFormError('NGO Name is mandatory.');
      return;
    }

    if (editingNgo) {
      const res = await updateNgo(editingNgo.id, {
        ngo_name: formData.ngo_name.trim(),
        contact_person: formData.contact_person.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to update NGO');
        return;
      }
    } else {
      const res = await addNgo({
        client_id: formData.client_id.trim(),
        ngo_name: formData.ngo_name.trim(),
        contact_person: formData.contact_person.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        status: 'ACTIVE',
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to add NGO');
        return;
      }
    }

    setModalOpen(false);
  };

  // Filtered NGOs
  const filteredNgos = useMemo(() => {
    if (!searchTerm) return ngos;
    const q = searchTerm.toLowerCase();
    return ngos.filter(
      n =>
        n.ngo_name.toLowerCase().includes(q) ||
        n.client_id.toLowerCase().includes(q) ||
        (n.contact_person && n.contact_person.toLowerCase().includes(q))
    );
  }, [ngos, searchTerm]);

  // Aggregate stats per NGO from all invoices
  const ngoStatsMap = useMemo(() => {
    const stats = new Map<
      string,
      {
        invoices: Invoice[];
        totalOutstanding: number;
        totalAmount: number;
        invoiceCount: number;
        clinics: Set<string>;
        staff: Set<string>;
      }
    >();

    ngos.forEach(ngo => {
      const key = ngo.client_id.trim().toUpperCase();
      stats.set(key, {
        invoices: [],
        totalOutstanding: 0,
        totalAmount: 0,
        invoiceCount: 0,
        clinics: new Set<string>(),
        staff: new Set<string>(),
      });
    });

    invoices.forEach(inv => {
      if (inv.client_id) {
        const key = inv.client_id.trim().toUpperCase();
        const entry = stats.get(key);
        if (entry) {
          entry.invoices.push(inv);
          entry.totalOutstanding += Number(inv.balance) || 0;
          entry.totalAmount += Number(inv.amount) || 0;
          entry.invoiceCount += 1;
          if (inv.clinic_name) entry.clinics.add(inv.clinic_name);
          if (inv.user_name) entry.staff.add(inv.user_name);
        }
      }
    });

    return stats;
  }, [ngos, invoices]);

  // Selected NGO Invoices for Detail View
  const selectedNgoStats = useMemo(() => {
    if (!selectedNgoForLedger) return null;
    const targetId = selectedNgoForLedger.client_id.trim().toUpperCase();
    return ngoStatsMap.get(targetId) || {
      invoices: [],
      totalOutstanding: 0,
      totalAmount: 0,
      invoiceCount: 0,
      clinics: new Set<string>(),
      staff: new Set<string>(),
    };
  }, [selectedNgoForLedger, ngoStatsMap]);

  const selectedNgoInvoices = selectedNgoStats?.invoices || [];

  const filteredLedgerInvoices = useMemo(() => {
    if (!ledgerSearch) return selectedNgoInvoices;
    const q = ledgerSearch.toLowerCase();
    return selectedNgoInvoices.filter(
      i =>
        i.invoice_no.toLowerCase().includes(q) ||
        i.client_name.toLowerCase().includes(q) ||
        i.clinic_name.toLowerCase().includes(q) ||
        i.user_name.toLowerCase().includes(q)
    );
  }, [selectedNgoInvoices, ledgerSearch]);

  const selectedNgoOutstanding = selectedNgoStats?.totalOutstanding || 0;
  const selectedNgoTotalAmount = selectedNgoStats?.totalAmount || 0;

  // Real-time preview of matching invoices when typing Client ID in Add NGO modal
  const liveMatchingInvoicesInModal = useMemo(() => {
    const rawInput = formData.client_id.trim();
    if (!rawInput) return [];
    const normalizedInput = rawInput.toUpperCase();
    return invoices.filter(
      inv => inv.client_id && inv.client_id.trim().toUpperCase() === normalizedInput
    );
  }, [formData.client_id, invoices]);

  const liveModalMatchingOutstanding = useMemo(() => {
    return liveMatchingInvoicesInModal.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  }, [liveMatchingInvoicesInModal]);

  const liveModalMatchingTotalAmount = useMemo(() => {
    return liveMatchingInvoicesInModal.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [liveMatchingInvoicesInModal]);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>NGO Master Management</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
              {ngos.length} Registered
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Maintain authorized animal welfare partner organizations. Invoices are automatically classified as NGO during import by matching Client ID.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(ngos, 'MaxPetZ_Registered_NGOs')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New NGO</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search NGO by name, Client ID, or contact person..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredNgos.length} NGOs
        </span>
      </div>

      {/* NGO Master Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">NGO Name</th>
                <th className="py-2.5 px-3">Client ID</th>
                <th className="py-2.5 px-3 text-right">Invoices</th>
                <th className="py-2.5 px-3 text-right">Total Outstanding</th>
                <th className="py-2.5 px-3 text-right">Total Billed</th>
                <th className="py-2.5 px-3">Associated Clinics</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredNgos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No NGOs registered yet. Click "Add New NGO" to classify an existing client as an NGO partner.
                  </td>
                </tr>
              ) : (
                filteredNgos.map(ngo => {
                  const stats = ngoStatsMap.get(ngo.client_id.trim().toUpperCase());
                  const invoiceCount = stats?.invoiceCount || 0;
                  const totalOutstanding = stats?.totalOutstanding || 0;
                  const totalAmount = stats?.totalAmount || 0;
                  const clinicsList = stats ? Array.from(stats.clinics) : [];

                  return (
                    <tr key={ngo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{ngo.ngo_name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {ngo.client_id}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {invoiceCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600 dark:text-red-400">
                        {formatINR(totalOutstanding)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatINR(totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={clinicsList.join(', ')}>
                        {clinicsList.join(', ') || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            ngo.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : ngo.status === 'INACTIVE'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {ngo.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedNgoForLedger(ngo)}
                            title="View Invoices & Dues Ledger"
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
                            onClick={() =>
                              setNgoStatus(ngo.id, ngo.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
                            }
                            title={ngo.status === 'ACTIVE' ? 'Deactivate NGO' : 'Activate NGO'}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => unlinkNgoClientId(ngo.id)}
                            title="Archive / Unlink Client ID"
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Link2Off className="w-3.5 h-3.5" />
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

      {/* Add / Edit NGO Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-500" />
                <span>{editingNgo ? 'Edit NGO Partner' : 'Register New Partner NGO'}</span>
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                {formError}
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
                  placeholder="e.g. NGO-00042 or 00452"
                  value={formData.client_id}
                  onChange={e => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-60"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Stored as text to preserve leading zeros. Invoices matching this Client ID will immediately be classified as NGO.
                </p>

                {/* Live Existing Invoices Detection Banner */}
                {!editingNgo && formData.client_id.trim() && (
                  <div className="mt-2 p-2.5 rounded-lg border text-[11px] transition-all bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                    {liveMatchingInvoicesInModal.length > 0 ? (
                      <div className="space-y-1">
                        <div className="font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Found {liveMatchingInvoicesInModal.length} existing invoices in database!</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-emerald-800 dark:text-emerald-300">
                          <span>Total Dues: <strong>{formatINR(liveModalMatchingOutstanding)}</strong></span>
                          <span>·</span>
                          <span>Billed: <strong>{formatINR(liveModalMatchingTotalAmount)}</strong></span>
                        </div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                          Adding this NGO will immediately reclassify these invoices and update your NGO dashboard.
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 dark:text-slate-400">
                        No existing invoices currently match Client ID "{formData.client_id.trim()}". Future imports with this Client ID will be classified as NGO.
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
                  placeholder="e.g. Friendicoes SECA"
                  value={formData.ngo_name}
                  onChange={e => setFormData(prev => ({ ...prev, ngo_name: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Contact Person (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Geeta Seshamani"
                  value={formData.contact_person}
                  onChange={e => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
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
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
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
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Hospital MoU terms, special rescue discount arrangements..."
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
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
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  {editingNgo ? 'Save Changes' : 'Register NGO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NGO Ledger Drill-down Modal (Requirement 5) */}
      {selectedNgoForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-xl overflow-hidden text-xs">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Building className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{selectedNgoForLedger.ngo_name}</span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                      Client ID: {selectedNgoForLedger.client_id}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {selectedNgoForLedger.status}
                    </span>
                  </h3>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Authorized NGO Partner · All invoices associated by normalized Client ID
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

            {/* Content Viewport */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Primary KPI Ribbon: Total Outstanding, Total Billed, Invoices, Clinics, Staff */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60">
                  <div className="text-[10px] uppercase font-semibold text-red-600 dark:text-red-400">Total Outstanding</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400 mt-0.5">
                    {formatINR(selectedNgoOutstanding)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Total Invoice Amount</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                    {formatINR(selectedNgoTotalAmount)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Total Invoices</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedNgoInvoices.length}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Associated Clinics</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedNgoStats?.clinics.size || 0}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Doctors / Staff</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedNgoStats?.staff.size || 0}
                  </div>
                </div>
              </div>

              {/* Clinic-wise & Staff-wise mini breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Clinic-Wise Outstanding Dues:
                  </span>
                  <div className="space-y-1">
                    {Array.from(selectedNgoStats?.clinics || []).map(clinic => {
                      const clinicDue = selectedNgoInvoices
                        .filter(i => i.clinic_name === clinic)
                        .reduce((sum, i) => sum + (Number(i.balance) || 0), 0);
                      return (
                        <div key={clinic} className="flex justify-between items-center text-[11px] py-0.5 border-b border-slate-200/50 dark:border-slate-700/50">
                          <span className="text-slate-600 dark:text-slate-400">{clinic}</span>
                          <span className="font-mono font-semibold text-red-600 dark:text-red-400">{formatINR(clinicDue)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Staff-Wise Associated Invoices:
                  </span>
                  <div className="space-y-1">
                    {Array.from(selectedNgoStats?.staff || []).map(staff => {
                      const staffCount = selectedNgoInvoices.filter(i => i.user_name === staff).length;
                      const staffDue = selectedNgoInvoices
                        .filter(i => i.user_name === staff)
                        .reduce((sum, i) => sum + (Number(i.balance) || 0), 0);
                      return (
                        <div key={staff} className="flex justify-between items-center text-[11px] py-0.5 border-b border-slate-200/50 dark:border-slate-700/50">
                          <span className="text-slate-600 dark:text-slate-400">{staff} ({staffCount} bills)</span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatINR(staffDue)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Ledger Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoice number, client case, clinic, doctor..."
                    value={ledgerSearch}
                    onChange={e => setLedgerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportToExcel(selectedNgoInvoices, `${selectedNgoForLedger.ngo_name}_Invoices`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-200 dark:border-emerald-800"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={() => exportToCSV(selectedNgoInvoices, `${selectedNgoForLedger.ngo_name}_Invoices`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* 9-Column Invoice Ledger Table (Requirement 5) */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Invoice Number</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Client ID</th>
                      <th className="py-2.5 px-3">Client Name</th>
                      <th className="py-2.5 px-3">Clinic</th>
                      <th className="py-2.5 px-3">Staff</th>
                      <th className="py-2.5 px-3 text-right">Invoice Amount</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                    {filteredLedgerInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          No matching invoices found for this NGO Client ID.
                        </td>
                      </tr>
                    ) : (
                      filteredLedgerInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {inv.invoice_no}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                            {formatDate(inv.date)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap font-semibold">
                            {inv.client_id}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 max-w-[150px] truncate" title={inv.client_name}>
                            {inv.client_name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[140px] truncate" title={inv.clinic_name}>
                            {inv.clinic_name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[120px] truncate" title={inv.user_name}>
                            {inv.user_name}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            {formatINR(inv.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-red-600 dark:text-red-400">
                            {formatINR(inv.balance)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {inv.status}
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

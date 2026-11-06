import React, { useState } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { useCartDue } from '../../context/CartDueContext';
import { CartDuePaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const CartDueCollectionsView: React.FC = () => {
  const {
    payments,
    advanceCredits,
    records,
    totalCollectionReceived,
    availableAdvanceCredit,
    addAdvanceCredit,
    allocateAdvanceCredit,
  } = useCartDue();

  // Modals state
  const [directAdvanceModalOpen, setDirectAdvanceModalOpen] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);

  // Direct Advance Form State
  const [advClientId, setAdvClientId] = useState('');
  const [advClientName, setAdvClientName] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advMethod, setAdvMethod] = useState<CartDuePaymentMethod>('UPI');
  const [advNotes, setAdvNotes] = useState('');
  const [advLoading, setAdvLoading] = useState(false);

  // Allocation Form State
  const [selectedCreditId, setSelectedCreditId] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [allocAmount, setAllocAmount] = useState('');
  const [allocLoading, setAllocLoading] = useState(false);
  const [allocError, setAllocError] = useState<string | null>(null);

  const [paymentCategoryFilter, setPaymentCategoryFilter] = useState<'all' | 'ngo' | 'normal' | 'unclassified'>('all');

  // Open records that can receive advance credit
  const openDueRecords = records.filter(r => r.remaining_amount > 0);

  const filteredPayments = payments.filter(p => {
    if (paymentCategoryFilter !== 'all') {
      if (paymentCategoryFilter === 'ngo' && p.client_type !== 'NGO') return false;
      if (paymentCategoryFilter === 'normal' && p.client_type !== 'NORMAL') return false;
      if (paymentCategoryFilter === 'unclassified' && p.client_type !== 'UNCLASSIFIED') return false;
    }
    return true;
  });

  const handleCreateDirectAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(advAmount) || 0;
    if (amount <= 0 || !advClientId.trim() || !advClientName.trim()) return;

    setAdvLoading(true);
    await addAdvanceCredit(advClientId.trim(), advClientName.trim(), amount, advMethod, advNotes.trim());
    setAdvLoading(false);
    setDirectAdvanceModalOpen(false);
    setAdvClientId('');
    setAdvClientName('');
    setAdvAmount('');
    setAdvNotes('');
  };

  const handleAllocateCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllocError(null);
    const amount = parseFloat(allocAmount) || 0;
    if (amount <= 0 || !selectedCreditId || !selectedRecordId) {
      setAllocError('Please select both an advance credit account, an open cart record, and a valid amount.');
      return;
    }

    setAllocLoading(true);
    const res = await allocateAdvanceCredit(selectedCreditId, selectedRecordId, amount);
    setAllocLoading(false);

    if (!res.success) {
      setAllocError(res.error || 'Failed to allocate credit.');
      return;
    }

    setAllocationModalOpen(false);
    setSelectedCreditId('');
    setSelectedRecordId('');
    setAllocAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Cart Due Collections & Advance Credit Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time transaction history for recorded cart payments, excess receipts, and advance credit allocations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDirectAdvanceModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Add Direct Advance</span>
          </button>
          {availableAdvanceCredit > 0 && openDueRecords.length > 0 && (
            <button
              onClick={() => setAllocationModalOpen(true)}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Allocate Advance to Due</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Collections Received
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalCollectionReceived)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Across {payments.length} total payment transaction{payments.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Available Advance Credit Pool
            </span>
            <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
              {formatCurrency(availableAdvanceCredit)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Held for {advanceCredits.filter(a => a.available_credit > 0).length} client account{advanceCredits.filter(a => a.available_credit > 0).length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Available Advance Accounts Table */}
      {advanceCredits.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-purple-600" />
              <span>Client Advance Credit Accounts</span>
            </h3>
            <span className="text-xs text-slate-400">
              Held separately for manual allocation to upcoming dues
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Client ID</th>
                  <th className="py-2.5 px-3">Client Name</th>
                  <th className="py-2.5 px-3 text-right">Total Advance Deposited</th>
                  <th className="py-2.5 px-3 text-right">Used / Allocated</th>
                  <th className="py-2.5 px-3 text-right">Available Advance Credit</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {advanceCredits.map(adv => (
                  <tr key={adv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {adv.client_id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {adv.client_name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(adv.total_credit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {formatCurrency(adv.used_credit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(adv.available_credit)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {adv.available_credit > 0 && openDueRecords.some(r => r.client_id === adv.client_id) && (
                        <button
                          onClick={() => {
                            setSelectedCreditId(adv.id);
                            setAllocationModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
                        >
                          Allocate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Transactions Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Payment Transactions Audit Log
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Isolated transaction receipts recorded for provider cart dues
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {(['all', 'ngo', 'normal', 'unclassified'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setPaymentCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-colors ${
                  paymentCategoryFilter === cat
                    ? cat === 'ngo'
                      ? 'bg-amber-500 text-white'
                      : cat === 'normal'
                      ? 'bg-blue-600 text-white'
                      : cat === 'unclassified'
                      ? 'bg-slate-700 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All' : cat === 'ngo' ? 'NGO' : cat === 'normal' ? 'Normal' : 'Unclassified'}
              </button>
            ))}
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No payments recorded matching selected filters. Use &quot;Record Payment&quot; on any Cart Due record or client card.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Client ID</th>
                  <th className="py-2.5 px-3">Client Name</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3">Reference / Txn ID</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {formatDate(p.payment_date)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {p.client_id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span>{p.client_name}</span>
                        {p.client_type === 'NGO' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            NGO
                          </span>
                        ) : p.client_type === 'UNCLASSIFIED' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Unclassified
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      {p.reference_no || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                      {p.notes || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      +{formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Direct Advance Deposit Modal */}
      {directAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-600" />
                <span>Deposit Direct Client Advance Credit</span>
              </h3>
              <button
                onClick={() => setDirectAdvanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDirectAdvance} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 001082"
                  value={advClientId}
                  onChange={e => setAdvClientId(e.target.value)}
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Mehta"
                  value={advClientName}
                  onChange={e => setAdvClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Advance Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  placeholder="e.g. 15000"
                  value={advAmount}
                  onChange={e => setAdvAmount(e.target.value)}
                  className="w-full px-3 py-2 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deposit Method *
                </label>
                <select
                  value={advMethod}
                  onChange={e => setAdvMethod(e.target.value as CartDuePaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="NetBanking">NetBanking / NEFT</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pre-paid deposit for scheduled dental surgery"
                  value={advNotes}
                  onChange={e => setAdvNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDirectAdvanceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={advLoading}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                >
                  {advLoading ? 'Saving...' : 'Deposit Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Advance to Due Modal */}
      {allocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-600" />
                <span>Allocate Advance Credit to Open Due</span>
              </h3>
              <button
                onClick={() => setAllocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {allocError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{allocError}</span>
              </div>
            )}

            <form onSubmit={handleAllocateCredit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Source Advance Credit Account *
                </label>
                <select
                  required
                  value={selectedCreditId}
                  onChange={e => {
                    setSelectedCreditId(e.target.value);
                    const adv = advanceCredits.find(a => a.id === e.target.value);
                    if (adv) setAllocAmount(String(adv.available_credit));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Select Client Advance Account --</option>
                  {advanceCredits
                    .filter(a => a.available_credit > 0)
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.client_name} ({a.client_id}) · Avail: {formatCurrency(a.available_credit)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Open Cart Due Record *
                </label>
                <select
                  required
                  value={selectedRecordId}
                  onChange={e => {
                    setSelectedRecordId(e.target.value);
                    const rec = openDueRecords.find(r => r.id === e.target.value);
                    const adv = advanceCredits.find(a => a.id === selectedCreditId);
                    if (rec && adv) {
                      setAllocAmount(String(Math.min(rec.remaining_amount, adv.available_credit)));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Select Open Due Record --</option>
                  {openDueRecords.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.client_name} ({r.client_id}) · Due: {formatCurrency(r.remaining_amount)} [{r.provider_name}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount to Allocate (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  value={allocAmount}
                  onChange={e => setAllocAmount(e.target.value)}
                  className="w-full px-3 py-2 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAllocationModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocLoading}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {allocLoading ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

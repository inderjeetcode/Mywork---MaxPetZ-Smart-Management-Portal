import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  PhoneCall, 
  CreditCard, 
  Wallet, 
  Calendar, 
  ChevronRight, 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { useCartDue } from '../../context/CartDueContext';
import { CartDueClientSummary, CartDueRecord } from '../../types';
import { RecordPaymentModal } from './RecordPaymentModal';
import { AddFollowupModal } from './AddFollowupModal';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const CartDueClientsView: React.FC = () => {
  const {
    clientSummaries,
    records,
    payments,
    followups,
    advanceCredits,
  } = useCartDue();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientTypeFilter, setClientTypeFilter] = useState<'all' | 'ngo' | 'normal' | 'unclassified'>('all');

  // Modals
  const [paymentRecord, setPaymentRecord] = useState<CartDueRecord | null>(null);
  const [followupClient, setFollowupClient] = useState<{ id: string; name: string } | null>(null);

  // Filtered Client Summaries
  const filteredClients = useMemo(() => {
    return clientSummaries.filter(c => {
      if (clientTypeFilter !== 'all') {
        if (clientTypeFilter === 'ngo' && c.client_type !== 'NGO') return false;
        if (clientTypeFilter === 'normal' && c.client_type !== 'NORMAL') return false;
        if (clientTypeFilter === 'unclassified' && c.client_type !== 'UNCLASSIFIED') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          c.client_name.toLowerCase().includes(q) ||
          c.client_id.toLowerCase().includes(q) ||
          (c.ngo_name && c.ngo_name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [clientSummaries, searchQuery, clientTypeFilter]);

  // Selected Client Data for Detail Drawer
  const activeClientSummary = useMemo(() => {
    if (!selectedClientId) return null;
    return clientSummaries.find(c => c.client_id === selectedClientId) || null;
  }, [selectedClientId, clientSummaries]);

  const activeClientRecords = useMemo(() => {
    if (!selectedClientId) return [];
    return records.filter(r => r.client_id === selectedClientId);
  }, [selectedClientId, records]);

  const activeClientPayments = useMemo(() => {
    if (!selectedClientId) return [];
    return payments.filter(p => p.client_id === selectedClientId);
  }, [selectedClientId, payments]);

  const activeClientFollowups = useMemo(() => {
    if (!selectedClientId) return [];
    return followups.filter(f => f.client_id === selectedClientId);
  }, [selectedClientId, followups]);

  const activeClientCredit = useMemo(() => {
    if (!selectedClientId) return 0;
    const found = advanceCredits.find(a => a.client_id === selectedClientId);
    return found ? found.available_credit : 0;
  }, [selectedClientId, advanceCredits]);

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Cart Due Client Accounts ({clientSummaries.length})</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dedicated client directory tracking provider dues, advance credits, and collection history
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
            {(['all', 'ngo', 'normal', 'unclassified'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setClientTypeFilter(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-colors ${
                  clientTypeFilter === cat
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

          {/* Search by Client Name or Client ID */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Client Name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No matching Cart Due clients found. Import records to build the client ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Client ID</th>
                  <th className="py-2.5 px-3">Client Name</th>
                  <th className="py-2.5 px-3">Associated Providers</th>
                  <th className="py-2.5 px-3 text-right">Original Cart Due</th>
                  <th className="py-2.5 px-3 text-right">Paid Amount</th>
                  <th className="py-2.5 px-3 text-right">Remaining Due</th>
                  <th className="py-2.5 px-3 text-right">Advance Credit</th>
                  <th className="py-2.5 px-3 text-center">Follow-up</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClients.map(client => (
                  <tr
                    key={client.client_id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedClientId(client.client_id)}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {client.client_id}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span>{client.client_name}</span>
                        {client.client_type === 'NGO' ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            NGO
                          </span>
                        ) : client.client_type === 'UNCLASSIFIED' ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Unclassified
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            Normal
                          </span>
                        )}
                      </div>
                      {client.ngo_name && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                          {client.ngo_name}
                        </div>
                      )}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {client.record_count} total record{client.record_count === 1 ? '' : 's'} ({client.open_records_count} open)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {client.providers.join(', ') || 'General Provider'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(client.total_original_due)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(client.total_paid)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(client.remaining_due)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-purple-600 dark:text-purple-400 font-semibold">
                      {client.available_advance_credit > 0
                        ? formatCurrency(client.available_advance_credit)
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          client.followup_status === 'Overdue'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : client.followup_status === 'Today'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            : client.followup_status === 'Upcoming'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {client.followup_status === 'None' ? 'No Call' : client.followup_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedClientId(client.client_id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="View Full Client Ledger"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Client Detail Ledger Drawer */}
      {selectedClientId && activeClientSummary && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {activeClientSummary.client_name}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                    {activeClientSummary.client_id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Associated Providers: {activeClientSummary.providers.join(', ') || 'General Provider'}
                </p>
              </div>
              <button
                onClick={() => setSelectedClientId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary Strip */}
            <div className="p-4 bg-slate-100/60 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Original Cart Due</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {formatCurrency(activeClientSummary.total_original_due)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Payment Received</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrency(activeClientSummary.total_paid)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Remaining Due</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {formatCurrency(activeClientSummary.remaining_due)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Available Advance</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
                  {formatCurrency(activeClientCredit)}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <button
                onClick={() => {
                  setFollowupClient({
                    id: activeClientSummary.client_id,
                    name: activeClientSummary.client_name,
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Log Follow-up Call</span>
              </button>
            </div>

            {/* Drawer Content Tabs / Sections */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 text-xs">
              {/* 1. Outstanding / Past Cart Records */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] mb-2.5">
                  Cart Due Records ({activeClientRecords.length})
                </h4>
                <div className="space-y-2">
                  {activeClientRecords.map(r => (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {r.provider_name}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Date: {formatDate(r.record_date)} · Status: <span className="font-semibold">{r.status}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          Remaining: {formatCurrency(r.remaining_amount)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Original: {formatCurrency(r.original_amount)}
                        </div>
                        {r.remaining_amount > 0 && (
                          <button
                            onClick={() => setPaymentRecord(r)}
                            className="mt-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                          >
                            Pay Due
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Payment History */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] mb-2.5">
                  Payment History ({activeClientPayments.length})
                </h4>
                {activeClientPayments.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No payments recorded for this client yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activeClientPayments.map(p => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span>Method: {p.payment_method}</span>
                            {p.reference_no && (
                              <span className="font-mono text-[10px] text-slate-400">({p.reference_no})</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Date: {formatDate(p.payment_date)} {p.notes ? `· ${p.notes}` : ''}
                          </p>
                        </div>
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(p.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Follow-up History */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] mb-2.5">
                  Follow-up Log & Contact History ({activeClientFollowups.length})
                </h4>
                {activeClientFollowups.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No collection calls logged for this client yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activeClientFollowups.map(f => (
                      <div
                        key={f.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {f.contact_method} · {f.contact_result}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {formatDate(f.followup_date)}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 italic">
                          &ldquo;{f.notes}&rdquo;
                        </p>
                        {f.next_followup_date && (
                          <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 pt-1">
                            Next Call Scheduled: {formatDate(f.next_followup_date)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentRecord && (
        <RecordPaymentModal
          record={paymentRecord}
          onClose={() => setPaymentRecord(null)}
        />
      )}

      {/* Add Follow-up Modal */}
      {followupClient && (
        <AddFollowupModal
          initialClientId={followupClient.id}
          initialClientName={followupClient.name}
          onClose={() => setFollowupClient(null)}
        />
      )}
    </div>
  );
};

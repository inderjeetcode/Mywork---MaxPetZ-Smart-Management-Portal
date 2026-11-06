import React, { useState } from 'react';
import { 
  CreditCard, 
  PhoneCall, 
  CalendarClock, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowUpRight, 
  Search,
  Upload,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { useCartDue } from '../../context/CartDueContext';
import { CartDueKpis } from './CartDueKpis';
import { RecordPaymentModal } from './RecordPaymentModal';
import { AddFollowupModal } from './AddFollowupModal';
import { CartDueRecord } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface CartDueOverviewProps {
  onNavigateToDataManagement?: () => void;
  onNavigateToFollowups?: () => void;
}

export const CartDueOverview: React.FC<CartDueOverviewProps> = ({
  onNavigateToDataManagement,
  onNavigateToFollowups,
}) => {
  const {
    records,
    filteredRecords,
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
    todayFollowups,
    overdueFollowups,
    completeFollowup,
  } = useCartDue();

  const [selectedRecordForPayment, setSelectedRecordForPayment] = useState<CartDueRecord | null>(null);
  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [selectedClientForFollowup, setSelectedClientForFollowup] = useState<{
    id: string;
    name: string;
    provider?: string;
  } | null>(null);

  // If no records imported yet, show a clean, high-clarity zero state
  if (records.length === 0) {
    return (
      <div className="space-y-6">
        <CartDueKpis
          totalCartOutstanding={0}
          totalCartClients={0}
          totalCartRecords={0}
          todayFollowupsCount={0}
          overdueFollowupsCount={0}
          totalCollectionReceived={0}
          availableAdvanceCredit={0}
          totalCartNgoOutstanding={0}
          totalNormalClientOutstanding={0}
          totalUnclassifiedOutstanding={0}
          ngoClientCount={0}
          normalClientCount={0}
          unclassifiedClientCount={0}
        />

        <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Cart Due Dashboard is Ready for Import
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No Cart Due records found. Import your <strong className="font-mono">cart due auto format.xlsx</strong> file to track provider cart receivables, log follow-ups, and manage advance credits.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateToDataManagement}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import Cart Due Excel / CSV</span>
            </button>
            <button
              onClick={() => setFollowupModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log Manual Follow-up</span>
            </button>
          </div>
        </div>

        {followupModalOpen && (
          <AddFollowupModal onClose={() => setFollowupModalOpen(false)} />
        )}
      </div>
    );
  }

  // Active records: prioritize unpaid/partial
  const recentDueRecords = filteredRecords
    .filter(r => r.remaining_amount > 0)
    .slice(0, 15);

  return (
    <div className="space-y-6">
      {/* 7 KPI Cards + 3-Way Category Partition */}
      <CartDueKpis
        totalCartOutstanding={totalCartOutstanding}
        totalCartClients={totalCartClients}
        totalCartRecords={totalCartRecords}
        todayFollowupsCount={todayFollowupsCount}
        overdueFollowupsCount={overdueFollowupsCount}
        totalCollectionReceived={totalCollectionReceived}
        availableAdvanceCredit={availableAdvanceCredit}
        totalCartNgoOutstanding={totalCartNgoOutstanding}
        totalNormalClientOutstanding={totalNormalClientOutstanding}
        totalUnclassifiedOutstanding={totalUnclassifiedOutstanding}
        ngoClientCount={ngoClientCount}
        normalClientCount={normalClientCount}
        unclassifiedClientCount={unclassifiedClientCount}
      />


      {/* Urgent Follow-up Strip (If any overdue or today followups) */}
      {(overdueFollowups.length > 0 || todayFollowups.length > 0) && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Action Required: Urgent Cart Due Follow-ups ({overdueFollowups.length + todayFollowups.length})
              </h3>
            </div>
            {onNavigateToFollowups && (
              <button
                onClick={onNavigateToFollowups}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>View All Follow-ups</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...overdueFollowups, ...todayFollowups].slice(0, 6).map(f => {
              const isOverdue = overdueFollowups.some(o => o.id === f.id);
              return (
                <div
                  key={f.id}
                  className={`p-3 rounded-lg border text-xs flex flex-col justify-between space-y-2 ${
                    isOverdue
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{f.client_name}</span>
                        <span className="font-mono text-[10px] text-slate-400">({f.client_id})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Method: {f.contact_method} · {f.contact_result}
                      </p>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isOverdue
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                          : 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {isOverdue ? 'Overdue' : 'Due Today'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                    &ldquo;{f.notes}&rdquo;
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Scheduled: {formatDate(f.next_followup_date || f.followup_date)}
                    </span>
                    <button
                      onClick={() => completeFollowup(f.id, 'Marked completed from overview')}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-800 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span>Complete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Cart Due Table Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Outstanding Cart Due Ledger
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Active provider cart dues mapped from Extension column
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedClientForFollowup(null);
              setFollowupModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Follow-up Call</span>
          </button>
        </div>

        {recentDueRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No matching outstanding cart records found for active filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Sr.No</th>
                  <th className="py-2.5 px-3">Client ID</th>
                  <th className="py-2.5 px-3">Client Name</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Record Date</th>
                  <th className="py-2.5 px-3 text-right">Original Due (Ext)</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Remaining Due</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentDueRecords.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      {r.sr_no ?? idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {r.client_id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span>{r.client_name}</span>
                        {r.client_type === 'NGO' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            NGO
                          </span>
                        ) : r.client_type === 'UNCLASSIFIED' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Unclassified
                          </span>
                        ) : null}
                      </div>
                      {r.ngo_name && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                          {r.ngo_name}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {r.provider_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {formatDate(r.record_date)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(r.original_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(r.paid_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(r.remaining_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === 'Paid'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : r.status === 'Partial'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRecordForPayment(r)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
                        >
                          Record Payment
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClientForFollowup({
                              id: r.client_id,
                              name: r.client_name,
                              provider: r.provider_name,
                            });
                            setFollowupModalOpen(true);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Schedule Follow-up"
                        >
                          <PhoneCall className="w-3 h-3 text-blue-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedRecordForPayment && (
        <RecordPaymentModal
          record={selectedRecordForPayment}
          onClose={() => setSelectedRecordForPayment(null)}
        />
      )}

      {followupModalOpen && (
        <AddFollowupModal
          initialClientId={selectedClientForFollowup?.id}
          initialClientName={selectedClientForFollowup?.name}
          initialProviderName={selectedClientForFollowup?.provider}
          onClose={() => {
            setFollowupModalOpen(false);
            setSelectedClientForFollowup(null);
          }}
        />
      )}
    </div>
  );
};

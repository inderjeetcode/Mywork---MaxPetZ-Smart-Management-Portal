import React, { useState } from 'react';
import { 
  Users, 
  ArrowUpRight, 
  X, 
  Download, 
  Search, 
  ShieldAlert, 
  Building2 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { StaffPerformanceSummary, Invoice } from '../../types';
import { formatINR, formatIndianNumber, formatPercent, exportToCSV } from '../../utils/formatters';

interface StaffPerformanceViewProps {
  staffMembers: StaffPerformanceSummary[];
  allInvoices: Invoice[];
}

export const StaffPerformanceView: React.FC<StaffPerformanceViewProps> = ({
  staffMembers,
  allInvoices,
}) => {
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [drillSearch, setDrillSearch] = useState('');

  // Selected staff drilldown data
  const staffInvoices = selectedStaff
    ? allInvoices.filter(i => i.user_name === selectedStaff)
    : [];

  const filteredDrillInvoices = staffInvoices.filter(i => {
    if (!drillSearch) return true;
    const q = drillSearch.toLowerCase();
    return (
      i.invoice_no.toLowerCase().includes(q) ||
      i.client_name.toLowerCase().includes(q) ||
      i.clinic_name.toLowerCase().includes(q)
    );
  });

  const selectedStaffMeta = staffMembers.find(s => s.staff_name === selectedStaff);

  return (
    <div className="space-y-5">
      {/* Editorial Notice on Financial Metric Interpretation */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-blue-600" />
          <span>
            <strong>Operational Note:</strong> Outstanding balances reflect patient invoice receivables originating under each user/doctor. Higher values indicate larger due exposure portfolios, not collection performance.
          </span>
        </div>
        <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
          {staffMembers.length} Active Staff Members
        </span>
      </div>

      {/* Comparison Chart */}
      {staffMembers.length > 0 && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
            <span>Outstanding Due Exposure by Staff / Doctor</span>
            <span className="text-[11px] text-slate-400 font-normal">Amounts in INR (₹)</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={staffMembers.slice(0, 10).map(s => ({
                  name: s.staff_name,
                  outstanding: s.total_outstanding,
                }))}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis fontSize={11} tickFormatter={val => `₹${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any) => [formatINR(Number(val) || 0), 'Outstanding Due Exposure']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="outstanding" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Staff Exposure Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Staff Outstanding Ledger & Clinic Associations
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ranked by outstanding exposure portfolio. Click row to drill down into associated bills.
            </p>
          </div>
          <button
            onClick={() => exportToCSV(staffMembers, 'MaxPetZ_Staff_Performance')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Staff / Doctor</th>
                <th className="py-2.5 px-3 text-right">Total Outstanding</th>
                <th className="py-2.5 px-3 text-right">Total Billed</th>
                <th className="py-2.5 px-3 text-right">Due Bills</th>
                <th className="py-2.5 px-3 text-right">Avg / Bill</th>
                <th className="py-2.5 px-3 text-right">Due Share</th>
                <th className="py-2.5 px-3">Associated Clinics</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {staffMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No staff records found for current filters.
                  </td>
                </tr>
              ) : (
                staffMembers.map(staff => (
                  <tr
                    key={staff.staff_name}
                    onClick={() => setSelectedStaff(staff.staff_name)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {staff.staff_name.charAt(0)}
                      </div>
                      <span>{staff.staff_name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                      {formatINR(staff.total_outstanding)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {formatINR(staff.total_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {formatIndianNumber(staff.outstanding_invoice_count)} / {staff.invoice_count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {formatINR(staff.avg_outstanding)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                      {formatPercent(staff.percentage_contribution)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                      {staff.clinics.join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 mx-auto text-[11px] font-semibold">
                        <span>View Bills</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Drill-Down Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedStaff} — Invoiced Bills Portfolio
                  </h2>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                    <span>Outstanding: <strong className="text-amber-600 dark:text-amber-400 font-mono">{formatINR(selectedStaffMeta?.total_outstanding)}</strong></span>
                    <span>·</span>
                    <span>Invoices: <strong className="font-mono">{staffInvoices.length}</strong></span>
                    <span>·</span>
                    <span>Clinics: <strong className="font-medium">{selectedStaffMeta?.clinics.join(', ')}</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Associated Patient Invoices ({filteredDrillInvoices.length})
                </h4>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search bill or client..."
                      value={drillSearch}
                      onChange={e => setDrillSearch(e.target.value)}
                      className="pl-8 pr-2.5 py-1 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <button
                    onClick={() => exportToCSV(filteredDrillInvoices, `${selectedStaff}_bills`)}
                    className="px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Export
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Invoice No</th>
                      <th className="py-2 px-2.5">Hospital Branch</th>
                      <th className="py-2 px-2.5">Client Name</th>
                      <th className="py-2 px-2.5 text-right">Billed Amt</th>
                      <th className="py-2 px-2.5 text-right">Balance Due</th>
                      <th className="py-2 px-2.5">Status</th>
                      <th className="py-2 px-2.5">Payment Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDrillInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-2.5 whitespace-nowrap text-slate-500 font-mono">{inv.date}</td>
                        <td className="py-2 px-2.5 font-mono font-semibold text-purple-600 dark:text-purple-400">{inv.invoice_no}</td>
                        <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{inv.clinic_name}</span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-800 dark:text-slate-200">{inv.client_name}</td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums text-slate-500">{formatINR(inv.amount)}</td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">{formatINR(inv.balance)}</td>
                        <td className="py-2 px-2.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-500">{inv.mode_of_payment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/30">
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

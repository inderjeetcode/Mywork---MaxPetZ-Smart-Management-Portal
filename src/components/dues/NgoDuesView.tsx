import React, { useState } from 'react';
import { 
  Building, 
  IndianRupee, 
  Receipt, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  ArrowUpRight, 
  X,
  Search,
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
import { useDues } from '../../context/DuesContext';
import { NGOAnalyticsSummary, Invoice } from '../../types';
import { formatINR, formatIndianNumber, exportToCSV } from '../../utils/formatters';

export const NgoDuesView: React.FC = () => {
  const { ngoSummaries, ngoOutstanding, filteredInvoices, ngos } = useDues();
  const [selectedNgo, setSelectedNgo] = useState<NGOAnalyticsSummary | null>(null);
  const [drillSearch, setDrillSearch] = useState('');

  // Calculations for NGO KPIs
  const totalNgoInvoices = ngoSummaries.reduce((acc, curr) => acc + curr.invoice_count, 0);
  const totalNgoBilled = ngoSummaries.reduce((acc, curr) => acc + curr.total_amount, 0);
  const totalDueNgoBills = ngoSummaries.reduce((acc, curr) => acc + curr.outstanding_invoice_count, 0);
  const avgNgoOutstanding = totalDueNgoBills > 0 ? ngoOutstanding / totalDueNgoBills : 0;
  const highestNgo = ngoSummaries[0] || null;

  // Selected NGO Invoices
  const selectedInvoices = selectedNgo
    ? filteredInvoices.filter(
        i =>
          i.client_type === 'NGO' &&
          i.client_id &&
          i.client_id.trim().toUpperCase() === selectedNgo.client_id.trim().toUpperCase()
      )
    : [];

  const filteredSelectedInvoices = selectedInvoices.filter(i => {
    if (!drillSearch) return true;
    const q = drillSearch.toLowerCase();
    return (
      i.invoice_no.toLowerCase().includes(q) ||
      i.client_name.toLowerCase().includes(q) ||
      i.clinic_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Editorial Header */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>NGO Financial Intelligence:</strong> Dedicated outstanding tracking for registered animal welfare partner organizations. Classified automatically via Client ID.
          </span>
        </div>
        <span className="font-mono text-emerald-700 dark:text-emerald-400">
          {ngoSummaries.length} NGOs in Filtered Scope
        </span>
      </div>

      {/* 6 Executive KPI Cards for NGO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Total NGO Outstanding</div>
          <div className="text-xl font-bold font-mono text-red-600 dark:text-red-400">
            {formatINR(ngoOutstanding)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Total NGO Billed</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(totalNgoBilled)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Registered NGOs</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {ngos.length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Total NGO Bills</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {totalNgoInvoices}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Average Due / Bill</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(avgNgoOutstanding)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Highest Due NGO</div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {highestNgo?.ngo_name || '—'}
          </div>
          <div className="text-xs font-mono font-bold text-red-600 dark:text-red-400 mt-0.5">
            {highestNgo ? formatINR(highestNgo.total_outstanding) : '₹0.00'}
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      {ngoSummaries.length > 0 && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
            <span>NGO Outstanding Comparison</span>
            <span className="text-[11px] text-slate-400 font-normal">Amounts in INR (₹)</span>
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ngoSummaries.slice(0, 10).map(s => ({
                  name: s.ngo_name,
                  outstanding: s.total_outstanding,
                }))}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis fontSize={11} tickFormatter={val => `₹${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any) => [formatINR(Number(val) || 0), 'Outstanding Balance']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="outstanding" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* NGO Ledger Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              NGO Outstanding Portfolio Breakdown
            </h3>
            <p className="text-[11px] text-slate-500">
              Ranked in descending order by outstanding due balance. Click any row to view individual bills.
            </p>
          </div>
          <button
            onClick={() => exportToCSV(ngoSummaries, 'MaxPetZ_NGO_Dues_Report')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">NGO Name</th>
                <th className="py-2.5 px-3">Client ID</th>
                <th className="py-2.5 px-3 text-right">Total Outstanding</th>
                <th className="py-2.5 px-3 text-right">Total Billed</th>
                <th className="py-2.5 px-3 text-right">Due Bills</th>
                <th className="py-2.5 px-3 text-right">Avg / Bill</th>
                <th className="py-2.5 px-3">Hospital Branches</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {ngoSummaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No NGO invoices or registered NGOs found matching your filters.
                  </td>
                </tr>
              ) : (
                ngoSummaries.map(ngo => (
                  <tr
                    key={ngo.client_id}
                    onClick={() => setSelectedNgo(ngo)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{ngo.ngo_name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {ngo.client_id}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-red-600 dark:text-red-400">
                      {formatINR(ngo.total_outstanding)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {formatINR(ngo.total_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {formatIndianNumber(ngo.outstanding_invoice_count)} / {ngo.invoice_count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {formatINR(ngo.avg_outstanding)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                      {ngo.clinics.join(', ') || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                        {ngo.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mx-auto text-[11px] font-semibold">
                        <span>Ledger</span>
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

      {/* Drilldown Modal */}
      {selectedNgo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{selectedNgo.ngo_name}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                      ID: {selectedNgo.client_id}
                    </span>
                  </h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                    <span>Outstanding: <strong className="font-mono text-red-600">{formatINR(selectedNgo.total_outstanding)}</strong></span>
                    <span>·</span>
                    <span>Invoices: <strong className="font-mono">{selectedInvoices.length}</strong></span>
                  </div>
                </div>
              </div>

              <button onClick={() => setSelectedNgo(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="relative max-w-xs flex-1">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoice number or case..."
                    value={drillSearch}
                    onChange={e => setDrillSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <button
                  onClick={() => exportToCSV(selectedInvoices, `${selectedNgo.ngo_name}_Invoices`)}
                  className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Export Invoices
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Invoice No</th>
                      <th className="py-2 px-2.5">Client / Case</th>
                      <th className="py-2 px-2.5">Clinic Branch</th>
                      <th className="py-2 px-2.5">Staff</th>
                      <th className="py-2 px-2.5 text-right">Invoice Amt</th>
                      <th className="py-2 px-2.5 text-right">Balance Due</th>
                      <th className="py-2 px-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSelectedInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-2.5 font-mono text-slate-500 whitespace-nowrap">{inv.date}</td>
                        <td className="py-2 px-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">{inv.invoice_no}</td>
                        <td className="py-2 px-2.5 text-slate-800 dark:text-slate-200">{inv.client_name}</td>
                        <td className="py-2 px-2.5 text-slate-600 dark:text-slate-400">{inv.clinic_name}</td>
                        <td className="py-2 px-2.5 text-slate-500">{inv.user_name}</td>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-500">{formatINR(inv.amount)}</td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-red-600 dark:text-red-400">{formatINR(inv.balance)}</td>
                        <td className="py-2 px-2.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/40">
              <button
                onClick={() => setSelectedNgo(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

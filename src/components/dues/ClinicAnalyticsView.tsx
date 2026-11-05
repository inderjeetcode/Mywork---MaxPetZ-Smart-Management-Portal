import React, { useState } from 'react';
import { 
  Building2, 
  ArrowUpRight, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  Download,
  Users,
  Search
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { ClinicAnalyticsSummary, Invoice } from '../../types';
import { formatINR, formatIndianNumber, formatPercent, exportToCSV } from '../../utils/formatters';

interface ClinicAnalyticsViewProps {
  clinics: ClinicAnalyticsSummary[];
  allInvoices: Invoice[];
}

const RISK_COLORS = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

export const ClinicAnalyticsView: React.FC<ClinicAnalyticsViewProps> = ({
  clinics,
  allInvoices,
}) => {
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);
  const [drillSearch, setDrillSearch] = useState('');

  // Selected clinic drill-down data
  const clinicInvoices = selectedClinic
    ? allInvoices.filter(i => i.clinic_name === selectedClinic)
    : [];

  const filteredDrillInvoices = clinicInvoices.filter(i => {
    if (!drillSearch) return true;
    const q = drillSearch.toLowerCase();
    return (
      i.invoice_no.toLowerCase().includes(q) ||
      i.client_name.toLowerCase().includes(q) ||
      i.user_name.toLowerCase().includes(q)
    );
  });

  const selectedClinicMeta = clinics.find(c => c.clinic_name === selectedClinic);

  // Staff breakdown for selected clinic
  const clinicStaffBreakdown = React.useMemo(() => {
    if (!selectedClinic) return [];
    const map = new Map<string, { totalDue: number; count: number }>();
    clinicInvoices.forEach(i => {
      const staff = i.user_name || 'Unassigned';
      const bal = Number(i.balance) || 0;
      if (!map.has(staff)) map.set(staff, { totalDue: 0, count: 0 });
      const rec = map.get(staff)!;
      rec.totalDue += bal;
      rec.count += 1;
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalDue - a.totalDue);
  }, [selectedClinic, clinicInvoices]);

  return (
    <div className="space-y-5">
      {/* Risk Notice Header */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>Management Notice:</strong> Risk indicators (High / Medium / Low) reflect cumulative branch outstanding exposure thresholds, not customer credit risk scores.
          </span>
        </div>
        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
          {clinics.length} Hospital Branches Active
        </span>
      </div>

      {/* Visual Analytics Charts */}
      {clinics.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar Chart: Clinic-wise Outstanding Comparison */}
          <div className="lg:col-span-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
              <span>Clinic-Wise Outstanding Balance Comparison</span>
              <span className="text-[11px] text-slate-400 font-normal">Amounts in INR (₹)</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={clinics.slice(0, 8).map(c => ({
                    name: c.clinic_name.replace('MaxPetZ - ', ''),
                    amount: c.total_outstanding,
                  }))}
                  margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                  <YAxis fontSize={11} tickFormatter={val => `₹${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(val: any) => [formatINR(Number(val) || 0), 'Outstanding Due']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart: Percentage Contribution */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Due Contribution by Clinic
            </h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clinics.slice(0, 6)}
                    dataKey="total_outstanding"
                    nameKey="clinic_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {clinics.slice(0, 6).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(val: any) => [formatINR(Number(val) || 0), 'Outstanding']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Clinic Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Hospital Branch Outstanding Portfolio
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click any clinic row to drill down into its invoice ledger and staff exposure.
            </p>
          </div>
          <button
            onClick={() => exportToCSV(clinics, 'MaxPetZ_Clinic_Analytics')}
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
                <th className="py-2.5 px-3">Clinic Name</th>
                <th className="py-2.5 px-3 text-right">Total Outstanding</th>
                <th className="py-2.5 px-3 text-right">Total Billed</th>
                <th className="py-2.5 px-3 text-right">Due Bills</th>
                <th className="py-2.5 px-3 text-right">Avg / Bill</th>
                <th className="py-2.5 px-3 text-right">% Share</th>
                <th className="py-2.5 px-3 text-right">Clients</th>
                <th className="py-2.5 px-3 text-right">Max Single Due</th>
                <th className="py-2.5 px-3 text-center">Exposure Risk</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {clinics.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No clinic records found for current filters.
                  </td>
                </tr>
              ) : (
                clinics.map(clinic => (
                  <tr
                    key={clinic.clinic_name}
                    onClick={() => setSelectedClinic(clinic.clinic_name)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{clinic.clinic_name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-red-600 dark:text-red-400">
                      {formatINR(clinic.total_outstanding)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {formatINR(clinic.total_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {formatIndianNumber(clinic.outstanding_invoice_count)} / {clinic.invoice_count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {formatINR(clinic.avg_outstanding)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                      {formatPercent(clinic.percentage_contribution)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {clinic.unique_clients}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {formatINR(clinic.highest_invoice)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase"
                        style={{
                          backgroundColor: `${RISK_COLORS[clinic.risk_level]}15`,
                          color: RISK_COLORS[clinic.risk_level],
                        }}
                      >
                        {clinic.risk_level === 'high' && <AlertTriangle className="w-2.5 h-2.5" />}
                        {clinic.risk_level === 'low' && <ShieldCheck className="w-2.5 h-2.5" />}
                        {clinic.risk_level} Risk
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto text-[11px] font-semibold">
                        <span>Drilldown</span>
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

      {/* Drill-down Modal for Selected Clinic */}
      {selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedClinic} — Detailed Dues Ledger
                  </h2>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                    <span>Outstanding: <strong className="text-red-600 dark:text-red-400 font-mono">{formatINR(selectedClinicMeta?.total_outstanding)}</strong></span>
                    <span>·</span>
                    <span>Total Invoices: <strong className="font-mono">{clinicInvoices.length}</strong></span>
                    <span>·</span>
                    <span>Contribution: <strong className="font-mono">{formatPercent(selectedClinicMeta?.percentage_contribution)}</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedClinic(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Staff Exposure Grid for this Clinic */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>Staff / Doctor Dues Exposure at this Branch</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {clinicStaffBreakdown.map(staff => (
                    <div
                      key={staff.name}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{staff.name}</div>
                        <div className="text-[11px] text-slate-400">{staff.count} associated invoices</div>
                      </div>
                      <div className="font-mono tabular-nums font-bold text-red-600 dark:text-red-400">
                        {formatINR(staff.totalDue)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoices List with Search */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Associated Invoices ({filteredDrillInvoices.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search invoice or client..."
                        value={drillSearch}
                        onChange={e => setDrillSearch(e.target.value)}
                        className="pl-8 pr-2.5 py-1 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <button
                      onClick={() => exportToCSV(filteredDrillInvoices, `${selectedClinic}_invoices`)}
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
                        <th className="py-2 px-2.5">Client Name</th>
                        <th className="py-2 px-2.5">Doctor / Staff</th>
                        <th className="py-2 px-2.5 text-right">Original Amt</th>
                        <th className="py-2 px-2.5 text-right">Balance Due</th>
                        <th className="py-2 px-2.5">Status</th>
                        <th className="py-2 px-2.5">Payment Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredDrillInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-2.5 whitespace-nowrap text-slate-500 font-mono">{inv.date}</td>
                          <td className="py-2 px-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{inv.invoice_no}</td>
                          <td className="py-2 px-2.5 text-slate-800 dark:text-slate-200">{inv.client_name}</td>
                          <td className="py-2 px-2.5 text-slate-600 dark:text-slate-400">{inv.user_name}</td>
                          <td className="py-2 px-2.5 text-right font-mono tabular-nums text-slate-500">{formatINR(inv.amount)}</td>
                          <td className="py-2 px-2.5 text-right font-mono tabular-nums font-bold text-red-600 dark:text-red-400">{formatINR(inv.balance)}</td>
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
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/30">
              <button
                onClick={() => setSelectedClinic(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50"
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

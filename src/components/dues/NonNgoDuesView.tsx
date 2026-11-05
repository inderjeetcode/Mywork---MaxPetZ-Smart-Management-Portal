import React, { useState, useMemo } from 'react';
import { 
  Users, 
  IndianRupee, 
  Receipt, 
  Search, 
  Download, 
  FileSpreadsheet, 
  Building2, 
  Calendar 
} from 'lucide-react';
import { useDues } from '../../context/DuesContext';
import { formatINR, formatDate, exportToExcel, exportToCSV } from '../../utils/formatters';

export const NonNgoDuesView: React.FC = () => {
  const { filteredInvoices, nonNgoOutstanding } = useDues();
  const [searchTerm, setSearchTerm] = useState('');
  const [clientIdFilter, setClientIdFilter] = useState('');

  // Filter only NON_NGO invoices
  const nonNgoInvoices = useMemo(() => {
    return filteredInvoices.filter(i => (i.client_type || 'NON_NGO') === 'NON_NGO');
  }, [filteredInvoices]);

  // Client-wise metrics
  const { totalBilled, uniqueClientsCount, filteredList } = useMemo(() => {
    let billed = 0;
    const clientSet = new Set<string>();

    const matches = nonNgoInvoices.filter(inv => {
      billed += Number(inv.amount) || 0;
      if (inv.client_id) clientSet.add(inv.client_id);
      else if (inv.client_name) clientSet.add(inv.client_name);

      if (clientIdFilter) {
        if (!inv.client_id || !inv.client_id.toLowerCase().includes(clientIdFilter.toLowerCase())) {
          return false;
        }
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          inv.client_name.toLowerCase().includes(q) ||
          inv.invoice_no.toLowerCase().includes(q) ||
          inv.clinic_name.toLowerCase().includes(q) ||
          inv.user_name.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return {
      totalBilled: billed,
      uniqueClientsCount: clientSet.size,
      filteredList: matches,
    };
  }, [nonNgoInvoices, searchTerm, clientIdFilter]);

  const avgOutstandingPerClient =
    uniqueClientsCount > 0 ? nonNgoOutstanding / uniqueClientsCount : 0;

  return (
    <div className="space-y-5">
      {/* Editorial Header */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Non-NGO Retail Dues Intelligence:</strong> Comprehensive dues analytics for private pet parents and retail hospital clients.
          </span>
        </div>
        <span className="font-mono text-blue-700 dark:text-blue-400">
          {nonNgoInvoices.length} Retail Invoices
        </span>
      </div>

      {/* 5 KPI Cards for Non-NGO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Total Non-NGO Due</div>
          <div className="text-xl font-bold font-mono text-red-600 dark:text-red-400">
            {formatINR(nonNgoOutstanding)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Total Billed Volume</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(totalBilled)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Unique Retail Clients</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {uniqueClientsCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Non-NGO Invoices</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {nonNgoInvoices.length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Avg Due / Client</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(avgOutstandingPerClient)}
          </div>
        </div>
      </div>

      {/* Control Bar: Search by Client ID & General Text */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search client name, invoice number, clinic..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="w-44">
            <input
              type="text"
              placeholder="Filter Client ID..."
              value={clientIdFilter}
              onChange={e => setClientIdFilter(e.target.value)}
              className="w-full px-3 py-1.5 font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(filteredList, 'MaxPetZ_Non_NGO_Invoices')}
            className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-200 dark:border-emerald-800"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => exportToCSV(filteredList, 'MaxPetZ_Non_NGO_Invoices')}
            className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Non-NGO Client Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Invoice No.</th>
                <th className="py-2.5 px-3">Client ID</th>
                <th className="py-2.5 px-3">Client Name</th>
                <th className="py-2.5 px-3">Clinic</th>
                <th className="py-2.5 px-3">Doctor / Staff</th>
                <th className="py-2.5 px-3 text-right">Invoice Amount</th>
                <th className="py-2.5 px-3 text-right">Balance Due</th>
                <th className="py-2.5 px-3">Payment Mode</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No Non-NGO client records found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{formatDate(inv.date)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoice_no}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{inv.client_id || '—'}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{inv.client_name}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{inv.clinic_name}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{inv.user_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatINR(inv.amount)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600 dark:text-red-400">
                      {formatINR(inv.balance)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{inv.mode_of_payment}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
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
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Building2, 
  Eye, 
  X, 
  FileText 
} from 'lucide-react';
import { useDues } from '../../context/DuesContext';
import { formatINR, formatIndianNumber, exportToCSV } from '../../utils/formatters';
import { Invoice } from '../../types';

interface ClientRecord {
  key: string;
  client_id: string | null;
  client_name: string;
  client_type: 'NGO' | 'NON_NGO' | 'UNCLASSIFIED';
  ngo_name?: string | null;
  total_invoices: number;
  total_billed: number;
  total_outstanding: number;
  clinics: string[];
}

export const ClientManagementView: React.FC = () => {
  const { filteredInvoices } = useDues();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);

  // Group invoices by client
  const clientsList = useMemo(() => {
    const map = new Map<string, ClientRecord>();

    filteredInvoices.forEach(inv => {
      const key = inv.client_id
        ? `ID_${inv.client_id.trim().toUpperCase()}`
        : `NAME_${inv.client_name.trim().toLowerCase()}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          client_id: inv.client_id || null,
          client_name: inv.client_name,
          client_type: inv.client_type || 'UNCLASSIFIED',
          ngo_name: inv.ngo_name,
          total_invoices: 0,
          total_billed: 0,
          total_outstanding: 0,
          clinics: [],
        });
      }

      const rec = map.get(key)!;
      rec.total_invoices += 1;
      rec.total_billed += Number(inv.amount) || 0;
      rec.total_outstanding += Number(inv.balance) || 0;
      if (inv.clinic_name && !rec.clinics.includes(inv.clinic_name)) {
        rec.clinics.push(inv.clinic_name);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total_outstanding - a.total_outstanding);
  }, [filteredInvoices]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clientsList;
    const q = searchTerm.toLowerCase();
    return clientsList.filter(
      c =>
        c.client_name.toLowerCase().includes(q) ||
        (c.client_id && c.client_id.toLowerCase().includes(q)) ||
        (c.ngo_name && c.ngo_name.toLowerCase().includes(q))
    );
  }, [clientsList, searchTerm]);

  // Selected client bills
  const selectedClientBills = useMemo(() => {
    if (!selectedClientKey) return [];
    return filteredInvoices.filter(inv => {
      const key = inv.client_id
        ? `ID_${inv.client_id.trim().toUpperCase()}`
        : `NAME_${inv.client_name.trim().toLowerCase()}`;
      return key === selectedClientKey;
    });
  }, [selectedClientKey, filteredInvoices]);

  const selectedClient = clientsList.find(c => c.key === selectedClientKey);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Hospital Client Directory & Receivables</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 font-semibold">
              {clientsList.length} Unique Clients
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified view of all clients across hospital branches, indexed by Client ID with individual debt exposure.
          </p>
        </div>

        <button
          onClick={() => exportToCSV(clientsList, 'MaxPetZ_Client_Directory')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Directory</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Client ID, Client Name, or NGO Name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredClients.length} of {clientsList.length}
        </span>
      </div>

      {/* Clients Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Client ID</th>
                <th className="py-2.5 px-3">Client Name</th>
                <th className="py-2.5 px-3 text-center">Type</th>
                <th className="py-2.5 px-3">Associated Clinics</th>
                <th className="py-2.5 px-3 text-right">Invoices</th>
                <th className="py-2.5 px-3 text-right">Total Billed</th>
                <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No clients found matching query.
                  </td>
                </tr>
              ) : (
                filteredClients.map(c => (
                  <tr
                    key={c.key}
                    onClick={() => setSelectedClientKey(c.key)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {c.client_id || <span className="text-slate-400 font-normal">Unassigned</span>}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                      {c.client_name}
                      {c.ngo_name && (
                        <div className="text-[10px] text-emerald-600 font-normal">
                          Linked NGO: {c.ngo_name}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          c.client_type === 'NGO'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                            : c.client_type === 'NON_NGO'
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600'
                            : 'bg-amber-50 dark:bg-amber-950 text-amber-600'
                        }`}
                      >
                        {c.client_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                      {c.clinics.join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{c.total_invoices}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatINR(c.total_billed)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600 dark:text-red-400">
                      {formatINR(c.total_outstanding)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button className="text-blue-600 hover:underline text-[11px] font-semibold">
                        View Bills
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Bills Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {selectedClient.client_name}
                </h3>
                <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                  <span>Client ID: <strong className="font-mono">{selectedClient.client_id || 'None'}</strong></span>
                  <span>·</span>
                  <span>Total Invoices: <strong className="font-mono">{selectedClientBills.length}</strong></span>
                  <span>·</span>
                  <span>Outstanding: <strong className="font-mono text-red-600">{formatINR(selectedClient.total_outstanding)}</strong></span>
                </div>
              </div>
              <button onClick={() => setSelectedClientKey(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Invoice No</th>
                    <th className="py-2 px-2.5">Clinic</th>
                    <th className="py-2 px-2.5">Staff</th>
                    <th className="py-2 px-2.5 text-right">Billed Amt</th>
                    <th className="py-2 px-2.5 text-right">Balance Due</th>
                    <th className="py-2 px-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedClientBills.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-2.5 font-mono text-slate-500 whitespace-nowrap">{inv.date}</td>
                      <td className="py-2 px-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoice_no}</td>
                      <td className="py-2 px-2.5 text-slate-600 dark:text-slate-400">{inv.clinic_name}</td>
                      <td className="py-2 px-2.5 text-slate-500">{inv.user_name}</td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-500">{formatINR(inv.amount)}</td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-red-600 dark:text-red-400">{formatINR(inv.balance)}</td>
                      <td className="py-2 px-2.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/40">
              <button
                onClick={() => setSelectedClientKey(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

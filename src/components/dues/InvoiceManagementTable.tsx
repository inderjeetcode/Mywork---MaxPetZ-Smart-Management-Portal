import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Download, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X,
  FileSpreadsheet,
  Building2,
  User,
  Calendar,
  CreditCard,
  HeartHandshake,
  Tag
} from 'lucide-react';
import { Invoice } from '../../types';
import { formatINR, formatDate, exportToExcel, exportToCSV } from '../../utils/formatters';

interface InvoiceManagementTableProps {
  invoices: Invoice[];
}

type SortField = 'date' | 'invoice_no' | 'client_id' | 'client_name' | 'clinic_name' | 'user_name' | 'amount' | 'return_amount' | 'sold_amount' | 'balance';
type SortOrder = 'asc' | 'desc';

export const InvoiceManagementTable: React.FC<InvoiceManagementTableProps> = ({ invoices }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState<'ALL' | 'NGO' | 'NON_NGO' | 'UNCLASSIFIED'>('ALL');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Filtered & Sorted Invoices
  const processedInvoices = useMemo(() => {
    let result = [...invoices];

    if (clientTypeFilter !== 'ALL') {
      result = result.filter(i => (i.client_type || 'UNCLASSIFIED') === clientTypeFilter);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        i =>
          i.invoice_no.toLowerCase().includes(q) ||
          (i.client_id && i.client_id.toLowerCase().includes(q)) ||
          i.client_name.toLowerCase().includes(q) ||
          (i.ngo_name && i.ngo_name.toLowerCase().includes(q)) ||
          i.clinic_name.toLowerCase().includes(q) ||
          i.user_name.toLowerCase().includes(q) ||
          i.invoice_type.toLowerCase().includes(q) ||
          i.mode_of_payment.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'amount' || sortField === 'balance' || sortField === 'return_amount' || sortField === 'sold_amount') {
        comparison = (Number(a[sortField]) || 0) - (Number(b[sortField]) || 0);
      } else {
        const valA = String(a[sortField] || '').toLowerCase();
        const valB = String(b[sortField] || '').toLowerCase();
        comparison = valA.localeCompare(valB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [invoices, searchTerm, clientTypeFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedInvoices.length / pageSize));
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedInvoices.slice(start, start + pageSize);
  }, [processedInvoices, currentPage, pageSize]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 ml-1 inline" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-1 inline" />
    );
  };

  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      {/* Control Bar: Search, Type Quick Filter & Exports */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Client ID, invoice no., NGO, client, clinic, staff..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={clientTypeFilter}
            onChange={e => {
              setClientTypeFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium shrink-0"
          >
            <option value="ALL">All Types</option>
            <option value="NGO">NGO Only</option>
            <option value="NON_NGO">Retail Non-NGO</option>
            <option value="UNCLASSIFIED">Unclassified</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Export to Excel */}
          <button
            onClick={() => exportToExcel(processedInvoices, 'MaxPetZ_Invoices_15Col_Report')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {/* Export to CSV */}
          <button
            onClick={() => exportToCSV(processedInvoices, 'MaxPetZ_Invoices_15Col_Report')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Page size dropdown */}
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
          >
            <option value={15}>15 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>
      </div>

      {/* Main 15-Column Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th onClick={() => handleSort('date')} className="py-2.5 px-3 cursor-pointer select-none whitespace-nowrap">
                <span>Date</span>
                {renderSortIcon('date')}
              </th>
              <th onClick={() => handleSort('invoice_no')} className="py-2.5 px-3 cursor-pointer select-none whitespace-nowrap">
                <span>Invoice No.</span>
                {renderSortIcon('invoice_no')}
              </th>
              <th onClick={() => handleSort('client_id')} className="py-2.5 px-3 cursor-pointer select-none whitespace-nowrap">
                <span>Client ID</span>
                {renderSortIcon('client_id')}
              </th>
              <th onClick={() => handleSort('client_name')} className="py-2.5 px-3 cursor-pointer select-none">
                <span>Client Name</span>
                {renderSortIcon('client_name')}
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">Client Type</th>
              <th className="py-2.5 px-3">NGO Name</th>
              <th onClick={() => handleSort('clinic_name')} className="py-2.5 px-3 cursor-pointer select-none">
                <span>Hospital Clinic</span>
                {renderSortIcon('clinic_name')}
              </th>
              <th onClick={() => handleSort('user_name')} className="py-2.5 px-3 cursor-pointer select-none">
                <span>Staff / Doctor</span>
                {renderSortIcon('user_name')}
              </th>
              <th className="py-2.5 px-3">Invoice Type</th>
              <th onClick={() => handleSort('amount')} className="py-2.5 px-3 text-right cursor-pointer select-none whitespace-nowrap">
                <span>Billed Amt</span>
                {renderSortIcon('amount')}
              </th>
              <th onClick={() => handleSort('return_amount')} className="py-2.5 px-3 text-right cursor-pointer select-none whitespace-nowrap">
                <span>Return</span>
                {renderSortIcon('return_amount')}
              </th>
              <th onClick={() => handleSort('sold_amount')} className="py-2.5 px-3 text-right cursor-pointer select-none whitespace-nowrap">
                <span>Sold</span>
                {renderSortIcon('sold_amount')}
              </th>
              <th onClick={() => handleSort('balance')} className="py-2.5 px-3 text-right cursor-pointer select-none whitespace-nowrap">
                <span>Balance Due</span>
                {renderSortIcon('balance')}
              </th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3">Payment Mode</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={16} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span>No invoices found matching your filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedInvoices.map(inv => {
                const bal = Number(inv.balance) || 0;
                const isHighDue = bal >= 25000;
                const isMediumDue = bal >= 5000 && bal < 25000;
                const isZeroDue = bal <= 0;
                const clientType = inv.client_type || 'UNCLASSIFIED';

                return (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      isHighDue ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(inv.date)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {inv.invoice_no}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {inv.client_id || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 max-w-[160px] truncate" title={inv.client_name}>
                      {inv.client_name}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          clientType === 'NGO'
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : clientType === 'NON_NGO'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {clientType === 'NON_NGO' ? 'Retail' : clientType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[140px] truncate" title={inv.ngo_name || '—'}>
                      {inv.ngo_name ? (
                        <span className="font-semibold text-purple-700 dark:text-purple-300">{inv.ngo_name}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[140px] truncate" title={inv.clinic_name}>
                      {inv.clinic_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[120px] truncate" title={inv.user_name}>
                      {inv.user_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[120px] truncate" title={inv.invoice_type}>
                      {inv.invoice_type}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {formatINR(inv.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                      {inv.return_amount ? formatINR(inv.return_amount) : '₹0.00'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {inv.sold_amount ? formatINR(inv.sold_amount) : formatINR(inv.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold">
                      <span
                        className={
                          isHighDue
                            ? 'text-red-600 dark:text-red-400'
                            : isMediumDue
                            ? 'text-amber-600 dark:text-amber-400'
                            : isZeroDue
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200'
                        }
                      >
                        {formatINR(inv.balance)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isZeroDue
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : isHighDue
                            ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {inv.status || (isZeroDue ? 'Paid' : 'Unpaid')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[110px] truncate" title={inv.mode_of_payment}>
                      {inv.mode_of_payment || 'Pending'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedInvoice(inv);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="View invoice details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing{' '}
          <strong className="text-slate-800 dark:text-slate-200 font-mono">
            {processedInvoices.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </strong>{' '}
          to{' '}
          <strong className="text-slate-800 dark:text-slate-200 font-mono">
            {Math.min(currentPage * pageSize, processedInvoices.length)}
          </strong>{' '}
          of <strong className="text-slate-800 dark:text-slate-200 font-mono">{processedInvoices.length}</strong> records
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden text-xs">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">
                  {selectedInvoice.invoice_no}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                  {selectedInvoice.status}
                </span>
                {selectedInvoice.client_type === 'NGO' && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                    <HeartHandshake className="w-3 h-3" />
                    NGO
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Billed Amount</div>
                  <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {formatINR(selectedInvoice.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Sold / Return</div>
                  <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 mt-0.5">
                    Sold: {formatINR(selectedInvoice.sold_amount || selectedInvoice.amount)}
                    <br />
                    Ret: {formatINR(selectedInvoice.return_amount || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Outstanding Due</div>
                  <div className="text-sm font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
                    {formatINR(selectedInvoice.balance)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Client ID:
                  </span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {selectedInvoice.client_id || 'Not Assigned'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Client Name:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedInvoice.client_name}</span>
                </div>

                {selectedInvoice.ngo_name && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-purple-500" /> Linked NGO:
                    </span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">{selectedInvoice.ngo_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Clinic Branch:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedInvoice.clinic_name}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Staff / Doctor:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedInvoice.user_name}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Invoice Date:
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{formatDate(selectedInvoice.date)}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Invoice Type:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedInvoice.invoice_type}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Mode of Payment:
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedInvoice.mode_of_payment}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/40">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
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


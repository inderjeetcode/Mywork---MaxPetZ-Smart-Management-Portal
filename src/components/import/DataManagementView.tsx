import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Clipboard, 
  Check, 
  AlertTriangle, 
  Trash2, 
  Download, 
  X, 
  ArrowRight,
  Database,
  FileCheck,
  History,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useDues } from '../../context/DuesContext';
import { 
  parseSpreadsheetData, 
  validateImportRows, 
  ColumnMapping, 
  ParseResult, 
  ValidatedRow 
} from '../../services/importService';
import { downloadSampleExcelTemplate } from '../../services/sampleDataService';
import { DuplicateInvoiceResolution } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';

export const DataManagementView: React.FC = () => {
  const { 
    invoices, 
    importBatches, 
    ngos,
    checkDuplicates, 
    commitImport, 
    loadSampleDuesData, 
    deleteImportBatch, 
    clearAllDuesData 
  } = useDues();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'history'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Staged parsing state
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    date: 'Date',
    status: 'Status',
    client_id: 'Clientid',
    client_name: 'Client',
    user_name: 'User',
    invoice_type: 'Invoice type',
    invoice_no: 'InvNo',
    amount: 'Invoice Amount',
    balance: 'Balance (As of now)',
    return_amount: 'Return',
    sold_amount: 'Sold',
    mode_of_payment: 'Mode of payment',
    clinic_name: 'Clinic',
    inv_year: 'Inv Year',
    inv_month: 'Inv Month',
    email: 'Email',
    mobile: 'Mobile',
    home: 'Home',
  });

  // Staged duplicate resolution modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [stagedDuplicates, setStagedDuplicates] = useState<DuplicateInvoiceResolution[]>([]);
  const [stagedUniqueInvoices, setStagedUniqueInvoices] = useState<ValidatedRow[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle incoming file
  const handleFile = async (file: File) => {
    setUploadError(null);
    setFileName(file.name);
    setFileSize(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseSpreadsheetData(buffer);
      setParsedData(result);

      // Merge detected mapping with defaults
      setColumnMapping(prev => ({
        ...prev,
        ...result.detectedMapping,
      }));
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to parse file. Please ensure it is a valid Excel or CSV.');
    }
  };

  // Handle Drag & Drop
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Paste parsing
  const handlePasteProcess = () => {
    if (!pasteContent.trim()) return;
    setUploadError(null);
    setFileName('Pasted_Clipboard_Data.tsv');
    setFileSize(pasteContent.length);

    try {
      const result = parseSpreadsheetData(pasteContent);
      setParsedData(result);
      setColumnMapping(prev => ({
        ...prev,
        ...result.detectedMapping,
      }));
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Could not parse pasted data. Please copy a table from Excel.');
    }
  };

  // Run validation and duplicate check before committing
  const handleInitiateValidation = () => {
    if (!parsedData) return;

    const validated = validateImportRows(parsedData.rawRows, columnMapping, ngos);
    const validRows = validated.filter(r => r.isValid);

    if (validRows.length === 0) {
      setUploadError('No valid rows found in file. Please verify column mapping.');
      return;
    }

    const { duplicates, uniqueInvoices } = checkDuplicates(validRows.map(v => v.data));

    if (duplicates.length > 0) {
      // Prompt user with Duplicate Resolution Modal as clarified in Phase 1
      setStagedDuplicates(duplicates);
      setStagedUniqueInvoices(validRows.filter(r => 
        !duplicates.some(d => d.invoice.invoice_no === r.data.invoice_no && d.invoice.clinic_name === r.data.clinic_name)
      ));
      setDuplicateModalOpen(true);
    } else {
      // Proceed directly
      executeCommit(validRows.map(r => r.data), [], 0);
    }
  };

  // Commit execution
  const executeCommit = async (
    inserts: typeof stagedDuplicates[0]['invoice'][],
    updates: { id: string; data: Partial<typeof stagedDuplicates[0]['invoice']> }[],
    skippedCount: number
  ) => {
    setImporting(true);
    const res = await commitImport(inserts, updates, {
      fileName: fileName || 'Imported_Data.xlsx',
      fileSize: fileSize || 1024,
      totalRows: parsedData?.rawRows.length || (inserts.length + updates.length + skippedCount),
      skippedCount,
    });
    setImporting(false);

    if (res.success) {
      setDuplicateModalOpen(false);
      setParsedData(null);
      setPasteContent('');
      setActiveTab('history');
    } else {
      setUploadError(res.error || 'Failed to commit import records.');
    }
  };

  // Finalize duplicate choices
  const handleFinalizeDuplicates = () => {
    const toInsert = [...stagedUniqueInvoices.map(r => r.data)];
    const toUpdate: { id: string; data: Partial<typeof stagedDuplicates[0]['invoice']> }[] = [];
    let skipped = 0;

    stagedDuplicates.forEach(d => {
      if (d.action === 'update') {
        toUpdate.push({ id: d.existingId, data: d.invoice });
      } else {
        skipped += 1;
      }
    });

    executeCommit(toInsert, toUpdate, skipped);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Template Download */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Hospital Dues Data Management & Staged Importer</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ingest monthly dues reports from Excel, CSV, or direct clipboard copy. Automatic column detection, duplicate resolution, and historical batch tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Load Sample Data Button */}
          <button
            onClick={() => loadSampleDuesData()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/70 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Load Sample October Dues</span>
          </button>

          {/* Download Template */}
          <button
            onClick={downloadSampleExcelTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Template</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'upload'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload File (XLSX, XLS, CSV)</span>
        </button>

        <button
          onClick={() => setActiveTab('paste')}
          className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'paste'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clipboard className="w-4 h-4" />
          <span>Copy-Paste Spreadsheet</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Import Batches & Audit History ({importBatches.length})</span>
        </button>
      </div>

      {uploadError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="p-1 hover:text-red-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tab 1: File Upload */}
      {activeTab === 'upload' && !parsedData && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-10 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-900'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Drag & drop your monthly Dues Excel or CSV here
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Supports .xlsx, .xls, and .csv files. Columns will be automatically matched to the 10 standard dues headers.
          </p>
          <button
            type="button"
            className="mt-4 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
          >
            Browse Files
          </button>
        </div>
      )}

      {/* Tab 2: Copy-Paste Spreadsheet */}
      {activeTab === 'paste' && !parsedData && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Paste Tab-Separated Data Directly from Excel / Google Sheets:
          </label>
          <textarea
            rows={8}
            value={pasteContent}
            onChange={e => setPasteContent(e.target.value)}
            placeholder={`Date\tStatus\tClient Name\tInvoice Type\tInvoice No.\tAmount\tBalance\tMode of Payment\tUser\tClinic\n2026-10-02\tUnpaid\tRajesh Mehra\tSurgery\tINV-1001\t45000\t45000\tPending\tDr. Rohan\tSouth Extension`}
            className="w-full p-3 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex justify-end">
            <button
              onClick={handlePasteProcess}
              disabled={!pasteContent.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              Parse Pasted Data
            </button>
          </div>
        </div>
      )}

      {/* Staged Data Preview & Column Mapping Review */}
      {parsedData && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Staged File Preview: {fileName}
              </h3>
              <p className="text-xs text-slate-400">
                Found {parsedData.rawRows.length} rows. Verify header associations before validating.
              </p>
            </div>
            <button
              onClick={() => setParsedData(null)}
              className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              Cancel
            </button>
          </div>

          {/* Column Mapping Selector Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Column Mapping Verification
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {(Object.keys(columnMapping) as (keyof ColumnMapping)[]).map(field => (
                <div key={field} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {field.replace('_', ' ')}
                  </div>
                  <select
                    value={columnMapping[field] || ''}
                    onChange={e =>
                      setColumnMapping(prev => ({ ...prev, [field]: e.target.value }))
                    }
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                  >
                    <option value="">-- Unmapped --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* First 5 Preview Rows */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Preview (First 5 Rows)
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-2.5">Invoice No</th>
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Client</th>
                    <th className="py-2 px-2.5">Clinic</th>
                    <th className="py-2 px-2.5">User</th>
                    <th className="py-2 px-2.5 text-right">Amount</th>
                    <th className="py-2 px-2.5 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedData.rawRows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      <td className="py-1.5 px-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {String(row[columnMapping.invoice_no] || '—')}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-slate-500">
                        {String(row[columnMapping.date] || '—')}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-800 dark:text-slate-200">
                        {String(row[columnMapping.client_name] || '—')}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-600 dark:text-slate-400">
                        {String(row[columnMapping.clinic_name] || '—')}
                      </td>
                      <td className="py-1.5 px-2.5 text-slate-600 dark:text-slate-400">
                        {String(row[columnMapping.user_name] || '—')}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono">
                        {String(row[columnMapping.amount] || '0')}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-red-600 dark:text-red-400">
                        {String(row[columnMapping.balance] || '0')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setParsedData(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleInitiateValidation}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              <span>Validate & Import</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Import Batches & History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400">Total Invoices in Portal:</span>{' '}
                <strong className="font-mono text-slate-900 dark:text-slate-100">{invoices.length}</strong>
              </div>
              <div>
                <span className="text-slate-400">Total Import Batches:</span>{' '}
                <strong className="font-mono text-slate-900 dark:text-slate-100">{importBatches.length}</strong>
              </div>
            </div>

            {invoices.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Dues Data</span>
              </button>
            )}
          </div>

          {/* Batches Table */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-400">
              Audit Batches
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Batch ID</th>
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="py-2.5 px-3">Import Date</th>
                    <th className="py-2.5 px-3 text-right">Total Rows</th>
                    <th className="py-2.5 px-3 text-right">Imported</th>
                    <th className="py-2.5 px-3 text-right">Updated</th>
                    <th className="py-2.5 px-3 text-right">Skipped</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {importBatches.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No import batches found yet. Use "Upload File" to import an Excel sheet.
                      </td>
                    </tr>
                  ) : (
                    importBatches.map(batch => (
                      <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 truncate max-w-[120px]">
                          {batch.id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{batch.file_name}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {formatDate(batch.created_at)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{batch.total_rows}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {batch.imported_rows}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-blue-600 dark:text-blue-400">
                          {batch.updated_rows}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                          {batch.skipped_rows}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => deleteImportBatch(batch.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Delete this import batch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Invoice Resolution Modal (Phase 1 Choice) */}
      {duplicateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50 dark:bg-amber-950/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-amber-900 dark:text-amber-200">
                    Duplicate Invoices Detected ({stagedDuplicates.length})
                  </h3>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Existing records match the unique primary key: <strong>Invoice No. + Clinic</strong>. Choose whether to Skip or Update each record.
                  </p>
                </div>
              </div>
              <button onClick={() => setDuplicateModalOpen(false)}>
                <X className="w-4 h-4 text-amber-700" />
              </button>
            </div>

            {/* Quick Bulk Action Bar */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Apply to all duplicates:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setStagedDuplicates(prev => prev.map(d => ({ ...d, action: 'skip' })))
                  }
                  className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-semibold"
                >
                  Set All to Skip
                </button>
                <button
                  onClick={() =>
                    setStagedDuplicates(prev => prev.map(d => ({ ...d, action: 'update' })))
                  }
                  className="px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold"
                >
                  Set All to Update
                </button>
              </div>
            </div>

            {/* Duplicates Table */}
            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="py-2 px-2.5">Invoice No</th>
                    <th className="py-2 px-2.5">Clinic</th>
                    <th className="py-2 px-2.5">Client</th>
                    <th className="py-2 px-2.5 text-right">Current Due</th>
                    <th className="py-2 px-2.5 text-right">New File Due</th>
                    <th className="py-2 px-2.5 text-center">Resolution Choice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stagedDuplicates.map((dup, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {dup.invoice.invoice_no}
                      </td>
                      <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300">{dup.invoice.clinic_name}</td>
                      <td className="py-2 px-2.5 text-slate-800 dark:text-slate-200">{dup.invoice.client_name}</td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums text-slate-500">
                        {formatINR(dup.currentBalance)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums font-bold text-red-600 dark:text-red-400">
                        {formatINR(dup.newBalance)}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
                          <button
                            onClick={() =>
                              setStagedDuplicates(prev =>
                                prev.map((item, i) => (i === idx ? { ...item, action: 'skip' } : item))
                              )
                            }
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                              dup.action === 'skip'
                                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs'
                                : 'text-slate-500'
                            }`}
                          >
                            Skip
                          </button>
                          <button
                            onClick={() =>
                              setStagedDuplicates(prev =>
                                prev.map((item, i) => (i === idx ? { ...item, action: 'update' } : item))
                              )
                            }
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                              dup.action === 'update'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-500'
                            }`}
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-500">
                {stagedUniqueInvoices.length} unique records will also be imported.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setDuplicateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalizeDuplicates}
                  disabled={importing}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  {importing ? 'Importing...' : 'Commit Decisions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl text-xs space-y-3">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Permanent Deletion</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete all financial dues records from the portal?
              <br />
              <strong className="text-slate-800 dark:text-slate-200">
                Note: Deleting dues data will NEVER delete your tasks or personal notes.
              </strong>
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await clearAllDuesData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
              >
                Yes, Delete Dues Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

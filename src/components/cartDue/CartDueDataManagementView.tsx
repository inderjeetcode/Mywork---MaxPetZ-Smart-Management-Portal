import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Info, 
  FileText,
  RefreshCw,
  X
} from 'lucide-react';
import { useCartDue } from '../../context/CartDueContext';
import { 
  parseCartDueFile, 
  checkCartDueDuplicates, 
  downloadCartDueAutoFormatTemplate,
  exportCartDueRecordsToExcel,
  CartDueImportParseResult 
} from '../../services/cartDueImportService';
import { CartDueDuplicateResolution, CartDueRecord } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const CartDueDataManagementView: React.FC = () => {
  const {
    records,
    importBatches,
    commitImport,
    deleteBatch,
    deleteSelectedRecords,
    deleteAllCartDueData,
  } = useCartDue();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<CartDueImportParseResult | null>(null);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<{
    duplicates: CartDueDuplicateResolution[];
    uniqueRecords: Omit<CartDueRecord, 'id'>[];
  } | null>(null);

  const [importing, setImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);

  // Selection for deletion
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [confirmBatchDeleteId, setConfirmBatchDeleteId] = useState<string | null>(null);

  // File Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setImportSuccessMsg(null);
    setImportErrorMsg(null);

    try {
      const parsed = await parseCartDueFile(file);
      setParseResult(parsed);

      // Check duplicates against current records
      const dupCheck = checkCartDueDuplicates(parsed.validRows, records);
      setDuplicateCheckResult(dupCheck);
    } catch (err: unknown) {
      setImportErrorMsg(err instanceof Error ? err.message : 'Failed to parse file.');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Commit Import
  const handleCommitImport = async () => {
    if (!parseResult || !duplicateCheckResult) return;

    setImporting(true);
    setImportErrorMsg(null);

    try {
      const recordsToInsert = duplicateCheckResult.uniqueRecords;
      const recordsToUpdate: { id: string; data: Partial<CartDueRecord> }[] = [];

      // Process duplicates according to resolution action
      duplicateCheckResult.duplicates.forEach(d => {
        if (d.action === 'update') {
          recordsToUpdate.push({
            id: d.existingId,
            data: {
              remaining_amount: d.newAmount,
              original_amount: d.newAmount,
              updated_at: new Date().toISOString(),
            },
          });
        }
      });

      const res = await commitImport(recordsToInsert, recordsToUpdate, {
        fileName: parseResult.fileName,
        fileSize: parseResult.fileSize,
        totalRows: parseResult.totalRows,
        skippedCount: duplicateCheckResult.duplicates.filter(d => d.action === 'skip').length,
      });

      if (!res.success) {
        setImportErrorMsg(res.error || 'Failed to complete import.');
        setImporting(false);
        return;
      }

      setImportSuccessMsg(
        `Successfully imported ${recordsToInsert.length} new Cart Due records and updated ${recordsToUpdate.length} records.`
      );
      setParseResult(null);
      setDuplicateCheckResult(null);
    } catch (err: unknown) {
      setImportErrorMsg(err instanceof Error ? err.message : 'Import failed unexpectedly');
    } finally {
      setImporting(false);
    }
  };

  // Toggle Duplicate Action
  const toggleDuplicateAction = (index: number) => {
    if (!duplicateCheckResult) return;
    const nextDups = [...duplicateCheckResult.duplicates];
    nextDups[index].action = nextDups[index].action === 'skip' ? 'update' : 'skip';
    setDuplicateCheckResult({
      ...duplicateCheckResult,
      duplicates: nextDups,
    });
  };

  // Toggle select record
  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const selectAllRecords = () => {
    if (selectedRecordIds.length === records.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(records.map(r => r.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Cart Due Data & Import Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Import <strong className="font-mono">cart due auto format.xlsx</strong> files, audit import batches, and manage Cart Due ledger records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadCartDueAutoFormatTemplate}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Format Template</span>
          </button>
          {records.length > 0 && (
            <button
              onClick={() => exportCartDueRecordsToExcel(records)}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Cart Due Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {importSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{importSuccessMsg}</div>
        </div>
      )}

      {importErrorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{importErrorMsg}</div>
        </div>
      )}

      {/* Drag & Drop Import Upload Area */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <Upload className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Upload cart due auto format.xlsx or CSV
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            Expected 6 columns: <strong className="font-mono">Sr.No</strong>, <strong className="font-mono">Client</strong>, <strong className="font-mono">Provider</strong>, <strong className="font-mono">Date</strong>, <strong className="font-mono">Extension</strong> (Outstanding Due), <strong className="font-mono">Client id</strong>
          </p>
        </div>

        <div className="flex justify-center pt-1">
          <button
            type="button"
            disabled={parsing}
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {parsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{parsing ? 'Parsing Excel File...' : 'Select File to Upload'}</span>
          </button>
        </div>
      </div>

      {/* Import Preview & Validation Drawer / Table */}
      {parseResult && duplicateCheckResult && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>File Validation & Import Preview: {parseResult.fileName}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Found {parseResult.validRows.length} valid rows · {duplicateCheckResult.duplicates.length} duplicate matches · {parseResult.invalidRows.length} rejected rows
              </p>
            </div>
            <button
              onClick={() => {
                setParseResult(null);
                setDuplicateCheckResult(null);
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Validation Warnings */}
          {duplicateCheckResult.duplicates.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Duplicate Cart Records Detected ({duplicateCheckResult.duplicates.length})</span>
              </div>
              <p className="text-[11px]">
                Matching Client ID + Provider + Date were already imported. Choose whether to <strong>Skip</strong> or <strong>Update</strong> the existing balance:
              </p>
              <div className="max-h-40 overflow-y-auto divide-y divide-amber-200/50 dark:divide-amber-800/50">
                {duplicateCheckResult.duplicates.map((dup, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{dup.record.client_name}</span> ({dup.record.client_id}) · {dup.record.provider_name}
                      <span className="text-[10px] block text-slate-500">
                        Current: {formatCurrency(dup.currentRemaining)} $\rightarrow$ New: {formatCurrency(dup.newAmount)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleDuplicateAction(idx)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                        dup.action === 'update'
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100'
                      }`}
                    >
                      {dup.action === 'update' ? 'Will Update' : 'Will Skip'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commit Button */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setParseResult(null);
                setDuplicateCheckResult(null);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={handleCommitImport}
              disabled={importing}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{importing ? 'Importing Records...' : `Commit Import (${parseResult.validRows.length} Rows)`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Import Batches History */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Cart Due Import Batches Audit History
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Logged upload events with isolated batch deletion capability
            </p>
          </div>
        </div>

        {importBatches.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            No Cart Due import batches logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3 text-right">Total Rows</th>
                  <th className="py-2.5 px-3 text-right">Imported</th>
                  <th className="py-2.5 px-3 text-right">Skipped</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Volume</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {importBatches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {formatDate(b.created_at)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {b.file_name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {b.total_rows}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {b.imported_rows}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {b.skipped_rows}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(b.total_outstanding_imported)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setConfirmBatchDeleteId(b.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete this import batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Danger Zone: Isolated Cart Due Wipe */}
      <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-950 bg-rose-50/30 dark:bg-rose-950/10 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">
            Quarantined Cart Due Data Deletion
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          This operation will clear <strong>ONLY</strong> Cart Due records, payment logs, advance credits, and follow-up history.
          It will <strong>NEVER</strong> affect regular invoices, NGO Master, staff records, or My Tasks.
        </p>
        <button
          onClick={() => setConfirmDeleteAllOpen(true)}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete All Cart Due Data...</span>
        </button>
      </div>

      {/* Confirmation Modal: Delete Batch */}
      {confirmBatchDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Confirm Delete Import Batch</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this import batch? All Cart Due records originating from this batch will be removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmBatchDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteBatch(confirmBatchDeleteId);
                  setConfirmBatchDeleteId(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
              >
                Delete Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete All Cart Due Data */}
      {confirmDeleteAllOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-rose-300 dark:border-rose-900 shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Clear Entire Cart Due Ledger?</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This action permanently clears all Cart Due records, payment history, advance credit balances, and follow-up entries.
              Regular hospital invoices, NGO Master, and My Tasks will remain completely untouched.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteAllOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteAllCartDueData();
                  setConfirmDeleteAllOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirm Delete All Cart Due Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

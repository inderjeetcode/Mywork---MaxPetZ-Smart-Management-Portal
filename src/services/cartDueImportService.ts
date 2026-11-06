import * as XLSX from 'xlsx';
import { CartDueRecord, CartDueDuplicateResolution } from '../types';

export interface CartDueParsedRow {
  raw: Record<string, unknown>;
  parsed?: Omit<CartDueRecord, 'id'>;
  isValid: boolean;
  errors: string[];
}

export interface CartDueImportParseResult {
  fileName: string;
  fileSize: number;
  totalRows: number;
  validRows: Omit<CartDueRecord, 'id'>[];
  invalidRows: { rowIndex: number; raw: Record<string, unknown>; error: string }[];
  detectedColumns: string[];
}

/**
 * Normalizes Excel dates that could be serial numbers (e.g. 45212) or string dates
 */
export function normalizeExcelDate(value: unknown): string {
  if (!value) return new Date().toISOString().split('T')[0];

  // If number, Excel date serial
  if (typeof value === 'number') {
    try {
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      // fallback below
    }
  }

  const str = String(value).trim();

  // Try direct Date parse
  const directDate = new Date(str);
  if (!isNaN(directDate.getTime()) && str.includes('-') && str.length >= 8) {
    return directDate.toISOString().split('T')[0];
  }

  // DD/MM/YYYY or DD-MM-YYYY format
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Parses numeric currency values cleanly
 */
export function parseCurrencyAmount(value: unknown): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  // Strip non-digit characters except period and negative sign
  const cleaned = String(value)
    .replace(/[₹$€£,\s]/g, '')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Normalizes raw row data into CartDueRecord
 * Mandatory mapping:
 * - Sr.No -> sr_no
 * - Client -> client_name
 * - Provider -> provider_name
 * - Date -> record_date
 * - Extension -> cart_outstanding_amount (original_amount & remaining_amount)
 * - Client id -> client_id (stored as TEXT)
 */
export function normalizeCartDueRow(
  row: Record<string, unknown>,
  index: number
): { record?: Omit<CartDueRecord, 'id'>; error?: string } {
  // Find matching keys
  const keys = Object.keys(row);

  const findKey = (candidates: string[]) => {
    return keys.find(k => {
      const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return candidates.some(c => clean === c.toLowerCase().replace(/[^a-z0-9]/g, ''));
    });
  };

  const srNoKey = findKey(['srno', 'sr.no', 'sr_no', 'sno', 's.no', 'serialno']);
  const clientKey = findKey(['client', 'clientname', 'client_name', 'patient', 'owner']);
  const providerKey = findKey(['provider', 'providername', 'provider_name', 'doctor', 'vet']);
  const dateKey = findKey(['date', 'recorddate', 'record_date', 'invoicedate']);
  const extensionKey = findKey(['extension', 'outstanding', 'dueamount', 'amount', 'cartdue', 'balance', 'ext']);
  const clientIdKey = findKey(['clientid', 'client id', 'client_id', 'custid', 'id']);

  const clientName = clientKey && row[clientKey] ? String(row[clientKey]).trim() : '';
  const providerName = providerKey && row[providerKey] ? String(row[providerKey]).trim() : 'General Provider';
  const rawDate = dateKey ? row[dateKey] : undefined;
  const rawAmount = extensionKey ? row[extensionKey] : 0;
  const rawClientId = clientIdKey && row[clientIdKey] !== undefined ? String(row[clientIdKey]).trim() : '';

  if (!clientName) {
    return { error: `Row ${index + 1}: Missing Client Name` };
  }

  const outstandingAmount = parseCurrencyAmount(rawAmount);
  if (outstandingAmount <= 0 && rawAmount !== 0) {
    return { error: `Row ${index + 1}: Invalid Extension amount (${rawAmount}) for Client "${clientName}"` };
  }

  const recordDate = normalizeExcelDate(rawDate);
  const clientId = rawClientId || `CL-${Math.floor(10000 + Math.random() * 90000)}`;

  const srNo = srNoKey && row[srNoKey] !== undefined ? String(row[srNoKey]).trim() : index + 1;

  const record: Omit<CartDueRecord, 'id'> = {
    sr_no: srNo,
    client_id: clientId,
    client_name: clientName,
    provider_name: providerName,
    record_date: recordDate,
    original_amount: outstandingAmount,
    paid_amount: 0,
    remaining_amount: outstandingAmount,
    status: 'Unpaid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { record };
}

/**
 * Parses an ArrayBuffer or binary string into structured Cart Due records
 */
export async function parseCartDueFile(file: File): Promise<CartDueImportParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  const validRows: Omit<CartDueRecord, 'id'>[] = [];
  const invalidRows: { rowIndex: number; raw: Record<string, unknown>; error: string }[] = [];

  const detectedColumns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

  rawRows.forEach((row, idx) => {
    // Skip completely empty rows
    const hasValues = Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
    if (!hasValues) return;

    const { record, error } = normalizeCartDueRow(row, idx);
    if (record) {
      validRows.push(record);
    } else {
      invalidRows.push({
        rowIndex: idx + 2, // Excel 1-indexed with header
        raw: row,
        error: error || 'Row failed validation',
      });
    }
  });

  return {
    fileName: file.name,
    fileSize: file.size,
    totalRows: rawRows.length,
    validRows,
    invalidRows,
    detectedColumns,
  };
}

/**
 * Check for duplicate records within current database (Key: client_id + provider_name + record_date)
 */
export function checkCartDueDuplicates(
  newRecords: Omit<CartDueRecord, 'id'>[],
  existingRecords: CartDueRecord[]
): {
  duplicates: CartDueDuplicateResolution[];
  uniqueRecords: Omit<CartDueRecord, 'id'>[];
} {
  const existingMap = new Map<string, CartDueRecord>();
  existingRecords.forEach(r => {
    const key = `${r.client_id.trim().toUpperCase()}___${r.provider_name.trim().toLowerCase()}___${r.record_date}`;
    existingMap.set(key, r);
  });

  const duplicates: CartDueDuplicateResolution[] = [];
  const uniqueRecords: Omit<CartDueRecord, 'id'>[] = [];

  newRecords.forEach(rec => {
    const key = `${rec.client_id.trim().toUpperCase()}___${rec.provider_name.trim().toLowerCase()}___${rec.record_date}`;
    const existing = existingMap.get(key);
    if (existing) {
      duplicates.push({
        record: rec,
        existingId: existing.id,
        currentRemaining: existing.remaining_amount,
        newAmount: rec.original_amount,
        action: 'skip',
      });
    } else {
      uniqueRecords.push(rec);
    }
  });

  return { duplicates, uniqueRecords };
}

/**
 * Generates and triggers download of the exact "cart due auto format.xlsx" template
 */
export function downloadCartDueAutoFormatTemplate(): void {
  const sampleData = [
    {
      'Sr.No': 1,
      'Client': 'Aarav Mehta (Pet: Leo)',
      'Provider': 'Dr. Rohan Sharma',
      'Date': '2026-10-14',
      'Extension': 18500,
      'Client id': '001082',
    },
    {
      'Sr.No': 2,
      'Client': 'Sunita Krishnan (Pet: Bella)',
      'Provider': 'Dr. Vikram Singh',
      'Date': '2026-10-18',
      'Extension': 34200,
      'Client id': '001095',
    },
    {
      'Sr.No': 3,
      'Client': 'Kunal Singhal (Pet: Rocky)',
      'Provider': 'Dr. Ananya Roy',
      'Date': '2026-10-22',
      'Extension': 9400,
      'Client id': '001103',
    },
    {
      'Sr.No': 4,
      'Client': 'Simran Bedi (Pet: Oscar)',
      'Provider': 'Dr. Rohan Sharma',
      'Date': '2026-10-25',
      'Extension': 27500,
      'Client id': '001119',
    },
    {
      'Sr.No': 5,
      'Client': 'Ramesh Chandra (Pet: Bruno)',
      'Provider': 'Dr. Vikram Singh',
      'Date': '2026-10-28',
      'Extension': 14800,
      'Client id': '001142',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cart Due Auto Format');
  XLSX.writeFile(workbook, 'cart_due_auto_format.xlsx');
}

/**
 * Exports current Cart Due records to Excel
 */
export function exportCartDueRecordsToExcel(records: CartDueRecord[], fileName = 'MaxPetZ_Cart_Due_Report.xlsx'): void {
  const exportData = records.map((r, idx) => ({
    'Sr.No': r.sr_no ?? idx + 1,
    'Client id': r.client_id,
    'Client': r.client_name,
    'Provider': r.provider_name,
    'Date': r.record_date,
    'Original Cart Due (Extension)': r.original_amount,
    'Paid Amount': r.paid_amount,
    'Remaining Due': r.remaining_amount,
    'Status': r.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cart Due Report');
  XLSX.writeFile(workbook, fileName);
}

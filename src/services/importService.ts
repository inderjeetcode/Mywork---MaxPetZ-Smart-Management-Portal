import * as XLSX from 'xlsx';
import { Invoice, NGO, ClientType } from '../types';

export interface ColumnMapping {
  date: string;
  invoice_no: string;
  client_id: string;
  client_name: string;
  user_name: string;
  invoice_type: string;
  amount: string;
  balance: string;
  return_amount: string;
  sold_amount: string;
  mode_of_payment: string;
  clinic_name: string;
  inv_year: string;
  inv_month: string;
  email: string;
  mobile: string;
  home: string;
  status: string;
}

export interface ParseResult {
  headers: string[];
  rawRows: Record<string, unknown>[];
  detectedMapping: Partial<ColumnMapping>;
}

export interface ValidatedRow {
  isValid: boolean;
  errors: string[];
  data: Omit<Invoice, 'id'>;
  rawRow: Record<string, unknown>;
  rowIndex: number;
}

const SYNONYMS: Record<keyof ColumnMapping, string[]> = {
  date: ['date', 'invoice date', 'inv date', 'bill date', 'dt', 'invoicedate'],
  invoice_no: ['invno', 'inv no', 'invoice no.', 'invoice no', 'invoice number', 'inv #', 'bill no', 'bill no.', 'invoiceno'],
  client_id: ['clientid', 'client id', 'customer id', 'customerid', 'party id', 'patient id', 'client code', 'client_id'],
  client_name: ['client', 'client name', 'customer name', 'customer', 'pet parent', 'party name', 'name'],
  user_name: ['user', 'staff', 'user name', 'staff name', 'doctor', 'created by', 'agent', 'username'],
  invoice_type: ['invoice type', 'type', 'inv type', 'bill type', 'category', 'service type'],
  amount: ['invoice amount', 'amount', 'total amount', 'original amount', 'bill amount', 'gross amount', 'amt'],
  balance: ['balance (as of now)', 'balance', 'due', 'outstanding', 'due amount', 'balance due', 'outstanding due', 'pending amount', 'bal'],
  return_amount: ['return', 'return amount', 'refund', 'credit note', 'returns'],
  sold_amount: ['sold', 'sold amount', 'net sales', 'sale amount'],
  mode_of_payment: ['mode of payment', 'payment mode', 'payment method', 'mode', 'mop', 'pay mode'],
  clinic_name: ['clinic', 'branch', 'hospital', 'center', 'clinic name', 'location', 'facility', 'centre'],
  inv_year: ['inv year', 'year', 'invoice year', 'invyear'],
  inv_month: ['inv month', 'month', 'invoice month', 'invmonth'],
  email: ['email', 'email address', 'e-mail'],
  mobile: ['mobile', 'mobile no', 'mobile number', 'phone', 'phone number', 'contact'],
  home: ['home', 'home phone', 'telephone', 'landline'],
  status: ['status', 'invoice status', 'inv status', 'payment status', 'due status'],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Auto-detects column mappings based on known header synonyms (17-column & legacy 10-column)
 */
export function detectColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};
  const normalizedHeaders = headers.map(h => ({ original: h, clean: normalizeHeader(h) }));

  for (const [field, synonymList] of Object.entries(SYNONYMS) as [keyof ColumnMapping, string[]][]) {
    for (const item of normalizedHeaders) {
      if (synonymList.includes(item.clean)) {
        mapping[field] = item.original;
        break;
      }
    }
    // Partial substring fallback
    if (!mapping[field]) {
      for (const item of normalizedHeaders) {
        if (synonymList.some(s => item.clean.includes(s) || s.includes(item.clean))) {
          mapping[field] = item.original;
          break;
        }
      }
    }
  }

  return mapping;
}

export function parseDateToISO(val: unknown): string {
  if (val === null || val === undefined || val === '') {
    return new Date().toISOString().split('T')[0];
  }

  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    return val.trim();
  }

  if (typeof val === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + val * 86400000);
    return date.toISOString().split('T')[0];
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      let year = dmy[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }

  return new Date().toISOString().split('T')[0];
}

export function parseAmount(val: unknown): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (!val) return 0;
  const str = String(val).replace(/[₹$,\s]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Reads spreadsheet buffer or text into headers and row objects
 */
export function parseSpreadsheetData(data: ArrayBuffer | string): ParseResult {
  let workbook: XLSX.WorkBook;

  if (typeof data === 'string') {
    workbook = XLSX.read(data, { type: 'string', raw: false });
  } else {
    workbook = XLSX.read(data, { type: 'array', cellDates: true });
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  const headerSet = new Set<string>();
  rawRows.forEach(row => {
    Object.keys(row).forEach(k => headerSet.add(k));
  });
  const headers = Array.from(headerSet);

  const detectedMapping = detectColumnMapping(headers);

  return {
    headers,
    rawRows,
    detectedMapping,
  };
}

/**
 * Validates parsed rows and automatically classifies each record into NGO, NON_NGO, or UNCLASSIFIED
 * based on exact normalized Client ID matching against registered NGO master entries.
 */
export function validateImportRows(
  rawRows: Record<string, unknown>[],
  mapping: ColumnMapping,
  ngosList: NGO[] = [],
  batchId?: string
): ValidatedRow[] {
  // Build lookup map of active NGOs by normalized client_id
  const ngoMap = new Map<string, NGO>();
  ngosList.forEach(ngo => {
    if (ngo.status === 'ACTIVE' && ngo.client_id) {
      ngoMap.set(ngo.client_id.trim().toUpperCase(), ngo);
    }
  });

  return rawRows.map((row, index) => {
    const errors: string[] = [];

    const rawInvoiceNo = row[mapping.invoice_no];
    const invoiceNo = String(rawInvoiceNo || '').trim();
    if (!invoiceNo) {
      errors.push('Missing Invoice Number (InvNo)');
    }

    const rawClinic = row[mapping.clinic_name];
    const clinicName = String(rawClinic || '').trim();
    if (!clinicName) {
      errors.push('Missing Clinic Name');
    }

    // Client ID: Stored as TEXT to preserve leading zeroes
    const rawClientId = row[mapping.client_id];
    let clientId: string | null = null;
    if (rawClientId !== undefined && rawClientId !== null && String(rawClientId).trim() !== '') {
      clientId = String(rawClientId).trim();
    }

    const rawClient = row[mapping.client_name];
    const clientName = String(rawClient || '').trim() || 'Unknown Client';

    const rawUser = row[mapping.user_name];
    const userName = String(rawUser || '').trim() || 'Unassigned';

    const amount = parseAmount(row[mapping.amount]);
    const balance = parseAmount(row[mapping.balance]);
    const returnAmount = parseAmount(row[mapping.return_amount]);
    const soldAmount = parseAmount(row[mapping.sold_amount]);

    const date = parseDateToISO(row[mapping.date]);
    const status = String(row[mapping.status] || (balance > 0 ? 'Unpaid' : 'Paid')).trim();
    const invoiceType = String(row[mapping.invoice_type] || 'Standard').trim();
    const modeOfPayment = String(row[mapping.mode_of_payment] || 'Pending').trim();

    // Year / Month / Contact details
    const invYear = row[mapping.inv_year] ? parseInt(String(row[mapping.inv_year]), 10) : null;
    const invMonth = row[mapping.inv_month] ? String(row[mapping.inv_month]).trim() : null;
    const email = row[mapping.email] ? String(row[mapping.email]).trim() : null;
    const mobile = row[mapping.mobile] ? String(row[mapping.mobile]).trim() : null;
    const home = row[mapping.home] ? String(row[mapping.home]).trim() : null;

    // Automatic NGO Classification based on normalized Client ID
    let clientType: ClientType = 'UNCLASSIFIED';
    let matchedNgoName: string | null = null;

    if (clientId) {
      const normalizedId = clientId.trim().toUpperCase();
      const matchedNgo = ngoMap.get(normalizedId);
      if (matchedNgo) {
        clientType = 'NGO';
        matchedNgoName = matchedNgo.ngo_name;
      } else {
        clientType = 'NON_NGO';
      }
    } else {
      clientType = 'UNCLASSIFIED';
    }

    const data: Omit<Invoice, 'id'> = {
      date,
      invoice_no: invoiceNo,
      client_id: clientId,
      client_name: clientName,
      client_type: clientType,
      ngo_name: matchedNgoName,
      invoice_type: invoiceType,
      amount,
      balance,
      return_amount: returnAmount,
      sold_amount: soldAmount,
      status,
      mode_of_payment: modeOfPayment,
      user_name: userName,
      clinic_name: clinicName,
      inv_year: isNaN(invYear as number) ? null : invYear,
      inv_month: invMonth,
      email,
      mobile,
      home,
      import_batch_id: batchId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      isValid: errors.length === 0,
      errors,
      data,
      rawRow: row,
      rowIndex: index + 1,
    };
  });
}

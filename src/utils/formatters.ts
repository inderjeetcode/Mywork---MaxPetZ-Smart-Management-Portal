import * as XLSX from 'xlsx';

/**
 * Formats numbers into standard Indian Currency (INR).
 * Example: 125000 -> "₹1,25,000.00"
 */
export function formatINR(amount: number | null | undefined): string {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
}

/**
 * Currency formatter alias for formatINR
 */
export const formatCurrency = formatINR;

/**
 * Formats compact numbers for axis ticks (e.g., 1000 -> "1K", 100000 -> "1L" or "100K")
 */
export function formatCompactNumber(num: number | null | undefined): string {
  const val = Number(num) || 0;
  if (Math.abs(val) >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
  if (Math.abs(val) >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return String(val);
}

/**
 * Formats numbers with Indian digit grouping without currency symbol.
 */
export function formatIndianNumber(num: number | null | undefined): string {
  const val = Number(num) || 0;
  return new Intl.NumberFormat('en-IN').format(val);
}

/**
 * Formats percentages with 1 decimal place.
 */
export function formatPercent(value: number | null | undefined): string {
  const val = Number(value) || 0;
  return `${val.toFixed(1)}%`;
}

/**
 * Formats standard date strings into readable format (e.g. 14 Oct 2026).
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Export arbitrary tabular object data to an Excel file (.xlsx)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToExcel(data: any[], fileName: string, sheetName = 'Dues Data'): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName.replace(/\.xlsx$/i, '')}.xlsx`);
}

/**
 * Export tabular object data to CSV file (.csv)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCSV(data: any[], fileName: string): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName.replace(/\.csv$/i, '')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

import React from 'react';
import { 
  IndianRupee, 
  FileText, 
  Building2, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Receipt,
  Building,
  UserCheck,
  HelpCircle
} from 'lucide-react';
import { formatINR, formatIndianNumber } from '../../utils/formatters';

interface ExecutiveKpisProps {
  totalOutstanding: number;
  ngoOutstanding: number;
  nonNgoOutstanding: number;
  unclassifiedOutstanding: number;
  totalInvoiceAmount: number;
  outstandingInvoiceCount: number;
  totalClinicsCount: number;
  totalStaffCount: number;
  avgOutstanding: number;
  highestOutstandingClinic: { name: string; amount: number } | null;
  highestOutstandingStaff: { name: string; amount: number } | null;
}

export const ExecutiveKpis: React.FC<ExecutiveKpisProps> = ({
  totalOutstanding,
  ngoOutstanding,
  nonNgoOutstanding,
  unclassifiedOutstanding,
  totalInvoiceAmount,
  outstandingInvoiceCount,
  totalClinicsCount,
  totalStaffCount,
  avgOutstanding,
  highestOutstandingClinic,
  highestOutstandingStaff,
}) => {
  return (
    <div className="space-y-3.5 mb-5">
      {/* Primary 4-Way Outstanding Strip (Task 9: Total = NGO + Non-NGO + Unclassified) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Outstanding Due */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold">Total Outstanding Due</span>
            <IndianRupee className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400 tracking-tight">
            {formatINR(totalOutstanding)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Combined sum of all 3 classifications
          </div>
        </div>

        {/* 2. NGO Outstanding */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1.5">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>NGO Outstanding</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              NGO
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatINR(ngoOutstanding)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Matched with registered NGO Client IDs
          </div>
        </div>

        {/* 3. Non-NGO Outstanding */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 mb-1.5">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Non-NGO Outstanding</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              RETAIL
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 tracking-tight">
            {formatINR(nonNgoOutstanding)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Private pet parents & retail clients
          </div>
        </div>

        {/* 4. Unclassified Outstanding */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1.5">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Unclassified Outstanding</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              NO ID
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 tracking-tight">
            {formatINR(unclassifiedOutstanding)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Invoices missing Client ID
          </div>
        </div>
      </div>

      {/* Secondary Operational Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Billed */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Total Original Billed</div>
          <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {formatINR(totalInvoiceAmount)}
          </div>
        </div>

        {/* Due Bills Count */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Outstanding Bills</div>
          <div className="text-lg font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {formatIndianNumber(outstandingInvoiceCount)}
          </div>
        </div>

        {/* Average Due */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Average Due / Bill</div>
          <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {formatINR(avgOutstanding)}
          </div>
        </div>

        {/* Total Clinics */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Hospital Branches</div>
          <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {totalClinicsCount}
          </div>
        </div>

        {/* Highest Due Clinic */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Highest Due Clinic</div>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={highestOutstandingClinic?.name || 'None'}>
            {highestOutstandingClinic?.name || '—'}
          </div>
          <div className="text-xs font-mono font-bold text-red-600 dark:text-red-400 mt-0.5">
            {highestOutstandingClinic ? formatINR(highestOutstandingClinic.amount) : '₹0.00'}
          </div>
        </div>

        {/* Highest Due Staff */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1">Highest Due Staff</div>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={highestOutstandingStaff?.name || 'None'}>
            {highestOutstandingStaff?.name || '—'}
          </div>
          <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {highestOutstandingStaff ? formatINR(highestOutstandingStaff.amount) : '₹0.00'}
          </div>
        </div>
      </div>
    </div>
  );
};

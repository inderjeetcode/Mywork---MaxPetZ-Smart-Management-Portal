import React from 'react';
import { 
  CreditCard, 
  Users, 
  FileSpreadsheet, 
  CalendarClock, 
  AlertTriangle, 
  TrendingUp, 
  WalletCards,
  Building2,
  UserCheck,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatINR } from '../../utils/formatters';

interface CartDueKpisProps {
  totalCartOutstanding: number;
  totalCartClients: number;
  totalCartRecords: number;
  todayFollowupsCount: number;
  overdueFollowupsCount: number;
  totalCollectionReceived: number;
  availableAdvanceCredit: number;
  // Category KPIs
  totalCartNgoOutstanding: number;
  totalNormalClientOutstanding: number;
  totalUnclassifiedOutstanding: number;
  ngoClientCount: number;
  normalClientCount: number;
  unclassifiedClientCount: number;
}

export const CartDueKpis: React.FC<CartDueKpisProps> = ({
  totalCartOutstanding,
  totalCartClients,
  totalCartRecords,
  todayFollowupsCount,
  overdueFollowupsCount,
  totalCollectionReceived,
  availableAdvanceCredit,
  totalCartNgoOutstanding,
  totalNormalClientOutstanding,
  totalUnclassifiedOutstanding,
  ngoClientCount,
  normalClientCount,
  unclassifiedClientCount,
}) => {
  // Proportions for visual distribution bar
  const ngoPercent = totalCartOutstanding > 0 ? (totalCartNgoOutstanding / totalCartOutstanding) * 100 : 0;
  const normalPercent = totalCartOutstanding > 0 ? (totalNormalClientOutstanding / totalCartOutstanding) * 100 : 0;
  const unclassifiedPercent = totalCartOutstanding > 0 ? (totalUnclassifiedOutstanding / totalCartOutstanding) * 100 : 0;

  // Strict reconciliation check: Total = NGO + Normal + Unclassified
  const sumCheck = totalCartNgoOutstanding + totalNormalClientOutstanding + totalUnclassifiedOutstanding;
  const isReconciled = Math.abs(sumCheck - totalCartOutstanding) < 0.01;

  return (
    <div className="space-y-3">
      {/* 1. Primary 7 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Total Cart Outstanding */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Cart Outstanding</span>
            <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              {formatCurrency(totalCartOutstanding)}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Total pending cart dues
            </p>
          </div>
        </div>

        {/* Total Cart Clients */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Cart Clients</span>
            <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              {totalCartClients}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Active clients with due
            </p>
          </div>
        </div>

        {/* Total Cart Records */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Records</span>
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              {totalCartRecords}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              All imported cart rows
            </p>
          </div>
        </div>

        {/* Today's Follow-ups */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Today&apos;s Follow-ups</span>
            <CalendarClock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              {todayFollowupsCount}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Scheduled calls today
            </p>
          </div>
        </div>

        {/* Overdue Follow-ups */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Overdue Follow-ups</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <div className={`text-lg font-bold font-mono tabular-nums ${overdueFollowupsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {overdueFollowupsCount}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Calls past scheduled date
            </p>
          </div>
        </div>

        {/* Total Collection Received */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Collection</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(totalCollectionReceived)}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Payments received
            </p>
          </div>
        </div>

        {/* Available Advance Credit */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Advance Credit</span>
            <WalletCards className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 tabular-nums">
              {formatCurrency(availableAdvanceCredit)}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Unallocated client balance
            </p>
          </div>
        </div>
      </div>

      {/* 2. Three-Way Category Partition Strip (NGO vs Normal vs Unclassified) */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-slate-800 text-white shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Cart Due Category Classification
              </span>
              {isReconciled ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Reconciled (No Double Counting)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <AlertTriangle className="w-3 h-3" /> Variance Detected
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Total ({formatINR(totalCartOutstanding)}) = NGO ({formatINR(totalCartNgoOutstanding)}) + Normal ({formatINR(totalNormalClientOutstanding)}) + Unclassified ({formatINR(totalUnclassifiedOutstanding)})
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-300">NGO:</span>
              <span className="font-mono font-bold text-amber-300">{ngoPercent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-slate-300">Normal:</span>
              <span className="font-mono font-bold text-blue-300">{normalPercent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="text-slate-300">Unclassified:</span>
              <span className="font-mono font-bold text-slate-400">{unclassifiedPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Visual Partition Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex my-3">
          <div 
            style={{ width: `${ngoPercent}%` }} 
            className="h-full bg-amber-400 transition-all duration-300"
            title={`NGO Outstanding: ${formatINR(totalCartNgoOutstanding)} (${ngoPercent.toFixed(1)}%)`}
          />
          <div 
            style={{ width: `${normalPercent}%` }} 
            className="h-full bg-blue-500 transition-all duration-300"
            title={`Normal Outstanding: ${formatINR(totalNormalClientOutstanding)} (${normalPercent.toFixed(1)}%)`}
          />
          <div 
            style={{ width: `${unclassifiedPercent}%` }} 
            className="h-full bg-slate-600 transition-all duration-300"
            title={`Unclassified: ${formatINR(totalUnclassifiedOutstanding)} (${unclassifiedPercent.toFixed(1)}%)`}
          />
        </div>

        {/* 4 Partition Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* Cart NGO Outstanding */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center justify-between text-amber-300 mb-1">
              <span className="text-[11px] font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> NGO Cart Due
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">
                {ngoClientCount} {ngoClientCount === 1 ? 'client' : 'clients'}
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-amber-300 tabular-nums">
              {formatCurrency(totalCartNgoOutstanding)}
            </div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">
              Exact Client ID NGO match
            </div>
          </div>

          {/* Normal Client Cart Due */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between text-blue-300 mb-1">
              <span className="text-[11px] font-medium flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Normal Client Due
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200">
                {normalClientCount} {normalClientCount === 1 ? 'client' : 'clients'}
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-blue-300 tabular-nums">
              {formatCurrency(totalNormalClientOutstanding)}
            </div>
            <div className="text-[10px] text-blue-400/80 mt-0.5">
              Non-NGO regular clients
            </div>
          </div>

          {/* Unclassified Outstanding */}
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-[11px] font-medium flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Unclassified Due
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                {unclassifiedClientCount} {unclassifiedClientCount === 1 ? 'client' : 'clients'}
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-slate-200 tabular-nums">
              {formatCurrency(totalUnclassifiedOutstanding)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Missing or blank Client ID
            </div>
          </div>

          {/* Total Cart Due Outstanding */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center justify-between text-emerald-300 mb-1">
              <span className="text-[11px] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Total Cart Due
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                {totalCartClients} total
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-300 tabular-nums">
              {formatCurrency(totalCartOutstanding)}
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">
              100% reconciled balance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

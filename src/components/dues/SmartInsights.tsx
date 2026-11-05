import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Building2, 
  Users, 
  CreditCard, 
  Receipt,
  FileCheck
} from 'lucide-react';
import { Invoice } from '../../types';
import { formatINR, formatPercent, formatDate } from '../../utils/formatters';

interface SmartInsightsProps {
  invoices: Invoice[];
  totalOutstanding: number;
}

export const SmartInsights: React.FC<SmartInsightsProps> = ({
  invoices,
  totalOutstanding,
}) => {
  // Compute data-backed observations
  const insights = useMemo(() => {
    if (invoices.length === 0) return null;

    // 1. Top 10 outstanding invoices
    const top10 = [...invoices]
      .filter(i => Number(i.balance) > 0)
      .sort((a, b) => Number(b.balance) - Number(a.balance))
      .slice(0, 10);

    const top10Total = top10.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
    const top10Share = totalOutstanding > 0 ? (top10Total / totalOutstanding) * 100 : 0;

    // 2. High-value tickets (> ₹30,000)
    const highTickets = invoices.filter(i => Number(i.balance) >= 30000);
    const highTicketsTotal = highTickets.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);

    // 3. Payment mode distribution
    const modeMap = new Map<string, { count: number; totalDue: number }>();
    invoices.forEach(i => {
      const mode = i.mode_of_payment || 'Unspecified';
      const bal = Number(i.balance) || 0;
      if (!modeMap.has(mode)) modeMap.set(mode, { count: 0, totalDue: 0 });
      const rec = modeMap.get(mode)!;
      rec.count += 1;
      rec.totalDue += bal;
    });

    const paymentModes = Array.from(modeMap.entries())
      .map(([mode, data]) => ({ mode, ...data }))
      .sort((a, b) => b.totalDue - a.totalDue);

    // 4. Invoice type distribution
    const typeMap = new Map<string, { count: number; totalDue: number }>();
    invoices.forEach(i => {
      const type = i.invoice_type || 'Standard';
      const bal = Number(i.balance) || 0;
      if (!typeMap.has(type)) typeMap.set(type, { count: 0, totalDue: 0 });
      const rec = typeMap.get(type)!;
      rec.count += 1;
      rec.totalDue += bal;
    });

    const invoiceTypes = Array.from(typeMap.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.totalDue - a.totalDue);

    return {
      top10,
      top10Total,
      top10Share,
      highTicketsCount: highTickets.length,
      highTicketsTotal,
      paymentModes,
      invoiceTypes,
    };
  }, [invoices, totalOutstanding]);

  if (!insights) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
        No invoice data available to generate operational insights.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Executive Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Concentration Insight */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Top 10 High Exposure Invoices</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {formatINR(insights.top10Total)}
          </div>
          <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
            Represents {formatPercent(insights.top10Share)} of total outstanding dues
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Targeting these 10 patient cases delivers the highest direct recovery impact for the hospital.
          </p>
        </div>

        {/* High Ticket Dues */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <Receipt className="w-4 h-4 text-red-500" />
            <span>High-Value Invoices (&ge; ₹30,000)</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
            {formatINR(insights.highTicketsTotal)}
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
            Across {insights.highTicketsCount} major hospital procedures
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Primarily surgeries, ICU hospitalizations, and specialized oncology treatments.
          </p>
        </div>

        {/* Primary Payment Mode Risk */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <CreditCard className="w-4 h-4 text-blue-500" />
            <span>Dominant Payment Channel Due</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
            {insights.paymentModes[0]?.mode || 'Pending Settlement'}
          </div>
          <div className="mt-1 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            {formatINR(insights.paymentModes[0]?.totalDue || 0)}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Accounts for {insights.paymentModes[0]?.count} open billing instances.
          </p>
        </div>
      </div>

      {/* Top 10 High Exposure Invoices Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Top 10 Highest Outstanding Invoices in Dataset
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ranked in descending order by remaining patient balance.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 font-semibold">
            Total Top 10: {formatINR(insights.top10Total)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Invoice No.</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Client Name</th>
                <th className="py-2.5 px-3">Clinic Branch</th>
                <th className="py-2.5 px-3">Doctor / Staff</th>
                <th className="py-2.5 px-3">Invoice Type</th>
                <th className="py-2.5 px-3 text-right">Original Amt</th>
                <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {insights.top10.map((inv, idx) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoice_no}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{formatDate(inv.date)}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{inv.client_name}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{inv.clinic_name}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{inv.user_name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{inv.invoice_type}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">{formatINR(inv.amount)}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-red-600 dark:text-red-400">
                    {formatINR(inv.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Types and Payment Mode Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invoice Types Breakdown */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
            Outstanding by Medical Service / Invoice Type
          </h3>
          <div className="space-y-2">
            {insights.invoiceTypes.map(t => {
              const pct = totalOutstanding > 0 ? (t.totalDue / totalOutstanding) * 100 : 0;
              return (
                <div key={t.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{t.type}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatINR(t.totalDue)} ({formatPercent(pct)})</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Modes Breakdown */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
            Outstanding by Recorded Payment Mode
          </h3>
          <div className="space-y-2">
            {insights.paymentModes.map(m => {
              const pct = totalOutstanding > 0 ? (m.totalDue / totalOutstanding) * 100 : 0;
              return (
                <div key={m.mode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{m.mode}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatINR(m.totalDue)} ({formatPercent(pct)})</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  PieChart as PieIcon, 
  TrendingUp, 
  Users, 
  UserCheck, 
  Calendar, 
  Filter,
  Building2,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { useCartDue } from '../../context/CartDueContext';
import { formatCurrency, formatCompactNumber, formatINR } from '../../utils/formatters';

export const CartDueAnalyticsView: React.FC = () => {
  const {
    records,
    clientSummaries,
    providerSummaries,
    dailyTrends,
    monthlyTrends,
    topClients,
    followupStatusDistribution,
    availableProviders,
    totalCartOutstanding,
    totalCartNgoOutstanding,
    totalNormalClientOutstanding,
    totalUnclassifiedOutstanding,
    ngoClientCount,
    normalClientCount,
    unclassifiedClientCount,
  } = useCartDue();

  const [selectedProviderFilter, setSelectedProviderFilter] = useState('ALL');
  const [analyticsCategoryTab, setAnalyticsCategoryTab] = useState<'all' | 'ngo' | 'normal' | 'unclassified'>('all');

  // Filter provider data if selected
  const displayedProviders = selectedProviderFilter === 'ALL'
    ? providerSummaries
    : providerSummaries.filter(p => p.provider_name === selectedProviderFilter);

  // Filter client summaries based on category tab
  const filteredClientSummaries = clientSummaries.filter(c => {
    if (analyticsCategoryTab === 'ngo') return c.client_type === 'NGO';
    if (analyticsCategoryTab === 'normal') return c.client_type === 'NORMAL';
    if (analyticsCategoryTab === 'unclassified') return c.client_type === 'UNCLASSIFIED';
    return true;
  });

  // Top clients by outstanding
  const chartTopClients = filteredClientSummaries.slice(0, 10).map(c => ({
    name: c.client_name.length > 18 ? `${c.client_name.substring(0, 16)}...` : c.client_name,
    outstanding: c.remaining_due,
    paid: c.total_paid,
    original: c.total_original_due,
    type: c.client_type,
  }));

  // Provider chart data with NGO vs Normal breakdown
  const chartProviders = displayedProviders.map(p => ({
    name: p.provider_name.length > 18 ? `${p.provider_name.substring(0, 16)}...` : p.provider_name,
    outstanding: p.total_outstanding,
    ngoDue: p.ngo_outstanding,
    normalDue: p.normal_outstanding,
    paid: p.total_paid,
    collectionRate: p.collection_rate,
  }));

  // 3-Way Category Composition Data
  const categoryDistributionData = [
    { name: 'NGO Cart Due', value: totalCartNgoOutstanding, count: ngoClientCount, color: '#F59E0B' },
    { name: 'Normal Client Due', value: totalNormalClientOutstanding, count: normalClientCount, color: '#3B82F6' },
    { name: 'Unclassified Due', value: totalUnclassifiedOutstanding, count: unclassifiedClientCount, color: '#64748B' },
  ].filter(d => d.value > 0);

  // Colors for charts
  const PIE_COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981'];

  if (records.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
        No Cart Due records available to generate analytics. Import your <strong className="font-mono">cart due auto format.xlsx</strong> file first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Cart Due Financial & NGO Classification Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive breakdown of provider cart receivables, NGO partner dues, and collection trends
          </p>
        </div>

        {/* Provider Filter Select */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedProviderFilter}
            onChange={e => setSelectedProviderFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
          >
            <option value="ALL">All Providers ({availableProviders.length})</option>
            {availableProviders.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 1: Category Distribution & Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Proportion Pie */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-500" />
              <span>Category Outstanding Share</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              NGO vs Normal Client vs Unclassified
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistributionData.length > 0 ? categoryDistributionData : [{ name: 'None', value: 1, color: '#cbd5e1' }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                  label={(entry: any) => (entry.value > 0 ? `₹${formatCompactNumber(entry.value)}` : '')}
                  labelLine={false}
                >
                  {categoryDistributionData.map((entry, index) => (
                    <Cell key={`cat-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Outstanding']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1 font-mono">
            <div className="flex justify-between text-amber-600 dark:text-amber-400">
              <span>NGO Dues:</span>
              <span>{formatCurrency(totalCartNgoOutstanding)} ({ngoClientCount} clients)</span>
            </div>
            <div className="flex justify-between text-blue-600 dark:text-blue-400">
              <span>Normal Clients:</span>
              <span>{formatCurrency(totalNormalClientOutstanding)} ({normalClientCount} clients)</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Unclassified:</span>
              <span>{formatCurrency(totalUnclassifiedOutstanding)} ({unclassifiedClientCount} clients)</span>
            </div>
          </div>
        </div>

        {/* Top 10 Outstanding Clients Bar Chart with Category Switcher Tabs */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Top Outstanding Cart Clients</span>
              </h3>
              <p className="text-[11px] text-slate-400">Remaining due vs collected amount</p>
            </div>

            {/* Category Filter Pills for Chart */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {(['all', 'ngo', 'normal', 'unclassified'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAnalyticsCategoryTab(tab)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-colors ${
                    analyticsCategoryTab === tab
                      ? tab === 'ngo'
                        ? 'bg-amber-500 text-white'
                        : tab === 'normal'
                        ? 'bg-blue-600 text-white'
                        : tab === 'unclassified'
                        ? 'bg-slate-700 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'ngo' ? 'NGO' : tab === 'normal' ? 'Normal' : 'Unclass.'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartTopClients} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis 
                  dataKey="name" 
                  angle={-25} 
                  textAnchor="end" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={v => `₹${formatCompactNumber(v)}`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="outstanding" name="Remaining Due" fill={analyticsCategoryTab === 'ngo' ? '#F59E0B' : '#3B82F6'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" name="Paid Collection" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Provider-wise Cart Outstanding with NGO vs Normal Breakdown */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>Provider-wise Dues with NGO vs Normal Client Breakdown</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Total cart receivables generated, split by NGO partners and regular clients
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartProviders} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={v => `₹${formatCompactNumber(v)}`}
              />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val) || 0), '']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="ngoDue" name="NGO Outstanding" fill="#F59E0B" stackId="due" radius={[0, 0, 0, 0]} />
              <Bar dataKey="normalDue" name="Normal Outstanding" fill="#3B82F6" stackId="due" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" name="Collected Amount" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Daily and Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cart Due Trend */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Daily Cart Due Generation</span>
            </h3>
            <p className="text-[11px] text-slate-400">Chronological distribution of cart due generation</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={v => `₹${formatCompactNumber(v)}`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Due Amount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#0284C7" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Cart Due Trend */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Monthly Cart Due Generation</span>
            </h3>
            <p className="text-[11px] text-slate-400">Aggregate monthly receivables volume</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={v => `₹${formatCompactNumber(v)}`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Monthly Due']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="amount" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Client-wise Collection Report Data Table with Category Badges */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Client-wise Collection Report & Recovery Rate
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Comprehensive recovery analysis per client account with NGO and Normal categorization
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                <th className="py-2.5 px-3">Client ID</th>
                <th className="py-2.5 px-3">Client Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Original Due</th>
                <th className="py-2.5 px-3 text-right">Collected</th>
                <th className="py-2.5 px-3 text-right">Outstanding</th>
                <th className="py-2.5 px-3 text-right">Recovery %</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {clientSummaries.slice(0, 20).map(c => {
                const recoveryRate =
                  c.total_original_due > 0
                    ? Math.round((c.total_paid / c.total_original_due) * 100)
                    : 100;

                return (
                  <tr key={c.client_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {c.client_id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {c.client_name}
                      {c.ngo_name && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                          {c.ngo_name}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {c.client_type === 'NGO' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          NGO
                        </span>
                      ) : c.client_type === 'UNCLASSIFIED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Unclassified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(c.total_original_due)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(c.total_paid)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(c.remaining_due)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      <span className={recoveryRate >= 80 ? 'text-emerald-600' : recoveryRate >= 40 ? 'text-amber-600' : 'text-rose-600'}>
                        {recoveryRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.remaining_due === 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : c.total_paid > 0
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {c.remaining_due === 0 ? 'Fully Cleared' : c.total_paid > 0 ? 'Partially Paid' : 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

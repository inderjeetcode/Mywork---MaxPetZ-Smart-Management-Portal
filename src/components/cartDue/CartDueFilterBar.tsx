import React from 'react';
import { Search, RotateCcw, Calendar, CheckSquare, Building2, User, HelpCircle, Layers } from 'lucide-react';
import { CartDueFilterState, CartDueRecordStatus } from '../../types';
import { useCartDue } from '../../context/CartDueContext';
import { formatCurrency } from '../../utils/formatters';

interface CartDueFilterBarProps {
  filters: CartDueFilterState;
  setFilters: React.Dispatch<React.SetStateAction<CartDueFilterState>>;
  resetFilters: () => void;
  availableProviders: string[];
  resultCount: number;
}

export const CartDueFilterBar: React.FC<CartDueFilterBarProps> = ({
  filters,
  setFilters,
  resetFilters,
  availableProviders,
  resultCount,
}) => {
  const {
    records,
    totalCartOutstanding,
    totalCartNgoOutstanding,
    totalNormalClientOutstanding,
    totalUnclassifiedOutstanding,
  } = useCartDue();

  const handleClientTypeTab = (type: 'all' | 'ngo' | 'normal' | 'unclassified') => {
    setFilters(prev => ({ ...prev, clientType: type }));
  };

  const handleDatePresetChange = (preset: CartDueFilterState['datePreset']) => {
    setFilters(prev => ({ ...prev, datePreset: preset }));
  };

  const toggleProvider = (provider: string) => {
    setFilters(prev => {
      const exists = prev.providers.includes(provider);
      return {
        ...prev,
        providers: exists ? prev.providers.filter(p => p !== provider) : [...prev.providers, provider],
      };
    });
  };

  const toggleStatus = (status: CartDueRecordStatus) => {
    setFilters(prev => {
      const exists = prev.statuses.includes(status);
      return {
        ...prev,
        statuses: exists ? prev.statuses.filter(s => s !== status) : [...prev.statuses, status],
      };
    });
  };

  // Record counts per category
  const allCount = records.length;
  const ngoCount = records.filter(r => r.client_type === 'NGO').length;
  const normalCount = records.filter(r => r.client_type === 'NORMAL').length;
  const unclassifiedCount = records.filter(r => r.client_type === 'UNCLASSIFIED').length;

  const currentTab = filters.clientType || 'all';

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* 1. Category Switcher Tabs (All, NGO, Normal, Unclassified) */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl">
        {/* All Cart Due */}
        <button
          onClick={() => handleClientTypeTab('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span>All Cart Due</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {allCount}
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
            ({formatCurrency(totalCartOutstanding)})
          </span>
        </button>

        {/* NGO Cart Due */}
        <button
          onClick={() => handleClientTypeTab('ngo')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'ngo'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
          }`}
        >
          <Building2 className={`w-3.5 h-3.5 ${currentTab === 'ngo' ? 'text-white' : 'text-amber-500'}`} />
          <span>NGO Cart Due</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
              currentTab === 'ngo'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
            }`}
          >
            {ngoCount}
          </span>
          <span
            className={`text-[11px] font-mono hidden sm:inline ${
              currentTab === 'ngo' ? 'text-amber-100' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            ({formatCurrency(totalCartNgoOutstanding)})
          </span>
        </button>

        {/* Normal Client Cart Due */}
        <button
          onClick={() => handleClientTypeTab('normal')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'normal'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <User className={`w-3.5 h-3.5 ${currentTab === 'normal' ? 'text-white' : 'text-blue-500'}`} />
          <span>Normal Client Cart Due</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
              currentTab === 'normal'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            }`}
          >
            {normalCount}
          </span>
          <span
            className={`text-[11px] font-mono hidden sm:inline ${
              currentTab === 'normal' ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            ({formatCurrency(totalNormalClientOutstanding)})
          </span>
        </button>

        {/* Unclassified Cart Due */}
        <button
          onClick={() => handleClientTypeTab('unclassified')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'unclassified'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HelpCircle className={`w-3.5 h-3.5 ${currentTab === 'unclassified' ? 'text-white' : 'text-slate-400'}`} />
          <span>Unclassified</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
              currentTab === 'unclassified'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {unclassifiedCount}
          </span>
          <span
            className={`text-[11px] font-mono hidden sm:inline ${
              currentTab === 'unclassified' ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            ({formatCurrency(totalUnclassifiedOutstanding)})
          </span>
        </button>
      </div>

      {/* 2. Top Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* General Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Cart Due by Client Name, Client ID, NGO Name, or Provider..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Client ID Search */}
        <div className="w-full md:w-56">
          <input
            type="text"
            placeholder="Exact Client ID..."
            value={filters.clientIdSearch || ''}
            onChange={e => setFilters(prev => ({ ...prev, clientIdSearch: e.target.value }))}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Reset Filters Button */}
        <button
          onClick={resetFilters}
          className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>

        {/* Result Count indicator */}
        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-md shrink-0 text-center">
          {resultCount} {resultCount === 1 ? 'record' : 'records'}
        </div>
      </div>

      {/* 3. Date Presets & Status Filters */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        {/* Date Presets */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Date:
          </span>
          {(['all', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'last_month'] as const).map(preset => {
            const labelMap = {
              all: 'All',
              today: 'Today',
              yesterday: 'Yesterday',
              last_7_days: '7 Days',
              last_30_days: '30 Days',
              this_month: 'This Month',
              last_month: 'Last Month',
            };
            const active = filters.datePreset === preset;
            return (
              <button
                key={preset}
                onClick={() => handleDatePresetChange(preset)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {labelMap[preset]}
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <CheckSquare className="w-3 h-3" /> Status:
          </span>
          {(['Unpaid', 'Partial', 'Paid'] as CartDueRecordStatus[]).map(status => {
            const active = filters.statuses.includes(status);
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  active
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>

        {/* Provider Multi-select chips if providers exist */}
        {availableProviders.length > 0 && (
          <>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
              <span className="text-[11px] text-slate-400 font-medium shrink-0">Provider:</span>
              {availableProviders.map(prov => {
                const active = filters.providers.includes(prov);
                return (
                  <button
                    key={prov}
                    onClick={() => toggleProvider(prov)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {prov}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

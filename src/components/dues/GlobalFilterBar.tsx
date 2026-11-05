import React, { useState } from 'react';
import { 
  Filter, 
  RotateCcw, 
  Search, 
  Calendar, 
  Building2, 
  User, 
  CreditCard,
  ChevronDown,
  Building,
  UserCheck,
  HelpCircle,
  Hash
} from 'lucide-react';
import { FilterState } from '../../types';

interface GlobalFilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  availableClinics: string[];
  availableStaff: string[];
  availableStatuses: string[];
  availableInvoiceTypes: string[];
  availablePaymentModes: string[];
  resultCount: number;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  filters,
  setFilters,
  resetFilters,
  availableClinics,
  availableStaff,
  availableStatuses,
  availableInvoiceTypes,
  availablePaymentModes,
  resultCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDatePresetChange = (preset: FilterState['datePreset']) => {
    setFilters(prev => ({ ...prev, datePreset: preset }));
  };

  const handleClientTypeChange = (type: FilterState['clientType']) => {
    setFilters(prev => ({ ...prev, clientType: type }));
  };

  const handleClinicToggle = (clinic: string) => {
    setFilters(prev => {
      const exists = prev.clinics.includes(clinic);
      return {
        ...prev,
        clinics: exists ? prev.clinics.filter(c => c !== clinic) : [...prev.clinics, clinic],
      };
    });
  };

  const handleStaffToggle = (staffName: string) => {
    setFilters(prev => {
      const exists = prev.staff.includes(staffName);
      return {
        ...prev,
        staff: exists ? prev.staff.filter(s => s !== staffName) : [...prev.staff, staffName],
      };
    });
  };

  const activeFilterCount =
    (filters.datePreset !== 'all' ? 1 : 0) +
    (filters.clientType !== 'all' ? 1 : 0) +
    (filters.clientIdSearch ? 1 : 0) +
    filters.clinics.length +
    filters.staff.length +
    filters.statuses.length +
    filters.invoiceTypes.length +
    filters.paymentModes.length +
    (filters.search ? 1 : 0) +
    (filters.minBalance !== undefined || filters.maxBalance !== undefined ? 1 : 0);

  return (
    <div className="p-4 mb-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors space-y-3">
      {/* Client Type Segmentation Filter Bar (Task 9 & Task 6) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleClientTypeChange('all')}
            className={`px-3 py-1 font-semibold rounded-md transition-all whitespace-nowrap ${
              filters.clientType === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All Clients
          </button>
          <button
            onClick={() => handleClientTypeChange('ngo')}
            className={`flex items-center gap-1.5 px-3 py-1 font-semibold rounded-md transition-all whitespace-nowrap ${
              filters.clientType === 'ngo'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>NGO Only</span>
          </button>
          <button
            onClick={() => handleClientTypeChange('non_ngo')}
            className={`flex items-center gap-1.5 px-3 py-1 font-semibold rounded-md transition-all whitespace-nowrap ${
              filters.clientType === 'non_ngo'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Non-NGO Retail</span>
          </button>
          <button
            onClick={() => handleClientTypeChange('unclassified')}
            className={`flex items-center gap-1.5 px-3 py-1 font-semibold rounded-md transition-all whitespace-nowrap ${
              filters.clientType === 'unclassified'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Unclassified (No ID)</span>
          </button>
        </div>

        {/* Client ID Quick Search */}
        <div className="relative w-44">
          <Hash className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter Client ID..."
            value={filters.clientIdSearch || ''}
            onChange={e => setFilters(prev => ({ ...prev, clientIdSearch: e.target.value }))}
            className="w-full pl-8 pr-2.5 py-1 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Second Row: General Search, Date Presets, and Filters Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* General Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, client, clinic, staff, NGO..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Date Presets Group */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="px-2 text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Date:</span>
          </div>
          {(
            [
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'last_7_days', label: 'Last 7D' },
              { id: 'last_30_days', label: 'Last 30D' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'financial_year', label: 'FY' },
            ] as const
          ).map(p => (
            <button
              key={p.id}
              onClick={() => handleDatePresetChange(p.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filters.datePreset === p.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filters Toggle and Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showAdvanced || activeFilterCount > 0
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>More Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Drawers */}
      {showAdvanced && (
        <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Clinic Multi-select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-500" />
              <span>Filter by Clinic</span>
            </label>
            <div className="max-h-28 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
              {availableClinics.length === 0 ? (
                <div className="text-[11px] text-slate-400 p-1">No clinics in dataset</div>
              ) : (
                availableClinics.map(c => (
                  <label key={c} className="flex items-center gap-2 px-1.5 py-0.5 hover:bg-white dark:hover:bg-slate-700/50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.clinics.includes(c)}
                      onChange={() => handleClinicToggle(c)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="truncate text-slate-700 dark:text-slate-300">{c}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Staff Multi-select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-500" />
              <span>Filter by Staff</span>
            </label>
            <div className="max-h-28 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
              {availableStaff.length === 0 ? (
                <div className="text-[11px] text-slate-400 p-1">No staff in dataset</div>
              ) : (
                availableStaff.map(s => (
                  <label key={s} className="flex items-center gap-2 px-1.5 py-0.5 hover:bg-white dark:hover:bg-slate-700/50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.staff.includes(s)}
                      onChange={() => handleStaffToggle(s)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span className="truncate text-slate-700 dark:text-slate-300">{s}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Payment Mode & Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-purple-500" />
              <span>Payment Mode & Status</span>
            </label>
            <div className="space-y-1.5">
              <select
                value={filters.paymentModes[0] || ''}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    paymentModes: e.target.value ? [e.target.value] : [],
                  }))
                }
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="">All Payment Modes</option>
                {availablePaymentModes.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={filters.statuses[0] || ''}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    statuses: e.target.value ? [e.target.value] : [],
                  }))
                }
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="">All Statuses</option>
                {availableStatuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Balance Range & Custom Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Balance Range (₹)
            </label>
            <div className="flex items-center gap-2 mb-1.5">
              <input
                type="number"
                placeholder="Min ₹"
                value={filters.minBalance ?? ''}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    minBalance: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-1/2 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={filters.maxBalance ?? ''}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    maxBalance: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-1/2 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            </div>

            {filters.datePreset === 'custom' && (
              <div className="flex items-center gap-1.5 mt-2">
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-1/2 px-1.5 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-1/2 px-1.5 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result Counter */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Showing <strong className="text-slate-800 dark:text-slate-200 font-mono">{resultCount}</strong> filtered records</span>
        {activeFilterCount > 0 && (
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            {activeFilterCount} filter criteria active
          </span>
        )}
      </div>
    </div>
  );
};

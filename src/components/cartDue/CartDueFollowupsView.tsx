import React, { useState } from 'react';
import { 
  PhoneCall, 
  CalendarClock, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  Search, 
  Trash2, 
  CheckSquare, 
  Bell,
  MessageSquare
} from 'lucide-react';
import { useCartDue } from '../../context/CartDueContext';
import { CartDueFollowup } from '../../types';
import { AddFollowupModal } from './AddFollowupModal';
import { formatDate } from '../../utils/formatters';

type FollowupTab = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export const CartDueFollowupsView: React.FC = () => {
  const {
    allFollowups,
    todayFollowups,
    upcomingFollowups,
    overdueFollowups,
    completedFollowups,
    completeFollowup,
    deleteFollowup,
  } = useCartDue();

  const [activeTab, setActiveTab] = useState<FollowupTab>('today');
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ngo' | 'normal' | 'unclassified'>('all');

  // Determine active list based on tab
  const getTabList = (): CartDueFollowup[] => {
    switch (activeTab) {
      case 'today':
        return todayFollowups;
      case 'upcoming':
        return upcomingFollowups;
      case 'overdue':
        return overdueFollowups;
      case 'completed':
        return completedFollowups;
      case 'all':
      default:
        return allFollowups;
    }
  };

  const rawList = getTabList();
  const filteredList = rawList.filter(f => {
    // Category filter
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'ngo' && f.client_type !== 'NGO') return false;
      if (categoryFilter === 'normal' && f.client_type !== 'NORMAL') return false;
      if (categoryFilter === 'unclassified' && f.client_type !== 'UNCLASSIFIED') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        f.client_name.toLowerCase().includes(q) ||
        f.client_id.toLowerCase().includes(q) ||
        f.notes.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Cart Due Follow-up CRM</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dedicated follow-up pipeline tracking promise-to-pays, call outcomes, and scheduled collection reminders
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Follow-up Call</span>
        </button>
      </div>

      {/* 5 Follow-up Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'today'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Today&apos;s Follow-ups</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {todayFollowups.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'overdue'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              {overdueFollowups.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'upcoming'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              {upcomingFollowups.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Completed</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {completedFollowups.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>All Follow-ups</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {allFollowups.length}
            </span>
          </button>
        </div>

        {/* Category Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {(['all', 'ngo', 'normal', 'unclassified'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-1 rounded text-[11px] font-semibold capitalize transition-colors ${
                  categoryFilter === cat
                    ? cat === 'ngo'
                      ? 'bg-amber-500 text-white'
                      : cat === 'normal'
                      ? 'bg-blue-600 text-white'
                      : cat === 'unclassified'
                      ? 'bg-slate-700 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All' : cat === 'ngo' ? 'NGO' : cat === 'normal' ? 'Normal' : 'Unclassified'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search follow-ups..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Follow-up Cards Grid */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
          No follow-up calls found for selected filters. Click &quot;Log Follow-up Call&quot; to schedule your next action.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map(f => {
            const isCompleted = f.status === 'Completed';
            const isOverdue = overdueFollowups.some(o => o.id === f.id);
            const isToday = todayFollowups.some(t => t.id === f.id);

            return (
              <div
                key={f.id}
                className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between space-y-3 transition-all ${
                  isCompleted
                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
                    : isOverdue
                    ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900/80'
                    : isToday
                    ? 'bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-900/80 ring-1 ring-blue-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                        <span>{f.client_name}</span>
                        {f.client_type === 'NGO' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            NGO
                          </span>
                        ) : f.client_type === 'UNCLASSIFIED' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Unclassified
                          </span>
                        ) : null}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-400">ID: {f.client_id}</span>
                        <span>·</span>
                        <span>{f.provider_name ? f.provider_name : 'General Provider'}</span>
                        {f.phone ? ` · Ph: ${f.phone}` : ''}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : isOverdue
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : isToday
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>


                  {/* Outcome Tag & Contact Method */}
                  <div className="flex items-center gap-2 mt-2 text-[11px]">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {f.contact_method}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {f.contact_result}
                    </span>
                    {f.has_reminder && (
                      <span className="ml-auto text-amber-500" title="Reminder Enabled">
                        <Bell className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 italic">
                    &ldquo;{f.notes}&rdquo;
                  </div>
                </div>

                {/* Footer Dates & Complete Button */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <div className="font-mono text-slate-400 text-[10px]">
                    Next Call: {f.next_followup_date ? formatDate(f.next_followup_date) : 'Not scheduled'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isCompleted && (
                      <button
                        onClick={() => completeFollowup(f.id, 'Resolved')}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span>Complete</span>
                      </button>
                    )}
                    <button
                      onClick={() => deleteFollowup(f.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete Follow-up"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && <AddFollowupModal onClose={() => setModalOpen(false)} />}
    </div>
  );
};

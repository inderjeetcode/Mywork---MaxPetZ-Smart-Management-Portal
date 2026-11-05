import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  Lightbulb,
  Database,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  FolderSync,
} from 'lucide-react';

export type DuesTab = 
  | 'overview' 
  | 'dues_dashboard'
  | 'ngo_mgmt' 
  | 'ngo_dues' 
  | 'non_ngo_dues' 
  | 'clinics' 
  | 'staff' 
  | 'clients' 
  | 'invoices' 
  | 'insights' 
  | 'import' 
  | 'database';

export type TaskTab = 'all_tasks' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'notes' | 'productivity';

interface SidebarProps {
  activeDashboard: 'dues' | 'tasks';
  activeDuesTab: DuesTab;
  setActiveDuesTab: (t: DuesTab) => void;
  activeTaskTab: TaskTab;
  setActiveTaskTab: (t: TaskTab) => void;
  overdueCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeDashboard,
  activeDuesTab,
  setActiveDuesTab,
  activeTaskTab,
  setActiveTaskTab,
  overdueCount = 0,
}) => {
  return (
    <aside className="w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-3.5 transition-colors">
      <div className="overflow-y-auto pr-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
          {activeDashboard === 'dues' ? 'Financial Intelligence' : 'Daily Task Workspace'}
        </div>

        {activeDashboard === 'dues' ? (
          <nav className="space-y-1">
            <button
              onClick={() => setActiveDuesTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeDuesTab === 'overview'
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveDuesTab('dues_dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeDuesTab === 'dues_dashboard'
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0 text-blue-500" />
              <span>Dues Dashboard</span>
            </button>

            <div className="pt-2 pb-1 px-3 text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">
              NGO Division
            </div>

            <button
              onClick={() => setActiveDuesTab('ngo_mgmt')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeDuesTab === 'ngo_mgmt'
                  ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-purple-500" />
              <span>NGO Management</span>
            </button>

            <button
              onClick={() => setActiveDuesTab('ngo_dues')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeDuesTab === 'ngo_dues'
                  ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0 text-purple-500" />
              <span>NGO Dues</span>
            </button>

            <button
              onClick={() => setActiveDuesTab('non_ngo_dues')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeDuesTab === 'non_ngo_dues'
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0 text-blue-500" />
              <span>Non-NGO Dues</span>
            </button>

            <div className="pt-2 pb-1 px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              Operations & Performance
            </div>

            <button
              onClick={() => setActiveDuesTab('clinics')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeDuesTab === 'clinics'
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Clinic Analytics</span>
            </button>

            <button
              onClick={() => setActiveDuesTab('staff')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeDuesTab === 'staff'
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Staff Performance</span>
            </button>

            <button
              onClick={() => setActiveDuesTab('clients')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeDuesTab === 'clients'
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Client Management</span>
            </button>

            <button
              onClick={() => setActiveDuesTab('invoices')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeDuesTab === 'invoices'
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span>Invoice Records</span>
            </button>

            <button
              onClick={() => setActiveDuesTab('insights')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeDuesTab === 'insights'
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Lightbulb className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Smart Insights</span>
            </button>

            <div className="pt-3 my-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
                Data Infrastructure
              </div>

              <button
                onClick={() => setActiveDuesTab('import')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeDuesTab === 'import'
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <FolderSync className="w-4 h-4 shrink-0" />
                <span>Data Management</span>
              </button>

              <button
                onClick={() => setActiveDuesTab('database')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeDuesTab === 'database'
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Database className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Settings & SQL</span>
              </button>
            </div>
          </nav>
        ) : (
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTaskTab('all_tasks')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTaskTab === 'all_tasks'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>All Tasks</span>
            </button>

            <button
              onClick={() => setActiveTaskTab('today')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTaskTab === 'today'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Today's Tasks</span>
            </button>

            <button
              onClick={() => setActiveTaskTab('upcoming')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTaskTab === 'upcoming'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>Upcoming</span>
            </button>

            <button
              onClick={() => setActiveTaskTab('overdue')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTaskTab === 'overdue'
                  ? 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>Overdue Tasks</span>
              </div>
              {overdueCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-mono">
                  {overdueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTaskTab('completed')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTaskTab === 'completed'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Completed</span>
            </button>

            <div className="pt-3 my-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
                Productivity Tools
              </div>

              <button
                onClick={() => setActiveTaskTab('notes')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTaskTab === 'notes'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Daily Notes</span>
              </button>

              <button
                onClick={() => setActiveTaskTab('productivity')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTaskTab === 'productivity'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Productivity Trends</span>
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* Hospital Footer Info */}
      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="font-semibold text-slate-700 dark:text-slate-300">MaxPetZ Delhi NCR</div>
        <div>Operational Portal v2.0</div>
      </div>
    </aside>
  );
};

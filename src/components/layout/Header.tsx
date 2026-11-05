import React from 'react';
import { 
  Building2, 
  CheckSquare, 
  FileSpreadsheet, 
  Sun, 
  Moon, 
  LogOut, 
  User as UserIcon,
  ShieldCheck,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useDues } from '../../context/DuesContext';
import { downloadSampleExcelTemplate } from '../../services/sampleDataService';

interface HeaderProps {
  activeDashboard: 'dues' | 'tasks';
  setActiveDashboard: (d: 'dues' | 'tasks') => void;
  onOpenImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeDashboard,
  setActiveDashboard,
  onOpenImport,
}) => {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { invoices } = useDues();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          M
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
              MAXPETZ
            </span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              Smart Portal
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            MaxPetZ Hospitals Pvt. Ltd.
          </p>
        </div>
      </div>

      {/* Zone 2: Dashboard Switcher (Instant switch without reload) */}
      <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveDashboard('dues')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeDashboard === 'dues'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Dues Dashboard</span>
          {invoices.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {invoices.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveDashboard('tasks')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeDashboard === 'tasks'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>My Tasks</span>
        </button>
      </div>

      {/* Zone 3: Quick Actions, Theme Toggle & Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Sample Template Download */}
        <button
          onClick={downloadSampleExcelTemplate}
          title="Download Sample October Due Excel"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Sample Excel</span>
        </button>

        {/* Primary Import Action */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors shadow-xs whitespace-nowrap"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Import Excel</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Profile Lockup */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="hidden lg:block text-right">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
              {profile?.full_name || user?.email?.split('@')[0] || 'Hospital Staff'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span className="capitalize">{profile?.role || 'Admin'}</span>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            title="Sign out of portal"
            className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

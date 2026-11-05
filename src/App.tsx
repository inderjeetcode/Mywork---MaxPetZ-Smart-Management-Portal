import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DuesProvider, useDues } from './context/DuesContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { Header } from './components/layout/Header';
import { Sidebar, DuesTab, TaskTab } from './components/layout/Sidebar';
import { LoginPage } from './components/auth/LoginPage';
import { ExecutiveKpis } from './components/dues/ExecutiveKpis';
import { GlobalFilterBar } from './components/dues/GlobalFilterBar';
import { ClinicAnalyticsView } from './components/dues/ClinicAnalyticsView';
import { StaffPerformanceView } from './components/dues/StaffPerformanceView';
import { InvoiceManagementTable } from './components/dues/InvoiceManagementTable';
import { SmartInsights } from './components/dues/SmartInsights';
import { NgoManagementView } from './components/ngo/NgoManagementView';
import { NgoDuesView } from './components/dues/NgoDuesView';
import { NonNgoDuesView } from './components/dues/NonNgoDuesView';
import { ClientManagementView } from './components/dues/ClientManagementView';
import { DataManagementView } from './components/import/DataManagementView';
import { DatabaseMigrationView } from './components/database/DatabaseMigrationView';
import { TaskDashboardView } from './components/tasks/TaskDashboardView';
import { X } from 'lucide-react';

const MainPortal: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    invoices,
    filteredInvoices,
    filters,
    setFilters,
    resetFilters,
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
    clinicSummaries,
    staffSummaries,
    availableClinics,
    availableStaff,
    availableStatuses,
    availableInvoiceTypes,
    availablePaymentModes,
  } = useDues();

  const { overdueTasksCount } = useTasks();

  const [activeDashboard, setActiveDashboard] = useState<'dues' | 'tasks'>('dues');
  const [activeDuesTab, setActiveDuesTab] = useState<DuesTab>('overview');
  const [activeTaskTab, setActiveTaskTab] = useState<TaskTab>('all_tasks');
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-slate-400">Loading MaxPetZ Management Portal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const showGlobalFilter = 
    activeDuesTab !== 'import' && 
    activeDuesTab !== 'database' && 
    activeDuesTab !== 'ngo_mgmt';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sticky Top Header */}
      <Header
        activeDashboard={activeDashboard}
        setActiveDashboard={setActiveDashboard}
        onOpenImport={() => {
          if (activeDashboard === 'dues') {
            setActiveDuesTab('import');
          } else {
            setImportModalOpen(true);
          }
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeDashboard={activeDashboard}
          activeDuesTab={activeDuesTab}
          setActiveDuesTab={setActiveDuesTab}
          activeTaskTab={activeTaskTab}
          setActiveTaskTab={setActiveTaskTab}
          overdueCount={overdueTasksCount}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeDashboard === 'dues' ? (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Display GlobalFilterBar when appropriate */}
              {showGlobalFilter && (
                <GlobalFilterBar
                  filters={filters}
                  setFilters={setFilters}
                  resetFilters={resetFilters}
                  availableClinics={availableClinics}
                  availableStaff={availableStaff}
                  availableStatuses={availableStatuses}
                  availableInvoiceTypes={availableInvoiceTypes}
                  availablePaymentModes={availablePaymentModes}
                  resultCount={filteredInvoices.length}
                />
              )}

              {/* Dues Tab: Overview */}
              {activeDuesTab === 'overview' && (
                <div className="space-y-6">
                  {/* Executive 8 KPI Cards + 3-Way Outstanding Breakdown */}
                  <ExecutiveKpis
                    totalOutstanding={totalOutstanding}
                    ngoOutstanding={ngoOutstanding}
                    nonNgoOutstanding={nonNgoOutstanding}
                    unclassifiedOutstanding={unclassifiedOutstanding}
                    totalInvoiceAmount={totalInvoiceAmount}
                    outstandingInvoiceCount={outstandingInvoiceCount}
                    totalClinicsCount={totalClinicsCount}
                    totalStaffCount={totalStaffCount}
                    avgOutstanding={avgOutstanding}
                    highestOutstandingClinic={highestOutstandingClinic}
                    highestOutstandingStaff={highestOutstandingStaff}
                  />

                  {/* Smart Insights Strip */}
                  <SmartInsights
                    invoices={filteredInvoices}
                    totalOutstanding={totalOutstanding}
                  />

                  {/* Primary Invoices Table */}
                  <InvoiceManagementTable invoices={filteredInvoices} />
                </div>
              )}

              {/* Dues Tab: Dues Dashboard (Full Ledger + Analytics) */}
              {activeDuesTab === 'dues_dashboard' && (
                <div className="space-y-6">
                  <ExecutiveKpis
                    totalOutstanding={totalOutstanding}
                    ngoOutstanding={ngoOutstanding}
                    nonNgoOutstanding={nonNgoOutstanding}
                    unclassifiedOutstanding={unclassifiedOutstanding}
                    totalInvoiceAmount={totalInvoiceAmount}
                    outstandingInvoiceCount={outstandingInvoiceCount}
                    totalClinicsCount={totalClinicsCount}
                    totalStaffCount={totalStaffCount}
                    avgOutstanding={avgOutstanding}
                    highestOutstandingClinic={highestOutstandingClinic}
                    highestOutstandingStaff={highestOutstandingStaff}
                  />
                  <InvoiceManagementTable invoices={filteredInvoices} />
                </div>
              )}

              {/* Dues Tab: NGO Master Management */}
              {activeDuesTab === 'ngo_mgmt' && (
                <NgoManagementView />
              )}

              {/* Dues Tab: Dedicated NGO Dues View */}
              {activeDuesTab === 'ngo_dues' && (
                <NgoDuesView />
              )}

              {/* Dues Tab: Dedicated Non-NGO Retail Dues View */}
              {activeDuesTab === 'non_ngo_dues' && (
                <NonNgoDuesView />
              )}

              {/* Dues Tab: Clinic Analytics */}
              {activeDuesTab === 'clinics' && (
                <ClinicAnalyticsView
                  clinics={clinicSummaries}
                  allInvoices={filteredInvoices}
                />
              )}

              {/* Dues Tab: Staff Performance */}
              {activeDuesTab === 'staff' && (
                <StaffPerformanceView
                  staffMembers={staffSummaries}
                  allInvoices={filteredInvoices}
                />
              )}

              {/* Dues Tab: Client Management Directory */}
              {activeDuesTab === 'clients' && (
                <ClientManagementView />
              )}

              {/* Dues Tab: Invoices Management */}
              {activeDuesTab === 'invoices' && (
                <InvoiceManagementTable invoices={filteredInvoices} />
              )}

              {/* Dues Tab: Smart Insights */}
              {activeDuesTab === 'insights' && (
                <SmartInsights
                  invoices={filteredInvoices}
                  totalOutstanding={totalOutstanding}
                />
              )}

              {/* Dues Tab: Import & Data Management */}
              {activeDuesTab === 'import' && <DataManagementView />}

              {/* Dues Tab: Supabase & SQL Assistant */}
              {activeDuesTab === 'database' && <DatabaseMigrationView />}
            </div>
          ) : (
            /* My Tasks Dashboard */
            <div className="max-w-5xl mx-auto">
              <TaskDashboardView currentTab={activeTaskTab} />
            </div>
          )}
        </main>
      </div>

      {/* Floating Import Modal (Accessible anytime from My Tasks) */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto p-6 relative">
            <button
              onClick={() => setImportModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <DataManagementView />
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DuesProvider>
          <TaskProvider>
            <MainPortal />
          </TaskProvider>
        </DuesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

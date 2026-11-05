import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  Download, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Layers,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { SUPABASE_MIGRATION_SQL } from '../../lib/sqlMigration';
import { runComprehensiveConnectionTest, DetailedConnectionTest, cleanSupabaseUrl } from '../../lib/supabase';

export const DatabaseMigrationView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<DetailedConnectionTest | null>(null);

  const runDiagnostics = async () => {
    setTesting(true);
    const res = await runComprehensiveConnectionTest();
    setTestResult(res);
    setTesting(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([SUPABASE_MIGRATION_SQL], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'maxpetz_supabase_migration.sql';
    link.click();
  };

  return (
    <div className="space-y-5">
      {/* Supabase Connection Header */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              testResult?.databaseConnected 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Supabase PostgreSQL Integration & Diagnostics</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                  testResult?.databaseConnected
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}>
                  {testResult?.databaseConnected ? 'Database Connected' : 'Schema Pending'}
                </span>
              </h2>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {cleanSupabaseUrl}
              </div>
            </div>
          </div>

          <button
            onClick={runDiagnostics}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>Re-test Auth & Tables</span>
          </button>
        </div>

        {/* Technical Error Notice if tables not found */}
        {testResult && !testResult.databaseConnected && testResult.readError && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Technical Diagnostics Notice:</strong> {testResult.readError}
              <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                The connection URL and Publishable Key are valid and sanitized. Execute the migration script below in your Supabase SQL editor to create the PostgreSQL tables and RLS policies.
              </div>
            </div>
          </div>
        )}

        {/* Live Diagnostics Card */}
        {testResult && (
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Live Diagnostic Test Results:</span>
              <span className="text-[11px] font-mono text-slate-400">
                Tested at: {new Date(testResult.checkedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 text-[10px]">SUPABASE AUTH</div>
                <div className={`font-bold ${testResult.authStatus === 'PASS' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {testResult.authStatus === 'PASS' ? 'PASS (Ready)' : 'AUTH ERR'}
                </div>
              </div>

              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 text-[10px]">invoices TABLE</div>
                <div className={`font-bold ${testResult.tablesFound.invoices ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {testResult.tablesFound.invoices ? 'PASS (Exists)' : 'NEEDS SQL'}
                </div>
              </div>

              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 text-[10px]">ngo_master TABLE</div>
                <div className={`font-bold ${testResult.tablesFound.ngo_master ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {testResult.tablesFound.ngo_master ? 'PASS (Exists)' : 'NEEDS SQL'}
                </div>
              </div>

              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 text-[10px]">tasks TABLE</div>
                <div className={`font-bold ${testResult.tablesFound.tasks ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {testResult.tablesFound.tasks ? 'PASS (Exists)' : 'NEEDS SQL'}
                </div>
              </div>

              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 text-[10px]">import_batches</div>
                <div className={`font-bold ${testResult.tablesFound.import_batches ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {testResult.tablesFound.import_batches ? 'PASS (Exists)' : 'NEEDS SQL'}
                </div>
              </div>

              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 text-[10px]">profiles TABLE</div>
                <div className={`font-bold ${testResult.tablesFound.profiles ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {testResult.tablesFound.profiles ? 'PASS (Exists)' : 'NEEDS SQL'}
                </div>
              </div>

              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-400 text-[10px]">task_history</div>
                <div className={`font-bold ${testResult.tablesFound.task_history ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {testResult.tablesFound.task_history ? 'PASS (Exists)' : 'NEEDS SQL'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Migration Instructions */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Full PostgreSQL Database Migration Script</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Covers 12 tables, indexes, automatic triggers, Row Level Security (RLS), and private storage bucket.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySQL}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied SQL!' : 'Copy Migration SQL'}</span>
            </button>

            <button
              onClick={handleDownloadSQL}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download .sql File</span>
            </button>
          </div>
        </div>

        {/* Step by step manual setup instructions */}
        <div className="p-4 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-2">
          <div className="font-bold flex items-center gap-1.5">
            <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>How to execute this migration in your Supabase Project:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] pl-1">
            <li>Open your Supabase Project Dashboard at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-semibold text-blue-700 dark:text-blue-400 inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
            <li>In the left sidebar, click on <strong>SQL Editor</strong>.</li>
            <li>Click <strong>New query</strong>.</li>
            <li>Click the blue <strong>"Copy Migration SQL"</strong> button above, and paste it into the editor.</li>
            <li>Click <strong>Run (Ctrl + Enter)</strong>.</li>
            <li>Come back to this tab and click <strong>"Re-test Tables & Auth"</strong> to confirm all 12 tables show PASS!</li>
          </ol>
        </div>

        {/* SQL Code Preview Block */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            SQL Code Preview (Safe & Repeatable):
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto border border-slate-800">
            {SUPABASE_MIGRATION_SQL}
          </pre>
        </div>
      </div>
    </div>
  );
};

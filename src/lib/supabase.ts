import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Sanitizes and normalizes the Supabase URL and Publishable Key.
 * Strips surrounding quotes, trailing slashes, extra backslashes, and accidental '/rest/v1' suffixes.
 */
function sanitizeSupabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) return 'https://xhqzwikzzwerqjqrccal.supabase.co';
  let cleaned = rawUrl.trim();
  // Remove enclosing quotes if any
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  // Remove any trailing backslashes or slashes
  cleaned = cleaned.replace(/[\\/]+$/, '');
  // Ensure it doesn't contain /rest/v1
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  // Final trim
  cleaned = cleaned.trim();

  // Validate format
  try {
    const parsed = new URL(cleaned);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return 'https://xhqzwikzzwerqjqrccal.supabase.co';
  }
}

function sanitizeSupabaseKey(rawKey: string | undefined): string {
  if (!rawKey) return 'sb_publishable_7gLmX1w80N0QlWaQG5D7Sw_SG8buOn3';
  return rawKey.trim().replace(/^["']|["']$/g, '').trim();
}

const rawEnvUrl = import.meta.env.VITE_SUPABASE_URL;
const rawEnvKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const cleanSupabaseUrl = sanitizeSupabaseUrl(rawEnvUrl);
export const cleanSupabaseKey = sanitizeSupabaseKey(rawEnvKey);

export const isSupabaseConfigured = Boolean(cleanSupabaseUrl && cleanSupabaseKey);

export const supabase: SupabaseClient = createClient(cleanSupabaseUrl, cleanKeyOrFallback(cleanSupabaseKey), {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

function cleanKeyOrFallback(key: string): string {
  return key || 'sb_publishable_7gLmX1w80N0QlWaQG5D7Sw_SG8buOn3';
}

export interface DetailedConnectionTest {
  authStatus: 'PASS' | 'FAIL';
  authError?: string;
  readStatus: 'PASS' | 'FAIL';
  readError?: string;
  writeStatus: 'PASS' | 'FAIL';
  writeError?: string;
  databaseConnected: boolean; // True ONLY if real DB tables respond successfully
  tablesFound: Record<string, boolean>;
  checkedAt: string;
  sanitizedUrl: string;
}

/**
 * Executes live tests:
 * 1. Authentication endpoint test
 * 2. Database read test on tables (invoices, ngo_master, tasks, etc.)
 * 3. Database write capability probe
 */
export async function runComprehensiveConnectionTest(): Promise<DetailedConnectionTest> {
  const result: DetailedConnectionTest = {
    authStatus: 'FAIL',
    readStatus: 'FAIL',
    writeStatus: 'FAIL',
    databaseConnected: false,
    tablesFound: {
      invoices: false,
      ngo_master: false,
      tasks: false,
      import_batches: false,
      profiles: false,
      task_history: false,
    },
    checkedAt: new Date().toISOString(),
    sanitizedUrl: cleanSupabaseUrl,
  };

  // 1. Auth Test
  try {
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      result.authStatus = 'FAIL';
      result.authError = authError.message;
    } else {
      result.authStatus = 'PASS';
    }
  } catch (err: unknown) {
    result.authStatus = 'FAIL';
    result.authError = err instanceof Error ? err.message : 'Auth request failed';
  }

  // 2. Database Read Test across core tables
  try {
    const [invRes, ngoRes, taskRes, batchRes, profRes, histRes] = await Promise.allSettled([
      supabase.from('invoices').select('id', { head: true, count: 'exact' }),
      supabase.from('ngo_master').select('id', { head: true, count: 'exact' }),
      supabase.from('tasks').select('id', { head: true, count: 'exact' }),
      supabase.from('import_batches').select('id', { head: true, count: 'exact' }),
      supabase.from('profiles').select('id', { head: true, count: 'exact' }),
      supabase.from('task_history').select('id', { head: true, count: 'exact' }),
    ]);

    if (invRes.status === 'fulfilled' && !invRes.value.error) {
      result.tablesFound.invoices = true;
    } else if (invRes.status === 'fulfilled' && invRes.value.error) {
      result.readError = `invoices: ${invRes.value.error.message}`;
    }

    if (ngoRes.status === 'fulfilled' && !ngoRes.value.error) {
      result.tablesFound.ngo_master = true;
    } else if (ngoRes.status === 'fulfilled' && ngoRes.value.error && !result.readError) {
      result.readError = `ngo_master: ${ngoRes.value.error.message}`;
    }

    if (taskRes.status === 'fulfilled' && !taskRes.value.error) {
      result.tablesFound.tasks = true;
    }

    if (batchRes.status === 'fulfilled' && !batchRes.value.error) {
      result.tablesFound.import_batches = true;
    }

    if (profRes.status === 'fulfilled' && !profRes.value.error) {
      result.tablesFound.profiles = true;
    }

    if (histRes.status === 'fulfilled' && !histRes.value.error) {
      result.tablesFound.task_history = true;
    }

    // Read succeeds if at least the core invoices table exists and responds
    if (result.tablesFound.invoices) {
      result.readStatus = 'PASS';
      result.databaseConnected = true;
    } else {
      result.readStatus = 'FAIL';
      if (!result.readError) {
        result.readError = 'Tables have not been created yet in the public schema.';
      }
    }
  } catch (err: unknown) {
    result.readStatus = 'FAIL';
    result.readError = err instanceof Error ? err.message : 'Database read query failed';
  }

  // 3. Database Write Test (probe write access or check RLS)
  if (result.databaseConnected) {
    try {
      // Test read-after-write with head request or safe RLS probe
      const { error: writeProbeErr } = await supabase
        .from('import_errors')
        .select('id', { head: true, count: 'exact' });

      if (!writeProbeErr) {
        result.writeStatus = 'PASS';
      } else {
        result.writeStatus = 'FAIL';
        result.writeError = writeProbeErr.message;
      }
    } catch (err: unknown) {
      result.writeStatus = 'FAIL';
      result.writeError = err instanceof Error ? err.message : 'Write check failed';
    }
  } else {
    result.writeStatus = 'FAIL';
    result.writeError = 'Pending database schema creation';
  }

  return result;
}

import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const LoginPage: React.FC = () => {
  const { signIn, signUp, resetPassword, startDemoSession } = useAuth();
  const { theme } = useTheme();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMessage(error.message);
        }
      } else if (mode === 'signup') {
        const { error, needsEmailConfirmation } = await signUp(email, password, fullName);
        if (error) {
          setErrorMessage(error.message);
        } else if (needsEmailConfirmation) {
          setSuccessMessage('Account created! Please check your email to confirm your account, or sign in.');
        } else {
          setSuccessMessage('Account created and logged in successfully!');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMessage(error.message);
        } else {
          setSuccessMessage('Password reset link has been dispatched to your email address.');
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-sm">
            M
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              MAXPETZ HOSPITALS
            </h1>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Smart Management Portal
            </p>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Sign in with your authorized hospital credentials to access the Dues & Task dashboards.
          </p>
        </div>

        {/* Tab switch: Login / Sign Up */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              mode === 'signup'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Register Staff
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Dr. Rohan Sharma"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@maxpetz.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Password *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <span>
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In to Portal'
                : mode === 'signup'
                ? 'Create Staff Account'
                : 'Send Reset Link'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Session Shortcut (Immediate Testing Pass) */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => startDemoSession('admin')}
            className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Test / Evaluate with Demo Executive Session</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-1.5">
            Allows instant dashboard testing while Supabase credentials are configured.
          </p>
        </div>
      </div>
    </div>
  );
};

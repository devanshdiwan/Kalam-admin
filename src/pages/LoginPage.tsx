import React, { useState } from 'react';
import { 
  KeyRound, 
  Mail, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { KalamLogo } from '../components/common/KalamLogo';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState<string>('superadmin@gmail.com');
  const [password, setPassword] = useState<string>('ADMIN123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both Admin Email and Password.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await loginWithEmail(email.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = () => {
    setEmail('superadmin@gmail.com');
    setPassword('ADMIN123');
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Login Box */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Kalam Library Emblem Header */}
        <div className="p-8 text-center border-b border-slate-800 bg-slate-900/80">
          <div className="flex justify-center mb-4">
            <KalamLogo size={88} />
          </div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">
            KALAM LIBRARY
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              GURSARAI
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-semibold text-slate-400 tracking-wide">
              Admin Web Panel
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
            Authorized administrative access for library management and student app administration.
          </p>
        </div>

        {/* Credentials Quick-Reference Pill */}
        <div className="mx-6 mt-6 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-200 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <ShieldCheck size={14} />
              <span>Super Admin Credentials</span>
            </div>
            <div className="text-[11px] font-mono text-slate-300">
              Email: <strong className="text-amber-300">superadmin@gmail.com</strong>
            </div>
            <div className="text-[11px] font-mono text-slate-300">
              Password: <strong className="text-amber-300">ADMIN123</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillCredentials}
            className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
          >
            Auto-fill
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-amber-400 outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-amber-400 outline-none transition-colors font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>Sign In to Admin Panel</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 text-center text-[11px] text-slate-400">
          Super Admin details and new personnel can be managed inside the panel.
        </div>

      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        KALAM LIBRARY GURSARAI • Administrative Control System
      </div>
    </div>
  );
};

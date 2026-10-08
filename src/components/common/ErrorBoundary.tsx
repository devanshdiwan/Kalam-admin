import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Kalam Admin Panel Uncaught Error Boundary]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetSession = () => {
    try {
      localStorage.removeItem('kalam_active_admin_session');
      // Clear any temporary broken state
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <ShieldAlert size={28} />
            </div>

            <div>
              <h1 className="text-lg font-extrabold text-slate-100 tracking-tight">
                Kalam Library Admin Panel
              </h1>
              <p className="text-xs text-rose-400 font-semibold mt-1">
                Display Recovery Mode
              </p>
              <p className="text-xs text-slate-400 mt-2">
                The panel encountered an unexpected rendering note. Your administrative data remains safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Error details:</span>
                <p className="text-xs text-rose-300 font-mono mt-0.5 break-all">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Reload Panel</span>
              </button>

              <button
                onClick={this.handleResetSession}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Reset to Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

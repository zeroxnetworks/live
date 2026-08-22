import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  tabName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AdminErrorBoundary] Caught error in admin tab:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/30 text-slate-200 my-4 space-y-3 shadow-lg">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <span className="p-1 rounded bg-amber-500/10 border border-amber-500/20">⚠️</span>
            <span>Module Load Issue ({this.props.tabName || "Admin Tab"})</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This admin module encountered a runtime exception or data snapshot error. The rest of the Admin Portal remains active and fully functional.
          </p>
          {this.state.error && (
            <pre className="p-3 bg-slate-950 text-[11px] font-mono text-red-300 rounded-xl border border-slate-800 overflow-x-auto max-h-32">
              {this.state.error.message || String(this.state.error)}
            </pre>
          )}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-white transition-colors cursor-pointer"
            >
              Retry Loading Module
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default AdminErrorBoundary;

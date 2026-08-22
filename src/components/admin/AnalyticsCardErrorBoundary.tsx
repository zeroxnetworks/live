import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  cardTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AnalyticsCardErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("[AnalyticsCardErrorBoundary] Caught card error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{this.props.cardTitle ? `${this.props.cardTitle}: ` : ""}Data temporarily unavailable</span>
          </div>
          <p className="text-[11px] text-slate-500">
            This card could not render due to malformed or incomplete analytics data.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-2.5 py-1 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition cursor-pointer"
          >
            Retry Card
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

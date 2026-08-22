import React from "react";
import { evaluatePasswordStrength } from "../lib/passwordUtils";
import { Check, X, ShieldAlert, ShieldCheck } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
}

export default function PasswordStrengthIndicator({
  password,
  showDetails = true
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const evaluation = evaluatePasswordStrength(password);

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 space-y-2.5 transition-all text-xs">
      {/* Top Bar: Label & Level Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-400 flex items-center gap-1.5">
          {evaluation.isValid ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          )}
          Protection Level:
        </span>
        <span className={`px-2 py-0.5 rounded-md border font-bold text-[11px] uppercase tracking-wider ${evaluation.badgeBg}`}>
          {evaluation.badgeText}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 rounded-full"
          style={{
            width: `${evaluation.percentage}%`,
            backgroundColor: evaluation.color
          }}
        />
      </div>

      {/* Rejection / Formula Notice */}
      {!evaluation.isValid && (
        <div className="text-[11px] text-red-400/90 font-medium bg-red-950/30 border border-red-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
          <X className="w-3.5 h-3.5 shrink-0 text-red-400" />
          <span>Poor password level is not accepted. Please fulfill the formula rules below.</span>
        </div>
      )}

      {/* Detailed Formula Checklist */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] border-t border-slate-800/80 text-slate-300">
          <div className={`flex items-center gap-1.5 ${evaluation.lengthValid ? "text-emerald-400" : "text-slate-500"}`}>
            {evaluation.lengthValid ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <X className="w-3 h-3 text-slate-500 shrink-0" />}
            <span>8–16 Characters ({password.length}/16)</span>
          </div>

          <div className={`flex items-center gap-1.5 ${evaluation.hasUppercase ? "text-emerald-400" : "text-slate-500"}`}>
            {evaluation.hasUppercase ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <X className="w-3 h-3 text-slate-500 shrink-0" />}
            <span>1 Uppercase (A-Z)</span>
          </div>

          <div className={`flex items-center gap-1.5 ${evaluation.hasLowercase ? "text-emerald-400" : "text-slate-500"}`}>
            {evaluation.hasLowercase ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <X className="w-3 h-3 text-slate-500 shrink-0" />}
            <span>1 Lowercase (a-z)</span>
          </div>

          <div className={`flex items-center gap-1.5 ${evaluation.hasNumber ? "text-emerald-400" : "text-slate-500"}`}>
            {evaluation.hasNumber ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <X className="w-3 h-3 text-slate-500 shrink-0" />}
            <span>1 Number (0-9)</span>
          </div>

          <div className={`col-span-2 flex items-center gap-1.5 ${evaluation.hasSpecial ? "text-emerald-400" : "text-slate-500"}`}>
            {evaluation.hasSpecial ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <X className="w-3 h-3 text-slate-500 shrink-0" />}
            <span>1 Special Symbol (!@#$%^&*)</span>
          </div>
        </div>
      )}
    </div>
  );
}

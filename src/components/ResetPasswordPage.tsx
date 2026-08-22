import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw,
  Mail,
  User,
  Shield,
  KeyRound
} from "lucide-react";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import { evaluatePasswordStrength } from "../lib/passwordUtils";

interface ResetPasswordPageProps {
  token: string;
  onOpenLogin: () => void;
  onClose?: () => void;
}

export default function ResetPasswordPage({
  token,
  onOpenLogin,
  onClose
}: ResetPasswordPageProps) {
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string>("");
  const [accountUsername, setAccountUsername] = useState<string>("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Verify token on mount
  useEffect(() => {
    let isMounted = true;
    const verifyToken = async () => {
      if (!token) {
        if (isMounted) {
          setVerifying(false);
          setTokenValid(false);
          setErrorMessage("Password reset link is missing or malformed.");
        }
        return;
      }

      try {
        setVerifying(true);
        const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.valid) {
          setTokenValid(true);
          setAccountEmail(data.email || "");
          setAccountUsername(data.username || "");
          setErrorMessage(null);
        } else {
          setTokenValid(false);
          setErrorMessage(data.message || "This password reset link is expired or no longer valid.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setTokenValid(false);
        setErrorMessage("Unable to verify reset link. Please check your network connection.");
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newPassword) {
      setFormError("Please enter a new password.");
      return;
    }

    const evaluation = evaluatePasswordStrength(newPassword);
    if (!evaluation.isValid) {
      setFormError("Password does not meet required security formula (8–16 characters, uppercase, lowercase, number, and special character).");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match. Please verify both fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/complete-reset-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update password.");
      }

      setResetSuccess(true);
      // Clean query parameter from URL without page reload
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to update password. Please try again or request a new reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-[#00AEEF]/20 selection:text-[#00AEEF] relative overflow-hidden">
      {/* Background glow ambiance */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00AEEF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-slate-950 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10 space-y-6"
      >
        {/* ZeroX Network Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00AEEF] to-blue-600 flex items-center justify-center text-white shadow-lg shadow-[#00AEEF]/25">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-2xl font-black tracking-wider">
            <span className="text-white">ZEROX</span>
            <span className="text-[#00AEEF]">NETWORK</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">
            Secure Authentication Portal
          </p>
        </div>

        {/* LOADING STATE */}
        {verifying && (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00AEEF] animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">
              Verifying secure password reset authorization...
            </p>
          </div>
        )}

        {/* INVALID / EXPIRED STATE */}
        {!verifying && !tokenValid && !resetSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5"
          >
            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                Password Reset Link Invalid
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {errorMessage || "This password reset link is expired or no longer valid."}
              </p>
              <div className="text-[11px] text-slate-400 bg-black/40 rounded-lg p-2.5 border border-slate-800/80">
                Password reset links are time-limited (1 hour) and single-use for account protection.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.history && window.history.replaceState) {
                  const cleanUrl = window.location.origin + window.location.pathname;
                  window.history.replaceState({}, document.title, cleanUrl);
                }
                onOpenLogin();
              }}
              className="w-full bg-[#00AEEF] hover:bg-[#0096ce] text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00AEEF]/20 active:scale-[0.98]"
            >
              <span>Return to Login / Request Reset</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* SUCCESS STATE */}
        {!verifying && resetSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5"
          >
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Password Updated Successfully
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your password has been changed successfully. You can now log in with your new password.
              </p>
              <div className="text-[11px] text-emerald-400/90 bg-emerald-950/30 rounded-lg p-2.5 border border-emerald-500/20">
                🔒 Confirmation alert dispatched from <strong className="text-white">zeroxnetworks@gmail.com</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.history && window.history.replaceState) {
                  const cleanUrl = window.location.origin + window.location.pathname;
                  window.history.replaceState({}, document.title, cleanUrl);
                }
                onOpenLogin();
              }}
              className="w-full bg-gradient-to-r from-[#00AEEF] to-blue-600 hover:from-[#0096ce] hover:to-blue-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00AEEF]/25 active:scale-[0.98]"
            >
              <span>Continue to Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ACTIVE RESET FORM */}
        {!verifying && tokenValid && !resetSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Context Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-[#00AEEF]" />
                <div>
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Resetting Account</div>
                  <div className="font-semibold text-white truncate max-w-[200px]">{accountEmail || accountUsername}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                Verified
              </span>
            </div>

            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-950/50 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </motion.div>
            )}

            {/* New Password Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="e.g. Abcdef7!"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 rounded-xl pl-10 pr-12 py-3 text-sm font-semibold focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-md cursor-pointer transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Checklist */}
              {newPassword && (
                <PasswordStrengthIndicator password={newPassword} showDetails={true} />
              )}
            </div>

            {/* Confirm New Password Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 rounded-xl pl-10 pr-12 py-3 text-sm font-semibold focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-md cursor-pointer transition-colors"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Passwords Match Feedback */}
              {confirmPassword && (
                <div className={`text-[11px] font-medium flex items-center gap-1.5 pt-1 ${passwordsMatch ? "text-emerald-400" : "text-amber-400"}`}>
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Passwords do not match yet</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || (newPassword ? !evaluatePasswordStrength(newPassword).isValid : true) || !passwordsMatch}
              className="w-full mt-2 bg-gradient-to-r from-[#00AEEF] to-blue-600 hover:from-[#0096ce] hover:to-blue-700 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00AEEF]/25 active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
          ZeroX Network Security Protocol &bull; 256-bit Encrypted
        </div>
      </motion.div>
    </div>
  );
}

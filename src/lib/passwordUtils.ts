export interface PasswordStrengthResult {
  score: number; // 0 to 4
  level: "Poor" | "Low" | "Medium" | "Strong" | "Powerful";
  color: string; // Tailwind color class or hex
  badgeBg: string;
  badgeText: string;
  percentage: number;
  lengthValid: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isValid: boolean; // Must be true to allow submission (never accept Poor or invalid)
  feedback: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const len = password.length;
  const lengthValid = len >= 8 && len <= 16;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  const criteriaMetCount = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  // Check if password satisfies formula: length 8-16 + all 4 types
  const satisfiesAllFormula = lengthValid && criteriaMetCount === 4;

  if (!password || len < 8 || len > 16 || criteriaMetCount < 3) {
    return {
      score: 0,
      level: "Poor",
      color: "#ef4444", // Red
      badgeBg: "bg-red-500/10 border-red-500/30 text-red-500",
      badgeText: "POOR (REJECTED)",
      percentage: Math.min(20, Math.max(5, (len / 16) * 20)),
      lengthValid,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      isValid: false,
      feedback: "Password is poor or fails formula rules. Requires 8-16 chars with uppercase, lowercase, number, and special symbol."
    };
  }

  if (!satisfiesAllFormula) {
    return {
      score: 1,
      level: "Low",
      color: "#f97316", // Orange
      badgeBg: "bg-orange-500/10 border-orange-500/30 text-orange-500",
      badgeText: "LOW PROTECTION",
      percentage: 40,
      lengthValid,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      isValid: false,
      feedback: "Low protection. You must include all 4 required character types."
    };
  }

  // At this point, length is 8-16 AND all 4 types are present
  if (len >= 12 && len <= 16) {
    return {
      score: 4,
      level: "Powerful",
      color: "#06b6d4", // Cyan
      badgeBg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
      badgeText: "🔥 POWERFUL",
      percentage: 100,
      lengthValid,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      isValid: true,
      feedback: "Maximum protection level! Military-grade password security."
    };
  }

  if (len >= 10) {
    return {
      score: 3,
      level: "Strong",
      color: "#10b981", // Emerald Green
      badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      badgeText: "🛡️ STRONG",
      percentage: 85,
      lengthValid,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      isValid: true,
      feedback: "High protection level. Strong defence against unauthorized access."
    };
  }

  return {
    score: 2,
    level: "Medium",
    color: "#eab308", // Yellow / Amber
    badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    badgeText: "⚡ MEDIUM",
    percentage: 65,
    lengthValid,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    isValid: true,
    feedback: "Good protection level. Meets standard security formula."
  };
}

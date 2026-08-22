/**
 * ZeroX Network - Centralized Safe Numeric & Formatting Utility
 * Prevents any "t.toFixed is not a function", NaN, null, or undefined runtime errors.
 */

export function toSafeNumber(val: any, fallback: number = 0): number {
  if (val === null || val === undefined || val === "" || typeof val === "boolean") {
    return fallback;
  }
  if (typeof val === "number") {
    return isNaN(val) || !isFinite(val) ? fallback : val;
  }
  if (typeof val === "string") {
    const cleanStr = val.trim().replace(/,/g, "");
    if (cleanStr === "") return fallback;
    const parsed = Number(cleanStr);
    return isNaN(parsed) || !isFinite(parsed) ? fallback : parsed;
  }
  const num = Number(val);
  return isNaN(num) || !isFinite(num) ? fallback : num;
}

export function safeFixed(val: any, digits: number = 2, fallback: number = 0): string {
  try {
    const num = toSafeNumber(val, fallback);
    return num.toFixed(digits);
  } catch {
    return (fallback || 0).toFixed(digits);
  }
}

export function safeLocaleString(val: any, fallback: number = 0, options?: Intl.NumberFormatOptions): string {
  try {
    const num = toSafeNumber(val, fallback);
    return options ? num.toLocaleString(undefined, options) : num.toLocaleString();
  } catch {
    return (fallback || 0).toLocaleString();
  }
}

export function safePercent(numerator: any, denominator: any, digits: number = 1): string {
  try {
    const num = toSafeNumber(numerator, 0);
    const den = toSafeNumber(denominator, 0);
    if (den === 0) return (0).toFixed(digits);
    return toSafeNumber((num / den) * 100, 0).toFixed(digits);
  } catch {
    return (0).toFixed(digits);
  }
}

export function safeRound(val: any, fallback: number = 0): number {
  return Math.round(toSafeNumber(val, fallback));
}

export function safeFloor(val: any, fallback: number = 0): number {
  return Math.floor(toSafeNumber(val, fallback));
}

export function safeCeil(val: any, fallback: number = 0): number {
  return Math.ceil(toSafeNumber(val, fallback));
}

export function toSafeDate(val: any): Date {
  if (val === null || val === undefined || val === '') return new Date();
  
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? new Date() : val;
  }

  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') {
      try {
        const d = val.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {}
    }
    if (typeof val.seconds === 'number') {
      const d = new Date(val.seconds * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }

  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return new Date();
    const ms = val < 1e11 ? val * 1000 : val;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return new Date();
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      const ms = num < 1e11 ? num * 1000 : num;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  return new Date();
}

export function safeTimeString(val: any, fallback: string = 'N/A'): string {
  try {
    const d = toSafeDate(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleTimeString();
  } catch {
    return fallback;
  }
}

export function safeDateString(val: any, fallback: string = 'N/A'): string {
  try {
    const d = toSafeDate(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toDateString();
  } catch {
    return fallback;
  }
}

export function safeDateTimeString(val: any, fallback: string = 'N/A'): string {
  try {
    const d = toSafeDate(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString();
  } catch {
    return fallback;
  }
}

export function safeISOString(val: any): string {
  try {
    const d = toSafeDate(val);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function safeTimestampMs(val: any): number {
  try {
    const d = toSafeDate(val);
    const ms = d.getTime();
    return isNaN(ms) ? Date.now() : ms;
  } catch {
    return Date.now();
  }
}



import { useState, useEffect } from "react";

export interface OrderTimerResult {
  formatted: string;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSecondsRemaining: number;
  percentRemaining: number;
}

export function useOrderTimer(expiresAt: string | number | undefined, status?: string): OrderTimerResult {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    // If order is already completed/canceled, we don't need a ticking interval
    if (status === "FINISHED" || status === "CANCELED" || status === "BANNED") {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  if (!expiresAt) {
    return {
      formatted: "--:--",
      minutes: 0,
      seconds: 0,
      isExpired: false,
      totalSecondsRemaining: 0,
      percentRemaining: 0
    };
  }

  const expiryTime = typeof expiresAt === "number" ? expiresAt : new Date(expiresAt).getTime();
  const diff = expiryTime - now;

  if (diff <= 0) {
    return {
      formatted: "00:00",
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalSecondsRemaining: 0,
      percentRemaining: 0
    };
  }

  const totalSecondsRemaining = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSecondsRemaining / 60);
  const seconds = totalSecondsRemaining % 60;
  const formatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  // Default duration reference is 20 minutes (1200 seconds)
  const percentRemaining = Math.min(100, Math.max(0, (totalSecondsRemaining / 1200) * 100));

  return {
    formatted,
    minutes,
    seconds,
    isExpired: false,
    totalSecondsRemaining,
    percentRemaining
  };
}

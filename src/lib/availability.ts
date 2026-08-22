export type ServiceAvailabilityStatus = 
  | "AVAILABLE" 
  | "OUT_OF_STOCK" 
  | "TEMPORARILY_UNAVAILABLE";

export interface AvailabilityCheckInput {
  selectedCountryKey: string | null | undefined;
  serviceKey: string | null | undefined;
  stockCount: number | null | undefined; // verified numeric stock count from provider response
  isProviderConnected: boolean; // whether provider data is valid and fresh
  lastSuccessfulSync?: number | null; // timestamp of last valid sync
  freshnessThresholdMs?: number; // default e.g. 120,000ms (2 minutes)
}

/**
 * Centralized, strict availability evaluator across ZeroX Network.
 * Used by Service List (Step 2) and Final Order Checkout (Step 3).
 *
 * Rules:
 * 1. If country or service is not selected -> "TEMPORARILY_UNAVAILABLE"
 * 2. If provider is disconnected / error AND no fresh cached data exists -> "TEMPORARILY_UNAVAILABLE"
 * 3. If stockCount is null, undefined, or NaN -> "TEMPORARILY_UNAVAILABLE" (NEVER convert null to 0 stock)
 * 4. If stockCount > 0 -> "AVAILABLE"
 * 5. If stockCount === 0 -> "OUT_OF_STOCK"
 */
export function getServiceAvailabilityStatus(input: AvailabilityCheckInput): ServiceAvailabilityStatus {
  const {
    selectedCountryKey,
    serviceKey,
    stockCount,
    isProviderConnected,
    lastSuccessfulSync,
    freshnessThresholdMs = 120000 // 2 minutes allowed freshness
  } = input;

  if (!selectedCountryKey || !serviceKey) {
    return "TEMPORARILY_UNAVAILABLE";
  }

  // Check data freshness if timestamp is available
  const now = Date.now();
  const isDataFresh = lastSuccessfulSync
    ? (now - lastSuccessfulSync) <= freshnessThresholdMs
    : true; // Default to true if connected and timestamp not tracked

  // If provider connection failed and data is stale or unverified
  if (!isProviderConnected && !isDataFresh) {
    return "TEMPORARILY_UNAVAILABLE";
  }

  // Strict stock evaluation - MUST be a valid number
  if (stockCount === null || stockCount === undefined || typeof stockCount !== "number" || Number.isNaN(stockCount)) {
    return "TEMPORARILY_UNAVAILABLE";
  }

  if (stockCount > 0) {
    return "AVAILABLE";
  }

  if (stockCount === 0) {
    return "OUT_OF_STOCK";
  }

  return "TEMPORARILY_UNAVAILABLE";
}

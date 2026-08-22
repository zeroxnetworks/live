import { adminDb } from "./firebaseAdmin";
import { getActiveSmsProvider } from "./orderEngine";
import { FiveSimAdapter, SmsProviderAdapter } from "./smsProviderAdapter";

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  providerName: string;
  status: "CONNECTED" | "AVAILABLE" | "NO_STOCK" | "DEGRADED" | "OFFLINE" | "ERROR" | "SYNCING";
  responseTimeMs: number;
  stockCount: number;
  countriesCount?: number;
  servicesCount?: number;
  diffSummary?: string;
  error?: string | null;
}

export interface InventoryDiff {
  timestamp: number;
  countriesAdded: number;
  countriesRemoved: number;
  countriesUpdated: number;
  servicesAdded: number;
  servicesRemoved: number;
  servicesUpdated: number;
  stockDelta: number;
}

export interface ProviderSyncMetrics {
  totalSyncCycles: number;
  successfulSyncCycles: number;
  failedSyncCycles: number;
  lastSyncDurationMs: number;
  lastSuccessfulSync: number;
  lastSyncAttempt: number;
  consecutiveFailures: number;
  totalStock: number;
  inStockCountries: number;
  inStockServices: number;
  totalCountries: number;
  totalServices: number;
  recentDiff: InventoryDiff | null;
  allocationStats: {
    totalAttempts: number;
    successful: number;
    failed: number;
    outOfStock: number;
  };
  recentErrors: Array<{ timestamp: string; error: string; provider: string }>;
}

export interface ProviderSyncState {
  providerId: string;
  providerName: string;
  connectionStatus: "CONNECTED" | "AVAILABLE" | "NO_STOCK" | "DEGRADED" | "OFFLINE" | "ERROR" | "SYNCING" | "UNSUPPORTED";
  apiHealthStatus: "HEALTHY" | "DEGRADED" | "OFFLINE";
  lastSyncAttempt: number;
  lastSuccessfulSync: number;
  dataVersion: number;
  totalStock: number;
  totalServices: number;
  totalCountries: number;
  inStockCountries?: number;
  inStockServices?: number;
  lastError: string | null;
  responseTimeMs: number;
  cachedPrices: Record<string, any> | null;
  cachedCountries: Record<string, any> | null;
  isSyncing: boolean;
  balance: number | null;
  balanceError: string | null;
  metrics?: ProviderSyncMetrics;
}

// Global In-Memory State & Metrics
let syncSequenceVersion = 1;

const metrics: ProviderSyncMetrics = {
  totalSyncCycles: 0,
  successfulSyncCycles: 0,
  failedSyncCycles: 0,
  lastSyncDurationMs: 0,
  lastSuccessfulSync: Date.now(),
  lastSyncAttempt: Date.now(),
  consecutiveFailures: 0,
  totalStock: 0,
  inStockCountries: 0,
  inStockServices: 0,
  totalCountries: 153,
  totalServices: 1260,
  recentDiff: null,
  allocationStats: {
    totalAttempts: 0,
    successful: 0,
    failed: 0,
    outOfStock: 0
  },
  recentErrors: []
};

// Last known good states to prevent data wipe on transient errors
let lastKnownGoodPrices: Record<string, any> | null = null;
let lastKnownGoodCountries: Record<string, any> | null = null;
let previousIndexedCountries: Set<string> = new Set();
let previousIndexedServices: Set<string> = new Set();
let previousTotalStock = 0;

let currentSyncState: ProviderSyncState = {
  providerId: "5sim_primary",
  providerName: "5Sim Primary Gateway",
  connectionStatus: "CONNECTED",
  apiHealthStatus: "HEALTHY",
  lastSyncAttempt: Date.now(),
  lastSuccessfulSync: Date.now(),
  dataVersion: 1,
  totalStock: 0,
  totalServices: 1260,
  totalCountries: 153,
  inStockCountries: 0,
  inStockServices: 0,
  lastError: null,
  responseTimeMs: 0,
  cachedPrices: null,
  cachedCountries: null,
  isSyncing: false,
  balance: null,
  balanceError: null,
  metrics
};

const syncLogs: SyncLogEntry[] = [];
let syncIntervalTimer: NodeJS.Timeout | null = null;
let isEngineRunning = false;
const DEFAULT_SYNC_INTERVAL_MS = 5000; // 5 seconds automated background synchronization
let lastFullCatalogTime = 0;

// Active Allocation Locks to prevent duplicate concurrent allocation requests
const activeAllocationLocks = new Set<string>();

export function acquireAllocationLock(userId: string, country: string, product: string): boolean {
  const lockKey = `${userId}_${country.toLowerCase().trim()}_${product.toLowerCase().trim()}`;
  if (activeAllocationLocks.has(lockKey)) {
    return false; // Already processing an allocation for this user and product
  }
  activeAllocationLocks.add(lockKey);
  // Auto-expire lock after 15 seconds to prevent permanent deadlock
  setTimeout(() => {
    activeAllocationLocks.delete(lockKey);
  }, 15000);
  return true;
}

export function releaseAllocationLock(userId: string, country: string, product: string) {
  const lockKey = `${userId}_${country.toLowerCase().trim()}_${product.toLowerCase().trim()}`;
  activeAllocationLocks.delete(lockKey);
}

export function recordAllocationMetric(result: "SUCCESS" | "FAILED" | "OUT_OF_STOCK" | "ATTEMPT") {
  metrics.allocationStats.totalAttempts++;
  if (result === "SUCCESS") metrics.allocationStats.successful++;
  else if (result === "FAILED") metrics.allocationStats.failed++;
  else if (result === "OUT_OF_STOCK") metrics.allocationStats.outOfStock++;
}

function addLog(entry: Omit<SyncLogEntry, "id">) {
  const log: SyncLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...entry
  };
  syncLogs.unshift(log);
  if (syncLogs.length > 100) {
    syncLogs.pop();
  }
}

function recordProviderError(error: string, providerName: string) {
  metrics.recentErrors.unshift({
    timestamp: new Date().toISOString(),
    error,
    provider: providerName
  });
  if (metrics.recentErrors.length > 20) {
    metrics.recentErrors.pop();
  }
}

/**
 * Perform an automatic synchronization cycle with the provider
 */
export async function performProviderSyncCycle(forceFullCatalog: boolean = false): Promise<ProviderSyncState> {
  // Overlap protection
  if (currentSyncState.isSyncing) {
    return currentSyncState;
  }

  currentSyncState.isSyncing = true;
  currentSyncState.lastSyncAttempt = Date.now();
  metrics.totalSyncCycles++;
  metrics.lastSyncAttempt = Date.now();
  const startTime = Date.now();

  try {
    const activeProvData = await getActiveSmsProvider();
    const providerName = activeProvData?.name || "5Sim Primary Gateway";
    const providerId = activeProvData?.id || "5sim_primary";
    const apiUrl = activeProvData?.apiUrl || "https://5sim.net/v1";
    const apiKey = activeProvData?.apiKey || process.env.PROVIDER_API_KEY || "";

    const adapter: SmsProviderAdapter = new FiveSimAdapter(providerId, providerName, apiUrl, apiKey);

    // 1. Provider Health & Balance Check
    const health = await adapter.checkHealth();
    const responseTimeMs = health.responseTimeMs || (Date.now() - startTime);

    if (health.status === "ERROR" || health.status === "OFFLINE") {
      metrics.failedSyncCycles++;
      metrics.consecutiveFailures++;
      const isDegraded = lastKnownGoodPrices !== null;

      currentSyncState.connectionStatus = health.status === "OFFLINE" ? "OFFLINE" : "ERROR";
      currentSyncState.apiHealthStatus = isDegraded ? "DEGRADED" : "OFFLINE";
      currentSyncState.lastError = health.error || "Provider connection failed";
      currentSyncState.balanceError = health.error || "Provider connection failed";
      currentSyncState.responseTimeMs = responseTimeMs;
      currentSyncState.providerId = providerId;
      currentSyncState.providerName = providerName;

      // PRESERVE last known good data! Do NOT wipe valid cache.
      if (lastKnownGoodPrices) {
        currentSyncState.cachedPrices = lastKnownGoodPrices;
      }
      if (lastKnownGoodCountries) {
        currentSyncState.cachedCountries = lastKnownGoodCountries;
      }

      recordProviderError(currentSyncState.lastError, providerName);

      addLog({
        timestamp: new Date().toISOString(),
        providerName,
        status: currentSyncState.connectionStatus,
        responseTimeMs,
        stockCount: currentSyncState.totalStock,
        error: currentSyncState.lastError
      });

      await saveSyncStateToFirestore();
      return currentSyncState;
    }

    // 2. Determine if full price & country matrix should be refreshed
    const shouldFetchFullCatalog = forceFullCatalog || !lastKnownGoodPrices || (Date.now() - lastFullCatalogTime >= 30000);

    if (!shouldFetchFullCatalog && lastKnownGoodPrices) {
      // Lightweight 5-second health & latency sync tick
      metrics.successfulSyncCycles++;
      metrics.consecutiveFailures = 0;
      metrics.lastSuccessfulSync = Date.now();
      metrics.lastSyncDurationMs = Date.now() - startTime;

      currentSyncState.providerId = providerId;
      currentSyncState.providerName = providerName;
      currentSyncState.lastSuccessfulSync = Date.now();
      currentSyncState.lastError = null;
      currentSyncState.connectionStatus = currentSyncState.totalStock > 0 ? "AVAILABLE" : "CONNECTED";
      currentSyncState.apiHealthStatus = "HEALTHY";
      currentSyncState.responseTimeMs = responseTimeMs;
      if (typeof health.balance === "number" && !isNaN(health.balance)) {
        currentSyncState.balance = health.balance;
        currentSyncState.balanceError = null;
      }
      currentSyncState.metrics = { ...metrics };

      addLog({
        timestamp: new Date().toISOString(),
        providerName,
        status: currentSyncState.connectionStatus,
        responseTimeMs,
        stockCount: currentSyncState.totalStock,
        countriesCount: currentSyncState.totalCountries,
        servicesCount: currentSyncState.totalServices,
        error: null
      });

      return currentSyncState;
    }

    // Full catalog synchronization: Fetch full prices/stock matrix and country catalog in parallel
    const [pricesRes, countriesRes] = await Promise.all([
      adapter.getPrices(),
      adapter.getCountries().catch(() => ({ status: "ERROR", data: null }))
    ]);

    if (pricesRes.status === "OFFLINE" || pricesRes.status === "ERROR") {
      metrics.failedSyncCycles++;
      metrics.consecutiveFailures++;
      currentSyncState.connectionStatus = pricesRes.status === "OFFLINE" ? "OFFLINE" : "ERROR";
      currentSyncState.apiHealthStatus = lastKnownGoodPrices !== null ? "DEGRADED" : "OFFLINE";
      currentSyncState.lastError = pricesRes.error || "Failed to fetch prices matrix";
      currentSyncState.responseTimeMs = Date.now() - startTime;

      // Keep last known good state
      if (lastKnownGoodPrices) {
        currentSyncState.cachedPrices = lastKnownGoodPrices;
      }

      recordProviderError(currentSyncState.lastError, providerName);

      addLog({
        timestamp: new Date().toISOString(),
        providerName,
        status: currentSyncState.connectionStatus,
        responseTimeMs: currentSyncState.responseTimeMs,
        stockCount: currentSyncState.totalStock,
        error: currentSyncState.lastError
      });

      await saveSyncStateToFirestore();
      return currentSyncState;
    }

    // 3. Successful sync: Calculate inventory reconciliation & diffs
    const priceData = pricesRes.data || {};
    let calculatedStock = 0;
    let inStockCountryCount = 0;
    const currentCountriesSet = new Set<string>();
    const currentServicesSet = new Set<string>();
    const inStockServicesSet = new Set<string>();

    if (typeof priceData === "object" && priceData !== null) {
      const topKeys = Object.keys(priceData);

      topKeys.forEach((cKey) => {
        const countryObj = priceData[cKey];
        currentCountriesSet.add(cKey);
        let countryStock = 0;

        if (typeof countryObj === "object" && countryObj !== null) {
          Object.keys(countryObj).forEach((sKey) => {
            currentServicesSet.add(sKey);
            const serviceObj = countryObj[sKey];
            let serviceStock = 0;

            if (typeof serviceObj === "object" && serviceObj !== null) {
              Object.keys(serviceObj).forEach((opKey) => {
                const opData = serviceObj[opKey];
                if (opData && typeof opData.count === "number") {
                  calculatedStock += opData.count;
                  countryStock += opData.count;
                  serviceStock += opData.count;
                }
              });
            }

            if (serviceStock > 0) {
              inStockServicesSet.add(sKey);
            }
          });
        }

        if (countryStock > 0) {
          inStockCountryCount++;
        }
      });
    }

    // Calculate Diffs
    let countriesAdded = 0;
    let countriesRemoved = 0;
    currentCountriesSet.forEach(c => {
      if (!previousIndexedCountries.has(c)) countriesAdded++;
    });
    previousIndexedCountries.forEach(c => {
      if (!currentCountriesSet.has(c)) countriesRemoved++;
    });

    let servicesAdded = 0;
    let servicesRemoved = 0;
    currentServicesSet.forEach(s => {
      if (!previousIndexedServices.has(s)) servicesAdded++;
    });
    previousIndexedServices.forEach(s => {
      if (!currentServicesSet.has(s)) servicesRemoved++;
    });

    const stockDelta = calculatedStock - previousTotalStock;
    const diff: InventoryDiff = {
      timestamp: Date.now(),
      countriesAdded,
      countriesRemoved,
      countriesUpdated: currentCountriesSet.size,
      servicesAdded,
      servicesRemoved,
      servicesUpdated: currentServicesSet.size,
      stockDelta
    };

    previousIndexedCountries = new Set(currentCountriesSet);
    previousIndexedServices = new Set(currentServicesSet);
    previousTotalStock = calculatedStock;
    lastFullCatalogTime = Date.now();

    // Update Cache & State
    syncSequenceVersion++;
    lastKnownGoodPrices = priceData;
    if (countriesRes.status === "CONNECTED" && countriesRes.data) {
      lastKnownGoodCountries = countriesRes.data;
    }

    metrics.successfulSyncCycles++;
    metrics.consecutiveFailures = 0;
    metrics.lastSuccessfulSync = Date.now();
    metrics.lastSyncDurationMs = Date.now() - startTime;
    metrics.totalStock = calculatedStock;
    metrics.totalCountries = currentCountriesSet.size > 0 ? currentCountriesSet.size : metrics.totalCountries;
    metrics.totalServices = currentServicesSet.size > 0 ? currentServicesSet.size : metrics.totalServices;
    metrics.inStockCountries = inStockCountryCount;
    metrics.inStockServices = inStockServicesSet.size;
    metrics.recentDiff = diff;

    currentSyncState.providerId = providerId;
    currentSyncState.providerName = providerName;
    currentSyncState.cachedPrices = priceData;
    if (countriesRes.status === "CONNECTED" && countriesRes.data) {
      currentSyncState.cachedCountries = countriesRes.data;
    } else if (lastKnownGoodCountries) {
      currentSyncState.cachedCountries = lastKnownGoodCountries;
    }

    currentSyncState.dataVersion = syncSequenceVersion;
    currentSyncState.totalStock = calculatedStock;
    currentSyncState.totalCountries = metrics.totalCountries;
    currentSyncState.totalServices = metrics.totalServices;
    currentSyncState.inStockCountries = inStockCountryCount;
    currentSyncState.inStockServices = inStockServicesSet.size;
    currentSyncState.lastSuccessfulSync = Date.now();
    currentSyncState.lastError = null;
    currentSyncState.connectionStatus = calculatedStock > 0 ? "AVAILABLE" : (pricesRes.status === "NO_STOCK" ? "NO_STOCK" : "CONNECTED");
    currentSyncState.apiHealthStatus = "HEALTHY";
    currentSyncState.responseTimeMs = responseTimeMs;
    currentSyncState.metrics = { ...metrics };

    if (typeof health.balance === "number" && !isNaN(health.balance)) {
      currentSyncState.balance = health.balance;
      currentSyncState.balanceError = null;
      if (activeProvData?.id) {
        try {
          await adminDb.collection("sms_providers").doc(activeProvData.id).update({
            balance: health.balance,
            lastSyncTime: new Date().toISOString()
          });
        } catch (e) {}
      }
    } else {
      currentSyncState.balance = null;
      currentSyncState.balanceError = "Missing numeric balance in API profile response";
    }

    addLog({
      timestamp: new Date().toISOString(),
      providerName,
      status: currentSyncState.connectionStatus,
      responseTimeMs: currentSyncState.responseTimeMs,
      stockCount: calculatedStock,
      countriesCount: currentCountriesSet.size,
      servicesCount: currentServicesSet.size,
      diffSummary: stockDelta !== 0 ? `Stock Δ: ${stockDelta > 0 ? "+" : ""}${stockDelta}` : undefined,
      error: null
    });

    await saveSyncStateToFirestore();
    return currentSyncState;
  } catch (err: any) {
    metrics.failedSyncCycles++;
    metrics.consecutiveFailures++;
    currentSyncState.connectionStatus = "ERROR";
    currentSyncState.apiHealthStatus = lastKnownGoodPrices !== null ? "DEGRADED" : "OFFLINE";
    currentSyncState.lastError = err?.message || "Unexpected synchronization failure";
    currentSyncState.balance = null;
    currentSyncState.balanceError = err?.message || "Unexpected synchronization failure";
    currentSyncState.responseTimeMs = Date.now() - startTime;

    if (lastKnownGoodPrices) {
      currentSyncState.cachedPrices = lastKnownGoodPrices;
    }

    recordProviderError(currentSyncState.lastError, currentSyncState.providerName);

    addLog({
      timestamp: new Date().toISOString(),
      providerName: currentSyncState.providerName,
      status: "ERROR",
      responseTimeMs: currentSyncState.responseTimeMs,
      stockCount: currentSyncState.totalStock,
      error: currentSyncState.lastError
    });

    return currentSyncState;
  } finally {
    currentSyncState.isSyncing = false;
  }
}

async function saveSyncStateToFirestore() {
  try {
    const docData = {
      providerId: currentSyncState.providerId,
      providerName: currentSyncState.providerName,
      connectionStatus: currentSyncState.connectionStatus,
      apiHealthStatus: currentSyncState.apiHealthStatus,
      lastSyncAttempt: currentSyncState.lastSyncAttempt,
      lastSuccessfulSync: currentSyncState.lastSuccessfulSync,
      totalStock: currentSyncState.totalStock,
      totalServices: currentSyncState.totalServices,
      totalCountries: currentSyncState.totalCountries,
      inStockCountries: currentSyncState.inStockCountries || 0,
      inStockServices: currentSyncState.inStockServices || 0,
      lastError: currentSyncState.lastError,
      responseTimeMs: currentSyncState.responseTimeMs,
      updatedAt: new Date().toISOString()
    };

    await adminDb.collection("sms_provider_sync").doc("active_status").set(docData, { merge: true });
  } catch (e: any) {
    if (!e?.message?.includes("Quota")) {
      console.warn("[Provider Sync Engine] Firestore sync save warning:", e?.message || e);
    }
  }
}

/**
 * Start the automatic continuous background synchronization engine
 * Runs every ~15 seconds with safe jitter and error backoff
 */
export function startProviderSyncEngine() {
  if (isEngineRunning) return;
  isEngineRunning = true;

  console.log(`[Provider Sync Engine] Starting continuous ${DEFAULT_SYNC_INTERVAL_MS / 1000}s auto-sync scheduler...`);

  // Run initial cycle immediately
  performProviderSyncCycle();

  // Controlled recursive timer: waits for current cycle to complete, then waits safe interval
  const scheduleNextTick = () => {
    // If consecutive failures occur, back off gracefully (up to 45s) to respect provider rate limits
    const backoffDelay = metrics.consecutiveFailures > 2
      ? Math.min(45000, DEFAULT_SYNC_INTERVAL_MS + (metrics.consecutiveFailures * 5000))
      : DEFAULT_SYNC_INTERVAL_MS;

    syncIntervalTimer = setTimeout(async () => {
      await performProviderSyncCycle();
      if (isEngineRunning) {
        scheduleNextTick();
      }
    }, backoffDelay);
  };

  scheduleNextTick();
}

export function stopProviderSyncEngine() {
  isEngineRunning = false;
  if (syncIntervalTimer) {
    clearTimeout(syncIntervalTimer);
    syncIntervalTimer = null;
  }
}

export function getProviderSyncState(): ProviderSyncState {
  return {
    ...currentSyncState,
    metrics: { ...metrics }
  };
}

export function getProviderSyncMetrics(): ProviderSyncMetrics {
  return { ...metrics };
}

export function getSyncLogs(): SyncLogEntry[] {
  return [...syncLogs];
}

export async function forceProviderSync(): Promise<ProviderSyncState> {
  currentSyncState.isSyncing = false; // Reset lock if force triggered
  return await performProviderSyncCycle(true);
}

export function normalizeCountryKey(country: string): string {
  if (!country) return "";
  const norm = country.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (norm === "uk" || norm === "united_kingdom" || norm === "britain" || norm === "great_britain") return "england";
  if (norm === "us" || norm === "united_states" || norm === "america") return "usa";
  return norm;
}

/**
 * ZeroX Virtual Numbers Customer Selling Price Formula
 * Applies ONLY to Virtual Numbers tab.
 */
export function calculateVirtualNumberCustomerPrice(
  providerCostUSD: number,
  cryptoRate: number = 278,
  minPricePKR: number = 50
): {
  providerCostPKR: number;
  customerPricePKR: number;
  customerPriceUSD: number;
} {
  const rate = cryptoRate > 0 ? cryptoRate : 278;
  const providerCostPKR = Number((providerCostUSD * rate).toFixed(2));
  let customerPricePKR: number;

  const actualMin = minPricePKR || 50;

  // Exact pricing rule:
  // If provider cost is LESS THAN Rs 50: Customer Price = (Provider Cost × 1.30) + Rs 50
  // If provider cost is Rs 50 OR ABOVE: Customer Price = Provider Cost × 1.30
  if (providerCostPKR < actualMin) {
    customerPricePKR = (providerCostPKR * 1.30) + actualMin;
  } else {
    customerPricePKR = providerCostPKR * 1.30;
  }

  // Ensure minimum price floor
  if (customerPricePKR < actualMin) {
    customerPricePKR = actualMin;
  }

  customerPricePKR = Number(customerPricePKR.toFixed(2));
  const customerPriceUSD = Number((customerPricePKR / rate).toFixed(4));

  return {
    providerCostPKR,
    customerPricePKR,
    customerPriceUSD
  };
}

export function calculateFinalCustomerPrice(
  serviceKey: string,
  providerCostUSD: number,
  settings: {
    cryptoRate?: number;
    customPrices?: Record<string, number>;
    virtualNumberMinimumPricePKR?: number;
  }
): number {
  const rate = settings.cryptoRate || 278;
  const minPricePKR = settings.virtualNumberMinimumPricePKR || 50;
  const { customerPricePKR } = calculateVirtualNumberCustomerPrice(providerCostUSD, rate, minPricePKR);
  
  let finalPKR = customerPricePKR;

  // Apply custom price override if it's higher than the calculated price
  if (settings.customPrices && settings.customPrices[serviceKey] !== undefined && settings.customPrices[serviceKey] > 0) {
    const overridePKR = settings.customPrices[serviceKey];
    if (overridePKR >= finalPKR) {
      finalPKR = overridePKR;
    }
  }

  // Ensure minimum price from settings
  const minPrice = settings.virtualNumberMinimumPricePKR || 50;
  if (finalPKR < minPrice) {
    finalPKR = minPrice;
  }

  return Number((finalPKR / rate).toFixed(4));
}

export interface OperatorPricingInfo {
  key: string;
  name: string;
  cost: number; // provider USD cost
  count: number; // stock count
}

export function getOperatorPricingDetails(country: string, service: string): {
  countryKey: string;
  serviceKey: string;
  allOperators: OperatorPricingInfo[];
  inStockOperators: OperatorPricingInfo[];
  cheapestInStockOperator: OperatorPricingInfo | null;
  totalStock: number;
  lastSyncTime: number;
} {
  const syncState = getProviderSyncState();
  const rawPrices = syncState.cachedPrices || {};
  const countryKey = normalizeCountryKey(country);
  const serviceKey = (service || "").toLowerCase().trim();

  let countryObj = rawPrices[countryKey] || rawPrices[country.toLowerCase().trim()];
  if (!countryObj) {
    const matchedKey = Object.keys(rawPrices).find(
      k => normalizeCountryKey(k) === countryKey
    );
    if (matchedKey) countryObj = rawPrices[matchedKey];
  }

  const allOperators: OperatorPricingInfo[] = [];
  const operatorMap = new Map<string, { cost: number; count: number }>();

  if (countryObj && typeof countryObj === "object") {
    // Format A: countryObj[serviceKey][operatorKey]
    if (countryObj[serviceKey] && typeof countryObj[serviceKey] === "object") {
      const ops = countryObj[serviceKey];
      Object.keys(ops).forEach((opKey) => {
        const item = ops[opKey];
        if (item && typeof item === "object") {
          operatorMap.set(opKey, {
            cost: Number(item.cost) || 0,
            count: Number(item.count) || 0
          });
        }
      });
    }

    // Format B: countryObj[operatorKey][serviceKey]
    Object.keys(countryObj).forEach((topKey) => {
      const child = countryObj[topKey];
      if (child && typeof child === "object" && child[serviceKey]) {
        const item = child[serviceKey];
        if (item && typeof item === "object") {
          if (!operatorMap.has(topKey)) {
            operatorMap.set(topKey, {
              cost: Number(item.cost) || 0,
              count: Number(item.count) || 0
            });
          }
        }
      }
    });
  }

  let totalStock = 0;
  operatorMap.forEach((item, opKey) => {
    totalStock += item.count;
    allOperators.push({
      key: opKey,
      name: opKey === "any" ? "Any Operator" : opKey.charAt(0).toUpperCase() + opKey.slice(1).replace(/_/g, " "),
      cost: item.cost,
      count: item.count
    });
  });

  // Filter concrete in-stock operators sorted by lowest provider cost
  const concreteInStock = allOperators
    .filter(o => o.key !== "any" && o.count > 0)
    .sort((a, b) => a.cost - b.cost);

  // Fallback if provider only returns aggregate "any" key
  if (concreteInStock.length === 0) {
    const anyInStock = allOperators.filter(o => o.count > 0).sort((a, b) => a.cost - b.cost);
    if (anyInStock.length > 0) {
      concreteInStock.push(anyInStock[0]);
    }
  }

  return {
    countryKey,
    serviceKey,
    allOperators,
    inStockOperators: concreteInStock,
    cheapestInStockOperator: concreteInStock.length > 0 ? concreteInStock[0] : null,
    totalStock,
    lastSyncTime: syncState.lastSuccessfulSync
  };
}

export function getSupportedCountriesCatalog(): Record<string, any> {
  const syncState = getProviderSyncState();
  const prices = syncState.cachedPrices;
  const rawCountries = syncState.cachedCountries || {};

  // If no cached prices yet, return rawCountries or empty
  if (!prices || typeof prices !== "object" || Object.keys(prices).length === 0) {
    return rawCountries;
  }

  const result: Record<string, any> = {};
  const supportedCountryKeys = Object.keys(prices);

  supportedCountryKeys.forEach((cKey) => {
    const normKey = cKey.toLowerCase().trim();
    if (rawCountries[normKey]) {
      result[normKey] = rawCountries[normKey];
    } else {
      result[normKey] = {
        key: normKey,
        text: normKey.charAt(0).toUpperCase() + normKey.slice(1),
        iso: normKey.slice(0, 2).toUpperCase()
      };
    }
  });

  return result;
}

/**
 * Get the real 5SIM provider balance (Single Source of Truth)
 */
export async function getProviderBalance(): Promise<{
  balance: number | null;
  currency: string;
  status: string;
  error?: string | null;
  lastSynced?: number | null;
}> {
  const state = await performProviderSyncCycle();
  return {
    balance: state.balance ?? null,
    currency: "USD",
    status: state.connectionStatus,
    error: state.lastError || state.balanceError || null,
    lastSynced: state.lastSuccessfulSync
  };
}

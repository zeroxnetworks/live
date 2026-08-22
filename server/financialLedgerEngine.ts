import { adminDb, admin } from "./firebaseAdmin";
import { getGlobalSettings } from "./settingsEngine";

export interface TransactionRecord {
  id?: string;
  userId: string;
  username?: string;
  type: "DEPOSIT" | "ORDER_SMS" | "ORDER_SMM" | "REFUND" | "ADMIN_ADJUSTMENT";
  amount: number; // Base USD
  amountPkr?: number; // Calculated in PKR
  rate?: number; // Crypto/PKR rate at time of transaction
  orderId?: string;
  txId?: string;
  method?: string;
  status: "COMPLETED" | "VOID" | "PENDING";
  description: string;
  balanceBefore?: number;
  balanceAfter?: number;
  cancellationFee?: number;
  processingFee?: number;
  createdAt: any;
  metadata?: any;
}

// In-memory operation locks to prevent race conditions per user or per order
const operationLocks = new Map<string, number>();

export function acquireLock(key: string, timeoutMs: number = 10000): boolean {
  const now = Date.now();
  const existing = operationLocks.get(key);
  if (existing && (now - existing) < timeoutMs) {
    return false;
  }
  operationLocks.set(key, now);
  return true;
}

export function releaseLock(key: string) {
  operationLocks.delete(key);
}

/**
 * Get current system exchange rate (PKR per USD)
 */
export async function getExchangeRate(): Promise<number> {
  try {
    const settings = await getGlobalSettings();
    if (typeof settings?.cryptoRate === "number" && settings.cryptoRate > 0) {
      return settings.cryptoRate;
    }
  } catch (e) {
    console.warn("[Ledger Engine] Could not read cryptoRate, fallback to 278");
  }
  return 278;
}

/**
 * Atomic Order Debit for Virtual Number / SMS Orders
 */
export async function processSmsOrderDebit(params: {
  userId: string;
  username?: string;
  orderId: string | number;
  product: string;
  country: string;
  operator: string;
  priceUsd: number;
  phone?: string;
}): Promise<{ success: boolean; newBalance: number; newBalancePkr: number; transactionId: string }> {
  const lockKey = `order_debit_${params.userId}_${params.orderId}`;
  if (!acquireLock(lockKey)) {
    throw new Error("Order debit already in progress for this user/order.");
  }

  try {
    const cryptoRate = await getExchangeRate();
    const cleanOrderId = String(params.orderId);
    const amountUsd = Number(params.priceUsd.toFixed(4));
    const amountPkr = Number((amountUsd * cryptoRate).toFixed(2));

    let newBal = 0;
    let createdTxId = "";

    await adminDb.runTransaction(async (t: any) => {
      const userRef = adminDb.collection("users").doc(params.userId);
      const userSnap = await t.get(userRef);

      if (!userSnap.exists) {
        throw new Error(`User account "${params.userId}" not found.`);
      }

      const userData = userSnap.data() || {};
      const currentBal = typeof userData.balance === "number" ? userData.balance : 0;

      if (currentBal < amountUsd - 0.0001) {
        throw new Error(`Insufficient wallet balance ($${currentBal.toFixed(2)} USD vs required $${amountUsd.toFixed(2)} USD / ₨${amountPkr} PKR).`);
      }

      newBal = Number(Math.max(0, currentBal - amountUsd).toFixed(4));

      // 1. Update user balance atomically
      t.update(userRef, {
        balance: newBal,
        lastOrderAt: new Date().toISOString()
      });

      // 2. Add immutable transaction record
      const txRef = adminDb.collection("transactions").doc();
      createdTxId = txRef.id;

      t.set(txRef, {
        id: txRef.id,
        userId: params.userId,
        username: params.username || userData.username || "User",
        type: "ORDER_SMS",
        amount: amountUsd,
        amountPkr: amountPkr,
        rate: cryptoRate,
        orderId: cleanOrderId,
        status: "COMPLETED",
        description: `SMS Virtual Number: ${params.product.toUpperCase()} (${params.country.toUpperCase()}) - ${params.phone || "Allocated"}`,
        balanceBefore: currentBal,
        balanceAfter: newBal,
        metadata: {
          product: params.product,
          country: params.country,
          operator: params.operator,
          phone: params.phone || "N/A"
        },
        createdAt: new Date().toISOString()
      });
    });

    return {
      success: true,
      newBalance: newBal,
      newBalancePkr: Number((newBal * cryptoRate).toFixed(2)),
      transactionId: createdTxId
    };
  } finally {
    releaseLock(lockKey);
  }
}

/**
 * Atomic Order Debit for SMM Orders
 */
export async function processSmmOrderDebit(params: {
  userId: string;
  username?: string;
  orderId: string;
  serviceId: string | number;
  serviceName: string;
  chargeUsd: number;
  chargePkr: number;
  quantity: number;
  link: string;
}): Promise<{ success: boolean; newBalance: number; newBalancePkr: number; transactionId: string }> {
  const lockKey = `smm_debit_${params.userId}_${params.orderId}`;
  if (!acquireLock(lockKey)) {
    throw new Error("SMM order debit already in progress.");
  }

  try {
    const cryptoRate = await getExchangeRate();
    const amountUsd = Number(params.chargeUsd.toFixed(4));
    const amountPkr = Number(params.chargePkr.toFixed(2));

    let newBal = 0;
    let createdTxId = "";

    await adminDb.runTransaction(async (t: any) => {
      const userRef = adminDb.collection("users").doc(params.userId);
      const userSnap = await t.get(userRef);

      if (!userSnap.exists) {
        throw new Error(`User account "${params.userId}" not found.`);
      }

      const userData = userSnap.data() || {};
      const currentBal = typeof userData.balance === "number" ? userData.balance : 0;

      if (currentBal < amountUsd - 0.0001) {
        throw new Error(`Insufficient wallet balance for SMM order.`);
      }

      newBal = Number(Math.max(0, currentBal - amountUsd).toFixed(4));

      // 1. Update user balance atomically
      t.update(userRef, {
        balance: newBal,
        lastSmmOrderAt: new Date().toISOString()
      });

      // 2. Add immutable transaction record
      const txRef = adminDb.collection("transactions").doc();
      createdTxId = txRef.id;

      t.set(txRef, {
        id: txRef.id,
        userId: params.userId,
        username: params.username || userData.username || "User",
        type: "ORDER_SMM",
        amount: amountUsd,
        amountPkr: amountPkr,
        rate: cryptoRate,
        orderId: params.orderId,
        status: "COMPLETED",
        description: `SMM Order: ${params.serviceName} (Qty: ${params.quantity.toLocaleString()})`,
        balanceBefore: currentBal,
        balanceAfter: newBal,
        metadata: {
          serviceId: params.serviceId,
          serviceName: params.serviceName,
          quantity: params.quantity,
          link: params.link
        },
        createdAt: new Date().toISOString()
      });
    });

    return {
      success: true,
      newBalance: newBal,
      newBalancePkr: Number((newBal * cryptoRate).toFixed(2)),
      transactionId: createdTxId
    };
  } finally {
    releaseLock(lockKey);
  }
}

/**
 * Atomic Order Refund (Guarantees STRICT idempotency and prevents double-refunds)
 */
export async function processOrderRefund(params: {
  userId: string;
  orderId: string | number;
  refundAmountUsd: number;
  reason: "TIMEOUT" | "CANCELED" | "BANNED" | "MANUAL_REFUND";
  description?: string;
  cancellationFee?: number;
  processingFee?: number;
}): Promise<{ success: boolean; alreadyRefunded?: boolean; newBalance?: number }> {
  const cleanOrderId = String(params.orderId);
  const lockKey = `refund_order_${cleanOrderId}`;

  if (!acquireLock(lockKey, 15000)) {
    console.warn(`[Ledger Engine] Concurrency lock active for refund on order #${cleanOrderId}`);
    return { success: false, alreadyRefunded: true };
  }

  try {
    const cryptoRate = await getExchangeRate();
    let isAlreadyRefunded = false;
    let newBal = 0;

    await adminDb.runTransaction(async (t: any) => {
      // 1. Check order status & refund flag in Firestore
      const orderRef = adminDb.collection("orders").doc(cleanOrderId);
      const orderSnap = await t.get(orderRef);

      if (orderSnap.exists) {
        const oData = orderSnap.data() || {};
        if (oData.isRefunded === true || oData.refundProcessed === true) {
          isAlreadyRefunded = true;
          return;
        }
      }

      // 2. Check if a refund transaction for this order already exists in transactions collection
      const existingTxSnap = await adminDb.collection("transactions")
        .where("orderId", "==", cleanOrderId)
        .where("type", "==", "REFUND")
        .get();

      if (!existingTxSnap.empty) {
        isAlreadyRefunded = true;
        // Mark order as refunded to prevent future queries
        if (orderSnap.exists) {
          t.update(orderRef, { isRefunded: true, status: "CANCELED" });
        }
        return;
      }

      // 3. User balance fetch and atomic credit
      const userRef = adminDb.collection("users").doc(params.userId);
      const userSnap = await t.get(userRef);

      if (!userSnap.exists) {
        throw new Error(`User "${params.userId}" not found for refund.`);
      }

      const userData = userSnap.data() || {};
      const currentBal = typeof userData.balance === "number" ? userData.balance : 0;
      const refundUsd = Number(params.refundAmountUsd.toFixed(4));
      const refundPkr = Number((refundUsd * cryptoRate).toFixed(2));

      newBal = Number((currentBal + refundUsd).toFixed(4));

      // 4. Update user balance
      t.update(userRef, { balance: newBal });

      // 5. Mark order as refunded
      if (orderSnap.exists) {
        t.update(orderRef, {
          status: params.reason === "BANNED" ? "BANNED" : "CANCELED",
          isRefunded: true,
          refundProcessed: true,
          refundAmountUsd: refundUsd,
          refundAmountPkr: refundPkr,
          refundedAt: new Date().toISOString()
        });
      }

      // 6. Record refund transaction
      const txRef = adminDb.collection("transactions").doc();
      const defaultDesc = params.reason === "TIMEOUT"
        ? `Automatic 100% timeout refund for expired activation #${cleanOrderId} (No SMS received)`
        : params.reason === "BANNED"
        ? `100% refund for unworking / banned number #${cleanOrderId}`
        : `Manual cancellation refund for order #${cleanOrderId}`;

      t.set(txRef, {
        id: txRef.id,
        userId: params.userId,
        username: userData.username || "User",
        type: "REFUND",
        amount: refundUsd,
        amountPkr: refundPkr,
        rate: cryptoRate,
        orderId: cleanOrderId,
        reason: params.reason,
        cancellationFee: params.cancellationFee || 0,
        processingFee: params.processingFee || 0,
        status: "COMPLETED",
        description: params.description || defaultDesc,
        balanceBefore: currentBal,
        balanceAfter: newBal,
        createdAt: new Date().toISOString()
      });
    });

    if (isAlreadyRefunded) {
      console.log(`[Ledger Engine] Skipped duplicate refund for order #${cleanOrderId}`);
      return { success: true, alreadyRefunded: true };
    }

    return {
      success: true,
      alreadyRefunded: false,
      newBalance: newBal
    };
  } finally {
    releaseLock(lockKey);
  }
}

/**
 * Atomic Deposit Credit (Direct / IMAP / Crypto / Admin Approval)
 */
export async function processDepositCredit(params: {
  userId: string;
  depositId?: string;
  grossAmountPkr: number;
  feePercent?: number;
  method: string;
  txId?: string;
  username?: string;
  userEmail?: string;
  adminNotes?: string;
}): Promise<{ success: boolean; alreadyProcessed?: boolean; usdCredited: number; newBalance: number; newBalancePkr: number }> {
  const lockKey = `deposit_${params.depositId || params.txId || params.userId}`;
  if (!acquireLock(lockKey, 15000)) {
    return { success: false, alreadyProcessed: true, usdCredited: 0, newBalance: 0, newBalancePkr: 0 };
  }

  try {
    const cryptoRate = await getExchangeRate();
    const feePct = params.feePercent !== undefined ? params.feePercent : 0; // 0 for exact net deposit matching
    const grossPkr = Number(params.grossAmountPkr.toFixed(2));
    const feePkr = Number((grossPkr * (feePct / 100)).toFixed(2));
    const netPkr = Number(Math.max(0, grossPkr - feePkr).toFixed(2));
    const usdTopup = Number((netPkr / cryptoRate).toFixed(4));

    let alreadyProcessed = false;
    let newBal = 0;

    await adminDb.runTransaction(async (t: any) => {
      // If deposit document ID provided, verify it isn't already approved
      if (params.depositId) {
        const depRef = adminDb.collection("deposits").doc(params.depositId);
        const depSnap = await t.get(depRef);
        if (depSnap.exists) {
          const depData = depSnap.data() || {};
          if ((depData.status || "").toUpperCase() === "APPROVED") {
            alreadyProcessed = true;
            return;
          }
        }
      }

      // Check if transaction ID was already credited
      if (params.txId) {
        const txCheck = await adminDb.collection("transactions")
          .where("txId", "==", String(params.txId).trim())
          .where("status", "==", "COMPLETED")
          .get();

        if (!txCheck.empty) {
          alreadyProcessed = true;
          return;
        }
      }

      // Fetch user
      const userRef = adminDb.collection("users").doc(params.userId);
      const userSnap = await t.get(userRef);

      if (!userSnap.exists) {
        throw new Error(`User "${params.userId}" not found.`);
      }

      const userData = userSnap.data() || {};
      const currentBal = typeof userData.balance === "number" ? userData.balance : 0;
      newBal = Number((currentBal + usdTopup).toFixed(4));

      // 1. Update user balance
      t.update(userRef, {
        balance: newBal,
        lastDepositAt: new Date().toISOString()
      });

      // 2. Mark deposit approved if doc exists
      if (params.depositId) {
        const depRef = adminDb.collection("deposits").doc(params.depositId);
        t.update(depRef, {
          status: "APPROVED",
          approvedAt: new Date().toISOString(),
          adminNotes: params.adminNotes || "Approved via secure ledger engine",
          netAmountPkr: netPkr,
          usdTopup
        });
      }

      // 3. Record transaction in ledger
      const txRef = adminDb.collection("transactions").doc();
      t.set(txRef, {
        id: txRef.id,
        userId: params.userId,
        username: params.username || userData.username || "User",
        type: "DEPOSIT",
        amount: usdTopup,
        amountPkr: grossPkr,
        netAmountPkr: netPkr,
        feeAmountPkr: feePkr,
        rate: cryptoRate,
        method: params.method.toLowerCase(),
        txId: params.txId || `DEP_${Date.now()}`,
        depositId: params.depositId || null,
        status: "COMPLETED",
        description: `Wallet Deposit via ${params.method.toUpperCase()} (Gross: ₨${grossPkr.toLocaleString()} PKR, Net: ₨${netPkr.toLocaleString()} PKR)`,
        balanceBefore: currentBal,
        balanceAfter: newBal,
        createdAt: new Date().toISOString()
      });
    });

    if (alreadyProcessed) {
      return { success: true, alreadyProcessed: true, usdCredited: 0, newBalance: 0, newBalancePkr: 0 };
    }

    return {
      success: true,
      alreadyProcessed: false,
      usdCredited: usdTopup,
      newBalance: newBal,
      newBalancePkr: Number((newBal * cryptoRate).toFixed(2))
    };
  } finally {
    releaseLock(lockKey);
  }
}

/**
 * Authoritative Single Source of Truth Calculation & Balance Reconciliation
 *
 * Balance Formula:
 * Authoritative Balance = Total Verified Deposits - Total Active/Completed Orders + Total Legitimate Refunds (Deduplicated) + Admin Adjustments
 */
export async function reconcileUserBalanceFromLedger(userId: string): Promise<{
  userId: string;
  username: string;
  previousBalance: number;
  authoritativeBalance: number;
  authoritativeBalancePkr: number;
  cryptoRate: number;
  totalDepositsPkr: number;
  totalOrdersPkr: number;
  totalRefundsPkr: number;
  breakdown: {
    deposits: any[];
    orders: any[];
    refunds: any[];
    transactions: any[];
  };
}> {
  const cryptoRate = await getExchangeRate();

  const userRef = adminDb.collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error(`User account "${userId}" not found.`);
  }

  const userData = userSnap.data() || {};
  const username = userData.username || "User";
  const previousBalance = typeof userData.balance === "number" ? userData.balance : 0;

  // 1. Fetch all transactions for this user
  const txSnap = await adminDb.collection("transactions").where("userId", "==", userId).get();
  const allTxs: any[] = [];
  txSnap.forEach(d => allTxs.push({ id: d.id, ...d.data() }));

  // 2. Fetch all approved deposits
  const depSnap = await adminDb.collection("deposits")
    .where("userId", "==", userId)
    .where("status", "==", "APPROVED")
    .get();
  const allDeposits: any[] = [];
  depSnap.forEach(d => allDeposits.push({ id: d.id, ...d.data() }));

  // Also query deposits by username if any were created with username
  if (username) {
    const depByNameSnap = await adminDb.collection("deposits")
      .where("username", "==", username)
      .where("status", "==", "APPROVED")
      .get();
    depByNameSnap.forEach(d => {
      if (!allDeposits.some(existing => existing.id === d.id)) {
        allDeposits.push({ id: d.id, ...d.data() });
      }
    });
  }

  // 3. Fetch all SMS orders
  const ordSnap = await adminDb.collection("orders").where("userId", "==", userId).get();
  const allOrders: any[] = [];
  ordSnap.forEach(d => allOrders.push({ id: d.id, ...d.data() }));

  // 4. Fetch all SMM orders
  const smmSnap = await adminDb.collection("smm_orders").where("userId", "==", userId).get();
  const allSmmOrders: any[] = [];
  smmSnap.forEach(d => allSmmOrders.push({ id: d.id, ...d.data() }));

  // 5. Fetch all Digital Subscription orders
  const subSnap = await adminDb.collection("subscription_orders").where("userId", "==", userId).get();
  const allSubOrders: any[] = [];
  subSnap.forEach(d => allSubOrders.push({ id: d.id, ...d.data() }));

  // Calculate Deposits (in PKR & USD)
  // Combine transactions DEPOSITS and approved deposits collection (de-duplicating by txId/depositId)
  const creditedTxIds = new Set<string>();
  let totalDepositsPkr = 0;
  let totalDepositsUsd = 0;

  // Process transaction ledger deposits first
  allTxs.filter(t => t.type === "DEPOSIT" && t.status !== "VOID").forEach(t => {
    const key = t.txId || t.depositId || t.id;
    if (!creditedTxIds.has(key)) {
      creditedTxIds.add(key);
      const usd = typeof t.amount === "number" ? t.amount : (t.amountPkr ? t.amountPkr / cryptoRate : 0);
      const pkr = typeof t.amountPkr === "number" ? t.amountPkr : usd * cryptoRate;
      totalDepositsUsd += usd;
      totalDepositsPkr += pkr;
    }
  });

  // Check if any approved deposit in deposits collection wasn't in transactions table
  allDeposits.forEach(d => {
    const key = d.txId || d.id;
    if (!creditedTxIds.has(key)) {
      creditedTxIds.add(key);
      const isCrypto = ["crypto", "nowpayments", "usdt", "btc", "eth", "bnb", "binance_pay", "redotpay"].includes((d.method || "").toLowerCase()) || (d.method || "").toLowerCase().includes("crypto");
      const feeRate = isCrypto ? 0.005 : 0.02;
      const grossPkr = typeof d.amount === "number" ? d.amount : (typeof d.grossAmount === "number" ? d.grossAmount : 0);
      const netPkr = typeof d.netAmountPkr === "number" ? d.netAmountPkr : Number((grossPkr * (1 - feeRate)).toFixed(2));
      const usd = typeof d.netAmountUsd === "number" ? d.netAmountUsd : Number((netPkr / cryptoRate).toFixed(4));
      totalDepositsPkr += netPkr;
      totalDepositsUsd += usd;
    }
  });

  // Calculate SMS & SMM Orders
  let totalOrdersUsd = 0;
  let totalOrdersPkr = 0;

  // Finished or active SMS orders
  allOrders.forEach(o => {
    // Orders that are FINISHED, RECEIVED, or PENDING charged the user
    // Note: CANCELED or BANNED orders were refunded, so their net cost will be offset by the refund
    const priceUsd = typeof o.price === "number" ? o.price : 0;
    const pricePkr = priceUsd * cryptoRate;
    totalOrdersUsd += priceUsd;
    totalOrdersPkr += pricePkr;
  });

  allSmmOrders.forEach(s => {
    const chargePkr = typeof s.charge === "number" ? s.charge : 0;
    const chargeUsd = typeof s.chargeUsd === "number" ? s.chargeUsd : (chargePkr / cryptoRate);
    totalOrdersUsd += chargeUsd;
    totalOrdersPkr += chargePkr;
  });

  allSubOrders.forEach(sub => {
    const priceUsd = typeof sub.price === "number" ? sub.price : (typeof sub.totalPriceUsd === "number" ? sub.totalPriceUsd : (typeof sub.totalPrice === "number" ? sub.totalPrice / cryptoRate : 0));
    const pricePkr = typeof sub.totalPricePkr === "number" ? sub.totalPricePkr : (priceUsd * cryptoRate);
    totalOrdersUsd += priceUsd;
    totalOrdersPkr += pricePkr;
  });

  // Calculate Legitimate Refunds (De-duplicate any duplicate refund records!)
  const refundedOrderIds = new Set<string>();
  let totalRefundsUsd = 0;
  let totalRefundsPkr = 0;

  // 1. Transaction ledger refunds
  allTxs.filter(t => t.type === "REFUND" && t.status !== "VOID").forEach(t => {
    const orderKey = t.orderId ? String(t.orderId) : t.id;
    if (!refundedOrderIds.has(orderKey)) {
      refundedOrderIds.add(orderKey);
      const rUsd = typeof t.amount === "number" ? t.amount : 0;
      const rPkr = typeof t.amountPkr === "number" ? t.amountPkr : rUsd * cryptoRate;
      totalRefundsUsd += rUsd;
      totalRefundsPkr += rPkr;
    } else {
      console.warn(`[Reconciliation] Identified duplicate refund transaction #${t.id} for order #${orderKey}. Skipping from balance.`);
    }
  });

  // 2. Account for any SMM refunds not yet backfilled into transactions
  allSmmOrders.filter(s => (s.isRefunded || s.status === "CANCELED") && (s.refundAmountUsd || s.refundAmount)).forEach(s => {
    const orderKey = String(s.id);
    if (!refundedOrderIds.has(orderKey)) {
      refundedOrderIds.add(orderKey);
      const rUsd = typeof s.refundAmountUsd === "number" ? s.refundAmountUsd : (typeof s.refundAmount === "number" ? s.refundAmount / cryptoRate : 0);
      const rPkr = typeof s.refundAmount === "number" ? s.refundAmount : rUsd * cryptoRate;
      totalRefundsUsd += rUsd;
      totalRefundsPkr += rPkr;
    }
  });

  // 3. Account for any Subscription cancellations not yet in transactions
  allSubOrders.filter(sub => sub.status === "CANCELLED").forEach(sub => {
    const orderKey = String(sub.id);
    if (!refundedOrderIds.has(orderKey)) {
      refundedOrderIds.add(orderKey);
      const rUsd = typeof sub.price === "number" ? sub.price : (typeof sub.totalPriceUsd === "number" ? sub.totalPriceUsd : 0);
      const rPkr = rUsd * cryptoRate;
      totalRefundsUsd += rUsd;
      totalRefundsPkr += rPkr;
    }
  });

  // Calculate Single Source of Truth Balance
  // Balance = Total Deposits - Total Orders + Total Deduplicated Refunds
  const netCalculatedBalanceUsd = Number(Math.max(0, totalDepositsUsd - totalOrdersUsd + totalRefundsUsd).toFixed(4));
  const netCalculatedBalancePkr = Number((netCalculatedBalanceUsd * cryptoRate).toFixed(2));

  // Update user document if mismatch
  if (Math.abs(previousBalance - netCalculatedBalanceUsd) > 0.001) {
    console.log(`[Reconciliation] Updating user @${username} (${userId}) balance from ${previousBalance} USD to ${netCalculatedBalanceUsd} USD (₨${netCalculatedBalancePkr} PKR)`);
    await userRef.update({
      balance: netCalculatedBalanceUsd,
      reconciledAt: new Date().toISOString(),
      reconciliationNote: `Reconciled from ledger: Deposits (₨${totalDepositsPkr.toFixed(2)}) - Orders (₨${totalOrdersPkr.toFixed(2)}) + Refunds (₨${totalRefundsPkr.toFixed(2)})`
    });
  }

  return {
    userId,
    username,
    previousBalance,
    authoritativeBalance: netCalculatedBalanceUsd,
    authoritativeBalancePkr: netCalculatedBalancePkr,
    cryptoRate,
    totalDepositsPkr,
    totalOrdersPkr,
    totalRefundsPkr,
    breakdown: {
      deposits: allDeposits,
      orders: allOrders,
      refunds: Array.from(refundedOrderIds),
      transactions: allTxs
    }
  };
}

import { adminDb } from "./firebaseAdmin";
import { processOrderRefund } from "./financialLedgerEngine";

let cachedProvider: any = null;
let lastProviderCacheTime: number = 0;

export function invalidateActiveSmsProviderCache() {
  cachedProvider = null;
  lastProviderCacheTime = 0;
}

// Helper to get active SMS Provider
export async function getActiveSmsProvider() {
  const now = Date.now();
  if (cachedProvider && (now - lastProviderCacheTime) < 15000) { // 15 seconds cache
    return cachedProvider;
  }

  try {
    // Check sms_providers first, then smsProviders
    const snap1 = await adminDb.collection("sms_providers").get();
    let activeProv: any = null;
    snap1.forEach(doc => {
      const data = doc.data();
      if (data.status && data.status.toUpperCase() === "ACTIVE") activeProv = { id: doc.id, ...data };
    });

    if (!activeProv && !snap1.empty) {
      const first = snap1.docs[0].data();
      activeProv = { id: snap1.docs[0].id, ...first };
    }

    if (!activeProv) {
      const snap2 = await adminDb.collection("smsProviders").get();
      snap2.forEach(doc => {
        const data = doc.data();
        if (data.status && data.status.toUpperCase() === "ACTIVE") activeProv = { id: doc.id, ...data };
      });
      if (!activeProv && !snap2.empty) {
        const first = snap2.docs[0].data();
        activeProv = { id: snap2.docs[0].id, ...first };
      }
    }

    if (!activeProv && process.env.PROVIDER_API_KEY) {
      activeProv = {
        id: "env_5sim",
        name: "5SIM Default",
        apiUrl: "https://5sim.net/v1",
        apiKey: process.env.PROVIDER_API_KEY,
        status: "ACTIVE"
      };
    }
    
    cachedProvider = activeProv;
    lastProviderCacheTime = now;
    return activeProv;
  } catch (err: any) {
    if (err?.message && (err.message.includes("Quota limit exceeded") || err.message.includes("RESOURCE_EXHAUSTED"))) {
      console.warn("[Order Engine] Firestore quota reached. Using cached provider.");
      return cachedProvider;
    }
    return cachedProvider;
  }
}

/**
 * Authoritative Order Synchronization with Provider
 */
export async function syncOrderWithProvider(orderId: string | number) {
  const cleanId = String(orderId).trim();
  const orderRef = adminDb.collection("orders").doc(cleanId);
  const orderSnap = await orderRef.get();
  
  if (!orderSnap.exists) {
    throw new Error("Order not found in database");
  }
  
  const orderData = orderSnap.data() || {};
  
  // If order is simulated
  if (orderData.isSimulated) {
    return { success: true, order: { id: cleanId, ...orderData }, isSimulated: true, providerStatus: orderData.status };
  }

  const activeProv = await getActiveSmsProvider();
  if (!activeProv) {
    return { success: true, order: { id: cleanId, ...orderData }, providerStatus: orderData.status, providerWarning: "No active SMS provider configured" };
  }

  const rawKey = (activeProv.apiKey || process.env.PROVIDER_API_KEY || "").trim();
  const apiKey = rawKey.replace(/^Bearer\s+/i, "").trim();
  const authHeader = apiKey ? `Bearer ${apiKey}` : "";
  const targetUrl = `${(activeProv.apiUrl || "https://5sim.net/v1").replace(/\/+$/, "")}/user/check/${cleanId}`;

  const response = await fetch(targetUrl, {
    headers: { "Authorization": authHeader, "Accept": "application/json", "User-Agent": "ZeroxNetwork-Backend/1.0" }
  });

  if (!response.ok) {
    const errTxt = await response.text().catch(() => "");
    return { success: false, error: `Provider returned HTTP ${response.status}: ${errTxt || response.statusText}`, order: { id: cleanId, ...orderData } };
  }

  const data: any = await response.json();
  const updates: any = {};

  if (data.status === "CANCELED" || data.status === "TIMEOUT" || data.status === "EXPIRED") {
    if (orderData.status !== "CANCELED" && !orderData.isRefunded) {
      updates.status = "CANCELED";
      updates.isExpiredTimeout = true;
      updates.refundAmount = orderData.price;

      // Authoritative atomic 100% full refund on timeout
      if (orderData.userId) {
        await processOrderRefund({
          userId: orderData.userId,
          orderId: cleanId,
          refundAmountUsd: typeof orderData.price === "number" ? orderData.price : 0,
          reason: "TIMEOUT",
          description: `Automatic 100% timeout refund for expired activation #${cleanId} (No SMS received)`
        });
      }
    }
  } else if (data.status === "FINISHED") {
    if (orderData.status !== "FINISHED") {
      updates.status = "FINISHED";
    }
  } else if (data.status === "RECEIVED") {
    updates.status = "RECEIVED";
    if (data.sms && Array.isArray(data.sms)) {
      updates.sms = data.sms;
    }
  }

  if (data.expires || data.expires_at) {
    updates.expires = data.expires || data.expires_at;
  }

  if (Object.keys(updates).length > 0) {
    await orderRef.update(updates);
  }

  const updatedDoc = { id: cleanId, ...orderData, ...updates };
  return {
    success: true,
    order: updatedDoc,
    providerRaw: data,
    providerStatus: data.status || updatedDoc.status
  };
}

export async function finishOrderWithProvider(orderId: string | number) {
  const cleanId = String(orderId).trim();
  const orderRef = adminDb.collection("orders").doc(cleanId);
  const activeProv = await getActiveSmsProvider();
  
  if (activeProv) {
    const rawKey = (activeProv.apiKey || "").trim();
    const apiKey = rawKey.replace(/^Bearer\s+/i, "").trim();
    const authHeader = apiKey ? `Bearer ${apiKey}` : "";
    const targetUrl = `${(activeProv.apiUrl || "https://5sim.net/v1").replace(/\/+$/, "")}/user/finish/${cleanId}`;
    try {
      await fetch(targetUrl, {
        headers: { "Authorization": authHeader, "Accept": "application/json" }
      });
    } catch (e) {
      console.warn("Provider finish call warning:", e);
    }
  }

  await orderRef.set({ status: "FINISHED" }, { merge: true });
  return { success: true, orderId: cleanId, status: "FINISHED" };
}

export async function banOrderWithProvider(orderId: string | number) {
  const cleanId = String(orderId).trim();
  const orderRef = adminDb.collection("orders").doc(cleanId);
  const orderSnap = await orderRef.get();
  const orderData = orderSnap.exists ? orderSnap.data() || {} : {};

  const activeProv = await getActiveSmsProvider();
  if (activeProv) {
    const rawKey = (activeProv.apiKey || "").trim();
    const apiKey = rawKey.replace(/^Bearer\s+/i, "").trim();
    const authHeader = apiKey ? `Bearer ${apiKey}` : "";
    const targetUrl = `${(activeProv.apiUrl || "https://5sim.net/v1").replace(/\/+$/, "")}/user/ban/${cleanId}`;
    try {
      await fetch(targetUrl, {
        headers: { "Authorization": authHeader, "Accept": "application/json" }
      });
    } catch (e) {
      console.warn("Provider ban call warning:", e);
    }
  }

  // Mark Bad / Banned and issue 100% refund via atomic ledger engine
  if (orderData.userId && orderData.status !== "BANNED" && orderData.status !== "CANCELED" && !orderData.isRefunded) {
    await processOrderRefund({
      userId: orderData.userId,
      orderId: cleanId,
      refundAmountUsd: typeof orderData.price === "number" ? orderData.price : 0,
      reason: "BANNED",
      description: `100% refund for unworking / banned number #${cleanId}`
    });
  }

  await orderRef.set({ status: "BANNED", isBannedRefund: true }, { merge: true });
  return { success: true, orderId: cleanId, status: "BANNED" };
}

// Background Order Polling Engine (15-second loop with rate-limiting pacing)
export function startOrderPollingEngine() {
  console.log("[Order Engine] Starting 15-second background polling for active orders...");
  
  setInterval(async () => {
    try {
      const ordersRef = adminDb.collection("orders");
      // Poll orders that are PENDING or RECEIVED (still active)
      const snapshot = await ordersRef.where("status", "in", ["PENDING", "RECEIVED"]).get();
      
      if (snapshot.empty) return;
      
      for (const docSnap of snapshot.docs) {
        const orderId = docSnap.id;
        try {
          await syncOrderWithProvider(orderId);
          // 200ms pacing delay between sequential requests to protect provider rate limits
          await new Promise(r => setTimeout(r, 200));
        } catch (err) {
          console.error(`[Order Engine] Error polling order ${orderId}:`, err);
        }
      }
    } catch (error: any) {
      if (error?.message && error.message.includes("Quota limit exceeded")) {
        console.warn("[Order Engine] Skipping polling due to Firestore quota limits.");
      } else {
        console.error("[Order Engine] Polling error:", error);
      }
    }
  }, 15000); // Poll every 15 seconds
}

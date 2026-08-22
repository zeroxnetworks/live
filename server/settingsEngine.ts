import { adminDb } from "./firebaseAdmin";

let cachedSettings: any = null;
let lastSettingsCacheTime: number = 0;

export async function getGlobalSettings() {
  const now = Date.now();
  if (cachedSettings && (now - lastSettingsCacheTime) < 60000) { // 60 seconds cache
    return cachedSettings;
  }

  try {
    const docRef = adminDb.collection("settings").doc("zerox_config");
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      cachedSettings = docSnap.data();
      lastSettingsCacheTime = now;
      return cachedSettings;
    }
  } catch (err) {
    console.warn("[Settings Engine] Failed to fetch settings from Firestore:", err);
  }

  // Fallback defaults if doc doesn't exist
  return {
    priceMarkupPercent: 10,
    cryptoRate: 278,
    customPrices: {},
    virtualNumberMinimumPricePKR: 50
  };
}

export function invalidateSettingsCache() {
  cachedSettings = null;
  lastSettingsCacheTime = 0;
}

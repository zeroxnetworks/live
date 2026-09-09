import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, setLogLevel } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';

// Configure Firestore log level
try {
  setLogLevel('silent');
} catch (e) {
  // Ignore if setLogLevel is already initialized
}

// Intercept benign internal notices from Firestore Web SDK (offline retries, bloom filters)
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = (...args: any[]) => {
    if (args.length > 0) {
      const firstArgStr = typeof args[0] === 'string' ? args[0] : (args[0]?.message || String(args[0]));
      if (
        firstArgStr.includes('Could not reach Cloud Firestore backend') ||
        firstArgStr.includes('operate in offline mode') ||
        firstArgStr.includes('BloomFilter') ||
        firstArgStr.includes('Invalid hash count') ||
        firstArgStr.includes('WatchChangeAggregator')
      ) {
        // Internal transient Firestore connection retry / cache fallback — suppress from error logs
        return;
      }
    }
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    if (args.length > 0) {
      const firstArgStr = typeof args[0] === 'string' ? args[0] : (args[0]?.message || String(args[0]));
      if (
        firstArgStr.includes('Could not reach Cloud Firestore backend') ||
        firstArgStr.includes('operate in offline mode') ||
        firstArgStr.includes('BloomFilter') ||
        firstArgStr.includes('Invalid hash count')
      ) {
        return;
      }
    }
    originalConsoleWarn.apply(console, args);
  };
}

const getEnv = (key: string, fallback = ""): string => {
  if (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] || "";
  }
  return fallback;
};

// Zerox Network production Firebase configuration.
// These values are the public Firebase Web SDK configuration for project: zerox-network.
const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "AIzaSyAjmrDtc-EPctFVUO2piUj1NF1jSfqv49Q"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "zerox-network.firebaseapp.com"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "zerox-network"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "zerox-network.firebasestorage.app"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "778851904164"),
  appId: getEnv("VITE_FIREBASE_APP_ID", "1:778851904164:web:01e85ae00f1b26fecd1431")
};

const app = initializeApp(firebaseConfig);

let isLocalStorageAvailable = false;
try {
  const testKey = '__test_ls__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
  isLocalStorageAvailable = true;
} catch (e) {
  isLocalStorageAvailable = false;
}

const firestoreDbId = getEnv("VITE_FIREBASE_FIRESTORE_DATABASE_ID", "ai-studio-zeroxnetwork-ef98149d-4e69-427d-aa5b-cc5a95b1634b");

export const db = (firestoreDbId && firestoreDbId !== "(default)")
  ? initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: isLocalStorageAvailable
        ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        : memoryLocalCache()
    }, firestoreDbId)
  : initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: isLocalStorageAvailable
        ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        : memoryLocalCache()
    });

export const auth = getAuth(app);

const authPersistence = isLocalStorageAvailable ? browserLocalPersistence : inMemoryPersistence;
setPersistence(auth, authPersistence).catch((err) => {
  console.warn("Firebase auth persistence configuration warning:", err);
});

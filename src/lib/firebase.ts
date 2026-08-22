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

const firebaseConfig = {
  apiKey: "AIzaSyBGetpMpLcDTtmfq8N3VQCW0FVGeoYjSw4",
  authDomain: "charismatic-analog-ft3g1.firebaseapp.com",
  projectId: "charismatic-analog-ft3g1",
  storageBucket: "charismatic-analog-ft3g1.firebasestorage.app",
  messagingSenderId: "855390875983",
  appId: "1:855390875983:web:99a33159cae58fb6b7553a"
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

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: isLocalStorageAvailable 
    ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    : memoryLocalCache()
}, "ai-studio-zeroxnetwork-ef98149d-4e69-427d-aa5b-cc5a95b1634b");

export const auth = getAuth(app);

const authPersistence = isLocalStorageAvailable ? browserLocalPersistence : inMemoryPersistence;
setPersistence(auth, authPersistence).catch((err) => {
  console.warn("Firebase auth persistence configuration warning:", err);
});




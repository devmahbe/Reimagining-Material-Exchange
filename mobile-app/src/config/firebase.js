import { Platform } from 'react-native';
import { getApps, initializeApp } from 'firebase/app';
import {
  browserPopupRedirectResolver,
  browserSessionPersistence,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  GoogleAuthProvider,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Values are loaded from .env (EXPO_PUBLIC_* variables are injected at build time by Expo).
// Never hardcode credentials here — edit .env instead.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// ─── Multiple accounts on one device ──────────────────────────────────────────
// Each signed-in account lives in its own Firebase app instance ("slot"), so
// every account has its own saved session and its own Firestore connection.
// The first slot is the default app, so existing logins keep working.
export const ACCOUNT_SLOTS = ['[DEFAULT]', 'account-2', 'account-3'];

const slots = {};

// Initialize Firebase Auth for one slot.
// `getReactNativePersistence` is React Native only (not exported by the web
// build of firebase/auth), so we must branch on platform:
//   - Native (iOS/Android): persist with AsyncStorage
//   - Web: per-tab session storage, so each browser tab can be logged in
//     to a different account at the same time
const createAuth = (firebaseApp) => {
  try {
    if (Platform.OS === 'web') {
      return initializeAuth(firebaseApp, {
        persistence: browserSessionPersistence,
        popupRedirectResolver: browserPopupRedirectResolver,
      });
    }
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Already initialized (e.g. after a fast refresh)
    return getAuth(firebaseApp);
  }
};

const createSlot = (name) => {
  const existing = getApps().find((a) => a.name === name);
  const firebaseApp =
    existing || (name === ACCOUNT_SLOTS[0] ? initializeApp(firebaseConfig) : initializeApp(firebaseConfig, name));
  return {
    name,
    app: firebaseApp,
    auth: createAuth(firebaseApp),
    db: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
  };
};

export const getSlot = (name) => {
  if (!slots[name]) slots[name] = createSlot(name);
  return slots[name];
};

// These are live bindings: modules that import them always see the
// currently active account after `setActiveSlot` is called.
export let auth;
export let db;
export let storage;
let activeSlotName = ACCOUNT_SLOTS[0];

export const setActiveSlot = (name) => {
  const slot = getSlot(name);
  activeSlotName = name;
  auth = slot.auth;
  db = slot.db;
  storage = slot.storage;
};

export const getActiveSlotName = () => activeSlotName;

setActiveSlot(ACCOUNT_SLOTS[0]);

// Google Sign-In provider (web only)
export const googleProvider = new GoogleAuthProvider();

export default getSlot(ACCOUNT_SLOTS[0]).app;

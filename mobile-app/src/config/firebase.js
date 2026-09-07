import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth.
// `getReactNativePersistence` is React Native only (not exported by the web
// build of firebase/auth), so we must branch on platform:
//   - Native (iOS/Android): persist with AsyncStorage
//   - Web: use the default browser persistence via getAuth()
export const auth = (() => {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
})();

export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Sign-In provider (web only)
export const googleProvider = new GoogleAuthProvider();

export default app;

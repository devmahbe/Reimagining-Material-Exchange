import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCOB8jCvZinLxk1vfcbcO4AeLrX_UuOVUc",
  authDomain: "bhangari-exchange.firebaseapp.com",
  projectId: "bhangari-exchange",
  storageBucket: "bhangari-exchange.firebasestorage.app",
  messagingSenderId: "1083221786919",
  appId: "1:1083221786919:web:1331a0785ed34ffc002902"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Sign-In provider (web only)
export const googleProvider = new GoogleAuthProvider();

export default app;

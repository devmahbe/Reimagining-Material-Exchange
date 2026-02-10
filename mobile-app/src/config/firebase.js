import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Sign-In provider
export const googleProvider = new GoogleAuthProvider();

export default app;

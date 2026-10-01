import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { signOutGoogle } from '../utils/googleAuth';
import { signOutActiveAccount } from './accountService';

export const ROLES = { HOUSEHOLD: 'household', COLLECTOR: 'collector' };

export const homeRouteFor = (role) => (role === ROLES.COLLECTOR ? 'CollectorHome' : 'HouseholdHome');

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getCurrentUserProfile = () => getUserProfile(auth.currentUser?.uid);

/** Create the Firestore profile for a newly registered user */
export const createUserProfile = async (user, { name, phone = '', address = '', role, authProvider }) => {
  const profile = {
    name: name || user.displayName || '',
    email: user.email || '',
    phone,
    address,
    role: role === ROLES.COLLECTOR ? ROLES.COLLECTOR : ROLES.HOUSEHOLD,
    createdAt: new Date().toISOString(),
    authProvider,
  };
  await setDoc(doc(db, 'users', user.uid), profile);
  return { id: user.uid, ...profile };
};

/** Update editable profile fields (role cannot be changed) */
export const updateUserProfile = (uid, { name, phone, address }) =>
  updateDoc(doc(db, 'users', uid), { name, phone, address });

/** Reset the navigation stack to the correct home screen for a role */
export const goHome = (navigation, role) =>
  navigation.reset({ index: 0, routes: [{ name: homeRouteFor(role) }] });

/**
 * Sign the active account out of Google + Firebase. If another account is
 * still signed in on this device, switch to it; otherwise return to Login.
 */
export const logout = async (navigation) => {
  await signOutGoogle();
  const next = await signOutActiveAccount();
  if (next) {
    const profile = await getUserProfile(next.uid).catch(() => null);
    if (profile) {
      goHome(navigation, profile.role);
      return;
    }
  }
  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
};

/** Map Firebase auth error codes to friendly Bangla messages */
export const authErrorMessage = (error, fallback = 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।') => {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়';
    case 'auth/invalid-email':
      return 'ইমেইল ফরম্যাট সঠিক নয়';
    case 'auth/email-already-in-use':
      return 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে';
    case 'auth/weak-password':
      return 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে';
    case 'auth/too-many-requests':
      return 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন';
    case 'auth/network-request-failed':
      return 'ইন্টারনেট সংযোগ পরীক্ষা করুন';
    case 'auth/user-disabled':
      return 'এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে';
    case 'auth/requires-recent-login':
      return 'নিরাপত্তার জন্য আবার লগইন করে চেষ্টা করুন';
    case 'auth/popup-blocked':
      return 'ব্রাউজার পপআপ ব্লক করেছে। পপআপ চালু করে আবার চেষ্টা করুন';
    case 'google/not-available':
      return 'এই বিল্ডে Google লগইন সমর্থিত নয়। ডেভেলপমেন্ট বিল্ড ব্যবহার করুন অথবা ইমেইল দিয়ে লগইন করুন';
    case 'google/play-services':
      return 'Google Play Services পাওয়া যায়নি';
    default:
      return fallback;
  }
};

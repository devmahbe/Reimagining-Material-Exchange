import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ACCOUNT_SLOTS, getActiveSlotName, getSlot, setActiveSlot } from '../config/firebase';

// Keeps several accounts signed in on one device and switches between them.
// On web the "active account" is remembered per browser tab (sessionStorage),
// matching the per-tab login sessions.

export const MAX_ACCOUNTS = ACCOUNT_SLOTS.length;
const ACTIVE_KEY = '@bhangari_active_account';

const store =
  Platform.OS === 'web'
    ? {
        get: async (k) => window.sessionStorage.getItem(k),
        set: async (k, v) => window.sessionStorage.setItem(k, v),
      }
    : {
        get: (k) => AsyncStorage.getItem(k),
        set: (k, v) => AsyncStorage.setItem(k, v),
      };

const ready = async (name) => {
  const slot = getSlot(name);
  try {
    await slot.auth.authStateReady();
  } catch (error) {
    // ignore — treat as signed out
  }
  return slot;
};

const activate = async (name) => {
  setActiveSlot(name);
  await store.set(ACTIVE_KEY, name).catch(() => {});
};

/**
 * Restore every saved session and re-select the last active account.
 * @returns {Promise<import('firebase/auth').User|null>} the active user
 */
export const initAccounts = async () => {
  const all = await Promise.all(ACCOUNT_SLOTS.map(ready));
  const saved = await store.get(ACTIVE_KEY).catch(() => null);
  const signedIn = all.filter((s) => s.auth.currentUser);
  const target =
    signedIn.find((s) => s.name === saved) ||
    signedIn[0] ||
    getSlot(ACCOUNT_SLOTS.includes(saved) ? saved : ACCOUNT_SLOTS[0]);
  await activate(target.name);
  return target.auth.currentUser;
};

/** All accounts currently signed in on this device, with name and role */
export const getSignedInAccounts = async () => {
  const list = [];
  for (const name of ACCOUNT_SLOTS) {
    const slot = await ready(name);
    const user = slot.auth.currentUser;
    if (!user) continue;
    let profile = null;
    try {
      const snap = await getDoc(doc(slot.db, 'users', user.uid));
      profile = snap.exists() ? snap.data() : null;
    } catch (error) {
      // show the account even if the profile can't be loaded
    }
    list.push({
      slot: name,
      uid: user.uid,
      email: user.email || profile?.email || '',
      name: profile?.name || user.displayName || user.email || 'ব্যবহারকারী',
      role: profile?.role || null,
      active: name === getActiveSlotName(),
    });
  }
  return list;
};

export const switchAccount = async (slotName) => {
  await activate(slotName);
  return getSlot(slotName).auth.currentUser;
};

/**
 * Pick a free slot for signing in another account and make it active.
 * @returns {Promise<{slot:string, previous:string}|null>} null when all slots are in use
 */
export const beginAddAccount = async () => {
  for (const name of ACCOUNT_SLOTS) {
    const slot = await ready(name);
    if (!slot.auth.currentUser) {
      const previous = getActiveSlotName();
      await activate(name);
      return { slot: name, previous };
    }
  }
  return null;
};

/** Leave "add account" without signing in: go back to the previous account */
export const abandonAddAccount = async (previous) => {
  const active = getSlot(getActiveSlotName());
  if (!active.auth.currentUser && previous && getSlot(previous).auth.currentUser) {
    await activate(previous);
  }
};

/**
 * After signing in on the active slot, check whether that same user is
 * already signed in on another slot. If so, drop the duplicate and switch
 * to the existing one.
 * @returns {Promise<boolean>} true when it was a duplicate
 */
export const dedupeActiveAccount = async () => {
  const activeName = getActiveSlotName();
  const uid = getSlot(activeName).auth.currentUser?.uid;
  if (!uid) return false;
  for (const name of ACCOUNT_SLOTS) {
    if (name === activeName) continue;
    if (getSlot(name).auth.currentUser?.uid === uid) {
      await signOut(getSlot(activeName).auth);
      await activate(name);
      return true;
    }
  }
  return false;
};

/** Sign out one specific (non-active) account */
export const signOutAccount = (slotName) => signOut(getSlot(slotName).auth);

/**
 * Sign out the active account. If other accounts are still signed in,
 * switch to one of them.
 * @returns {Promise<import('firebase/auth').User|null>} the new active user, if any
 */
export const signOutActiveAccount = async () => {
  await signOut(getSlot(getActiveSlotName()).auth);
  for (const name of ACCOUNT_SLOTS) {
    const slot = getSlot(name);
    if (slot.auth.currentUser) {
      await activate(name);
      return slot.auth.currentUser;
    }
  }
  return null;
};

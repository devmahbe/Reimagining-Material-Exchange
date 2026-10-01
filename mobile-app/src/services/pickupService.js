import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { calculateEarnings, toDate } from '../utils/helpers';

// Resolved on every call so it always uses the active account's connection
const pickupsRef = () => collection(db, 'pickupRequests');

const byNewest = (field = 'createdAt') => (a, b) =>
  (toDate(b[field])?.getTime() || 0) - (toDate(a[field])?.getTime() || 0);

const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

// All list queries use only equality filters and are sorted on the client,
// so they work without any composite Firestore indexes.

export const getHouseholdPickups = async (uid) => {
  const snap = await getDocs(query(pickupsRef(), where('userId', '==', uid)));
  return mapDocs(snap).sort(byNewest());
};

export const getCollectorPickups = async (uid) => {
  const snap = await getDocs(query(pickupsRef(), where('collectorId', '==', uid)));
  return mapDocs(snap).sort(byNewest());
};

export const getPendingPickups = async () => {
  const snap = await getDocs(query(pickupsRef(), where('status', '==', 'pending')));
  return mapDocs(snap).sort(byNewest());
};

/** Live updates for a single pickup. Returns an unsubscribe function. */
export const subscribeToPickup = (requestId, onData, onError) =>
  onSnapshot(
    doc(db, 'pickupRequests', requestId),
    (snap) => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError
  );

/** Create a new pickup request for the signed-in household */
export const createPickup = async ({ materials, images, schedule, address, phone, notes, userName }) => {
  const user = auth.currentUser;
  const cleanMaterials = materials.map((m) => ({
    id: m.id,
    name: m.name,
    icon: m.icon,
    quantity: m.quantity,
    unit: m.unit,
    min: m.min,
    max: m.max,
  }));

  const ref = await addDoc(pickupsRef(), {
    userId: user.uid,
    userEmail: user.email || '',
    userName: userName || '',
    materials: cleanMaterials,
    images: images || [],
    schedule,
    address,
    phone,
    notes: notes || '',
    estimatedEarnings: calculateEarnings(cleanMaterials),
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  return ref.id;
};

/**
 * Accept a pending pickup. Runs in a transaction so two collectors can never
 * accept the same request.
 */
export const acceptPickup = async (requestId, collector) => {
  const user = auth.currentUser;
  const ref = doc(db, 'pickupRequests', requestId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      const err = new Error('not-found');
      err.code = 'pickup/not-found';
      throw err;
    }
    if (snap.data().status !== 'pending') {
      const err = new Error('already-taken');
      err.code = 'pickup/already-taken';
      throw err;
    }
    tx.update(ref, {
      status: 'accepted',
      collectorId: user.uid,
      collectorName: collector?.name || 'সংগ্রাহক',
      collectorPhone: collector?.phone || '',
      acceptedAt: new Date().toISOString(),
    });
  });
};

const STATUS_TIME_FIELD = {
  'on-the-way': 'onTheWayAt',
  'at-location': 'atLocationAt',
};

/** Collector moves an accepted pickup forward (on-the-way / at-location) */
export const updatePickupStatus = (requestId, status) =>
  updateDoc(doc(db, 'pickupRequests', requestId), {
    status,
    [STATUS_TIME_FIELD[status]]: new Date().toISOString(),
  });

/** Household cancels a pickup that has not started yet */
export const cancelPickup = (requestId) =>
  updateDoc(doc(db, 'pickupRequests', requestId), {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    cancelledBy: auth.currentUser?.uid || '',
  });

export const pickupErrorMessage = (error) => {
  if (error?.code === 'pickup/already-taken') return 'দুঃখিত, এই অনুরোধটি অন্য একজন সংগ্রাহক ইতিমধ্যে গ্রহণ করেছেন';
  if (error?.code === 'pickup/not-found') return 'অনুরোধটি খুঁজে পাওয়া যায়নি';
  if (error?.code === 'permission-denied') return 'এই কাজের অনুমতি নেই';
  if (error?.code === 'unavailable') return 'ইন্টারনেট সংযোগ পরীক্ষা করুন';
  return 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।';
};

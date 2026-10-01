import { collection, doc, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { generateTransactionId, toDate } from '../utils/helpers';

// Demo payment system: no external payment API is called. A payment is
// "processed" locally, then recorded in Firestore together with the pickup
// completion in one atomic batch, so both sides always agree.

export const PAYMENT_METHODS = [
  {
    id: 'cash',
    label: 'নগদ টাকা',
    description: 'পিকআপের সময় হাতে হাতে পরিশোধ',
    icon: 'cash-outline',
    color: '#16A34A',
    bg: '#DCFCE7',
    needsAccount: false,
  },
  {
    id: 'wallet',
    label: 'মোবাইল ওয়ালেট',
    description: 'মোবাইল নম্বরে টাকা পাঠান (ডেমো)',
    icon: 'phone-portrait-outline',
    color: '#7C3AED',
    bg: '#EDE9FE',
    needsAccount: true,
    accountLabel: 'ওয়ালেট নম্বর',
    accountPlaceholder: '01XXXXXXXXX',
  },
  {
    id: 'bank',
    label: 'ব্যাংক ট্রান্সফার',
    description: 'ব্যাংক অ্যাকাউন্টে পাঠান (ডেমো)',
    icon: 'business-outline',
    color: '#0284C7',
    bg: '#E0F2FE',
    needsAccount: true,
    accountLabel: 'অ্যাকাউন্ট নম্বর',
    accountPlaceholder: 'অ্যাকাউন্ট নম্বর লিখুন',
  },
];

export const getPaymentMethod = (id) => PAYMENT_METHODS.find((m) => m.id === id) || PAYMENT_METHODS[0];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mask all but the last 4 characters of an account number */
export const maskAccount = (value) => {
  const s = String(value || '');
  if (s.length <= 4) return s;
  return `${'•'.repeat(Math.min(s.length - 4, 6))}${s.slice(-4)}`;
};

/**
 * Pay the household for a pickup and mark the pickup completed.
 * @param {object} pickup - the pickup request document (with id)
 * @param {object} opts - { amount, methodId, account, note, onStep }
 * @returns {Promise<object>} the saved payment (with id)
 */
export const payForPickup = async (pickup, { amount, methodId, account = '', note = '', onStep }) => {
  const user = auth.currentUser;
  const method = getPaymentMethod(methodId);

  // Simulated processing steps so the flow feels like a real payment
  onStep?.('verifying');
  await wait(700);
  onStep?.('processing');
  await wait(900);

  const now = new Date().toISOString();
  const paymentRef = doc(collection(db, 'payments'));
  const payment = {
    transactionId: generateTransactionId(),
    requestId: pickup.id,
    payerId: user.uid,
    payerName: pickup.collectorName || 'সংগ্রাহক',
    payeeId: pickup.userId,
    payeeName: pickup.userName || '',
    amount: Math.round(amount),
    method: method.id,
    account: method.needsAccount ? String(account).trim() : '',
    note: String(note || '').trim(),
    materials: (pickup.materials || []).map((m) => ({ name: m.name, quantity: m.quantity, unit: m.unit })),
    status: 'success',
    isDemo: true,
    createdAt: now,
  };

  const batch = writeBatch(db);
  batch.set(paymentRef, payment);
  batch.update(doc(db, 'pickupRequests', pickup.id), {
    status: 'completed',
    completedAt: now,
    actualEarnings: payment.amount,
    paymentStatus: 'paid',
    paymentMethod: method.id,
    paymentId: paymentRef.id,
    paidAt: now,
  });
  await batch.commit();

  onStep?.('done');
  return { id: paymentRef.id, ...payment };
};

export const getPayment = async (paymentId) => {
  const snap = await getDoc(doc(db, 'payments', paymentId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

const byNewest = (a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0);

/** Payments the signed-in user sent (collector) or received (household) */
export const getMyPayments = async (role) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const field = role === 'collector' ? 'payerId' : 'payeeId';
  const snap = await getDocs(query(collection(db, 'payments'), where(field, '==', uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest);
};

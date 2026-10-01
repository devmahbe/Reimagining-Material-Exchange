import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../config/firebase';
import { findCatalogMaterial } from '../constants/materials';

// ─── Numbers & digits ──────────────────────────────────────────────────────────

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

/** Convert ASCII digits in a value to Bangla digits: 120 -> "১২০" */
export const toBnDigits = (value) =>
  String(value ?? '').replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);

/** Convert Bangla digits in a string to ASCII digits: "১২০" -> "120" */
export const toEnDigits = (value) =>
  String(value ?? '').replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/** Group digits Indian style (1,00,000) without relying on Intl support */
const groupIndian = (intString) => {
  if (intString.length <= 3) return intString;
  const last3 = intString.slice(-3);
  const rest = intString.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
};

/** Format a number with Bangla digits: 12500 -> "১২,৫০০" */
export const formatNumber = (value) => {
  const num = Math.round(Number(value) || 0);
  const sign = num < 0 ? '-' : '';
  return sign + toBnDigits(groupIndian(String(Math.abs(num))));
};

/** Format a Taka amount: 12500 -> "৳১২,৫০০" */
export const formatTaka = (value) => `৳${formatNumber(value)}`;

/** Parse user-entered numbers that may contain Bangla digits */
export const parseAmount = (value) => {
  const num = parseFloat(toEnDigits(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
};

// ─── Prices & estimates ────────────────────────────────────────────────────────

/**
 * Get the numeric [min, max] price for a material. Works with the catalog
 * (numeric min/max) and with legacy documents where price was a string like "৳৮-১২".
 */
export const getPriceRange = (material) => {
  if (!material) return [0, 0];
  if (Number.isFinite(material.min) && Number.isFinite(material.max)) {
    return [material.min, material.max];
  }
  const catalog = findCatalogMaterial(material);
  if (catalog) return [catalog.min, catalog.max];
  const nums = (toEnDigits(material.price).match(/\d+(\.\d+)?/g) || []).map(Number);
  if (nums.length === 0) return [0, 0];
  return [Math.min(...nums), Math.max(...nums)];
};

export const getAveragePrice = (material) => {
  const [min, max] = getPriceRange(material);
  return (min + max) / 2;
};

export const formatPriceRange = (material) => {
  const [min, max] = getPriceRange(material);
  if (!min && !max) return '—';
  return min === max ? `৳${toBnDigits(min)}` : `৳${toBnDigits(min)}–${toBnDigits(max)}`;
};

/** Estimated value of one material line (average price × quantity) */
export const estimateMaterial = (material) =>
  Math.round(getAveragePrice(material) * (Number(material?.quantity) || 1));

/**
 * Calculate estimated earnings from materials
 * @param {Array} materials - material objects with min/max (or legacy price string) and quantity
 * @returns {number} - Estimated total earnings
 */
export const calculateEarnings = (materials) => {
  if (!materials || materials.length === 0) return 0;
  return materials.reduce((sum, m) => sum + estimateMaterial(m), 0);
};

// ─── Dates ─────────────────────────────────────────────────────────────────────

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
export const BN_MONTHS_SHORT = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
export const BN_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
export const BN_DAYS_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

/** Normalize an ISO string, Firestore Timestamp, Date or millis into a Date (or null) */
export const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "২৯ সেপ্টেম্বর ২০২৬" */
export const formatDateBangla = (value, { short = false, withYear = true } = {}) => {
  const date = toDate(value);
  if (!date) return '—';
  const month = (short ? BN_MONTHS_SHORT : BN_MONTHS)[date.getMonth()];
  const base = `${toBnDigits(date.getDate())} ${month}`;
  return withYear ? `${base} ${toBnDigits(date.getFullYear())}` : base;
};

/** "সকাল ১০:৩০" */
export const formatTimeBangla = (value) => {
  const date = toDate(value);
  if (!date) return '';
  const h = date.getHours();
  const period = h < 5 ? 'রাত' : h < 12 ? 'সকাল' : h < 15 ? 'দুপুর' : h < 18 ? 'বিকাল' : h < 20 ? 'সন্ধ্যা' : 'রাত';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${toBnDigits(h12)}:${toBnDigits(String(date.getMinutes()).padStart(2, '0'))}`;
};

export const formatDateTimeBangla = (value) => {
  const date = toDate(value);
  if (!date) return '—';
  return `${formatDateBangla(date, { short: true })}, ${formatTimeBangla(date)}`;
};

export const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "আজ", "আগামীকাল", or "২ অক্টো" */
export const formatRelativeDay = (value) => {
  const date = toDate(value);
  if (!date) return '—';
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (isSameDay(date, today)) return 'আজ';
  if (isSameDay(date, tomorrow)) return 'আগামীকাল';
  return formatDateBangla(date, { short: true, withYear: false });
};

/**
 * Get time difference in human readable format
 * @param {string|Date} dateInput - Date to compare
 * @returns {string} - Human readable time difference
 */
export const getTimeAgo = (dateInput) => {
  const date = toDate(dateInput);
  if (!date) return '';
  const diffInMs = Date.now() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMinutes < 1) return 'এখন';
  if (diffInMinutes < 60) return `${toBnDigits(diffInMinutes)} মিনিট আগে`;
  if (diffInHours < 24) return `${toBnDigits(diffInHours)} ঘণ্টা আগে`;
  if (diffInDays === 1) return 'গতকাল';
  if (diffInDays < 7) return `${toBnDigits(diffInDays)} দিন আগে`;
  return formatDateBangla(date, { short: true });
};

// ─── Phone & email ─────────────────────────────────────────────────────────────

/** Normalize a Bangladeshi phone number to 01XXXXXXXXX (accepts +880, spaces, Bangla digits) */
export const normalizePhone = (phone) => {
  let digits = toEnDigits(phone).replace(/[^0-9]/g, '');
  if (digits.startsWith('880')) digits = digits.slice(2);
  return digits;
};

/**
 * Validate phone number (Bangladesh format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether phone is valid
 */
export const isValidPhone = (phone) => /^01[3-9]\d{8}$/.test(normalizePhone(phone));

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhone = (phone) => {
  const p = normalizePhone(phone);
  if (p.length !== 11) return phone || '';
  return `${p.slice(0, 5)}-${p.slice(5)}`;
};

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

// ─── Misc ──────────────────────────────────────────────────────────────────────

/** Short, human-friendly transaction id, e.g. "TXN-LZ8K2Q-4F7A" */
export const generateTransactionId = () => {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TXN-${time}-${rand}`;
};

export const getInitial = (name) => (name ? String(name).trim().charAt(0).toUpperCase() : '?');

// ─── Storage uploads ──────────────────────────────────────────────────────────

/**
 * Upload an image to Firebase Storage under `<folder>/<uid>/<file>` so the
 * storage rules can restrict users to their own files.
 * @param {string} uri - Local URI of the image
 * @param {string} folder - Folder path in storage (e.g., 'pickups')
 * @param {string} fileName - Custom file name (optional)
 * @returns {Promise<string>} - Download URL of uploaded image
 */
export const uploadImage = async (uri, folder = 'pickups', fileName = null) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');

  const name = fileName || `image_${Date.now()}.jpg`;
  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(storage, `${folder}/${uid}/${name}`);
  await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(storageRef);
};

/**
 * Upload multiple images. Returns the URLs that succeeded and how many failed,
 * so one bad photo doesn't block the whole request.
 */
export const uploadMultipleImages = async (uris, folder = 'pickups') => {
  const results = await Promise.allSettled(
    uris.map((uri, index) => uploadImage(uri, folder, `image_${Date.now()}_${index}.jpg`))
  );
  const urls = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  return { urls, failed: results.length - urls.length };
};

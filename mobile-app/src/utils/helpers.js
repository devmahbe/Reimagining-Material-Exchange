import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload an image to Firebase Storage
 * @param {string} uri - Local URI of the image
 * @param {string} folder - Folder path in storage (e.g., 'pickups', 'profiles')
 * @param {string} fileName - Custom file name (optional)
 * @returns {Promise<string>} - Download URL of uploaded image
 */
export const uploadImage = async (uri, folder = 'images', fileName = null) => {
  try {
    // Generate unique filename if not provided
    const timestamp = Date.now();
    const name = fileName || `image_${timestamp}.jpg`;
    const storagePath = `${folder}/${name}`;

    // Fetch the image data
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create reference and upload
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Upload multiple images
 * @param {Array<string>} uris - Array of local URIs
 * @param {string} folder - Folder path in storage
 * @returns {Promise<Array<string>>} - Array of download URLs
 */
export const uploadMultipleImages = async (uris, folder = 'images') => {
  try {
    const uploadPromises = uris.map((uri, index) => 
      uploadImage(uri, folder, `image_${Date.now()}_${index}.jpg`)
    );
    
    const downloadURLs = await Promise.all(uploadPromises);
    return downloadURLs;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Calculate estimated earnings from materials
 * @param {Array} materials - Array of material objects with name, quantity, price
 * @returns {number} - Estimated total earnings
 */
export const calculateEarnings = (materials) => {
  if (!materials || materials.length === 0) return 0;
  
  let total = 0;
  materials.forEach((material) => {
    // Extract average price from price range (e.g., "৳৮-১২" -> 10)
    const priceMatch = material.price.match(/\d+/g);
    if (priceMatch && priceMatch.length > 0) {
      const prices = priceMatch.map(Number);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      total += avgPrice * (material.quantity || 1);
    }
  });
  
  return Math.round(total);
};

/**
 * Format date to Bangla readable format
 * @param {string|Date} dateInput - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDateBangla = (dateInput) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  
  return date.toLocaleDateString('bn-BD', options);
};

/**
 * Format time to Bangla readable format
 * @param {string|Date} dateInput - Date to format
 * @returns {string} - Formatted time string
 */
export const formatTimeBangla = (dateInput) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  return date.toLocaleTimeString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Generate a unique request ID
 * @returns {string} - Unique request ID
 */
export const generateRequestId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `REQ${timestamp}${random}`;
};

/**
 * Get time difference in human readable format
 * @param {string|Date} dateInput - Date to compare
 * @returns {string} - Human readable time difference
 */
export const getTimeAgo = (dateInput) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMinutes < 1) return 'এখন';
  if (diffInMinutes < 60) return `${diffInMinutes} মিনিট আগে`;
  if (diffInHours < 24) return `${diffInHours} ঘন্টা আগে`;
  if (diffInDays === 1) return 'গতকাল';
  if (diffInDays < 7) return `${diffInDays} দিন আগে`;
  
  return formatDateBangla(date);
};

/**
 * Validate phone number (Bangladesh format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether phone is valid
 */
export const isValidPhone = (phone) => {
  // Bangladesh phone: 01XXXXXXXXX (11 digits)
  const phoneRegex = /^01[3-9]\d{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`;
};

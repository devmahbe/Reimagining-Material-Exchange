import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth } from '../config/firebase';

// Google OAuth client IDs from Google Cloud Console -> Credentials.
// The WEB client ID matters for native sign-in: it sets the audience (aud)
// of the ID token that Firebase verifies on the server.
const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '1083221786919-aka14r2qpg96dinbbbdct2imkc9ke7ic.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

let isConfigured = false;
let googleModule; // loaded lazily so the app still runs where the native module is missing (e.g. Expo Go)

const loadGoogleModule = () => {
  if (googleModule !== undefined) return googleModule;
  try {
    // eslint-disable-next-line global-require
    googleModule = require('@react-native-google-signin/google-signin');
  } catch (error) {
    googleModule = null;
  }
  return googleModule;
};

/**
 * Configure the native Google Sign-In module. Safe to call repeatedly.
 * On Android the flow uses the OAuth client whose package name + SHA-1 match
 * this build, so there is no custom URI scheme or browser redirect involved.
 */
export const configureGoogleSignIn = () => {
  const mod = loadGoogleModule();
  if (isConfigured || !mod) return;
  mod.GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    offlineAccess: false,
  });
  isConfigured = true;
};

/**
 * Sign in with Google on any platform.
 *  - Web: Firebase popup
 *  - iOS/Android (development/production build): native account picker
 * @returns {Promise<UserCredential|null>} null when the user cancels
 */
export const signInWithGoogle = async () => {
  if (Platform.OS === 'web') {
    try {
      return await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        return null;
      }
      throw error;
    }
  }

  const mod = loadGoogleModule();
  if (!mod) {
    const err = new Error('Google Sign-In native module is not available in this build');
    err.code = 'google/not-available';
    throw err;
  }

  configureGoogleSignIn();
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = mod;

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    // Clear the module's remembered Google account so the picker always
    // appears — needed when adding a second account on the same device.
    await GoogleSignin.signOut().catch(() => {});
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null; // user dismissed the picker

    const { idToken } = response.data;
    if (!idToken) throw new Error('Google Sign-In did not return an idToken');

    const credential = GoogleAuthProvider.credential(idToken);
    return await signInWithCredential(auth, credential);
  } catch (error) {
    if (isErrorWithCode?.(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return null;
      if (error.code === statusCodes.IN_PROGRESS) return null;
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        const err = new Error('Google Play Services not available');
        err.code = 'google/play-services';
        throw err;
      }
    }
    throw error;
  }
};

// Kept for backward compatibility with older imports
export const signInWithGoogleNative = signInWithGoogle;

/**
 * Sign out of the native Google module (Firebase sign-out is separate).
 */
export const signOutGoogle = async () => {
  try {
    const mod = Platform.OS !== 'web' ? loadGoogleModule() : null;
    if (mod) await mod.GoogleSignin.signOut();
  } catch (error) {
    // Never let the Google module block the app's sign-out flow
  }
};

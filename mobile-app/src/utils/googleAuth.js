import { Platform } from 'react-native';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';

// Google OAuth client IDs from Google Cloud Console -> Credentials.
// The WEB client ID matters for native sign-in: it sets the audience (aud)
// of the ID token that Firebase verifies on the server.
const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '1083221786919-aka14r2qpg96dinbbbdct2imkc9ke7ic.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

let isConfigured = false;

/**
 * Configure the native Google Sign-In module. Safe to call repeatedly.
 * On Android the flow uses the OAuth client whose package name + SHA-1 match
 * this build, so there is no custom URI scheme or browser redirect involved.
 */
export const configureGoogleSignIn = () => {
  if (isConfigured) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    offlineAccess: false,
  });
  isConfigured = true;
};

/**
 * Native Google Sign-In for iOS/Android development builds.
 * Opens the on-device Google account picker (no browser round-trip) and signs
 * the user in to Firebase with the returned ID token.
 *
 * @returns {Promise<UserCredential|null>} null when the user cancels
 */
export const signInWithGoogleNative = async () => {
  if (Platform.OS === 'web') {
    throw new Error(
      'signInWithGoogleNative is for iOS/Android only. Use signInWithPopup on web.'
    );
  }

  configureGoogleSignIn();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    // User dismissed the Google account picker
    return null;
  }

  const { idToken } = response.data;
  if (!idToken) {
    throw new Error('Google Sign-In did not return an idToken');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  return await signInWithCredential(auth, credential);
};

/**
 * Sign out of the native Google module (Firebase sign-out is separate).
 */
export const signOutGoogle = async () => {
  try {
    if (Platform.OS !== 'web') {
      await GoogleSignin.signOut();
    }
  } catch (error) {
    // Never let the Google module block the app's sign-out flow
  }
};

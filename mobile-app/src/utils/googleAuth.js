import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';


WebBrowser.maybeCompleteAuthSession();
const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '1083221786919-aka14r2qpg96dinbbbdct2imkc9ke7ic.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;


export const useGoogleAuth = () => {
  // On web, return null values since we use signInWithPopup instead
  if (Platform.OS === 'web') {
    return { request: null, response: null, promptAsync: null };
  }

  // On mobile, use expo-auth-session.
  // Android REQUIRES androidClientId (the error "Client Id property
  // androidClientId must be defined" comes from here when it's missing).
  // Provide it in .env: EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  // (get it from Google Cloud Console → Credentials → OAuth 2.0 Client IDs → Android).
  const authRequestArray = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
  });
  const [request, response, promptAsync] = authRequestArray;


  if (request?.redirectUri) {
    console.log('REDIRECT DEBUG (register this URI):', request.redirectUri);
  }

  return { request, response, promptAsync };
};

/**
 * Handle Google Sign-In response and authenticate with Firebase
 * @param {Object} response - Response from Google auth
 * @returns {Promise<UserCredential>} Firebase user credential
 */
export const handleGoogleAuthResponse = async (response) => {
  // TEMP DEBUG — remove after diagnosing Google sign-in
  console.log('GOOGLE RESPONSE DEBUG:', JSON.stringify(response, null, 2));
  if (response?.type === 'success') {
    const { authentication } = response;
    
    // Create Google credential for Firebase
    const credential = GoogleAuthProvider.credential(
      authentication.idToken,
      authentication.accessToken
    );
    
    // Sign in to Firebase with Google credential
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential;
  }
  
  throw new Error('Google authentication failed or was cancelled');
};

/**
 * Simplified Google Sign-In function
 * @param {Function} promptAsync - Prompt function from useGoogleAuth hook
 * @returns {Promise<UserCredential>} Firebase user credential
 */
export const signInWithGoogle = async (promptAsync) => {
  const response = await promptAsync();
  return await handleGoogleAuthResponse(response);
};

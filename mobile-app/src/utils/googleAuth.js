import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';


WebBrowser.maybeCompleteAuthSession();
const GOOGLE_WEB_CLIENT_ID = '1083221786919-aka14r2qpg96dinbbbdct2imkc9ke7ic.apps.googleusercontent.com';


export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    // Optional: Add these if you create Android/iOS apps in Google Cloud Console
    // iosClientId: 'YOUR_IOS_CLIENT_ID',
    // androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  });

  return { request, response, promptAsync };
};

/**
 * Handle Google Sign-In response and authenticate with Firebase
 * @param {Object} response - Response from Google auth
 * @returns {Promise<UserCredential>} Firebase user credential
 */
export const handleGoogleAuthResponse = async (response) => {
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

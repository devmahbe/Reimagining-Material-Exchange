import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useGoogleAuth, handleGoogleAuthResponse } from '../utils/googleAuth';
import colors from '../constants/colors';
import banglaText from '../constants/banglaText';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Google Auth (works on all platforms, but we only use it on mobile)
  const googleAuth = useGoogleAuth();
  const { request, response, promptAsync } = googleAuth || { request: null, response: null, promptAsync: null };
  
  // Handle Google auth response for mobile
  useEffect(() => {
    if (Platform.OS !== 'web' && response) {
      handleGoogleSignInMobile();
    }
  }, [response]);
  
  const handleGoogleSignInMobile = async () => {
    try {
      setLoading(true);
      const userCredential = await handleGoogleAuthResponse(response);
      const user = userCredential.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New Google user - create profile
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          phone: '',
          address: '',
          role: 'household',
          createdAt: new Date().toISOString(),
          authProvider: 'google',
        });
      }
      
      const userData = userDoc.exists() ? userDoc.data() : { role: 'household' };
      Alert.alert('সফল', 'Google দিয়ে প্রবেশ সফল হয়েছে!');
      
      // Navigate based on role
      if (userData?.role === 'collector') {
        navigation.replace('CollectorHome');
      } else {
        navigation.replace('HouseholdHome');
      }
    } catch (error) {
      console.log('Google Sign-In Error:', error);
      Alert.alert('ত্রুটি', 'Google প্রবেশ ব্যর্থ');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে সব ক্ষেত্র পূরণ করুন');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      
      Alert.alert('সফল', 'প্রবেশ সফল হয়েছে!');
      
      // Navigate based on role
      if (userData?.role === 'collector') {
        navigation.replace('CollectorHome');
      } else {
        navigation.replace('HouseholdHome');
      }
    } catch (error) {
      let errorMsg = 'প্রবেশ ব্যর্থ';
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'এই ইমেইলে কোন অ্যাকাউন্ট নেই';
      } else if (error.code === 'auth/wrong-password') {
        errorMsg = 'ভুল পাসওয়ার্ড';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'ভুল ইমেইল ফরম্যাট';
      }
      Alert.alert('ত্রুটi', errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // Web: Use popup
        const googleProvider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          // New Google user - create profile
          await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName,
            email: user.email,
            phone: '',
            address: '',
            role: 'household',
            createdAt: new Date().toISOString(),
            authProvider: 'google',
          });
        }
        
        const userData = userDoc.exists() ? userDoc.data() : { role: 'household' };
        Alert.alert('সফল', 'Google দিয়ে প্রবেশ সফল হয়েছে!');
        
        // Navigate based on role
        if (userData?.role === 'collector') {
          navigation.replace('CollectorHome');
        } else {
          navigation.replace('HouseholdHome');
        }
      } else {
        // Mobile: Use expo-auth-session
        await promptAsync();
        // Response will be handled by useEffect
      }
    } catch (error) {
      console.log('Google Sign-In Error:', error);
      Alert.alert('ত্রুটি', 'Google প্রবেশ ব্যর্থ');
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>♻️</Text>
            <Text style={styles.logoText}>ভাঙ্গারি এক্সচেঞ্জ</Text>
            <Text style={styles.subtitle}>পরিবেশ বান্ধব ভবিষ্যৎ গড়ি</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>{banglaText.login}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{banglaText.email}</Text>
              <TextInput
                style={styles.input}
                placeholder="আপনার ইমেইল লিখুন"
                placeholderTextColor={colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{banglaText.password}</Text>
              <TextInput
                style={styles.input}
                placeholder="পাসওয়ার্ড লিখুন"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>
                {banglaText.forgotPassword}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? banglaText.loading : banglaText.login}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <Text>অথবা</Text>
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading || (Platform.OS !== 'web' && !request)}
            >
              <Text style={styles.googleIcon}>🔍</Text>
              <Text style={styles.googleButtonText}>Google দিয়ে প্রবেশ করুন</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>{banglaText.dontHaveAccount} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLink}>{banglaText.signup}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 25,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.textDark,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: colors.primary,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    justifyContent: 'center',
  },
  googleButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: colors.textGray,
  },
  signupLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});

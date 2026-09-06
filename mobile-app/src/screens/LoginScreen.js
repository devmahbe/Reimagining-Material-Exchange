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
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useGoogleAuth, handleGoogleAuthResponse } from '../utils/googleAuth';
import colors from '../constants/colors';
import banglaText from '../constants/banglaText';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const googleAuth = useGoogleAuth();
  const { request, response, promptAsync } = googleAuth || {
    request: null,
    response: null,
    promptAsync: null,
  };

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
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
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
      if (userData?.role === 'collector') {
        navigation.replace('CollectorHome');
      } else {
        navigation.replace('HouseholdHome');
      }
    } catch (error) {
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
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      if (userData?.role === 'collector') {
        navigation.replace('CollectorHome');
      } else {
        navigation.replace('HouseholdHome');
      }
    } catch (error) {
      let errorMsg = 'প্রবেশ ব্যর্থ হয়েছে';
      if (error.code === 'auth/user-not-found') errorMsg = 'এই ইমেইলে কোন অ্যাকাউন্ট নেই';
      else if (error.code === 'auth/wrong-password') errorMsg = 'ভুল পাসওয়ার্ড দেওয়া হয়েছে';
      else if (error.code === 'auth/invalid-email') errorMsg = 'ইমেইল ফরম্যাট সঠিক নয়';
      Alert.alert('ত্রুটি', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('ইমেইল প্রয়োজন', 'পাসওয়ার্ড রিসেটের জন্য উপরে আপনার ইমেইল লিখুন');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('সফল', 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।');
    } catch {
      Alert.alert('ত্রুটি', 'সঠিক ইমেইল লিখে আবার চেষ্টা করুন।');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const googleProvider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
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
        if (userData?.role === 'collector') {
          navigation.replace('CollectorHome');
        } else {
          navigation.replace('HouseholdHome');
        }
      } else {
        await promptAsync();
      }
    } catch (error) {
      Alert.alert('ত্রুটি', 'Google প্রবেশ ব্যর্থ');
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1B6B45', '#0D4530']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo / Branding */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIconWrap}>
              <Ionicons name="leaf" size={40} color="#1B6B45" />
            </View>
            <Text style={styles.logoText}>ভাঙ্গারি এক্সচেঞ্জ</Text>
            <Text style={styles.logoSubtext}>পরিবেশ বান্ধব ভবিষ্যৎ গড়ি</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>স্বাগতম</Text>
            <Text style={styles.formSubtitle}>আপনার অ্যাকাউন্টে প্রবেশ করুন</Text>

            {/* Email */}
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color={colors.textGray} style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                placeholder="ইমেইল ঠিকানা"
                placeholderTextColor={colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textGray} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { flex: 1 }]}
                placeholder="পাসওয়ার্ড"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.textGray}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>পাসওয়ার্ড ভুলে গেছেন?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.primaryBtnText}>লোড হচ্ছে...</Text>
              ) : (
                <View style={styles.btnInner}>
                  <Ionicons name="log-in-outline" size={20} color="white" />
                  <Text style={styles.primaryBtnText}>প্রবেশ করুন</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>অথবা</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              disabled={loading || (Platform.OS !== 'web' && !request)}
            >
              <View style={styles.googleIconBox}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Google দিয়ে প্রবেশ করুন</Text>
            </TouchableOpacity>

            {/* Sign up link */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>অ্যাকাউন্ট নেই? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLink}>নিবন্ধন করুন</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  // Logo
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.3,
  },

  // Card
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: colors.textGray,
    marginBottom: 24,
  },

  // Inputs
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
  },
  eyeBtn: { padding: 4 },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 22 },
  forgotText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Primary button
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: {
    marginHorizontal: 14,
    fontSize: 13,
    color: colors.textGray,
  },

  // Google button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    height: 52,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: { color: '#fff', fontSize: 16, fontWeight: '700' },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: colors.textDark },

  // Signup row
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  signupText: { fontSize: 14, color: colors.textGray },
  signupLink: { fontSize: 14, color: colors.primary, fontWeight: '700' },
});

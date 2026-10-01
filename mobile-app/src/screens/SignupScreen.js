import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Alert } from '../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { signInWithGoogle } from '../utils/googleAuth';
import { authErrorMessage, createUserProfile, getUserProfile, goHome, ROLES } from '../services/userService';
import { dedupeActiveAccount } from '../services/accountService';
import { isValidEmail, isValidPhone, normalizePhone } from '../utils/helpers';
import { AppButton, AppHeader, FormField } from '../components/ui';
import { RoleOption } from './LoginScreen';
import colors from '../constants/colors';
import { font, radius, shadow, spacing } from '../constants/theme';

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState(ROLES.HOUSEHOLD);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const clearError = (key) => setErrors((e) => ({ ...e, [key]: null }));

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = 'নাম লিখুন';
    if (!isValidEmail(email)) next.email = 'সঠিক ইমেইল লিখুন';
    if (!isValidPhone(phone)) next.phone = 'সঠিক ফোন নম্বর লিখুন (01XXXXXXXXX)';
    if (password.length < 6) next.password = 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() }).catch(() => {});
      const profile = await createUserProfile(cred.user, {
        name: name.trim(),
        phone: normalizePhone(phone),
        address: address.trim(),
        role,
        authProvider: 'email',
      });
      // The user is already signed in after registration — go straight to the app
      goHome(navigation, profile.role);
    } catch (error) {
      Alert.alert('নিবন্ধন ব্যর্থ', authErrorMessage(error, 'নিবন্ধন করা যায়নি'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const cred = await signInWithGoogle();
      if (!cred) return; // cancelled
      if (await dedupeActiveAccount()) {
        const already = await getUserProfile(auth.currentUser?.uid);
        Alert.alert('আগে থেকেই যোগ করা', 'এই অ্যাকাউন্টে এই ডিভাইসে আগে থেকেই লগইন করা আছে।');
        if (already) goHome(navigation, already.role);
        return;
      }
      const existing = await getUserProfile(cred.user.uid);
      if (existing) {
        Alert.alert('স্বাগতম ফিরে!', 'এই Google অ্যাকাউন্ট দিয়ে আগেই নিবন্ধন করা হয়েছে।');
        goHome(navigation, existing.role);
        return;
      }
      const profile = await createUserProfile(cred.user, {
        name: name.trim() || cred.user.displayName || '',
        phone: isValidPhone(phone) ? normalizePhone(phone) : '',
        address: address.trim(),
        role,
        authProvider: 'google',
      });
      goHome(navigation, profile.role);
    } catch (error) {
      Alert.alert('Google নিবন্ধন ব্যর্থ', authErrorMessage(error, 'Google দিয়ে নিবন্ধন করা যায়নি'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const busy = loading || googleLoading;

  return (
    <View style={styles.container}>
      <AppHeader title="নতুন অ্যাকাউন্ট" subtitle="কয়েক ধাপে নিবন্ধন সম্পন্ন করুন" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>আপনি কে?</Text>
          <View style={styles.roleRow}>
            <RoleOption role={ROLES.HOUSEHOLD} selected={role === ROLES.HOUSEHOLD} onPress={() => setRole(ROLES.HOUSEHOLD)} />
            <RoleOption role={ROLES.COLLECTOR} selected={role === ROLES.COLLECTOR} onPress={() => setRole(ROLES.COLLECTOR)} />
          </View>

          <View style={styles.card}>
            <FormField
              label="পূর্ণ নাম"
              icon="person-outline"
              placeholder="আপনার নাম"
              value={name}
              onChangeText={(t) => { setName(t); clearError('name'); }}
              autoComplete="name"
              error={errors.name}
            />
            <FormField
              label="ইমেইল"
              icon="mail-outline"
              placeholder="example@email.com"
              value={email}
              onChangeText={(t) => { setEmail(t); clearError('email'); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />
            <FormField
              label="ফোন নম্বর"
              icon="call-outline"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChangeText={(t) => { setPhone(t); clearError('phone'); }}
              keyboardType="phone-pad"
              maxLength={14}
              error={errors.phone}
            />
            <FormField
              label="ঠিকানা (ঐচ্ছিক)"
              icon="location-outline"
              placeholder="বাড়ি, রাস্তা, এলাকা, শহর"
              value={address}
              onChangeText={setAddress}
            />
            <FormField
              label="পাসওয়ার্ড"
              icon="lock-closed-outline"
              placeholder="কমপক্ষে ৬ অক্ষর"
              value={password}
              onChangeText={(t) => { setPassword(t); clearError('password'); }}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              error={errors.password}
              right={
                <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={10}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textGray} />
                </TouchableOpacity>
              }
            />

            <AppButton title="নিবন্ধন করুন" icon="person-add-outline" onPress={handleSignup} loading={loading} disabled={googleLoading} />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>অথবা</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, busy && { opacity: 0.6 }]}
              onPress={handleGoogleSignup}
              disabled={busy}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.googleText}>
                {googleLoading ? 'অপেক্ষা করুন...' : `Google দিয়ে ${role === ROLES.COLLECTOR ? 'সংগ্রাহক' : 'পরিবার'} হিসেবে নিবন্ধন`}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>ইতিমধ্যে অ্যাকাউন্ট আছে?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
              <Text style={styles.loginLink}> প্রবেশ করুন</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  sectionLabel: { fontSize: font.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md, marginTop: spacing.sm },
  roleRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, ...shadow.sm },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  dividerText: { marginHorizontal: spacing.md, color: colors.textLight, fontSize: font.sm },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  googleText: { fontSize: font.sm + 1, fontWeight: '600', color: colors.text, flexShrink: 1 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  loginText: { color: colors.textGray, fontSize: font.sm + 1 },
  loginLink: { color: colors.primary, fontWeight: '700', fontSize: font.sm + 1 },
});

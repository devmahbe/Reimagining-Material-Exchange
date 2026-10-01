import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Alert } from '../utils/alert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { signInWithGoogle } from '../utils/googleAuth';
import {
  authErrorMessage,
  createUserProfile,
  getUserProfile,
  goHome,
  logout,
  ROLES,
} from '../services/userService';
import { abandonAddAccount, dedupeActiveAccount } from '../services/accountService';
import { isValidEmail, isValidPhone, normalizePhone } from '../utils/helpers';
import { AppButton, FormField } from '../components/ui';
import colors from '../constants/colors';
import { font, radius, shadow, spacing } from '../constants/theme';

export function RoleOption({ role, selected, onPress }) {
  const isCollector = role === ROLES.COLLECTOR;
  return (
    <TouchableOpacity
      style={[styles.roleOption, selected && styles.roleOptionSelected]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={[styles.roleIcon, selected && { backgroundColor: colors.primary }]}>
        <Ionicons name={isCollector ? 'bicycle' : 'home'} size={22} color={selected ? colors.white : colors.primary} />
      </View>
      <Text style={[styles.roleName, selected && { color: colors.primary }]}>
        {isCollector ? 'সংগ্রাহক' : 'পরিবার'}
      </Text>
      <Text style={styles.roleHint}>{isCollector ? 'সামগ্রী সংগ্রহ করি' : 'সামগ্রী বিক্রি করি'}</Text>
      {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.roleCheck} /> : null}
    </TouchableOpacity>
  );
}

export default function LoginScreen({ navigation, route }) {
  // When opened from the account switcher, this signs in an additional account
  const addingAccount = !!route?.params?.addingAccount;
  const previousSlot = route?.params?.previousSlot;
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // First-time Google users choose their role before a profile is created
  const [setupUser, setSetupUser] = useState(null);
  const [setupRole, setSetupRole] = useState(ROLES.HOUSEHOLD);
  const [setupPhone, setSetupPhone] = useState('');
  const [setupSaving, setSetupSaving] = useState(false);

  // If a user is signed in but has no profile yet (e.g. setup was interrupted), resume it.
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getUserProfile(user.uid)
      .then((profile) => (profile ? goHome(navigation, profile.role) : setSetupUser(user)))
      .catch(() => {});
  }, [navigation]);

  // Leaving "add account" without signing in returns to the previous account
  useEffect(() => {
    if (!addingAccount) return undefined;
    return navigation.addListener('beforeRemove', () => {
      abandonAddAccount(previousSlot);
    });
  }, [navigation, addingAccount, previousSlot]);

  /** Go to the right home screen after a successful sign-in */
  const enterApp = async (user) => {
    if (await dedupeActiveAccount()) {
      Alert.alert('আগে থেকেই যোগ করা', 'এই অ্যাকাউন্টে এই ডিভাইসে আগে থেকেই লগইন করা আছে। সেটিতে নিয়ে যাওয়া হচ্ছে।');
      const existing = await getUserProfile(auth.currentUser?.uid);
      if (existing) {
        goHome(navigation, existing.role);
        return;
      }
    }
    const profile = await getUserProfile(user.uid);
    if (profile) goHome(navigation, profile.role);
    else setSetupUser(user);
  };

  const handleLogin = async () => {
    const next = {};
    if (!isValidEmail(email)) next.email = 'সঠিক ইমেইল লিখুন';
    if (!password) next.password = 'পাসওয়ার্ড লিখুন';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await enterApp(cred.user);
    } catch (error) {
      Alert.alert('প্রবেশ ব্যর্থ', authErrorMessage(error, 'প্রবেশ ব্যর্থ হয়েছে'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!isValidEmail(email)) {
      setErrors({ email: 'পাসওয়ার্ড রিসেটের জন্য উপরে আপনার ইমেইল লিখুন' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('ইমেইল পাঠানো হয়েছে', 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।');
    } catch (error) {
      Alert.alert('ত্রুটি', authErrorMessage(error, 'রিসেট লিংক পাঠানো যায়নি'));
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const cred = await signInWithGoogle();
      if (!cred) return; // cancelled
      await enterApp(cred.user);
    } catch (error) {
      Alert.alert('Google প্রবেশ ব্যর্থ', authErrorMessage(error, 'Google দিয়ে প্রবেশ করা যায়নি'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const completeSetup = async () => {
    if (setupPhone && !isValidPhone(setupPhone)) {
      Alert.alert('ত্রুটি', 'সঠিক ফোন নম্বর লিখুন (01XXXXXXXXX)');
      return;
    }
    setSetupSaving(true);
    try {
      const profile = await createUserProfile(setupUser, {
        role: setupRole,
        phone: setupPhone ? normalizePhone(setupPhone) : '',
        authProvider: setupUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
      });
      setSetupUser(null);
      goHome(navigation, profile.role);
    } catch (error) {
      Alert.alert('ত্রুটি', 'প্রোফাইল তৈরি করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setSetupSaving(false);
    }
  };

  const cancelSetup = async () => {
    setSetupUser(null);
    try {
      await logout(navigation);
    } catch (_) {}
  };

  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {addingAccount ? (
            <TouchableOpacity style={[styles.cancelAdd, { top: insets.top + spacing.md }]} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={colors.white} />
              <Text style={styles.cancelAddText}>বাতিল</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.brand}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="recycle" size={44} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>ভাঙ্গারি এক্সচেঞ্জ</Text>
            <Text style={styles.brandSubtitle}>পুরনো জিনিস বিক্রি করুন ঘরে বসেই</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{addingAccount ? 'আরেকটি অ্যাকাউন্ট' : 'স্বাগতম 👋'}</Text>
            <Text style={styles.subtitle}>
              {addingAccount
                ? 'অন্য অ্যাকাউন্টে প্রবেশ করুন — আগের অ্যাকাউন্টেও লগইন থাকবে'
                : 'আপনার অ্যাকাউন্টে প্রবেশ করুন'}
            </Text>

            <FormField
              label="ইমেইল"
              icon="mail-outline"
              placeholder="example@email.com"
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: null })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              error={errors.email}
            />
            <FormField
              label="পাসওয়ার্ড"
              icon="lock-closed-outline"
              placeholder="আপনার পাসওয়ার্ড"
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: null })); }}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              error={errors.password}
              right={
                <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={10}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textGray} />
                </TouchableOpacity>
              }
            />

            <TouchableOpacity style={styles.forgot} onPress={handleForgotPassword} hitSlop={8}>
              <Text style={styles.forgotText}>পাসওয়ার্ড ভুলে গেছেন?</Text>
            </TouchableOpacity>

            <AppButton title="প্রবেশ করুন" icon="log-in-outline" onPress={handleLogin} loading={loading} disabled={googleLoading} />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>অথবা</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, (loading || googleLoading) && { opacity: 0.6 }]}
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.googleText}>{googleLoading ? 'অপেক্ষা করুন...' : 'Google দিয়ে প্রবেশ করুন'}</Text>
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>অ্যাকাউন্ট নেই?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')} hitSlop={8}>
                <Text style={styles.signupLink}> নিবন্ধন করুন</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Role setup for first-time Google users */}
      <Modal visible={!!setupUser} transparent animationType="slide" onRequestClose={cancelSetup}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.xl }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>প্রায় শেষ!</Text>
            <Text style={styles.modalSubtitle}>
              {setupUser?.displayName ? `${setupUser.displayName}, ` : ''}আপনি কীভাবে অ্যাপটি ব্যবহার করবেন?
            </Text>
            <View style={styles.roleRow}>
              <RoleOption role={ROLES.HOUSEHOLD} selected={setupRole === ROLES.HOUSEHOLD} onPress={() => setSetupRole(ROLES.HOUSEHOLD)} />
              <RoleOption role={ROLES.COLLECTOR} selected={setupRole === ROLES.COLLECTOR} onPress={() => setSetupRole(ROLES.COLLECTOR)} />
            </View>
            <FormField
              label="ফোন নম্বর (ঐচ্ছিক)"
              icon="call-outline"
              placeholder="01XXXXXXXXX"
              keyboardType="phone-pad"
              value={setupPhone}
              onChangeText={setSetupPhone}
              maxLength={14}
            />
            <AppButton title="চালিয়ে যান" icon="arrow-forward" onPress={completeSetup} loading={setupSaving} />
            <AppButton title="বাতিল" variant="ghost" onPress={cancelSetup} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },
  cancelAdd: {
    position: 'absolute',
    left: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    zIndex: 2,
  },
  cancelAddText: { color: colors.white, fontWeight: '700', fontSize: font.sm + 1 },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadow.lg,
  },
  brandTitle: { fontSize: font.xxl + 2, fontWeight: '800', color: colors.white },
  brandSubtitle: { fontSize: font.sm + 1, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl + 4,
    padding: spacing.xxl,
    ...shadow.lg,
  },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: font.sm + 1, color: colors.textGray, marginTop: 4, marginBottom: spacing.xl },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.sm, marginBottom: spacing.lg },
  forgotText: { color: colors.primary, fontWeight: '600', fontSize: font.sm },
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
    backgroundColor: colors.white,
  },
  googleText: { fontSize: font.md, fontWeight: '600', color: colors.text },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  signupText: { color: colors.textGray, fontSize: font.sm + 1 },
  signupLink: { color: colors.primary, fontWeight: '700', fontSize: font.sm + 1 },

  roleRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  roleOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  roleOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roleIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  roleName: { fontSize: font.md, fontWeight: '700', color: colors.text },
  roleHint: { fontSize: font.xs + 1, color: colors.textGray, marginTop: 2, textAlign: 'center' },
  roleCheck: { position: 'absolute', top: 8, right: 8 },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    padding: spacing.xxl,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  modalTitle: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  modalSubtitle: { fontSize: font.sm + 1, color: colors.textGray, marginTop: 4, marginBottom: spacing.xl },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import colors from '../constants/colors';
import banglaText from '../constants/banglaText';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('household');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে সব ক্ষেত্র পূরণ করুন');
      return;
    }

    if (password.length < 6) {
      Alert.alert('ত্রুটি', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        phone,
        address,
        role: selectedRole,
        createdAt: new Date().toISOString(),
        authProvider: 'email',
      });

      Alert.alert('সফল', 'নিবন্ধন সফল হয়েছে! এখন লগইন করুন।');
      navigation.replace('Login');
    } catch (error) {
      let errorMsg = 'নিবন্ধন ব্যর্থ';
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'এই ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'ভুল ইমেইল ফরম্যাট';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'দুর্বল পাসওয়ার্ড';
      }
      Alert.alert('ত্রুটি', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        Alert.alert('বিদ্যমান', 'এই অ্যাকাউন্ট ইতিমধ্যে আছে। লগইন করুন।');
        navigation.replace('Login');
      } else {
        // Create new user with selected role
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          phone: '',
          address: '',
          role: selectedRole,
          createdAt: new Date().toISOString(),
          authProvider: 'google',
        });

        Alert.alert('সফল', 'Google দিয়ে নিবন্ধন সফল হয়েছে!');
        navigation.replace('HouseholdHome');
      }
    } catch (error) {
      console.log('Google Sign-Up Error:', error);
      Alert.alert('ত্রুটি', 'Google নিবন্ধন ব্যর্থ: ' + error.message);
    } finally {
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>♻️</Text>
              <Text style={styles.logoText}>ভাঙ্গারি এক্সচেঞ্জ</Text>
            </View>

            {/* Signup Form */}
            <View style={styles.formContainer}>
              <Text style={styles.title}>{banglaText.signup}</Text>

              {/* Role Selection */}
              <Text style={styles.sectionTitle}>{banglaText.selectRole}</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    selectedRole === 'household' && styles.roleOptionSelected,
                  ]}
                  onPress={() => setSelectedRole('household')}
                >
                  <Text style={styles.roleIcon}>🏠</Text>
                  <Text style={styles.roleName}>{banglaText.household}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    selectedRole === 'collector' && styles.roleOptionSelected,
                  ]}
                  onPress={() => setSelectedRole('collector')}
                >
                  <Text style={styles.roleIcon}>👷</Text>
                  <Text style={styles.roleName}>{banglaText.collector}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{banglaText.name}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="আপনার নাম লিখুন"
                  placeholderTextColor={colors.textLight}
                  value={name}
                  onChangeText={setName}
                />
              </View>

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
                <Text style={styles.label}>{banglaText.phone}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ফোন নম্বর লিখুন"
                  placeholderTextColor={colors.textLight}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{banglaText.address}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="আপনার ঠিকানা লিখুন"
                  placeholderTextColor={colors.textLight}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{banglaText.password}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="পাসওয়ার্ড লিখুন (৬+ অক্ষর)"
                  placeholderTextColor={colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={styles.signupButtonText}>
                  {loading ? banglaText.loading : banglaText.signup}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <Text>অথবা</Text>
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignup}
                disabled={loading}
              >
                <Text style={styles.googleIcon}>🔍</Text>
                <Text style={styles.googleButtonText}>Google দিয়ে নিবন্ধন করুন</Text>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>{banglaText.alreadyHaveAccount} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>{banglaText.login}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
  },
  roleIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  roleName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  inputGroup: {
    marginBottom: 16,
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
  signupButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
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
    marginBottom: 10,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: colors.textGray,
  },
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import colors from '../constants/colors';

// ─── bKash Sandbox Config ────────────────────────────────────────────────────
// Register at https://developer.bka.sh/ to get sandbox credentials.
// Replace the placeholders below with your actual sandbox values.
const BKASH_CONFIG = {
  baseURL: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
  appKey: 'YOUR_SANDBOX_APP_KEY',       // from developer.bka.sh
  appSecret: 'YOUR_SANDBOX_APP_SECRET', // from developer.bka.sh
  username: 'YOUR_SANDBOX_USERNAME',    // from developer.bka.sh
  password: 'YOUR_SANDBOX_PASSWORD',    // from developer.bka.sh
};

const STEPS = {
  IDLE: 'idle',
  GRANTING_TOKEN: 'granting_token',
  CREATING_PAYMENT: 'creating_payment',
  WEBVIEW: 'webview',
  EXECUTING: 'executing',
  SUCCESS: 'success',
  FAILED: 'failed',
};

export default function BKashPaymentScreen({ navigation, route }) {
  const { amount: initialAmount = 0 } = route.params || {};

  const [amount, setAmount] = useState(String(initialAmount));
  const [bkashNumber, setBkashNumber] = useState('');
  const [step, setStep] = useState(STEPS.IDLE);
  const [statusMsg, setStatusMsg] = useState('');
  const [paymentURL, setPaymentURL] = useState('');
  const [idToken, setIdToken] = useState('');
  const [paymentID, setPaymentID] = useState('');

  const isSandboxConfigured = !BKASH_CONFIG.appKey.startsWith('YOUR_');

  // ── Step 1: Grant Token ────────────────────────────────────────────────────
  const grantToken = async () => {
    setStatusMsg('টোকেন সংগ্রহ করছি...');
    const res = await fetch(`${BKASH_CONFIG.baseURL}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        username: BKASH_CONFIG.username,
        password: BKASH_CONFIG.password,
      },
      body: JSON.stringify({
        app_key: BKASH_CONFIG.appKey,
        app_secret: BKASH_CONFIG.appSecret,
      }),
    });
    const data = await res.json();
    if (!data.id_token) throw new Error('টোকেন পাওয়া যায়নি: ' + JSON.stringify(data));
    return data.id_token;
  };

  // ── Step 2: Create Payment ─────────────────────────────────────────────────
  const createPayment = async (token, amountTk) => {
    setStatusMsg('পেমেন্ট তৈরি করছি...');
    const res = await fetch(`${BKASH_CONFIG.baseURL}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': BKASH_CONFIG.appKey,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: bkashNumber,
        callbackURL: 'https://bhangari.exchange/bkash/callback',
        amount: String(amountTk),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: `INV-${Date.now()}`,
      }),
    });
    const data = await res.json();
    if (!data.bkashURL) throw new Error('পেমেন্ট URL পাওয়া যায়নি: ' + JSON.stringify(data));
    return { paymentID: data.paymentID, bkashURL: data.bkashURL };
  };

  // ── Step 3: Execute Payment ────────────────────────────────────────────────
  const executePayment = async (token, pid) => {
    setStatusMsg('পেমেন্ট নিশ্চিত করছি...');
    const res = await fetch(`${BKASH_CONFIG.baseURL}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': BKASH_CONFIG.appKey,
      },
      body: JSON.stringify({ paymentID: pid }),
    });
    const data = await res.json();
    return data;
  };

  // ── Main pay flow ──────────────────────────────────────────────────────────
  const handlePay = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('ত্রুটি', 'সঠিক পরিমাণ লিখুন');
      return;
    }
    if (!bkashNumber.match(/^01[3-9]\d{8}$/)) {
      Alert.alert('ত্রুটি', 'সঠিক bKash নম্বর লিখুন (01XXXXXXXXX)');
      return;
    }
    if (!isSandboxConfigured) {
      Alert.alert(
        'স্যান্ডবক্স কনফিগার করুন',
        'BKashPaymentScreen.js ফাইলে BKASH_CONFIG-এ আপনার স্যান্ডবক্স credentials দিন।\n\nদেখুন: developer.bka.sh',
        [
          { text: 'বন্ধ করুন' },
          {
            text: 'ডেমো মোডে চালান',
            onPress: () => runDemoMode(amountNum),
          },
        ]
      );
      return;
    }

    try {
      setStep(STEPS.GRANTING_TOKEN);
      const token = await grantToken();
      setIdToken(token);

      setStep(STEPS.CREATING_PAYMENT);
      const { paymentID: pid, bkashURL } = await createPayment(token, amountNum);
      setPaymentID(pid);
      setPaymentURL(bkashURL);
      setStep(STEPS.WEBVIEW);
    } catch (err) {
      console.log('bKash error:', err);
      setStep(STEPS.FAILED);
      setStatusMsg(err.message || 'পেমেন্ট শুরু করা যায়নি');
    }
  };

  // ── Detect bKash callback in WebView ──────────────────────────────────────
  const handleWebViewNavigationChange = async (navState) => {
    const url = navState.url;
    if (url.includes('bhangari.exchange/bkash/callback')) {
      const params = new URLSearchParams(url.split('?')[1] || '');
      const status = params.get('status');
      setStep(STEPS.EXECUTING);
      try {
        const result = await executePayment(idToken, paymentID);
        if (result.statusCode === '0000' || result.transactionStatus === 'Completed') {
          setStep(STEPS.SUCCESS);
          setStatusMsg(`পেমেন্ট সফল! TrxID: ${result.trxID}`);
        } else {
          setStep(STEPS.FAILED);
          setStatusMsg(result.statusMessage || 'পেমেন্ট ব্যর্থ হয়েছে');
        }
      } catch (err) {
        setStep(STEPS.FAILED);
        setStatusMsg('পেমেন্ট যাচাই করা যায়নি');
      }
    }
  };

  // ── Demo / mock mode when credentials not set ──────────────────────────────
  const runDemoMode = (amountNum) => {
    setStep(STEPS.GRANTING_TOKEN);
    setStatusMsg('টোকেন সংগ্রহ করছি...');
    setTimeout(() => {
      setStep(STEPS.CREATING_PAYMENT);
      setStatusMsg('পেমেন্ট তৈরি করছি...');
      setTimeout(() => {
        setStep(STEPS.SUCCESS);
        setStatusMsg(`ডেমো পেমেন্ট সফল! ৳${amountNum} আপনার bKash ${bkashNumber}-এ পাঠানো হয়েছে। TrxID: DEMO${Date.now()}`);
      }, 1500);
    }, 1500);
  };

  // ── UI States ──────────────────────────────────────────────────────────────
  const isLoading = [STEPS.GRANTING_TOKEN, STEPS.CREATING_PAYMENT, STEPS.EXECUTING].includes(step);

  if (step === STEPS.WEBVIEW) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={styles.webviewHeader}>
          <TouchableOpacity onPress={() => setStep(STEPS.IDLE)} style={styles.webviewBack}>
            <Text style={styles.webviewBackText}>← বাতিল</Text>
          </TouchableOpacity>
          <Text style={styles.webviewTitle}>bKash পেমেন্ট</Text>
          <View style={{ width: 70 }} />
        </View>
        <WebView
          source={{ uri: paymentURL }}
          onNavigationStateChange={handleWebViewNavigationChange}
          style={{ flex: 1 }}
          javaScriptEnabled
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← ফিরুন</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>bKash উত্তোলন</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* bKash logo banner */}
        <LinearGradient colors={['#E2136E', '#C01060']} style={styles.bkashBanner}>
          <Text style={styles.bkashLogo}>bKash</Text>
          <Text style={styles.bkashTagline}>Mobile Banking</Text>
          {!isSandboxConfigured && (
            <View style={styles.sandboxBadge}>
              <Text style={styles.sandboxBadgeText}>ডেমো মোড</Text>
            </View>
          )}
        </LinearGradient>

        {/* Amount */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>উত্তোলনের পরিমাণ (৳)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>৳</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textLight}
            />
          </View>
        </View>

        {/* bKash number */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>bKash নম্বর</Text>
          <TextInput
            style={styles.textInput}
            value={bkashNumber}
            onChangeText={setBkashNumber}
            keyboardType="phone-pad"
            placeholder="01XXXXXXXXX"
            placeholderTextColor={colors.textLight}
            maxLength={11}
          />
        </View>

        {/* Status / progress */}
        {isLoading && (
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color="#E2136E" />
            <Text style={styles.statusText}>{statusMsg}</Text>
          </View>
        )}

        {step === STEPS.SUCCESS && (
          <View style={[styles.statusCard, styles.successCard]}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>পেমেন্ট সফল!</Text>
            <Text style={styles.statusText}>{statusMsg}</Text>
          </View>
        )}

        {step === STEPS.FAILED && (
          <View style={[styles.statusCard, styles.failedCard]}>
            <Text style={styles.failedIcon}>❌</Text>
            <Text style={styles.failedTitle}>পেমেন্ট ব্যর্থ</Text>
            <Text style={styles.statusText}>{statusMsg}</Text>
          </View>
        )}

        {/* Pay button */}
        {step !== STEPS.SUCCESS && (
          <TouchableOpacity
            style={[styles.payButton, isLoading && styles.payButtonDisabled]}
            onPress={handlePay}
            disabled={isLoading}
          >
            <LinearGradient colors={['#E2136E', '#C01060']} style={styles.payButtonGradient}>
              <Text style={styles.payButtonText}>
                {isLoading ? 'প্রক্রিয়াকরণ...' : `৳${amount || '0'} bKash-এ পাঠান`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {step === STEPS.SUCCESS && (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>✓ সম্পন্ন হয়েছে</Text>
          </TouchableOpacity>
        )}

        {/* Info card about sandbox */}
        {!isSandboxConfigured && (
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>স্যান্ডবক্স কীভাবে সেটআপ করবেন?</Text>
              <Text style={styles.infoText}>
                ১. developer.bka.sh এ রেজিস্ট্রেশন করুন{'\n'}
                ২. "Create App" করুন{'\n'}
                ৩. Sandbox credentials (App Key, App Secret, Username, Password) পাবেন{'\n'}
                ৪. BKashPaymentScreen.js-এর BKASH_CONFIG-এ দিন
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  bkashBanner: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#E2136E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  bkashLogo: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 1,
  },
  bkashTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  sandboxBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sandboxBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textGray,
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    color: colors.textDark,
  },
  textInput: {
    fontSize: 18,
    color: colors.textDark,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  statusCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  successCard: {
    borderTopWidth: 4,
    borderTopColor: colors.success,
  },
  failedCard: {
    borderTopWidth: 4,
    borderTopColor: colors.error,
  },
  statusText: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  successIcon: { fontSize: 48 },
  successTitle: { fontSize: 20, fontWeight: '700', color: colors.success },
  failedIcon: { fontSize: 48 },
  failedTitle: { fontSize: 20, fontWeight: '700', color: colors.error },
  payButton: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#E2136E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  doneButton: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    gap: 12,
  },
  infoIcon: { fontSize: 22 },
  infoContent: { flex: 1 },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.textGray,
    lineHeight: 20,
  },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E2136E',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  webviewBack: { padding: 4 },
  webviewBackText: { color: 'white', fontSize: 15, fontWeight: '600' },
  webviewTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
});

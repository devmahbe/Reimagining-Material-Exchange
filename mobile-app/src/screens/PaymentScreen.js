import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import { Alert } from '../utils/alert';
import { subscribeToPickup } from '../services/pickupService';
import { getPaymentMethod, maskAccount, payForPickup, PAYMENT_METHODS } from '../services/paymentService';
import { AppButton, AppHeader, BottomBar, Card, EmptyState, FormField, LoadingView, SectionHeader } from '../components/ui';
import {
  formatPhone,
  formatTaka,
  isValidPhone,
  normalizePhone,
  parseAmount,
  toBnDigits,
  toEnDigits,
} from '../utils/helpers';
import colors from '../constants/colors';
import { font, radius, spacing } from '../constants/theme';

const MAX_AMOUNT = 1000000;

const STEP_TEXT = {
  verifying: 'তথ্য যাচাই করা হচ্ছে...',
  processing: 'পেমেন্ট প্রক্রিয়া করা হচ্ছে...',
  done: 'পেমেন্ট সফল!',
};

export default function PaymentScreen({ navigation, route }) {
  const { requestId } = route.params;
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState('cash');
  const [account, setAccount] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [step, setStep] = useState(null);

  useEffect(() => {
    let initialised = false;
    const unsubscribe = subscribeToPickup(
      requestId,
      (data) => {
        setRequest(data);
        setLoading(false);
        if (data && !initialised) {
          initialised = true;
          setAmount(String(Math.round(data.estimatedEarnings || 0)));
          setAccount(data.phone || '');
        }
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, [requestId]);

  const method = getPaymentMethod(methodId);
  const amountNum = parseAmount(amount);

  const validate = () => {
    const next = {};
    if (!amountNum || amountNum <= 0) next.amount = 'সঠিক পরিমাণ লিখুন';
    else if (amountNum > MAX_AMOUNT) next.amount = `সর্বোচ্চ ${formatTaka(MAX_AMOUNT)} পরিশোধ করা যাবে`;
    if (method.id === 'wallet' && !isValidPhone(account)) next.account = 'সঠিক মোবাইল নম্বর লিখুন (01XXXXXXXXX)';
    if (method.id === 'bank' && !/^\d{6,20}$/.test(toEnDigits(account).replace(/[\s-]/g, ''))) {
      next.account = 'সঠিক অ্যাকাউন্ট নম্বর লিখুন (৬-২০ সংখ্যা)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const openConfirm = () => {
    if (validate()) setConfirmOpen(true);
  };

  const cleanAccount = () => {
    if (method.id === 'wallet') return normalizePhone(account);
    if (method.id === 'bank') return toEnDigits(account).replace(/[\s-]/g, '');
    return '';
  };

  const handlePay = async () => {
    setStep('verifying');
    try {
      const payment = await payForPickup(request, {
        amount: amountNum,
        methodId,
        account: cleanAccount(),
        note,
        onStep: setStep,
      });
      setTimeout(() => {
        setConfirmOpen(false);
        setStep(null);
        navigation.replace('PaymentReceipt', { paymentId: payment.id, justPaid: true });
      }, 700);
    } catch (error) {
      setStep(null);
      Alert.alert(
        'পেমেন্ট ব্যর্থ',
        error?.code === 'permission-denied'
          ? 'এই পিকআপের পেমেন্ট করার অনুমতি নেই বা এটি আগেই সম্পন্ন হয়েছে।'
          : 'পেমেন্ট সম্পন্ন করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।'
      );
    }
  };

  const back = () => navigation.goBack();

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="পেমেন্ট" onBack={back} />
        <LoadingView />
      </View>
    );
  }

  const canPay =
    request &&
    request.collectorId === auth.currentUser?.uid &&
    ['at-location', 'in-progress', 'on-the-way', 'accepted'].includes(request.status);

  // While a payment is in progress the live listener will see the pickup turn
  // "completed" — keep showing the processing sheet until we navigate away.
  if (!canPay && !step) {
    return (
      <View style={styles.container}>
        <AppHeader title="পেমেন্ট" onBack={back} />
        <EmptyState
          icon={request?.status === 'completed' ? 'checkmark-done-circle-outline' : 'alert-circle-outline'}
          title={request?.status === 'completed' ? 'পেমেন্ট আগেই সম্পন্ন হয়েছে' : 'এই পিকআপের পেমেন্ট করা যাবে না'}
          message={request?.status === 'completed' ? 'এই পিকআপটি ইতিমধ্যে সম্পন্ন ও পরিশোধিত।' : 'শুধুমাত্র নির্ধারিত সংগ্রাহক চলমান পিকআপের পেমেন্ট করতে পারবেন।'}
          actionLabel={request?.paymentId ? 'রসিদ দেখুন' : 'ফিরে যান'}
          onAction={request?.paymentId ? () => navigation.replace('PaymentReceipt', { paymentId: request.paymentId }) : back}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="পেমেন্ট করুন" subtitle="ডেমো পেমেন্ট — কোনো আসল টাকা লেনদেন হবে না" onBack={back} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Payee */}
          <Card style={styles.payee}>
            <View style={styles.payeeIcon}>
              <Ionicons name="home" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.payeeLabel}>প্রাপক</Text>
              <Text style={styles.payeeName}>{request.userName || 'পরিবার'}</Text>
              <Text style={styles.payeeSub}>{formatPhone(request.phone)}</Text>
            </View>
          </Card>

          {/* Amount */}
          <SectionHeader title="চূড়ান্ত পরিমাণ" />
          <Card>
            <View style={[styles.amountBox, errors.amount && { borderColor: colors.error }]}>
              <Text style={styles.currency}>৳</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(t) => {
                  setAmount(t.replace(/[^0-9০-৯.]/g, ''));
                  setErrors((e) => ({ ...e, amount: null }));
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textLight}
                maxLength={9}
              />
            </View>
            {errors.amount ? <Text style={styles.error}>{errors.amount}</Text> : null}
            <Text style={styles.estimateHint}>
              আনুমানিক মূল্য ছিল {formatTaka(request.estimatedEarnings)} — ওজন করার পর সঠিক মূল্য লিখুন
            </Text>
            <View style={styles.quickAmounts}>
              {[request.estimatedEarnings, Math.round((request.estimatedEarnings || 0) * 1.1), Math.round((request.estimatedEarnings || 0) * 0.9)]
                .filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
                .map((v) => (
                  <TouchableOpacity key={v} style={styles.quickAmount} onPress={() => setAmount(String(v))}>
                    <Text style={styles.quickAmountText}>{formatTaka(v)}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </Card>

          {/* Method */}
          <SectionHeader title="পেমেন্ট পদ্ধতি" />
          {PAYMENT_METHODS.map((m) => {
            const active = m.id === methodId;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.method, active && styles.methodActive]}
                onPress={() => {
                  setMethodId(m.id);
                  setErrors((e) => ({ ...e, account: null }));
                  if (m.id === 'wallet') setAccount(request.phone || '');
                  if (m.id === 'bank') setAccount('');
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.methodIcon, { backgroundColor: m.bg }]}>
                  <Ionicons name={m.icon} size={22} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Text style={styles.methodDesc}>{m.description}</Text>
                </View>
                <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? colors.primary : colors.textLight} />
              </TouchableOpacity>
            );
          })}

          {method.needsAccount ? (
            <FormField
              label={method.accountLabel}
              icon={method.id === 'wallet' ? 'phone-portrait-outline' : 'card-outline'}
              placeholder={method.accountPlaceholder}
              value={account}
              onChangeText={(t) => {
                setAccount(t);
                setErrors((e) => ({ ...e, account: null }));
              }}
              keyboardType="number-pad"
              maxLength={method.id === 'wallet' ? 14 : 24}
              error={errors.account}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}

          <FormField
            label="নোট (ঐচ্ছিক)"
            icon="document-text-outline"
            placeholder="যেমন: ১২ কেজি কাগজ, ৩ কেজি প্লাস্টিক"
            value={note}
            onChangeText={setNote}
            maxLength={200}
            style={{ marginTop: method.needsAccount ? 0 : spacing.sm }}
          />
        </ScrollView>

        <BottomBar>
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.footerLabel}>পরিশোধ করবেন</Text>
              <Text style={styles.footerAmount}>{formatTaka(amountNum)}</Text>
            </View>
            <AppButton title="এগিয়ে যান" icon="arrow-forward" onPress={openConfirm} style={{ paddingHorizontal: spacing.xxl }} />
          </View>
        </BottomBar>
      </KeyboardAvoidingView>

      {/* Confirm + processing sheet */}
      <Modal visible={confirmOpen} transparent animationType="slide" onRequestClose={() => !step && setConfirmOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
            {step ? (
              <View style={styles.processing}>
                {step === 'done' ? (
                  <View style={styles.doneCircle}>
                    <Ionicons name="checkmark" size={44} color={colors.white} />
                  </View>
                ) : (
                  <ActivityIndicator size="large" color={colors.primary} />
                )}
                <Text style={styles.processingText}>{STEP_TEXT[step]}</Text>
                <Text style={styles.processingSub}>অনুগ্রহ করে অপেক্ষা করুন, অ্যাপ বন্ধ করবেন না</Text>
              </View>
            ) : (
              <>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>পেমেন্ট নিশ্চিত করুন</Text>
                <Text style={styles.sheetAmount}>{formatTaka(amountNum)}</Text>
                <View style={styles.summaryBox}>
                  <SummaryLine label="প্রাপক" value={request.userName || 'পরিবার'} />
                  <SummaryLine label="পদ্ধতি" value={method.label} />
                  {method.needsAccount ? <SummaryLine label={method.accountLabel} value={maskAccount(cleanAccount())} /> : null}
                  <SummaryLine label="উপাদান" value={`${toBnDigits((request.materials || []).length)}টি`} />
                  <SummaryLine label="চার্জ" value="৳০ (ডেমো)" last />
                </View>
                <AppButton title={`${formatTaka(amountNum)} পরিশোধ করুন`} icon="lock-closed" onPress={handlePay} />
                <AppButton title="বাতিল" variant="ghost" onPress={() => setConfirmOpen(false)} style={{ marginTop: spacing.xs }} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SummaryLine({ label, value, last }) {
  return (
    <View style={[styles.summaryLine, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  payee: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  payeeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  payeeLabel: { fontSize: font.xs + 1, color: colors.textGray },
  payeeName: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  payeeSub: { fontSize: font.sm, color: colors.textGray },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primarySoft,
  },
  currency: { fontSize: 32, fontWeight: '800', color: colors.primary, marginRight: spacing.sm },
  amountInput: { flex: 1, fontSize: 34, fontWeight: '800', color: colors.text, paddingVertical: spacing.md },
  error: { color: colors.error, fontSize: font.xs + 1, marginTop: 6 },
  estimateHint: { fontSize: font.sm, color: colors.textGray, marginTop: spacing.md, lineHeight: 19 },
  quickAmounts: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  quickAmount: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface },
  quickAmountText: { fontSize: font.sm, fontWeight: '700', color: colors.primary },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodActive: { borderColor: colors.primary },
  methodIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontSize: font.md, fontWeight: '700', color: colors.text },
  methodDesc: { fontSize: font.sm - 1, color: colors.textGray, marginTop: 2 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  footerLabel: { fontSize: font.xs + 1, color: colors.textGray },
  footerAmount: { fontSize: font.xxl, fontWeight: '800', color: colors.primary },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl + 4, borderTopRightRadius: radius.xl + 4, padding: spacing.xl },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.lg },
  sheetTitle: { fontSize: font.lg, fontWeight: '700', color: colors.textGray, textAlign: 'center' },
  sheetAmount: { fontSize: 38, fontWeight: '800', color: colors.primary, textAlign: 'center', marginVertical: spacing.sm },
  summaryBox: { backgroundColor: colors.background, borderRadius: radius.lg, paddingHorizontal: spacing.lg, marginVertical: spacing.lg },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  summaryLabel: { fontSize: font.sm + 1, color: colors.textGray },
  summaryValue: { fontSize: font.sm + 1, fontWeight: '700', color: colors.text, flexShrink: 1, textAlign: 'right', marginLeft: spacing.md },
  processing: { alignItems: 'center', paddingVertical: spacing.xxxl },
  doneCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  processingText: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginTop: spacing.xl },
  processingSub: { fontSize: font.sm, color: colors.textGray, marginTop: spacing.sm },
});

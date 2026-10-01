import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { getPayment, getPaymentMethod, maskAccount } from '../services/paymentService';
import { AppButton, AppHeader, BottomBar, EmptyState, LoadingView } from '../components/ui';
import { formatDateTimeBangla, formatTaka, toBnDigits } from '../utils/helpers';
import colors from '../constants/colors';
import { font, radius, shadow, spacing } from '../constants/theme';

export default function PaymentReceiptScreen({ navigation, route }) {
  const { paymentId, justPaid } = route.params;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayment(paymentId)
      .then(setPayment)
      .catch(() => setPayment(null))
      .finally(() => setLoading(false));
  }, [paymentId]);

  const isPayer = payment?.payerId === auth.currentUser?.uid;
  const method = payment ? getPaymentMethod(payment.method) : null;

  const shareReceipt = () => {
    if (!payment) return;
    const lines = [
      'ভাঙ্গারি এক্সচেঞ্জ — পেমেন্ট রসিদ',
      `ট্রানজেকশন: ${payment.transactionId}`,
      `পরিমাণ: ${formatTaka(payment.amount)}`,
      `পদ্ধতি: ${method.label}`,
      `প্রদানকারী: ${payment.payerName}`,
      `প্রাপক: ${payment.payeeName || 'পরিবার'}`,
      `সময়: ${formatDateTimeBangla(payment.createdAt)}`,
      '(ডেমো পেমেন্ট)',
    ];
    Share.share({ message: lines.join('\n') }).catch(() => {});
  };

  const done = () => {
    if (justPaid) {
      navigation.reset({ index: 0, routes: [{ name: 'CollectorHome' }] });
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="পেমেন্ট রসিদ" onBack={done} />
        <LoadingView />
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.container}>
        <AppHeader title="পেমেন্ট রসিদ" onBack={done} />
        <EmptyState icon="receipt-outline" title="রসিদ পাওয়া যায়নি" message="এই পেমেন্টের তথ্য দেখা যাচ্ছে না" actionLabel="ফিরে যান" onAction={done} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="পেমেন্ট রসিদ" onBack={done} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.receipt}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={40} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>{isPayer ? 'পেমেন্ট সফল হয়েছে' : 'পেমেন্ট পেয়েছেন'}</Text>
          <Text style={styles.amount}>{formatTaka(payment.amount)}</Text>
          <View style={styles.demoBadge}>
            <Ionicons name="flask-outline" size={13} color={colors.accent} />
            <Text style={styles.demoText}>ডেমো লেনদেন</Text>
          </View>

          <View style={styles.dashed} />

          <Line label="ট্রানজেকশন আইডি" value={payment.transactionId} mono />
          <Line label="সময়" value={formatDateTimeBangla(payment.createdAt)} />
          <Line label="পদ্ধতি" value={method.label} icon={method.icon} iconColor={method.color} />
          {payment.account ? <Line label="অ্যাকাউন্ট" value={maskAccount(payment.account)} /> : null}
          <Line label="প্রদানকারী (সংগ্রাহক)" value={payment.payerName} />
          <Line label="প্রাপক (পরিবার)" value={payment.payeeName || 'পরিবার'} />
          {payment.materials?.length ? (
            <Line
              label="উপাদান"
              value={payment.materials.map((m) => `${m.name} ${toBnDigits(m.quantity)} ${m.unit}`).join(', ')}
            />
          ) : null}
          {payment.note ? <Line label="নোট" value={payment.note} /> : null}
          <Line label="স্ট্যাটাস" value="সফল" valueColor={colors.success} last />
        </View>

        {justPaid ? (
          <Text style={styles.hint}>পিকআপটি সম্পন্ন হিসেবে চিহ্নিত হয়েছে এবং পরিবারকে জানানো হয়েছে।</Text>
        ) : null}
      </ScrollView>

      <BottomBar>
        <View style={styles.actions}>
          <AppButton title="শেয়ার" icon="share-social-outline" variant="outline" onPress={shareReceipt} style={{ flex: 1 }} />
          <AppButton title={justPaid ? 'হোমে ফিরুন' : 'ঠিক আছে'} icon="checkmark" onPress={done} style={{ flex: 1 }} />
        </View>
      </BottomBar>
    </View>
  );
}

function Line({ label, value, mono, icon, iconColor, valueColor, last }) {
  return (
    <View style={[styles.line, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.lineLabel}>{label}</Text>
      <View style={styles.lineValueWrap}>
        {icon ? <Ionicons name={icon} size={15} color={iconColor} /> : null}
        <Text style={[styles.lineValue, mono && styles.mono, valueColor && { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  receipt: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', ...shadow.md },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginTop: spacing.lg },
  amount: { fontSize: 38, fontWeight: '800', color: colors.primary, marginTop: spacing.xs },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  demoText: { fontSize: font.xs + 1, fontWeight: '700', color: colors.accent },
  dashed: { alignSelf: 'stretch', borderTopWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', marginVertical: spacing.xl },
  line: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.lg,
  },
  lineLabel: { fontSize: font.sm, color: colors.textGray },
  lineValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  lineValue: { fontSize: font.sm + 1, fontWeight: '700', color: colors.text, textAlign: 'right', flexShrink: 1 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: font.sm },
  hint: { textAlign: 'center', color: colors.textGray, fontSize: font.sm, marginTop: spacing.lg, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.md },
});

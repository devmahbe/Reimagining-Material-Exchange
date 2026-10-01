import React, { useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '../../utils/alert';
import { cancelPickup, pickupErrorMessage, subscribeToPickup } from '../../services/pickupService';
import { getUserProfile } from '../../services/userService';
import { getCollectorRating } from '../../services/reviewService';
import { getPaymentMethod } from '../../services/paymentService';
import MapPreview from '../../components/MapPreview';
import { AppButton, AppHeader, Avatar, BottomBar, Card, EmptyState, InfoRow, LoadingView, SectionHeader } from '../../components/ui';
import { getStatusMeta, TIMELINE_STEPS } from '../../constants/status';
import {
  estimateMaterial,
  formatDateTimeBangla,
  formatPhone,
  formatRelativeDay,
  formatTaka,
  formatTimeBangla,
  toBnDigits,
} from '../../utils/helpers';
import colors from '../../constants/colors';
import { font, radius, spacing } from '../../constants/theme';

export default function TrackPickupScreen({ navigation, route }) {
  const { requestId } = route.params;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [collector, setCollector] = useState(null);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToPickup(
      requestId,
      (data) => {
        if (!data) setNotFound(true);
        setRequest(data);
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [requestId]);

  const collectorId = request?.collectorId;
  useEffect(() => {
    if (!collectorId) return;
    let active = true;
    getUserProfile(collectorId).then((p) => active && setCollector(p)).catch(() => {});
    getCollectorRating(collectorId).then((r) => active && setRating(r)).catch(() => {});
    return () => {
      active = false;
    };
  }, [collectorId]);

  const callCollector = () => {
    const phone = collector?.phone || request?.collectorPhone;
    if (!phone) {
      Alert.alert('ফোন নম্বর নেই', 'সংগ্রাহকের ফোন নম্বর পাওয়া যায়নি। বার্তা পাঠিয়ে যোগাযোগ করুন।');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('ত্রুটি', 'ফোন কল করা যাচ্ছে না'));
  };

  const messageCollector = () =>
    navigation.navigate('ChatScreen', {
      recipientId: collectorId,
      recipientName: collector?.name || request?.collectorName || 'সংগ্রাহক',
      requestId,
    });

  const handleCancel = () =>
    Alert.alert('অনুরোধ বাতিল করবেন?', 'এই পিকআপ অনুরোধটি বাতিল হয়ে যাবে।', [
      { text: 'না', style: 'cancel' },
      {
        text: 'হ্যাঁ, বাতিল করুন',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelPickup(requestId);
          } catch (error) {
            Alert.alert('ত্রুটি', pickupErrorMessage(error));
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);

  const back = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HouseholdHome'));

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="পিকআপ ট্র্যাক" onBack={back} />
        <LoadingView />
      </View>
    );
  }

  if (notFound || !request) {
    return (
      <View style={styles.container}>
        <AppHeader title="পিকআপ ট্র্যাক" onBack={back} />
        <EmptyState icon="alert-circle-outline" title="অনুরোধটি পাওয়া যায়নি" message="অনুরোধটি মুছে ফেলা হয়েছে অথবা দেখার অনুমতি নেই" actionLabel="ফিরে যান" onAction={back} />
      </View>
    );
  }

  const meta = getStatusMeta(request.status);
  const isCancelled = request.status === 'cancelled';
  const canCancel = request.status === 'pending' || request.status === 'accepted';
  const canRate = request.status === 'completed' && !request.userRating && collectorId;
  const currentIndex = TIMELINE_STEPS.findIndex((s) => s.key === (request.status === 'in-progress' ? 'at-location' : request.status));
  const payMethod = request.paymentMethod ? getPaymentMethod(request.paymentMethod) : null;

  return (
    <View style={styles.container}>
      <AppHeader title="পিকআপ ট্র্যাক" subtitle={`অনুরোধ #${requestId.slice(-6).toUpperCase()}`} onBack={back} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Status hero */}
        <View style={[styles.statusHero, { backgroundColor: meta.bg }]}>
          <View style={[styles.statusIcon, { backgroundColor: meta.color }]}>
            <Ionicons name={meta.icon.replace('-outline', '')} size={28} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
            <Text style={styles.statusMessage}>{meta.message}</Text>
          </View>
        </View>

        {/* Payment received */}
        {request.paymentStatus === 'paid' ? (
          <Card style={styles.paidCard} onPress={request.paymentId ? () => navigation.navigate('PaymentReceipt', { paymentId: request.paymentId }) : undefined}>
            <Ionicons name="wallet" size={26} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.paidTitle}>{formatTaka(request.actualEarnings)} পেমেন্ট পেয়েছেন</Text>
              <Text style={styles.paidSub}>{payMethod?.label} • {formatDateTimeBangla(request.paidAt)}</Text>
            </View>
            {request.paymentId ? <Ionicons name="chevron-forward" size={18} color={colors.textGray} /> : null}
          </Card>
        ) : null}

        {/* Timeline */}
        {!isCancelled ? (
          <>
            <SectionHeader title="অগ্রগতি" />
            <Card>
              {TIMELINE_STEPS.map((step, index) => {
                const done = index <= currentIndex;
                const time = request[step.timeField];
                const last = index === TIMELINE_STEPS.length - 1;
                return (
                  <View key={step.key} style={styles.step}>
                    <View style={styles.stepLeft}>
                      <View style={[styles.dot, done && styles.dotDone, index === currentIndex && styles.dotCurrent]}>
                        {done ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                      </View>
                      {!last ? <View style={[styles.line, index < currentIndex && styles.lineDone]} /> : null}
                    </View>
                    <View style={[styles.stepBody, last && { paddingBottom: 0 }]}>
                      <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{step.label}</Text>
                      {time ? <Text style={styles.stepTime}>{formatRelativeDay(time)}, {formatTimeBangla(time)}</Text> : null}
                    </View>
                  </View>
                );
              })}
            </Card>
          </>
        ) : (
          <Card style={{ marginTop: spacing.lg }}>
            <Text style={styles.cancelNote}>এই অনুরোধটি {formatDateTimeBangla(request.cancelledAt)} তারিখে বাতিল করা হয়েছে।</Text>
          </Card>
        )}

        {/* Collector */}
        {collectorId && !isCancelled ? (
          <>
            <SectionHeader title="আপনার সংগ্রাহক" />
            <Card>
              <View style={styles.collectorRow}>
                <Avatar name={collector?.name || request.collectorName} size={52} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.collectorName}>{collector?.name || request.collectorName || 'সংগ্রাহক'}</Text>
                  <Text style={styles.collectorPhone}>{formatPhone(collector?.phone || request.collectorPhone) || 'ফোন নম্বর নেই'}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color={colors.accentLight} />
                    <Text style={styles.ratingText}>
                      {rating.count > 0 ? `${toBnDigits(rating.average.toFixed(1))} (${toBnDigits(rating.count)} রিভিউ)` : 'নতুন সংগ্রাহক'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.contactRow}>
                <AppButton title="কল করুন" icon="call-outline" variant="soft" size="sm" onPress={callCollector} style={{ flex: 1 }} />
                <AppButton title="বার্তা" icon="chatbubble-ellipses-outline" variant="soft" size="sm" onPress={messageCollector} style={{ flex: 1 }} />
              </View>
            </Card>
          </>
        ) : null}

        {/* Details */}
        <SectionHeader title="পিকআপের বিবরণ" />
        <Card style={{ paddingVertical: spacing.xs }}>
          <InfoRow icon="calendar-outline" label="তারিখ ও সময়" value={`${formatRelativeDay(request.schedule?.date)}, ${request.schedule?.timeSlot || ''}`} />
          <InfoRow icon="location-outline" label="ঠিকানা" value={request.address} />
          <InfoRow icon="call-outline" label="যোগাযোগ" value={formatPhone(request.phone)} last />
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          {(request.materials || []).map((m, i) => (
            <View key={i} style={styles.materialRow}>
              <Text style={styles.materialName}>{m.name}</Text>
              <Text style={styles.materialQty}>{toBnDigits(m.quantity)} {m.unit}</Text>
              <Text style={styles.materialAmount}>{formatTaka(estimateMaterial(m))}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{request.status === 'completed' ? 'চূড়ান্ত মূল্য' : 'আনুমানিক মূল্য'}</Text>
            <Text style={styles.totalValue}>
              {formatTaka(request.status === 'completed' ? request.actualEarnings ?? request.estimatedEarnings : request.estimatedEarnings)}
            </Text>
          </View>
        </Card>

        {request.images?.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
            {request.images.map((uri, i) => (
              <Image key={uri + i} source={{ uri }} style={styles.photo} />
            ))}
          </ScrollView>
        ) : null}

        {/* Map */}
        {request.address && !isCancelled ? (
          <>
            <SectionHeader title="ঠিকানার মানচিত্র" />
            <Card style={{ padding: spacing.md }}>
              <MapPreview address={request.address} height={200} />
            </Card>
          </>
        ) : null}
      </ScrollView>

      {canCancel || canRate ? (
        <BottomBar>
          {canRate ? (
            <AppButton
              title="সংগ্রাহককে রেটিং দিন"
              icon="star-outline"
              variant="accent"
              onPress={() =>
                navigation.navigate('RateCollector', {
                  requestId,
                  collectorId,
                  collectorName: collector?.name || request.collectorName || 'সংগ্রাহক',
                })
              }
            />
          ) : (
            <AppButton title="অনুরোধ বাতিল করুন" icon="close-circle-outline" variant="danger" onPress={handleCancel} loading={cancelling} />
          )}
        </BottomBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statusHero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.xl, padding: spacing.xl },
  statusIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontSize: font.xl, fontWeight: '800' },
  statusMessage: { fontSize: font.sm + 1, color: colors.textBody, marginTop: 2 },
  paidCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.success },
  paidTitle: { fontSize: font.md, fontWeight: '800', color: colors.text },
  paidSub: { fontSize: font.sm, color: colors.textGray, marginTop: 2 },
  step: { flexDirection: 'row' },
  stepLeft: { alignItems: 'center', width: 28 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotCurrent: { boxShadow: '0px 0px 0px 4px rgba(27,107,69,0.18)' },
  line: { width: 2, flex: 1, minHeight: 22, backgroundColor: colors.border, marginVertical: 2 },
  lineDone: { backgroundColor: colors.primary },
  stepBody: { flex: 1, paddingLeft: spacing.md, paddingBottom: spacing.lg },
  stepLabel: { fontSize: font.md, color: colors.textLight, fontWeight: '600' },
  stepLabelDone: { color: colors.text },
  stepTime: { fontSize: font.xs + 1, color: colors.textGray, marginTop: 2 },
  cancelNote: { fontSize: font.sm + 1, color: colors.textBody },
  collectorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  collectorName: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  collectorPhone: { fontSize: font.sm, color: colors.textGray, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: font.sm, color: colors.textBody, fontWeight: '600' },
  contactRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  materialRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  materialName: { flex: 1, fontSize: font.md, color: colors.text, fontWeight: '600' },
  materialQty: { fontSize: font.sm, color: colors.textGray, marginRight: spacing.lg },
  materialAmount: { fontSize: font.md, fontWeight: '700', color: colors.text, minWidth: 64, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: { fontSize: font.md, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: font.lg, fontWeight: '800', color: colors.primary },
  photos: { gap: spacing.sm, marginTop: spacing.md },
  photo: { width: 90, height: 90, borderRadius: radius.md, backgroundColor: colors.surface },
});

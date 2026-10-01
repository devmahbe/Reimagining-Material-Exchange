import React, { useEffect, useState } from 'react';
import { Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import { Alert } from '../../utils/alert';
import { getCurrentUserProfile } from '../../services/userService';
import { acceptPickup, pickupErrorMessage, subscribeToPickup, updatePickupStatus } from '../../services/pickupService';
import MapPreview from '../../components/MapPreview';
import { AppButton, AppHeader, Avatar, BottomBar, Card, EmptyState, InfoRow, LoadingView, SectionHeader, StatusBadge } from '../../components/ui';
import { findCatalogMaterial } from '../../constants/materials';
import {
  estimateMaterial,
  formatDateBangla,
  formatPhone,
  formatPriceRange,
  formatTaka,
  toBnDigits,
} from '../../utils/helpers';
import colors from '../../constants/colors';
import { font, radius, spacing } from '../../constants/theme';

const NEXT_STEP = {
  accepted: { status: 'on-the-way', title: 'রওনা দিয়েছি', icon: 'bicycle-outline' },
  'on-the-way': { status: 'at-location', title: 'ঠিকানায় পৌঁছেছি', icon: 'location-outline' },
};

export default function RequestDetailsScreen({ navigation, route }) {
  const { requestId } = route.params;
  const uid = auth.currentUser?.uid;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToPickup(
      requestId,
      (data) => {
        setRequest(data);
        setUnavailable(!data);
        setLoading(false);
      },
      () => {
        // Permission denied means another collector has taken this request
        setUnavailable(true);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [requestId]);

  const isMine = request?.collectorId === uid;

  const handleAccept = () =>
    Alert.alert('পিকআপ গ্রহণ করবেন?', 'গ্রহণ করার পর পরিবারকে জানানো হবে।', [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'গ্রহণ করুন',
        onPress: async () => {
          setBusy(true);
          try {
            const profile = await getCurrentUserProfile();
            await acceptPickup(requestId, profile);
          } catch (e) {
            Alert.alert('গ্রহণ করা যায়নি', pickupErrorMessage(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  const advance = async (status) => {
    setBusy(true);
    try {
      await updatePickupStatus(requestId, status);
    } catch (e) {
      Alert.alert('ত্রুটি', pickupErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const callHousehold = () => {
    if (!request?.phone) return;
    Linking.openURL(`tel:${request.phone}`).catch(() => Alert.alert('ত্রুটি', 'ফোন কল করা যাচ্ছে না'));
  };

  const messageHousehold = () =>
    navigation.navigate('ChatScreen', {
      recipientId: request.userId,
      recipientName: request.userName || 'পরিবার',
      requestId,
    });

  const back = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('CollectorHome'));

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="পিকআপের বিস্তারিত" onBack={back} />
        <LoadingView />
      </View>
    );
  }

  if (unavailable || !request) {
    return (
      <View style={styles.container}>
        <AppHeader title="পিকআপের বিস্তারিত" onBack={back} />
        <EmptyState
          icon="lock-closed-outline"
          title="অনুরোধটি আর পাওয়া যাচ্ছে না"
          message="সম্ভবত অন্য একজন সংগ্রাহক এটি গ্রহণ করেছেন অথবা পরিবার অনুরোধটি বাতিল করেছে।"
          actionLabel="ফিরে যান"
          onAction={back}
        />
      </View>
    );
  }

  const next = isMine ? NEXT_STEP[request.status] : null;
  const canComplete = isMine && (request.status === 'at-location' || request.status === 'in-progress');

  return (
    <View style={styles.container}>
      <AppHeader title="পিকআপের বিস্তারিত" subtitle={`অনুরোধ #${requestId.slice(-6).toUpperCase()}`} onBack={back} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={styles.summary}>
          <View style={{ flex: 1 }}>
            <StatusBadge status={request.status} />
            <Text style={styles.summaryDate}>
              {formatDateBangla(request.schedule?.date, { short: true })} • {request.schedule?.timeSlot || '—'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.summaryLabel}>{request.status === 'completed' ? 'পরিশোধিত' : 'আনুমানিক'}</Text>
            <Text style={styles.summaryAmount}>
              {formatTaka(request.status === 'completed' ? request.actualEarnings ?? request.estimatedEarnings : request.estimatedEarnings)}
            </Text>
          </View>
        </Card>

        <SectionHeader title="উপাদান তালিকা" />
        <Card>
          {(request.materials || []).map((m, i) => {
            const catalog = findCatalogMaterial(m);
            return (
              <View key={i} style={[styles.materialRow, i === request.materials.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.materialIcon, { backgroundColor: catalog?.bg || colors.primarySoft }]}>
                  <MaterialCommunityIcons name={catalog?.icon || 'recycle'} size={20} color={catalog?.color || colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.materialName}>{m.name}</Text>
                  <Text style={styles.materialDetail}>
                    {toBnDigits(m.quantity)} {m.unit} × {formatPriceRange(m)}/{m.unit}
                  </Text>
                </View>
                <Text style={styles.materialAmount}>{formatTaka(estimateMaterial(m))}</Text>
              </View>
            );
          })}
        </Card>

        {request.images?.length > 0 ? (
          <>
            <SectionHeader title={`ছবি (${toBnDigits(request.images.length)})`} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {request.images.map((uri, i) => (
                <TouchableOpacity key={uri + i} onPress={() => setViewer(uri)}>
                  <Image source={{ uri }} style={styles.photo} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : null}

        <SectionHeader title="পরিবারের তথ্য" />
        <Card>
          <View style={styles.personRow}>
            <Avatar name={request.userName || 'প'} size={46} icon={request.userName ? undefined : 'home'} />
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>{request.userName || 'পরিবার'}</Text>
              <Text style={styles.personPhone}>
                {isMine ? formatPhone(request.phone) : 'গ্রহণ করার পর ফোন নম্বর দেখা যাবে'}
              </Text>
            </View>
          </View>
          <InfoRow icon="location-outline" label="ঠিকানা" value={request.address} last={!request.notes} />
          {request.notes ? <InfoRow icon="chatbox-ellipses-outline" label="নির্দেশনা" value={request.notes} last /> : null}
          {isMine && request.status !== 'completed' ? (
            <View style={styles.contactRow}>
              <AppButton title="কল করুন" icon="call-outline" variant="soft" size="sm" onPress={callHousehold} style={{ flex: 1 }} />
              <AppButton title="বার্তা" icon="chatbubble-ellipses-outline" variant="soft" size="sm" onPress={messageHousehold} style={{ flex: 1 }} />
            </View>
          ) : null}
        </Card>

        {request.address ? (
          <>
            <SectionHeader title="মানচিত্র" />
            <Card style={{ padding: spacing.md }}>
              <MapPreview address={request.address} height={210} />
            </Card>
          </>
        ) : null}

        {request.status === 'completed' && request.paymentId ? (
          <AppButton
            title="পেমেন্ট রসিদ দেখুন"
            icon="receipt-outline"
            variant="outline"
            style={{ marginTop: spacing.xl }}
            onPress={() => navigation.navigate('PaymentReceipt', { paymentId: request.paymentId })}
          />
        ) : null}
      </ScrollView>

      {request.status === 'pending' || next || canComplete ? (
        <BottomBar>
          {request.status === 'pending' ? (
            <AppButton title="পিকআপ গ্রহণ করুন" icon="checkmark-circle-outline" onPress={handleAccept} loading={busy} />
          ) : null}
          {next ? <AppButton title={next.title} icon={next.icon} onPress={() => advance(next.status)} loading={busy} /> : null}
          {canComplete ? (
            <AppButton
              title="ওজন করে পেমেন্ট করুন"
              icon="wallet-outline"
              variant="accent"
              onPress={() => navigation.navigate('Payment', { requestId })}
            />
          ) : null}
        </BottomBar>
      ) : null}

      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <TouchableOpacity style={styles.viewer} activeOpacity={1} onPress={() => setViewer(null)}>
          {viewer ? <Image source={{ uri: viewer }} style={styles.viewerImage} resizeMode="contain" /> : null}
          <View style={styles.viewerClose}>
            <Ionicons name="close" size={26} color={colors.white} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  summary: { flexDirection: 'row', alignItems: 'center' },
  summaryDate: { fontSize: font.sm, color: colors.textGray, marginTop: spacing.sm },
  summaryLabel: { fontSize: font.xs + 1, color: colors.textGray },
  summaryAmount: { fontSize: font.xxl, fontWeight: '800', color: colors.primary },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  materialIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  materialName: { fontSize: font.md, fontWeight: '700', color: colors.text },
  materialDetail: { fontSize: font.sm, color: colors.textGray, marginTop: 2 },
  materialAmount: { fontSize: font.md, fontWeight: '700', color: colors.text },
  photo: { width: 100, height: 100, borderRadius: radius.md, backgroundColor: colors.surface },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  personName: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  personPhone: { fontSize: font.sm, color: colors.textGray, marginTop: 2 },
  contactRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '80%' },
  viewerClose: { position: 'absolute', top: 48, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});

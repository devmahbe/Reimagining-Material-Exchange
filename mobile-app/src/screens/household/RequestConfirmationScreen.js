import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Alert } from '../../utils/alert';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createPickup } from '../../services/pickupService';
import { AppButton, AppHeader, BottomBar, Card, InfoRow, SectionHeader } from '../../components/ui';
import {
  calculateEarnings,
  estimateMaterial,
  formatPhone,
  formatPriceRange,
  formatTaka,
  toBnDigits,
  uploadMultipleImages,
} from '../../utils/helpers';
import colors from '../../constants/colors';
import { font, radius, spacing } from '../../constants/theme';

export default function RequestConfirmationScreen({ navigation, route }) {
  const { materials, images = [], schedule, address, phone, notes, userName } = route.params;
  const [submitting, setSubmitting] = useState(false);
  const [stepText, setStepText] = useState('');
  const total = calculateEarnings(materials);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let imageUrls = [];
      let failedUploads = 0;
      if (images.length > 0) {
        setStepText('ছবি আপলোড হচ্ছে...');
        const result = await uploadMultipleImages(images, 'pickups');
        imageUrls = result.urls;
        failedUploads = result.failed;
      }

      setStepText('অনুরোধ জমা হচ্ছে...');
      const requestId = await createPickup({ materials, images: imageUrls, schedule, address, phone, notes, userName });

      const goToTracking = () =>
        navigation.reset({
          index: 1,
          routes: [{ name: 'HouseholdHome' }, { name: 'TrackPickup', params: { requestId } }],
        });

      Alert.alert(
        'অনুরোধ জমা হয়েছে ✅',
        failedUploads > 0
          ? `আপনার পিকআপ অনুরোধ জমা হয়েছে, তবে ${toBnDigits(failedUploads)}টি ছবি আপলোড করা যায়নি।`
          : 'শীঘ্রই একজন সংগ্রাহক আপনার অনুরোধ গ্রহণ করবেন।',
        [{ text: 'ট্র্যাক করুন', onPress: goToTracking }],
        { cancelable: false }
      );
    } catch (error) {
      Alert.alert('ত্রুটি', 'অনুরোধ জমা দেওয়া যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
      setStepText('');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="পর্যালোচনা" subtitle="ধাপ ৩/৩ — তথ্য যাচাই করুন" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <SectionHeader title="উপাদান" style={{ marginTop: 0 }} />
        <Card>
          {materials.map((m, i) => (
            <View key={m.id || i} style={[styles.materialRow, i === materials.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.materialIcon, { backgroundColor: m.bg || colors.primarySoft }]}>
                <MaterialCommunityIcons name={m.icon || 'recycle'} size={20} color={m.color || colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.materialName}>{m.name}</Text>
                <Text style={styles.materialDetail}>
                  {toBnDigits(m.quantity)} {m.unit} × {formatPriceRange(m)}
                </Text>
              </View>
              <Text style={styles.materialAmount}>{formatTaka(estimateMaterial(m))}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>আনুমানিক মোট</Text>
            <Text style={styles.totalValue}>{formatTaka(total)}</Text>
          </View>
        </Card>

        <SectionHeader title="সময় ও ঠিকানা" />
        <Card style={{ paddingVertical: spacing.xs }}>
          <InfoRow icon="calendar-outline" label="তারিখ" value={schedule.dateDisplay} />
          <InfoRow icon="time-outline" label="সময়" value={schedule.timeSlot} />
          <InfoRow icon="location-outline" label="ঠিকানা" value={address} />
          <InfoRow icon="call-outline" label="ফোন" value={formatPhone(phone)} last={!notes} />
          {notes ? <InfoRow icon="chatbox-ellipses-outline" label="নির্দেশনা" value={notes} last /> : null}
        </Card>

        {images.length > 0 ? (
          <>
            <SectionHeader title={`ছবি (${toBnDigits(images.length)})`} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {images.map((uri, i) => (
                <Image key={uri + i} source={{ uri }} style={styles.photo} />
              ))}
            </ScrollView>
          </>
        ) : null}

        <View style={styles.note}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={styles.noteText}>
            সংগ্রাহক পিকআপের সময় ওজন করে চূড়ান্ত দাম ঠিক করবেন এবং অ্যাপের মাধ্যমে পেমেন্ট করবেন। পিকআপ শুরুর আগে আপনি অনুরোধ বাতিল করতে পারবেন।
          </Text>
        </View>
      </ScrollView>

      <BottomBar>
        {submitting && stepText ? <Text style={styles.stepText}>{stepText}</Text> : null}
        <AppButton title="অনুরোধ নিশ্চিত করুন" icon="checkmark-circle-outline" onPress={handleSubmit} loading={submitting} />
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
  },
  totalLabel: { fontSize: font.md, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: font.xl, fontWeight: '800', color: colors.primary },
  photo: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.surface },
  note: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  noteText: { flex: 1, fontSize: font.sm, color: colors.textBody, lineHeight: 20 },
  stepText: { textAlign: 'center', color: colors.textGray, fontSize: font.sm, marginBottom: spacing.sm },
});

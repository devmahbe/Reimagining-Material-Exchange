import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Alert } from '../../utils/alert';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppButton, AppHeader, BottomBar, Card, SectionHeader } from '../../components/ui';
import { MATERIALS } from '../../constants/materials';
import { calculateEarnings, formatPriceRange, formatTaka, toBnDigits } from '../../utils/helpers';
import colors from '../../constants/colors';
import { font, radius, spacing } from '../../constants/theme';

const MAX_PHOTOS = 5;

export default function MaterialSelectionScreen({ navigation, route }) {
  const preselect = route.params?.preselect;
  const [selected, setSelected] = useState(() => {
    const m = MATERIALS.find((x) => x.id === preselect);
    return m ? { [m.id]: 1 } : {};
  });
  const [images, setImages] = useState([]);

  const setQuantity = (id, qty) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(qty, 999);
      return next;
    });

  const selectedMaterials = MATERIALS.filter((m) => selected[m.id]).map((m) => ({ ...m, quantity: selected[m.id] }));
  const estimate = calculateEarnings(selectedMaterials);

  const addAssets = (assets) => {
    const uris = (assets || []).map((a) => a.uri);
    setImages((prev) => [...prev, ...uris].slice(0, MAX_PHOTOS));
  };

  const pickImage = async () => {
    if (images.length >= MAX_PHOTOS) {
      Alert.alert('সর্বোচ্চ ছবি', `সর্বোচ্চ ${toBnDigits(MAX_PHOTOS)}টি ছবি যোগ করা যাবে`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('অনুমতি প্রয়োজন', 'ছবি নির্বাচন করতে গ্যালারির অনুমতি দিন');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - images.length,
      quality: 0.6,
    });
    if (!result.canceled) addAssets(result.assets);
  };

  const takePhoto = async () => {
    if (images.length >= MAX_PHOTOS) {
      Alert.alert('সর্বোচ্চ ছবি', `সর্বোচ্চ ${toBnDigits(MAX_PHOTOS)}টি ছবি যোগ করা যাবে`);
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('অনুমতি প্রয়োজন', 'ছবি তুলতে ক্যামেরার অনুমতি দিন');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled) addAssets(result.assets);
  };

  const handleContinue = () => {
    if (selectedMaterials.length === 0) {
      Alert.alert('উপাদান নির্বাচন করুন', 'অন্তত একটি উপাদান নির্বাচন করুন');
      return;
    }
    navigation.navigate('SchedulePickup', { materials: selectedMaterials, images });
  };

  return (
    <View style={styles.container}>
      <AppHeader title="উপাদান নির্বাচন" subtitle="ধাপ ১/৩ — কী বিক্রি করবেন?" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={18} color={colors.info} />
          <Text style={styles.tipText}>পরিমাণ আনুমানিক দিন — সংগ্রাহক পিকআপের সময় ওজন করে দাম ঠিক করবেন।</Text>
        </View>

        {MATERIALS.map((m) => {
          const qty = selected[m.id] || 0;
          const isSelected = qty > 0;
          return (
            <View key={m.id} style={[styles.row, isSelected && styles.rowSelected]}>
              <View style={[styles.rowIcon, { backgroundColor: m.bg }]}>
                <MaterialCommunityIcons name={m.icon} size={26} color={m.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{m.name}</Text>
                <Text style={styles.rowPrice}>{formatPriceRange(m)} / {m.unit}</Text>
              </View>
              {isSelected ? (
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setQuantity(m.id, qty - 1)} accessibilityLabel="কমান">
                    <Ionicons name={qty === 1 ? 'trash-outline' : 'remove'} size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <View style={styles.qtyBox}>
                    <Text style={styles.qtyText}>{toBnDigits(qty)}</Text>
                    <Text style={styles.qtyUnit}>{m.unit}</Text>
                  </View>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setQuantity(m.id, qty + 1)} accessibilityLabel="বাড়ান">
                    <Ionicons name="add" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addBtn} onPress={() => setQuantity(m.id, 1)}>
                  <Ionicons name="add" size={16} color={colors.white} />
                  <Text style={styles.addText}>যোগ</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <SectionHeader title="ছবি যোগ করুন (ঐচ্ছিক)" />
        <Card>
          <Text style={styles.photoHint}>স্পষ্ট ছবি দিলে সংগ্রাহক সহজে মূল্যায়ন করতে পারবেন</Text>
          <View style={styles.photoRow}>
            {images.map((uri, i) => (
              <View key={uri + i} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.thumbRemove}
                  onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  hitSlop={8}
                  accessibilityLabel="ছবি মুছুন"
                >
                  <Ionicons name="close" size={14} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < MAX_PHOTOS ? (
              <>
                <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={24} color={colors.primary} />
                  <Text style={styles.photoBtnText}>ক্যামেরা</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                  <Ionicons name="images-outline" size={24} color={colors.primary} />
                  <Text style={styles.photoBtnText}>গ্যালারি</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </Card>
      </ScrollView>

      <BottomBar>
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.footerLabel}>
              {selectedMaterials.length > 0 ? `${toBnDigits(selectedMaterials.length)}টি উপাদান • আনুমানিক` : 'কোনো উপাদান নির্বাচিত নয়'}
            </Text>
            <Text style={styles.footerAmount}>{formatTaka(estimate)}</Text>
          </View>
          <AppButton
            title="পরবর্তী"
            icon="arrow-forward"
            onPress={handleContinue}
            disabled={selectedMaterials.length === 0}
            style={{ paddingHorizontal: spacing.xxl }}
          />
        </View>
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  tip: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipText: { flex: 1, fontSize: font.sm, color: colors.textBody, lineHeight: 19 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: '#FBFEFC' },
  rowIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontSize: font.md + 1, fontWeight: '700', color: colors.text },
  rowPrice: { fontSize: font.sm, color: colors.textGray, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    height: 40,
    borderRadius: radius.pill,
  },
  addText: { color: colors.white, fontWeight: '700', fontSize: font.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBox: { minWidth: 40, alignItems: 'center' },
  qtyText: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  qtyUnit: { fontSize: font.xs, color: colors.textGray },
  photoHint: { fontSize: font.sm, color: colors.textGray, marginBottom: spacing.md },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  thumbWrap: { width: 76, height: 76 },
  thumb: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.surface },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtn: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryLight,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnText: { fontSize: font.xs, color: colors.primary, marginTop: 4, fontWeight: '600' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  footerLabel: { fontSize: font.xs + 1, color: colors.textGray },
  footerAmount: { fontSize: font.xxl, fontWeight: '800', color: colors.primary },
});

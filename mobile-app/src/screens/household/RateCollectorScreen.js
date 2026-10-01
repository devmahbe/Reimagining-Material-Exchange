import React, { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '../../utils/alert';
import { submitReview } from '../../services/reviewService';
import { AppButton, AppHeader, Avatar, BottomBar, Card, FormField, SectionHeader } from '../../components/ui';
import colors from '../../constants/colors';
import { font, radius, spacing } from '../../constants/theme';

const TAGS = [
  { id: 1, label: 'সময়মতো এসেছেন', icon: 'time-outline' },
  { id: 2, label: 'ভদ্র ব্যবহার', icon: 'happy-outline' },
  { id: 3, label: 'সঠিক ওজন', icon: 'scale-outline' },
  { id: 4, label: 'ভালো দাম দিয়েছেন', icon: 'cash-outline' },
  { id: 5, label: 'পেশাদার', icon: 'ribbon-outline' },
  { id: 6, label: 'দ্রুত সেবা', icon: 'flash-outline' },
];

const RATING_LABELS = ['', 'খুবই খারাপ', 'খারাপ', 'মোটামুটি', 'খুব ভালো', 'চমৎকার!'];

export default function RateCollectorScreen({ navigation, route }) {
  const { requestId, collectorId, collectorName } = route.params;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleTag = (id) =>
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('রেটিং দিন', 'অনুগ্রহ করে ১ থেকে ৫ তারকার মধ্যে একটি রেটিং নির্বাচন করুন');
      return;
    }
    setLoading(true);
    try {
      await submitReview({
        requestId,
        collectorId,
        rating,
        review,
        tags: TAGS.filter((t) => selectedTags.includes(t.id)).map((t) => t.label),
      });
      Alert.alert('ধন্যবাদ! 🎉', 'আপনার রিভিউ সফলভাবে জমা হয়েছে', [{ text: 'ঠিক আছে', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('ত্রুটি', error?.code === 'permission-denied' ? 'এই পিকআপের জন্য আগেই রিভিউ দেওয়া হয়েছে' : 'রিভিউ জমা দিতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="রেটিং দিন" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Card style={styles.hero}>
            <Avatar name={collectorName} size={72} />
            <Text style={styles.name}>{collectorName}</Text>
            <Text style={styles.question}>সংগ্রাহকের সেবা কেমন ছিল?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} hitSlop={6} accessibilityLabel={`${star} তারকা`}>
                  <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={40} color={star <= rating ? colors.accentLight : colors.border} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>{RATING_LABELS[rating] || 'তারকায় ট্যাপ করুন'}</Text>
          </Card>

          <SectionHeader title="কী ভালো লেগেছে? (ঐচ্ছিক)" />
          <View style={styles.tags}>
            {TAGS.map((tag) => {
              const active = selectedTags.includes(tag.id);
              return (
                <TouchableOpacity key={tag.id} onPress={() => toggleTag(tag.id)} style={[styles.tag, active && styles.tagActive]}>
                  <Ionicons name={tag.icon} size={16} color={active ? colors.white : colors.primary} />
                  <Text style={[styles.tagText, active && { color: colors.white }]}>{tag.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <SectionHeader title="মন্তব্য (ঐচ্ছিক)" />
          <FormField
            placeholder="আপনার অভিজ্ঞতা লিখুন..."
            value={review}
            onChangeText={setReview}
            multiline
            maxLength={500}
          />
        </ScrollView>
        <BottomBar>
          <AppButton title="রিভিউ জমা দিন" icon="send-outline" onPress={handleSubmit} loading={loading} />
          <AppButton title="পরে দেব" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: spacing.xs }} />
        </BottomBar>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', paddingVertical: spacing.xxl },
  name: { fontSize: font.xl, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  question: { fontSize: font.md, color: colors.textGray, marginTop: 4 },
  stars: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  ratingLabel: { marginTop: spacing.md, fontSize: font.md, fontWeight: '700', color: colors.accent },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primarySoft,
  },
  tagActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagText: { fontSize: font.sm, fontWeight: '600', color: colors.text },
});

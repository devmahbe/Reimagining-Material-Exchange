import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../../config/firebase';
import colors from '../../constants/colors';

export default function RateCollectorScreen({ navigation, route }) {
  const { requestId, collectorId, collectorName } = route.params;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);

  const tags = [
    { id: 1, label: 'সময়মতো এসেছেন', icon: '⏰' },
    { id: 2, label: 'ভদ্র ব্যবহার', icon: '😊' },
    { id: 3, label: 'পরিচ্ছন্নতা', icon: '✨' },
    { id: 4, label: 'ভালো দাম দিয়েছেন', icon: '💰' },
    { id: 5, label: 'পেশাদার', icon: '⭐' },
    { id: 6, label: 'দ্রুত সেবা', icon: '⚡' },
  ];

  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('রেটিং দিন', 'অনুগ্রহ করে একটি রেটিং নির্বাচন করুন');
      return;
    }

    setLoading(true);
    try {
      // Update pickup request with rating
      await updateDoc(doc(db, 'pickupRequests', requestId), {
        userRating: rating,
        userReview: review,
        ratingTags: selectedTags,
        ratedAt: new Date().toISOString(),
      });

      // Update collector's average rating
      const collectorRef = doc(db, 'users', collectorId);
      const collectorDoc = await getDoc(collectorRef);
      
      if (collectorDoc.exists()) {
        const collectorData = collectorDoc.data();
        const currentRating = collectorData.rating || 0;
        const totalRatings = collectorData.totalRatings || 0;
        
        const newTotalRatings = totalRatings + 1;
        const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;
        
        await updateDoc(collectorRef, {
          rating: newRating,
          totalRatings: newTotalRatings,
        });
      }

      // Store individual review for collector's profile
      await setDoc(doc(db, 'reviews', `${requestId}_${collectorId}`), {
        requestId,
        collectorId,
        userId: collectorDoc.data()?.userId,
        rating,
        review,
        tags: selectedTags,
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        'ধন্যবাদ! 🎉',
        'আপনার রিভিউ সফলভাবে জমা হয়েছে',
        [{ text: 'ঠিক আছে', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.log('Error submitting rating:', error);
      Alert.alert('ত্রুটি', 'রেটিং জমা দিতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← ফিরুন</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>রেটিং দিন</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Collector Info */}
        <View style={styles.collectorCard}>
          <View style={styles.collectorAvatar}>
            <Text style={styles.collectorAvatarText}>
              {collectorName?.charAt(0) || '👷'}
            </Text>
          </View>
          <Text style={styles.collectorName}>{collectorName}</Text>
          <Text style={styles.instruction}>
            সংগ্রাহকের সেবা কেমন ছিল?
          </Text>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingCard}>
          <Text style={styles.sectionTitle}>আপনার রেটিং</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Text style={[
                  styles.star,
                  star <= rating && styles.starSelected,
                ]}>
                  ⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {rating === 1 && 'খুবই খারাপ'}
              {rating === 2 && 'খারাপ'}
              {rating === 3 && 'ভালো'}
              {rating === 4 && 'খুব ভালো'}
              {rating === 5 && 'চমৎকার'}
            </Text>
          )}
        </View>

        {/* Quick Tags */}
        <View style={styles.tagsCard}>
          <Text style={styles.sectionTitle}>দ্রুত ট্যাগ (ঐচ্ছিক)</Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.tag,
                  selectedTags.includes(tag.id) && styles.tagSelected,
                ]}
                onPress={() => toggleTag(tag.id)}
              >
                <Text style={styles.tagIcon}>{tag.icon}</Text>
                <Text style={[
                  styles.tagLabel,
                  selectedTags.includes(tag.id) && styles.tagLabelSelected,
                ]}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Written Review */}
        <View style={styles.reviewCard}>
          <Text style={styles.sectionTitle}>রিভিউ লিখুন (ঐচ্ছিক)</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="আপনার অভিজ্ঞতা শেয়ার করুন..."
            placeholderTextColor={colors.textLight}
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.reviewHint}>
            অন্যদের সাহায্য করতে আপনার অভিজ্ঞতা লিখুন
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmitRating}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? [colors.textGray, colors.textLight] : [colors.secondary, '#FFA726']}
            style={styles.submitButtonGradient}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'জমা হচ্ছে...' : '✓ রিভিউ জমা দিন'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Skip Option */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.skipText}>পরে রেটিং দেব</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  collectorCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  collectorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  collectorAvatarText: {
    fontSize: 40,
    color: 'white',
    fontWeight: '700',
  },
  collectorName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  instruction: {
    fontSize: 16,
    color: colors.textGray,
    textAlign: 'center',
  },
  ratingCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 40,
    opacity: 0.3,
  },
  starSelected: {
    opacity: 1,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
  },
  tagsCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagSelected: {
    backgroundColor: colors.primaryLight + '20',
    borderColor: colors.primary,
  },
  tagIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tagLabel: {
    fontSize: 14,
    color: colors.text,
  },
  tagLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  reviewInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    marginBottom: 8,
  },
  reviewHint: {
    fontSize: 14,
    color: colors.textLight,
  },
  submitButton: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
  },
  skipText: {
    fontSize: 16,
    color: colors.textGray,
    textDecorationLine: 'underline',
  },
});

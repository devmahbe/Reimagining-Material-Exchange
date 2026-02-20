import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { uploadMultipleImages, calculateEarnings } from '../../utils/helpers';
import colors from '../../constants/colors';

export default function RequestConfirmationScreen({ navigation, route }) {
  const { materials, images, date, time, address, phone, notes } = route.params;
  const [loading, setLoading] = useState(false);

  const getTotalEstimate = () => {
    let total = 0;
    materials.forEach(m => {
      const avgPrice = parseInt(m.price.match(/\d+/)[0]);
      total += avgPrice * m.quantity;
    });
    return total;
  };

  const handleConfirmRequest = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      
      // Upload images if any
      let imageUrls = [];
      if (images && images.length > 0) {
        try {
          imageUrls = await uploadMultipleImages(images, 'pickups');
        } catch (uploadError) {
          console.log('Image upload failed, continuing without images:', uploadError);
        }
      }
      
      // Calculate earnings
      const estimatedEarnings = calculateEarnings(materials);
      
      await addDoc(collection(db, 'pickupRequests'), {
        userId: user.uid,
        userEmail: user.email,
        materials: materials.map(m => ({
          name: m.name,
          icon: m.icon,
          quantity: m.quantity,
          unit: m.unit,
          price: m.price
        })),
        images: imageUrls,
        schedule: {
          date: date.full.toISOString(),
          dateDisplay: date.display,
          timeSlot: time.time,
          timeValue: time.value
        },
        address,
        phone,
        notes,
        estimatedEarnings,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        'সফল! ✅',
        'আপনার পিকআপ অনুরোধ সফলভাবে জমা হয়েছে। শীঘ্রই একজন সংগ্রাহক যোগাযোগ করবেন।',
        [
          {
            text: 'হোমে ফিরুন',
            onPress: () => navigation.navigate('HouseholdHome')
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে আবার চেষ্টা করুন');
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
        <Text style={styles.headerTitle}>নিশ্চিতকরণ</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>অনুরোধ প্রস্তুত!</Text>
          <Text style={styles.successSubtitle}>
            নিচের তথ্য পর্যালোচনা করুন এবং নিশ্চিত করুন
          </Text>
        </View>

        {/* Materials Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 উপাদান</Text>
          <View style={styles.card}>
            {materials.map((m, index) => (
              <View key={m.id} style={styles.materialRow}>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialIcon}>{m.icon}</Text>
                  <View>
                    <Text style={styles.materialName}>{m.name}</Text>
                    <Text style={styles.materialDetail}>
                      {m.quantity} {m.unit} × {m.price}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Schedule Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ সময়সূচী</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>তারিখ</Text>
              <Text style={styles.infoValue}>
                {date.day}, {date.display}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>সময়</Text>
              <Text style={styles.infoValue}>{time.time}</Text>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 যোগাযোগ</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ঠিকানা</Text>
              <Text style={styles.infoValue}>{address}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ফোন</Text>
              <Text style={styles.infoValue}>{phone}</Text>
            </View>
            {notes && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>নির্দেশনা</Text>
                  <Text style={styles.infoValue}>{notes}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Images */}
        {images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📷 ছবি</Text>
            <View style={styles.card}>
              <Text style={styles.imageInfo}>
                ✅ {images.length} টি ছবি যোগ করা হয়েছে
              </Text>
            </View>
          </View>
        )}

        {/* Price Estimate */}
        <View style={styles.estimateCard}>
          <Text style={styles.estimateLabel}>আনুমানিক মূল্য</Text>
          <Text style={styles.estimateAmount}>৳{getTotalEstimate()}</Text>
          <Text style={styles.estimateNote}>
            * প্রকৃত মূল্য পরিদর্শনের পর নির্ধারিত হবে
          </Text>
        </View>

        {/* Important Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>ℹ️</Text>
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>গুরুত্বপূর্ণ</Text>
            <Text style={styles.noteText}>
              • একজন সংগ্রাহক শীঘ্রই আপনার অনুরোধ গ্রহণ করবে{'\n'}
              • পিকআপের আগে আপনি বার্তা পাবেন{'\n'}
              • প্রকৃত মূল্য উপাদান যাচাই করার পর নির্ধারিত হবে
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleConfirmRequest}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.secondary, colors.secondaryLight]}
            style={styles.confirmButtonGradient}
          >
            <Text style={styles.confirmButtonText}>
              {loading ? 'জমা হচ্ছে...' : '✓ অনুরোধ নিশ্চিত করুন'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  materialRow: {
    paddingVertical: 10,
  },
  materialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  materialIcon: {
    fontSize: 32,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  materialDetail: {
    fontSize: 13,
    color: colors.textGray,
    marginTop: 2,
  },
  infoRow: {
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textGray,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 5,
  },
  imageInfo: {
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '600',
  },
  estimateCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  estimateLabel: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 8,
  },
  estimateAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  estimateNote: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  noteCard: {
    backgroundColor: 'rgba(255, 143, 0, 0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  noteIcon: {
    fontSize: 24,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 6,
  },
  noteText: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

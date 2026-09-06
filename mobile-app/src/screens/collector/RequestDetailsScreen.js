import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import colors from '../../constants/colors';

export default function RequestDetailsScreen({ navigation, route }) {
  const { requestId, autoAccept } = route.params;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completeModal, setCompleteModal] = useState(false);
  const [actualAmount, setActualAmount] = useState('');

  useEffect(() => {
    loadRequestDetails();
    
    if (autoAccept) {
      // Show confirmation immediately if coming from accept button
      setTimeout(() => handleAccept(), 500);
    }
  }, []);

  const loadRequestDetails = async () => {
    try {
      const requestDoc = await getDoc(doc(db, 'pickupRequests', requestId));
      
      if (requestDoc.exists()) {
        setRequest({ id: requestDoc.id, ...requestDoc.data() });
      } else {
        Alert.alert('ত্রুটি', 'অনুরোধটি খুঁজে পাওয়া যায়নি');
        navigation.goBack();
      }
    } catch (error) {
      console.log('Error loading request:', error);
      Alert.alert('ত্রুটি', 'অনুরোধ লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    Alert.alert(
      'পিকআপ গ্রহণ করুন',
      'আপনি কি এই পিকআপটি গ্রহণ করতে চান?',
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'হ্যাঁ, গ্রহণ করুন',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              const collectorDoc = await getDoc(doc(db, 'users', user.uid));
              const collectorName = collectorDoc.data()?.name || 'সংগ্রাহক';

              await updateDoc(doc(db, 'pickupRequests', requestId), {
                status: 'accepted',
                collectorId: user.uid,
                collectorName,
                acceptedAt: new Date().toISOString(),
              });

              setRequest(prev => ({ ...prev, status: 'accepted', collectorId: user.uid, collectorName }));
              Alert.alert('সফল! ✓', 'পিকআপ অনুরোধটি গ্রহণ করা হয়েছে');
            } catch (error) {
              Alert.alert('ত্রুটি', 'পিকআপ গ্রহণ করা যায়নি');
            }
          }
        }
      ]
    );
  };

  const handleOnTheWay = async () => {
    try {
      await updateDoc(doc(db, 'pickupRequests', requestId), {
        status: 'on-the-way',
        onTheWayAt: new Date().toISOString(),
      });
      setRequest(prev => ({ ...prev, status: 'on-the-way' }));
    } catch (error) {
      Alert.alert('ত্রুটি', 'অবস্থা আপডেট করা যায়নি');
    }
  };

  const handleAtLocation = async () => {
    try {
      await updateDoc(doc(db, 'pickupRequests', requestId), {
        status: 'at-location',
        atLocationAt: new Date().toISOString(),
      });
      setRequest(prev => ({ ...prev, status: 'at-location' }));
    } catch (error) {
      Alert.alert('ত্রুটি', 'অবস্থা আপডেট করা যায়নি');
    }
  };

  const handleComplete = () => {
    setActualAmount(String(request?.estimatedEarnings || ''));
    setCompleteModal(true);
  };

  const handleConfirmComplete = async () => {
    const earned = parseFloat(actualAmount) || request?.estimatedEarnings || 0;
    try {
      await updateDoc(doc(db, 'pickupRequests', requestId), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        actualEarnings: earned,
      });
      setCompleteModal(false);
      Alert.alert(
        'সম্পন্ন! ✓',
        `পিকআপটি সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে\nপ্রকৃত আয়: ৳${earned}`,
        [{ text: 'ঠিক আছে', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('ত্রুটি', 'অবস্থা আপডেট করা যায়নি');
    }
  };

  if (loading || !request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>পিকআপের বিস্তারিত</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(request.status)}</Text>
          </View>
        </View>

        {/* Schedule Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 পিকআপের সময়</Text>
          <View style={styles.scheduleInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>তারিখ</Text>
              <Text style={styles.infoValue}>{formatDate(request.schedule?.date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>সময়</Text>
              <Text style={styles.infoValue}>{request.schedule?.timeSlot}</Text>
            </View>
          </View>
        </View>

        {/* Materials Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>♻️ উপাদান তালিকা</Text>
          {request.materials && request.materials.map((material, index) => {
            const numericPrice = parseFloat(String(material.price || '0').replace(/[^0-9.]/g, '')) || 0;
            return (
              <View key={index} style={styles.materialItem}>
                <View style={styles.materialLeft}>
                  <Text style={styles.materialName}>{material.name}</Text>
                  <Text style={styles.materialQuantity}>
                    {material.quantity} {material.unit} — {material.price}/কেজি
                  </Text>
                </View>
                <Text style={styles.materialPrice}>
                  ৳{Math.round(numericPrice * (material.quantity || 0))}
                </Text>
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>আনুমানিক মোট</Text>
            <Text style={styles.totalValue}>৳{request.estimatedEarnings || 0}</Text>
          </View>
        </View>

        {/* Photos */}
        {request.images && request.images.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📷 ছবি</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photosGrid}>
                {request.images.map((imageUrl, index) => (
                  <Image
                    key={index}
                    source={{ uri: imageUrl }}
                    style={styles.photo}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📞 যোগাযোগের তথ্য</Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Text style={styles.contactIcon}>📍</Text>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>ঠিকানা</Text>
                <Text style={styles.contactValue}>{request.address || 'ঠিকানা উল্লেখ নেই'}</Text>
              </View>
            </View>

            {request.phone && (
              <View style={styles.contactRow}>
                <Text style={styles.contactIcon}>📱</Text>
                <View style={styles.contactTextContainer}>
                  <Text style={styles.contactLabel}>ফোন</Text>
                  <Text style={styles.contactValue}>{request.phone}</Text>
                </View>
              </View>
            )}

            {request.notes && (
              <View style={styles.contactRow}>
                <Text style={styles.contactIcon}>📝</Text>
                <View style={styles.contactTextContainer}>
                  <Text style={styles.contactLabel}>নোট</Text>
                  <Text style={styles.contactValue}>{request.notes}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Buttons */}
      {request.status === 'pending' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.acceptButtonText}>✓ পিকআপ গ্রহণ করুন</Text>
          </TouchableOpacity>
        </View>
      )}

      {request.status === 'accepted' && request.collectorId === auth.currentUser?.uid && (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.onTheWayButton} onPress={handleOnTheWay}>
            <Text style={styles.onTheWayButtonText}>🚗 পথে আছি</Text>
          </TouchableOpacity>
        </View>
      )}

      {request.status === 'on-the-way' && request.collectorId === auth.currentUser?.uid && (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.atLocationButton} onPress={handleAtLocation}>
            <Text style={styles.atLocationButtonText}>📍 পৌঁছেছি</Text>
          </TouchableOpacity>
        </View>
      )}

      {(request.status === 'at-location' || request.status === 'in-progress') &&
        request.collectorId === auth.currentUser?.uid && (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Text style={styles.completeButtonText}>✓ সম্পন্ন হিসেবে চিহ্নিত করুন</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Complete + Actual Earnings Modal */}
      <Modal visible={completeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>পিকআপ সম্পন্ন করুন</Text>
            <Text style={styles.modalSubtitle}>
              প্রকৃত পরিমাণ লিখুন (আনুমানিক: ৳{request?.estimatedEarnings || 0})
            </Text>
            <TextInput
              style={styles.modalInput}
              value={actualAmount}
              onChangeText={setActualAmount}
              placeholder="প্রকৃত আয় (টাকা)"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCompleteModal(false)}
              >
                <Text style={styles.modalCancelText}>বাতিল</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmComplete}
              >
                <Text style={styles.modalConfirmText}>সম্পন্ন করুন ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStatusLabel(status) {
  const labels = {
    pending: '⏳ অপেক্ষমাণ',
    accepted: '✓ গৃহীত',
    'on-the-way': '🚗 পথে আছেন',
    'at-location': '📍 পৌঁছেছেন',
    'in-progress': '📦 সংগ্রহ করছেন',
    completed: '✓ সম্পন্ন',
    cancelled: '✗ বাতিল',
  };
  return labels[status] || status;
}

function getStatusColor(status) {
  const colorMap = {
    pending: '#FF8F00',
    accepted: '#2196F3',
    'on-the-way': '#FF9800',
    'at-location': '#9C27B0',
    'in-progress': '#2196F3',
    completed: '#4CAF50',
    cancelled: '#f44336',
  };
  return colorMap[status] || '#9E9E9E';
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const bengaliDays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
  const dayName = bengaliDays[date.getDay()];
  
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  return `${dayName}, ${day}/${month}/${year}`;
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
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 15,
  },
  scheduleInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textGray,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  materialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  materialLeft: {
    flex: 1,
  },
  materialName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  materialQuantity: {
    fontSize: 13,
    color: colors.textGray,
  },
  materialPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.bgCream,
  },
  contactInfo: {
    gap: 15,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: '500',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  onTheWayButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  onTheWayButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  atLocationButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  atLocationButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textGray,
  },
  modalConfirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
});

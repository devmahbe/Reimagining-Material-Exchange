import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import colors from '../../constants/colors';

export default function HistoryScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const user = auth.currentUser;
      const q = query(
        collection(db, 'pickupRequests'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      
      setRequests(data);
    } catch (error) {
      console.log('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'অপেক্ষমাণ', color: colors.secondary },
      accepted: { text: 'গৃহীত', color: colors.primary },
      completed: { text: 'সম্পন্ন', color: colors.success },
      cancelled: { text: 'বাতিল', color: '#f44336' }
    };
    
    return statusMap[status] || statusMap.pending;
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
        <Text style={styles.headerTitle}>ইতিহাস</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>কোন ইতিহাস নেই</Text>
            <Text style={styles.emptyText}>
              আপনি এখনও কোন পিকআপ অনুরোধ করেননি
            </Text>
          </View>
        ) : (
          requests.map((request) => {
            const status = getStatusBadge(request.status);
            
            return (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View>
                    <Text style={styles.requestDate}>
                      {new Date(request.createdAt).toLocaleDateString('bn-BD')}
                    </Text>
                    <View style={styles.materialsList}>
                      {request.materials.slice(0, 2).map((m, i) => (
                        <Text key={i} style={styles.materialText}>
                          {m.name}
                        </Text>
                      ))}
                      {request.materials.length > 2 && (
                        <Text style={styles.materialText}>
                          +{request.materials.length - 2} আরো
                        </Text>
                      )}
                    </View>
                  </View>
                  <View 
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${status.color}20` }
                    ]}
                  >
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.text}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📅 {request.scheduledDate}</Text>
                    <Text style={styles.detailLabel}>⏰ {request.scheduledTime}</Text>
                  </View>
                  <View style={styles.requestFooter}>
                    <Text style={styles.estimateText}>
                      আনুমানিক: ৳{request.estimatedValue}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textGray,
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestDate: {
    fontSize: 13,
    color: colors.textGray,
    marginBottom: 6,
  },
  materialsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  materialText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  requestDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textGray,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimateText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});

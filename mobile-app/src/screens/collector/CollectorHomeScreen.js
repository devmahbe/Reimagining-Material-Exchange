import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import colors from '../../constants/colors';

export default function CollectorHomeScreen({ navigation }) {
  const [availableRequests, setAvailableRequests] = useState([]);
  const [stats, setStats] = useState({
    todayPickups: 0,
    weekEarnings: 0,
    pendingRequests: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load available pickup requests (pending status)
      const requestsQuery = query(
        collection(db, 'pickupRequests'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(requestsQuery);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAvailableRequests(requests);
      setStats(prev => ({
        ...prev,
        pendingRequests: requests.length
      }));
    } catch (error) {
      console.log('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getPickupTimeLabel = (date, timeSlot) => {
    const pickupDate = new Date(date);
    const today = new Date();
    
    const diffTime = pickupDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let dateLabel = '';
    if (diffDays === 0) {
      dateLabel = 'আজ';
    } else if (diffDays === 1) {
      dateLabel = 'আগামীকাল';
    } else {
      const options = { day: 'numeric', month: 'short' };
      dateLabel = pickupDate.toLocaleDateString('bn-BD', options);
    }
    
    return `${dateLabel}, ${timeSlot}`;
  };

  const getMaterialSummary = (materials) => {
    if (!materials || materials.length === 0) return 'কোন উপাদান নেই';
    
    if (materials.length === 1) {
      return `${materials[0].name} (${materials[0].quantity} ${materials[0].unit})`;
    }
    
    return `${materials[0].name} + ${materials.length - 1} আরো`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <View>
          <Text style={styles.welcomeText}>স্বাগতম 👷</Text>
          <Text style={styles.headerTitle}>সংগ্রাহক ড্যাশবোর্ড</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            {stats.pendingRequests > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.pendingRequests}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => navigation.navigate('CollectorStats')}
          >
            <Text style={styles.statsIcon}>📊</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('CollectorStats')}
        >
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>📦</Text>
          </View>
          <Text style={styles.statValue}>{stats.todayPickups}</Text>
          <Text style={styles.statLabel}>আজকের পিকআপ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('CollectorStats')}
        >
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>💰</Text>
          </View>
          <Text style={styles.statValue}>৳{stats.weekEarnings}</Text>
          <Text style={styles.statLabel}>সপ্তাহের আয়</Text>
        </TouchableOpacity>
        
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>⏳</Text>
          </View>
          <Text style={styles.statValue}>{stats.pendingRequests}</Text>
          <Text style={styles.statLabel}>নতুন অনুরোধ</Text>
        </View>
      </View>

      {/* Available Requests */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>উপলব্ধ পিকআপ অনুরোধ</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text style={styles.refreshText}>🔄 রিফ্রেশ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.requestsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {availableRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>কোন নতুন অনুরোধ নেই</Text>
            <Text style={styles.emptySubtext}>নতুন অনুরোধ আসলে এখানে দেখাবে</Text>
          </View>
        ) : (
          availableRequests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={styles.requestCard}
              onPress={() => navigation.navigate('RequestDetails', { requestId: request.id })}
            >
              <View style={styles.requestHeader}>
                <View style={styles.requestTime}>
                  <Text style={styles.timeIcon}>🕒</Text>
                  <Text style={styles.timeText}>
                    {getPickupTimeLabel(request.schedule?.date, request.schedule?.timeSlot)}
                  </Text>
                </View>
                <View style={styles.priceTag}>
                  <Text style={styles.priceText}>৳{request.estimatedPrice || 0}</Text>
                </View>
              </View>

              <View style={styles.requestBody}>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialIcon}>♻️</Text>
                  <Text style={styles.materialText}>
                    {getMaterialSummary(request.materials)}
                  </Text>
                </View>

                <View style={styles.addressInfo}>
                  <Text style={styles.addressIcon}>📍</Text>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {request.schedule?.address || 'ঠিকানা উল্লেখ নেই'}
                  </Text>
                </View>

                {request.schedule?.phone && (
                  <View style={styles.phoneInfo}>
                    <Text style={styles.phoneIcon}>📞</Text>
                    <Text style={styles.phoneText}>{request.schedule.phone}</Text>
                  </View>
                )}
              </View>

              <View style={styles.requestFooter}>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => navigation.navigate('RequestDetails', { requestId: request.id })}
                >
                  <Text style={styles.detailsButtonText}>বিস্তারিত দেখুন</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => navigation.navigate('RequestDetails', { requestId: request.id, autoAccept: true })}
                >
                  <Text style={styles.acceptButtonText}>গ্রহণ করুন ✓</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsIcon: {
    fontSize: 24,
  },
  notificationButton: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 28,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 28,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textGray,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  refreshText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  requestsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  requestTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  priceTag: {
    backgroundColor: colors.bgGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  requestBody: {
    marginBottom: 15,
  },
  materialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  materialIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  materialText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: colors.textGray,
    lineHeight: 18,
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  phoneText: {
    fontSize: 13,
    color: colors.textGray,
  },
  requestFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: colors.bgCream,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
  },
});

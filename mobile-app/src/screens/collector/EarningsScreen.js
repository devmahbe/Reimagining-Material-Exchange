import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import colors from '../../constants/colors';

export default function EarningsScreen({ navigation, route }) {
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const user = auth.currentUser;
      
      // Query completed pickups for this collector
      const q = query(
        collection(db, 'pickupRequests'),
        where('collectorId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const completedPickups = [];
      
      querySnapshot.forEach((doc) => {
        completedPickups.push({ id: doc.id, ...doc.data() });
      });

      // Calculate earnings — create fresh dates to avoid mutation bugs
      const nowRef = new Date();
      const todayStart = new Date(nowRef.getFullYear(), nowRef.getMonth(), nowRef.getDate());
      const weekStart = new Date(nowRef.getFullYear(), nowRef.getMonth(), nowRef.getDate() - nowRef.getDay());
      const monthStart = new Date(nowRef.getFullYear(), nowRef.getMonth(), 1);

      const calculated = {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0,
      };

      const txns = completedPickups.map(pickup => {
        const amount = pickup.actualEarnings || pickup.estimatedEarnings || 0;
        const date = new Date(pickup.completedAt);
        
        calculated.total += amount;
        
        if (date >= todayStart) {
          calculated.today += amount;
        }
        if (date >= weekStart) {
          calculated.thisWeek += amount;
        }
        if (date >= monthStart) {
          calculated.thisMonth += amount;
        }

        return {
          id: pickup.id,
          amount,
          date: pickup.completedAt,
          materials: pickup.materials,
          address: pickup.address,
          status: 'completed',
        };
      });

      setEarnings(calculated);
      setTransactions(txns);
    } catch (error) {
      console.log('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    const now = new Date();

    switch (filter) {
      case 'today': {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return transactions.filter(t => new Date(t.date) >= todayStart);
      }
      case 'week': {
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        return transactions.filter(t => new Date(t.date) >= weekStart);
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return transactions.filter(t => new Date(t.date) >= monthStart);
      }
      default:
        return transactions;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <Text style={styles.headerTitle}>আয়</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total Earnings Card */}
        <LinearGradient
          colors={[colors.success, '#66BB6A']}
          style={styles.totalCard}
        >
          <Text style={styles.totalLabel}>মোট আয়</Text>
          <Text style={styles.totalAmount}>৳{earnings.total.toLocaleString('bn-BD')}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>৳{earnings.today.toLocaleString('bn-BD')}</Text>
              <Text style={styles.statLabel}>আজ</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>৳{earnings.thisWeek.toLocaleString('bn-BD')}</Text>
              <Text style={styles.statLabel}>এই সপ্তাহ</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>৳{earnings.thisMonth.toLocaleString('bn-BD')}</Text>
              <Text style={styles.statLabel}>এই মাস</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatIcon}>📦</Text>
            <Text style={styles.quickStatValue}>{transactions.length}</Text>
            <Text style={styles.quickStatLabel}>মোট পিকআপ</Text>
          </View>

          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatIcon}>💰</Text>
            <Text style={styles.quickStatValue}>
              ৳{transactions.length > 0 ? Math.round(earnings.total / transactions.length) : 0}
            </Text>
            <Text style={styles.quickStatLabel}>গড় আয়</Text>
          </View>

          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatIcon}>📈</Text>
            <Text style={styles.quickStatValue}>
              {earnings.thisMonth > 0 ? '+' + Math.round((earnings.thisMonth / earnings.total) * 100) : 0}%
            </Text>
            <Text style={styles.quickStatLabel}>এই মাস</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {['all', 'today', 'week', 'month'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' && 'সব'}
                {f === 'today' && 'আজ'}
                {f === 'week' && 'সপ্তাহ'}
                {f === 'month' && 'মাস'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsCard}>
          <Text style={styles.sectionTitle}>লেনদেনের ইতিহাস</Text>
          
          {loading ? (
            <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
          ) : filterTransactions().length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💸</Text>
              <Text style={styles.emptyText}>কোন লেনদেন নেই</Text>
            </View>
          ) : (
            filterTransactions().map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionIconContainer}>
                    <Text style={styles.transactionIcon}>✓</Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>পিকআপ সম্পন্ন</Text>
                    <Text style={styles.transactionMaterials} numberOfLines={1}>
                      {transaction.materials.map(m => m.name).join(', ')}
                    </Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>
                    +৳{transaction.amount.toLocaleString('bn-BD')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Withdrawal Banner */}
        <TouchableOpacity
          style={styles.withdrawalBanner}
          onPress={() => navigation.navigate('BKashPayment', { amount: earnings.total })}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            style={styles.withdrawalGradient}
          >
            <View style={styles.withdrawalContent}>
              <Text style={styles.withdrawalIcon}>💳</Text>
              <View style={styles.withdrawalText}>
                <Text style={styles.withdrawalTitle}>ব্যাংকে টাকা তুলুন</Text>
                <Text style={styles.withdrawalSubtitle}>
                  আপনার ব্যাংক অ্যাকাউন্টে টাকা পাঠান
                </Text>
              </View>
            </View>
            <Text style={styles.withdrawalArrow}>→</Text>
          </LinearGradient>
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
  totalCard: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  totalLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: 'white',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
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
  quickStatIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: colors.textGray,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textGray,
  },
  filterTextActive: {
    color: 'white',
  },
  transactionsCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textGray,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textGray,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  transactionLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIcon: {
    fontSize: 20,
    color: colors.success,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  transactionMaterials: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  transactionRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
  },
  withdrawalBanner: {
    margin: 20,
    marginTop: 0,
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  withdrawalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  withdrawalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  withdrawalIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  withdrawalText: {
    flex: 1,
  },
  withdrawalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  withdrawalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  withdrawalArrow: {
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
  },
});

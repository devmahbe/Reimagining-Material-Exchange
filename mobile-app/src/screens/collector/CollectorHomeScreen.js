import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import colors from '../../constants/colors';

export default function CollectorHomeScreen({ navigation }) {
  const [availableRequests, setAvailableRequests] = useState([]);
  const [stats, setStats] = useState({ todayPickups: 0, weekEarnings: 0, pendingRequests: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const user = auth.currentUser;

      const requestsQuery = query(
        collection(db, 'pickupRequests'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(requestsQuery);
      const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAvailableRequests(requests);

      const completedQuery = query(
        collection(db, 'pickupRequests'),
        where('collectorId', '==', user.uid),
        where('status', '==', 'completed')
      );
      const completedSnapshot = await getDocs(completedQuery);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

      let todayPickups = 0;
      let weekEarnings = 0;
      completedSnapshot.forEach(d => {
        const p = d.data();
        const completed = p.completedAt ? new Date(p.completedAt) : null;
        if (completed) {
          if (completed >= todayStart) todayPickups++;
          if (completed >= weekStart) weekEarnings += p.actualEarnings || p.estimatedEarnings || 0;
        }
      });

      setStats({ todayPickups, weekEarnings, pendingRequests: requests.length });
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
    const diffDays = Math.ceil((pickupDate - new Date()) / (1000 * 60 * 60 * 24));
    let dateLabel = diffDays === 0 ? 'আজ' : diffDays === 1 ? 'আগামীকাল'
      : pickupDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
    return `${dateLabel}, ${timeSlot}`;
  };

  const getMaterialSummary = (materials) => {
    if (!materials || materials.length === 0) return 'কোন উপাদান নেই';
    if (materials.length === 1) return `${materials[0].name} (${materials[0].quantity} ${materials[0].unit})`;
    return `${materials[0].name} + ${materials.length - 1} আরো`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* ── Header ── */}
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>স্বাগতম</Text>
          <Text style={styles.headerTitle}>সংগ্রাহক ড্যাশবোর্ড</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerIconBtn, stats.pendingRequests > 0 && styles.headerIconBtnAlert]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {stats.pendingRequests > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeDotText}>{stats.pendingRequests}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('CollectorStats')}>
            <Ionicons name="bar-chart-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('CollectorStats')}>
          <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="cube-outline" size={22} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{stats.todayPickups}</Text>
          <Text style={styles.statLabel}>আজকের পিকআপ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Earnings')}>
          <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="cash-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>৳{stats.weekEarnings}</Text>
          <Text style={styles.statLabel}>সপ্তাহের আয়</Text>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="time-outline" size={22} color={colors.accent} />
          </View>
          <Text style={styles.statValue}>{stats.pendingRequests}</Text>
          <Text style={styles.statLabel}>নতুন অনুরোধ</Text>
        </View>
      </View>

      {/* ── List header ── */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>উপলব্ধ পিকআপ অনুরোধ</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={16} color={colors.primary} />
          <Text style={styles.refreshLabel}>রিফ্রেশ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {availableRequests.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="package-variant" size={48} color={colors.textLight} />
            </View>
            <Text style={styles.emptyTitle}>কোন নতুন অনুরোধ নেই</Text>
            <Text style={styles.emptySubtitle}>নতুন অনুরোধ আসলে এখানে দেখাবে</Text>
          </View>
        ) : (
          availableRequests.map(request => (
            <TouchableOpacity
              key={request.id}
              style={styles.requestCard}
              onPress={() => navigation.navigate('RequestDetails', { requestId: request.id })}
              activeOpacity={0.85}
            >
              {/* Card top */}
              <View style={styles.cardTop}>
                <View style={styles.timeChip}>
                  <Ionicons name="time-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.timeText}>
                    {getPickupTimeLabel(request.schedule?.date, request.schedule?.timeSlot)}
                  </Text>
                </View>
                <View style={styles.priceChip}>
                  <Text style={styles.priceText}>৳{request.estimatedEarnings || 0}</Text>
                </View>
              </View>

              {/* Card body */}
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="recycle" size={16} color={colors.primary} />
                  <Text style={styles.infoText}>{getMaterialSummary(request.materials)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textGray} />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {request.address || 'ঠিকানা উল্লেখ নেই'}
                  </Text>
                </View>
                {request.phone && (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={16} color={colors.textGray} />
                    <Text style={styles.infoText}>{request.phone}</Text>
                  </View>
                )}
              </View>

              {/* Card footer */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => navigation.navigate('RequestDetails', { requestId: request.id })}
                >
                  <Text style={styles.detailsBtnText}>বিস্তারিত</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => navigation.navigate('RequestDetails', { requestId: request.id, autoAccept: true })}
                >
                  <Ionicons name="checkmark-outline" size={16} color="#fff" />
                  <Text style={styles.acceptBtnText}>গ্রহণ করুন</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View style={styles.bottomNav}>
        <NavItem icon="home" label="হোম" active onPress={() => {}} />
        <NavItem icon="chatbubbles-outline" label="বার্তা" onPress={() => navigation.navigate('Messages')} />
        <NavItem icon="cash-outline" label="আয়" onPress={() => navigation.navigate('Earnings')} />
        <NavItem icon="settings-outline" label="সেটিংস" onPress={() => navigation.navigate('Settings')} />
      </View>
    </SafeAreaView>
  );
}

function NavItem({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons
        name={active ? icon.replace('-outline', '') : icon}
        size={24}
        color={active ? colors.primary : colors.textLight}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18,
  },
  headerLeft: { flex: 1 },
  headerGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerIconBtnAlert: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeDot: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  badgeDotText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Stats
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 10,
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
    shadowRadius: 6, elevation: 2,
  },
  statIconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.textDark, marginBottom: 3 },
  statLabel: { fontSize: 10, color: colors.textGray, textAlign: 'center', fontWeight: '500' },

  // List header
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  listTitle: { fontSize: 15, fontWeight: '700', color: colors.textDark },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshLabel: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Requests list
  list: { flex: 1, paddingHorizontal: 16 },

  // Empty state
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyIconWrap: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.textDark, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: colors.textLight },

  // Request card
  requestCard: {
    backgroundColor: '#fff', borderRadius: 18, marginBottom: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07,
    shadowRadius: 10, elevation: 3,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  timeChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  timeText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  priceChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
  },
  priceText: { fontSize: 16, fontWeight: '700', color: colors.primaryDark },
  cardBody: { gap: 8, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: colors.textBody, flex: 1 },
  cardFooter: { flexDirection: 'row', gap: 10 },
  detailsBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.surface,
    alignItems: 'center',
  },
  detailsBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  acceptBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingTop: 10, paddingBottom: 18,
    borderTopWidth: 1, borderTopColor: colors.border,
    justifyContent: 'space-around',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  navItem: { alignItems: 'center', flex: 1 },
  navLabel: { fontSize: 10, color: colors.textLight, marginTop: 4, fontWeight: '500' },
  navLabelActive: { color: colors.primary, fontWeight: '700' },
});

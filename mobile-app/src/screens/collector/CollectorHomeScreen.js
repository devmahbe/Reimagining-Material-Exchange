import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../../config/firebase';
import { Alert } from '../../utils/alert';
import { getUserProfile } from '../../services/userService';
import { acceptPickup, getCollectorPickups, getPendingPickups, pickupErrorMessage } from '../../services/pickupService';
import { getUnreadCount } from '../../services/chatService';
import { collectorNavItems } from '../../navigation/navItems';
import { AppButton, AppHeader, BottomNav, Card, EmptyState, IconButton, LoadingView, StatusBadge } from '../../components/ui';
import { ACTIVE_STATUSES } from '../../constants/status';
import { formatRelativeDay, formatTaka, isSameDay, toBnDigits, toDate } from '../../utils/helpers';
import colors from '../../constants/colors';
import { font, radius, spacing } from '../../constants/theme';

export { collectorNavItems };

const materialSummary = (materials = []) => {
  if (materials.length === 0) return 'কোনো উপাদান নেই';
  if (materials.length === 1) return `${materials[0].name} (${toBnDigits(materials[0].quantity)} ${materials[0].unit})`;
  return `${materials[0].name} + আরো ${toBnDigits(materials.length - 1)}টি`;
};

export default function CollectorHomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [pending, setPending] = useState([]);
  const [mine, setMine] = useState([]);
  const [tab, setTab] = useState('new');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      setError(false);
      const [p, pendingList, myList, u] = await Promise.all([
        getUserProfile(uid).catch(() => null),
        getPendingPickups(),
        getCollectorPickups(uid),
        getUnreadCount(uid).catch(() => 0),
      ]);
      setProfile(p);
      setPending(pendingList.filter((r) => r.userId !== uid));
      setMine(myList);
      setUnread(u);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleAccept = (request) =>
    Alert.alert('পিকআপ গ্রহণ করবেন?', `${materialSummary(request.materials)}\n${request.address || ''}`, [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'গ্রহণ করুন',
        onPress: async () => {
          setAcceptingId(request.id);
          try {
            await acceptPickup(request.id, profile);
            navigation.navigate('RequestDetails', { requestId: request.id });
          } catch (e) {
            Alert.alert('গ্রহণ করা যায়নি', pickupErrorMessage(e));
            load();
          } finally {
            setAcceptingId(null);
          }
        },
      },
    ]);

  // Stats
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const completed = mine.filter((r) => r.status === 'completed');
  const todayCount = completed.filter((r) => toDate(r.completedAt) && isSameDay(toDate(r.completedAt), now)).length;
  const weekTotal = completed
    .filter((r) => toDate(r.completedAt) >= weekStart)
    .reduce((s, r) => s + (r.actualEarnings || r.estimatedEarnings || 0), 0);
  const active = mine.filter((r) => ACTIVE_STATUSES.includes(r.status));

  const data = tab === 'new' ? pending : active;

  const renderItem = ({ item }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('RequestDetails', { requestId: item.id })}>
      <View style={styles.cardTop}>
        <View style={styles.timeChip}>
          <Ionicons name="time-outline" size={14} color={colors.primary} />
          <Text style={styles.timeText}>
            {formatRelativeDay(item.schedule?.date)}, {item.schedule?.timeSlot || '—'}
          </Text>
        </View>
        {tab === 'new' ? (
          <Text style={styles.price}>{formatTaka(item.estimatedEarnings)}</Text>
        ) : (
          <StatusBadge status={item.status} />
        )}
      </View>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="recycle" size={17} color={colors.primary} />
        <Text style={styles.infoText} numberOfLines={1}>{materialSummary(item.materials)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={17} color={colors.textGray} />
        <Text style={styles.infoText} numberOfLines={2}>{item.address || 'ঠিকানা উল্লেখ নেই'}</Text>
      </View>
      <View style={styles.actions}>
        <AppButton
          title="বিস্তারিত"
          variant="outline"
          size="sm"
          style={{ flex: 1 }}
          onPress={() => navigation.navigate('RequestDetails', { requestId: item.id })}
        />
        {tab === 'new' ? (
          <AppButton
            title="গ্রহণ করুন"
            icon="checkmark"
            size="sm"
            style={{ flex: 1 }}
            loading={acceptingId === item.id}
            disabled={!!acceptingId}
            onPress={() => handleAccept(item)}
          />
        ) : null}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title={profile?.name ? `স্বাগতম, ${profile.name.split(' ')[0]}` : 'সংগ্রাহক ড্যাশবোর্ড'}
        subtitle="আজকের পিকআপগুলো দেখে নিন"
        right={
          <>
            <IconButton icon="notifications-outline" badge={pending.length} onPress={() => navigation.navigate('Notifications')} accessibilityLabel="বিজ্ঞপ্তি" />
            <IconButton icon="stats-chart-outline" onPress={() => navigation.navigate('CollectorStats')} accessibilityLabel="পরিসংখ্যান" />
          </>
        }
      >
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.stat} onPress={() => navigation.navigate('CollectorStats')}>
            <Text style={styles.statValue}>{toBnDigits(todayCount)}</Text>
            <Text style={styles.statLabel}>আজ সম্পন্ন</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.stat} onPress={() => navigation.navigate('Earnings')}>
            <Text style={styles.statValue}>{formatTaka(weekTotal)}</Text>
            <Text style={styles.statLabel}>এই সপ্তাহ</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.stat} onPress={() => setTab('mine')}>
            <Text style={styles.statValue}>{toBnDigits(active.length)}</Text>
            <Text style={styles.statLabel}>চলমান</Text>
          </TouchableOpacity>
        </View>
      </AppHeader>

      <View style={styles.tabs}>
        {[
          { key: 'new', label: 'নতুন অনুরোধ', count: pending.length },
          { key: 'mine', label: 'আমার পিকআপ', count: active.length },
        ].map((t) => (
          <TouchableOpacity key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            <View style={[styles.tabCount, tab === t.key && styles.tabCountActive]}>
              <Text style={[styles.tabCountText, tab === t.key && { color: colors.primary }]}>{toBnDigits(t.count)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={
            error ? (
              <EmptyState icon="cloud-offline-outline" title="লোড করা যায়নি" message="ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন" actionLabel="আবার চেষ্টা" onAction={load} />
            ) : tab === 'new' ? (
              <EmptyState icon="cube-outline" title="কোনো নতুন অনুরোধ নেই" message="নতুন পিকআপ অনুরোধ আসলে এখানে দেখা যাবে। নিচে টেনে রিফ্রেশ করুন।" />
            ) : (
              <EmptyState icon="bicycle-outline" title="কোনো চলমান পিকআপ নেই" message="নতুন অনুরোধ গ্রহণ করলে এখানে দেখা যাবে" actionLabel="নতুন অনুরোধ দেখুন" onAction={() => setTab('new')} />
            )
          }
        />
      )}

      <BottomNav items={collectorNavItems(navigation, unread)} active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: font.lg, fontWeight: '800', color: colors.white },
  statLabel: { fontSize: font.xs + 1, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  tabs: {
    flexDirection: 'row',
    margin: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 4,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 42, borderRadius: radius.sm + 2 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: font.sm + 1, fontWeight: '700', color: colors.textGray },
  tabTextActive: { color: colors.white },
  tabCount: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  tabCountActive: { backgroundColor: colors.white },
  tabCountText: { fontSize: font.xs, fontWeight: '800', color: colors.textGray },
  list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
  card: { marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    flexShrink: 1,
  },
  timeText: { fontSize: font.xs + 1, fontWeight: '700', color: colors.primary },
  price: { fontSize: font.lg, fontWeight: '800', color: colors.accent },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: 6 },
  infoText: { flex: 1, fontSize: font.sm + 1, color: colors.textBody, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
});

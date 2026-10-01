import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { getUserProfile, ROLES } from '../services/userService';
import { getCollectorPickups, getHouseholdPickups, getPendingPickups } from '../services/pickupService';
import { AppHeader, Chip, EmptyState, LoadingView } from '../components/ui';
import { formatTaka, getTimeAgo, toBnDigits, toDate } from '../utils/helpers';
import colors from '../constants/colors';
import { font, radius, spacing } from '../constants/theme';

const storageKey = (uid) => `@bhangari_notifications_${uid}`;

const loadState = async (uid) => {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    const parsed = raw ? JSON.parse(raw) : {};
    return { read: parsed.read || [], dismissed: parsed.dismissed || [] };
  } catch (e) {
    return { read: [], dismissed: [] };
  }
};

const saveState = (uid, state) => AsyncStorage.setItem(storageKey(uid), JSON.stringify(state)).catch(() => {});

const push = (list, item) => item.time && list.push(item);

/** Build the notification feed from the user's pickups (no push server needed) */
const buildHouseholdFeed = (pickups) => {
  const list = [];
  pickups.forEach((r) => {
    const target = { screen: 'TrackPickup', params: { requestId: r.id } };
    push(list, { id: `submitted_${r.id}`, icon: 'paper-plane', color: colors.info, title: 'অনুরোধ জমা হয়েছে', message: 'আপনার পিকআপ অনুরোধ সংগ্রাহকদের কাছে পাঠানো হয়েছে', time: toDate(r.createdAt), target });
    push(list, { id: `accepted_${r.id}`, icon: 'checkmark-circle', color: colors.success, title: 'পিকআপ গৃহীত', message: `${r.collectorName || 'একজন সংগ্রাহক'} আপনার অনুরোধ গ্রহণ করেছেন`, time: toDate(r.acceptedAt), target });
    push(list, { id: `ontheway_${r.id}`, icon: 'bicycle', color: colors.accent, title: 'সংগ্রাহক পথে', message: `${r.collectorName || 'সংগ্রাহক'} আপনার ঠিকানায় আসছেন`, time: toDate(r.onTheWayAt), target });
    push(list, { id: `arrived_${r.id}`, icon: 'location', color: colors.purple, title: 'সংগ্রাহক পৌঁছেছেন', message: 'সংগ্রাহক আপনার ঠিকানায় পৌঁছেছেন', time: toDate(r.atLocationAt), target });
    if (r.paymentStatus === 'paid') {
      push(list, {
        id: `paid_${r.id}`,
        icon: 'wallet',
        color: colors.success,
        title: 'পেমেন্ট পেয়েছেন',
        message: `${formatTaka(r.actualEarnings)} পেমেন্ট পেয়েছেন। রসিদ দেখতে ট্যাপ করুন`,
        time: toDate(r.paidAt || r.completedAt),
        target: r.paymentId ? { screen: 'PaymentReceipt', params: { paymentId: r.paymentId } } : target,
      });
    } else {
      push(list, { id: `completed_${r.id}`, icon: 'checkmark-done-circle', color: colors.success, title: 'পিকআপ সম্পন্ন', message: 'পিকআপ সফলভাবে সম্পন্ন হয়েছে', time: toDate(r.completedAt), target });
    }
    if (r.status === 'cancelled') {
      push(list, { id: `cancelled_${r.id}`, icon: 'close-circle', color: colors.error, title: 'অনুরোধ বাতিল', message: 'পিকআপ অনুরোধটি বাতিল করা হয়েছে', time: toDate(r.cancelledAt), target });
    }
  });
  return list;
};

const buildCollectorFeed = (mine, pending) => {
  const list = [];
  pending.slice(0, 15).forEach((r) => {
    push(list, {
      id: `new_${r.id}`,
      icon: 'cube',
      color: colors.accent,
      title: 'নতুন পিকআপ অনুরোধ',
      message: `${(r.materials || []).map((m) => m.name).join(', ')} • আনুমানিক ${formatTaka(r.estimatedEarnings)}`,
      time: toDate(r.createdAt),
      target: { screen: 'RequestDetails', params: { requestId: r.id } },
    });
  });
  mine.forEach((r) => {
    const target = { screen: 'RequestDetails', params: { requestId: r.id } };
    push(list, { id: `col_accepted_${r.id}`, icon: 'checkmark-circle', color: colors.info, title: 'পিকআপ গ্রহণ করেছেন', message: r.address || 'পিকআপ গ্রহণ নিশ্চিত হয়েছে', time: toDate(r.acceptedAt), target });
    if (r.status === 'cancelled') {
      push(list, { id: `col_cancelled_${r.id}`, icon: 'close-circle', color: colors.error, title: 'পরিবার অনুরোধ বাতিল করেছে', message: r.address || '', time: toDate(r.cancelledAt), target });
    }
    push(list, {
      id: `col_paid_${r.id}`,
      icon: 'wallet',
      color: colors.success,
      title: 'পেমেন্ট সম্পন্ন',
      message: `${formatTaka(r.actualEarnings ?? r.estimatedEarnings)} পরিশোধ করা হয়েছে`,
      time: toDate(r.completedAt),
      target: r.paymentId ? { screen: 'PaymentReceipt', params: { paymentId: r.paymentId } } : target,
    });
  });
  return list;
};

export default function NotificationsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [state, setState] = useState({ read: [], dismissed: [] });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const uid = auth.currentUser?.uid;

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const [profile, saved] = await Promise.all([getUserProfile(uid), loadState(uid)]);
      let feed;
      if (profile?.role === ROLES.COLLECTOR) {
        const [mine, pending] = await Promise.all([getCollectorPickups(uid), getPendingPickups().catch(() => [])]);
        feed = buildCollectorFeed(mine, pending.filter((r) => r.userId !== uid));
      } else {
        feed = buildHouseholdFeed(await getHouseholdPickups(uid));
      }
      feed.sort((a, b) => b.time - a.time);
      setState(saved);
      setItems(feed.slice(0, 100));
    } catch (e) {
      // keep existing list
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const updateState = (next) => {
    setState(next);
    saveState(uid, next);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const visibleAll = items.filter((n) => !state.dismissed.includes(n.id));
  const isRead = (n) => state.read.includes(n.id);
  const unreadCount = visibleAll.filter((n) => !isRead(n)).length;
  const visible = filter === 'unread' ? visibleAll.filter((n) => !isRead(n)) : visibleAll;

  const open = (n) => {
    if (!isRead(n)) updateState({ ...state, read: [...state.read, n.id] });
    if (n.target) navigation.navigate(n.target.screen, n.target.params);
  };

  const markAllRead = () => updateState({ ...state, read: Array.from(new Set([...state.read, ...visibleAll.map((n) => n.id)])) });
  const dismiss = (id) => updateState({ ...state, dismissed: [...state.dismissed, id] });

  const renderItem = ({ item }) => {
    const read = isRead(item);
    return (
      <TouchableOpacity style={[styles.card, !read && styles.cardUnread]} onPress={() => open(item)}>
        <View style={[styles.icon, { backgroundColor: `${item.color}1A` }]}>
          <Ionicons name={item.icon} size={20} color={item.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, !read && styles.titleUnread]} numberOfLines={1}>{item.title}</Text>
            {!read ? <View style={styles.dot} /> : null}
          </View>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.time}>{getTimeAgo(item.time)}</Text>
        </View>
        <TouchableOpacity onPress={() => dismiss(item.id)} hitSlop={10} style={styles.close} accessibilityLabel="মুছুন">
          <Ionicons name="close" size={18} color={colors.textLight} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="বিজ্ঞপ্তি"
        subtitle={unreadCount ? `${toBnDigits(unreadCount)}টি নতুন` : 'সব পড়া হয়েছে'}
        onBack={() => navigation.goBack()}
        right={
          unreadCount ? (
            <TouchableOpacity onPress={markAllRead} style={styles.markAll}>
              <Ionicons name="checkmark-done" size={16} color={colors.white} />
              <Text style={styles.markAllText}>সব পড়া</Text>
            </TouchableOpacity>
          ) : null
        }
      />
      <View style={styles.filters}>
        <Chip label={`সব (${toBnDigits(visibleAll.length)})`} active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label={`নতুন (${toBnDigits(unreadCount)})`} active={filter === 'unread'} onPress={() => setFilter('unread')} />
      </View>
      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title={filter === 'unread' ? 'কোনো নতুন বিজ্ঞপ্তি নেই' : 'কোনো বিজ্ঞপ্তি নেই'}
              message="পিকআপ সংক্রান্ত আপডেট এখানে দেখা যাবে"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: spacing.md, height: 36, borderRadius: radius.pill },
  markAllText: { color: colors.white, fontWeight: '700', fontSize: font.sm },
  filters: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { padding: spacing.lg, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  cardUnread: { borderLeftColor: colors.primary, backgroundColor: '#FBFEFC' },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flexShrink: 1, fontSize: font.md, fontWeight: '600', color: colors.text },
  titleUnread: { fontWeight: '800' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  message: { fontSize: font.sm, color: colors.textBody, marginTop: 2, lineHeight: 19 },
  time: { fontSize: font.xs + 1, color: colors.textLight, marginTop: 4 },
  close: { padding: 2 },
});

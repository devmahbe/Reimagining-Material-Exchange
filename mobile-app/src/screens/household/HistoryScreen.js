import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../../config/firebase';
import { getHouseholdPickups } from '../../services/pickupService';
import { AppButton, AppHeader, BottomNav, Card, Chip, EmptyState, LoadingView, StatusBadge } from '../../components/ui';
import { householdNavItems } from '../../navigation/navItems';
import { ACTIVE_STATUSES } from '../../constants/status';
import { formatDateBangla, formatRelativeDay, formatTaka, toBnDigits } from '../../utils/helpers';
import colors from '../../constants/colors';
import { font, spacing } from '../../constants/theme';

const FILTERS = [
  { key: 'all', label: 'সব' },
  { key: 'active', label: 'চলমান' },
  { key: 'completed', label: 'সম্পন্ন' },
  { key: 'cancelled', label: 'বাতিল' },
];

const matchesFilter = (req, filter) => {
  if (filter === 'active') return req.status === 'pending' || ACTIVE_STATUSES.includes(req.status);
  if (filter === 'completed') return req.status === 'completed';
  if (filter === 'cancelled') return req.status === 'cancelled';
  return true;
};

export default function HistoryScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setError(false);
      setRequests(await getHouseholdPickups(auth.currentUser?.uid));
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

  const data = requests.filter((r) => matchesFilter(r, filter));

  const renderItem = ({ item }) => {
    const materials = item.materials || [];
    const isActive = item.status === 'pending' || ACTIVE_STATUSES.includes(item.status);
    const amount = item.status === 'completed' ? item.actualEarnings ?? item.estimatedEarnings : item.estimatedEarnings;
    return (
      <Card style={styles.card} onPress={() => navigation.navigate('TrackPickup', { requestId: item.id })}>
        <View style={styles.cardTop}>
          <StatusBadge status={item.status} />
          <Text style={styles.date}>{formatDateBangla(item.createdAt, { short: true })}</Text>
        </View>
        <Text style={styles.materials} numberOfLines={1}>
          {materials.slice(0, 3).map((m) => m.name).join(', ')}
          {materials.length > 3 ? ` +${toBnDigits(materials.length - 3)}` : ''}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textGray} />
          <Text style={styles.meta}>
            {formatRelativeDay(item.schedule?.date)} • {item.schedule?.timeSlot || '—'}
          </Text>
        </View>
        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.amountLabel}>{item.status === 'completed' ? 'প্রাপ্ত' : 'আনুমানিক'}</Text>
            <Text style={styles.amount}>{formatTaka(amount)}</Text>
          </View>
          {isActive ? (
            <AppButton title="ট্র্যাক" icon="navigate-outline" size="sm" variant="soft" onPress={() => navigation.navigate('TrackPickup', { requestId: item.id })} />
          ) : null}
          {item.status === 'completed' && !item.userRating && item.collectorId ? (
            <AppButton
              title="রেটিং দিন"
              icon="star-outline"
              size="sm"
              variant="accent"
              onPress={() =>
                navigation.navigate('RateCollector', {
                  requestId: item.id,
                  collectorId: item.collectorId,
                  collectorName: item.collectorName || 'সংগ্রাহক',
                })
              }
            />
          ) : null}
          {item.status === 'completed' && item.userRating && item.paymentId ? (
            <AppButton title="রসিদ" icon="receipt-outline" size="sm" variant="soft" onPress={() => navigation.navigate('PaymentReceipt', { paymentId: item.paymentId })} />
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="পিকআপ ইতিহাস" subtitle={`মোট ${toBnDigits(requests.length)}টি অনুরোধ`} onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ScrollView>
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
            ) : (
              <EmptyState
                icon="cube-outline"
                title={filter === 'all' ? 'কোনো অনুরোধ নেই' : 'এই তালিকায় কিছু নেই'}
                message="আপনার প্রথম পিকআপ অনুরোধ করুন এবং পুরনো জিনিস থেকে আয় করুন"
                actionLabel="পিকআপ অনুরোধ করুন"
                onAction={() => navigation.navigate('MaterialSelection')}
              />
            )
          }
        />
      )}

      <BottomNav items={householdNavItems(navigation)} active="history" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filters: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
  card: { marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: font.xs + 1, color: colors.textGray },
  materials: { fontSize: font.md + 1, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  meta: { fontSize: font.sm, color: colors.textGray },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  amountLabel: { fontSize: font.xs, color: colors.textGray },
  amount: { fontSize: font.lg, fontWeight: '800', color: colors.primary },
});

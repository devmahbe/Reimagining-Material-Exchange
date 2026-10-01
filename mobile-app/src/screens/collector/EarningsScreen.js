import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../../config/firebase';
import { getCollectorPickups } from '../../services/pickupService';
import { getPaymentMethod } from '../../services/paymentService';
import { collectorNavItems } from '../../navigation/navItems';
import { AppHeader, BottomNav, Card, Chip, EmptyState, IconButton, LoadingView } from '../../components/ui';
import { formatDateTimeBangla, formatTaka, toBnDigits, toDate } from '../../utils/helpers';
import colors from '../../constants/colors';
import { font, radius, spacing } from '../../constants/theme';

const FILTERS = [
  { key: 'all', label: 'সব' },
  { key: 'today', label: 'আজ' },
  { key: 'week', label: 'এই সপ্তাহ' },
  { key: 'month', label: 'এই মাস' },
];

const periodStart = (key) => {
  const now = new Date();
  if (key === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === 'week') return new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  if (key === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
};

const sumSince = (list, key) => {
  const start = periodStart(key);
  return list.filter((t) => !start || t.date >= start).reduce((s, t) => s + t.amount, 0);
};

export default function EarningsScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setError(false);
      const pickups = await getCollectorPickups(auth.currentUser?.uid);
      const txns = pickups
        .filter((p) => p.status === 'completed')
        .map((p) => ({
          id: p.id,
          paymentId: p.paymentId,
          amount: p.actualEarnings ?? p.estimatedEarnings ?? 0,
          date: toDate(p.completedAt) || toDate(p.createdAt),
          method: p.paymentMethod,
          household: p.userName || 'পরিবার',
          materials: (p.materials || []).map((m) => m.name).join(', '),
        }))
        .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
      setTransactions(txns);
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

  const start = periodStart(filter);
  const visible = transactions.filter((t) => !start || t.date >= start);
  const total = sumSince(transactions, 'all');
  const average = transactions.length ? total / transactions.length : 0;

  const renderItem = ({ item }) => {
    const method = item.method ? getPaymentMethod(item.method) : null;
    return (
      <TouchableOpacity
        style={styles.txn}
        onPress={() =>
          item.paymentId
            ? navigation.navigate('PaymentReceipt', { paymentId: item.paymentId })
            : navigation.navigate('RequestDetails', { requestId: item.id })
        }
      >
        <View style={[styles.txnIcon, { backgroundColor: method?.bg || colors.successSoft }]}>
          <Ionicons name={method?.icon || 'checkmark-done'} size={20} color={method?.color || colors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.txnTitle} numberOfLines={1}>{item.household}</Text>
          <Text style={styles.txnSub} numberOfLines={1}>{item.materials || 'পিকআপ সম্পন্ন'}</Text>
          <Text style={styles.txnDate}>{formatDateTimeBangla(item.date)}{method ? ` • ${method.label}` : ''}</Text>
        </View>
        <Text style={styles.txnAmount}>{formatTaka(item.amount)}</Text>
      </TouchableOpacity>
    );
  };

  const header = (
    <View>
      <LinearGradient colors={[colors.success, colors.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.totalCard}>
        <Text style={styles.totalLabel}>মোট লেনদেন</Text>
        <Text style={styles.totalAmount}>{formatTaka(total)}</Text>
        <View style={styles.periodRow}>
          {[
            { key: 'today', label: 'আজ' },
            { key: 'week', label: 'এই সপ্তাহ' },
            { key: 'month', label: 'এই মাস' },
          ].map((p, i) => (
            <React.Fragment key={p.key}>
              {i > 0 ? <View style={styles.periodDivider} /> : null}
              <View style={styles.periodItem}>
                <Text style={styles.periodValue}>{formatTaka(sumSince(transactions, p.key))}</Text>
                <Text style={styles.periodLabel}>{p.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.quickRow}>
        <Card style={styles.quick}>
          <Ionicons name="cube-outline" size={22} color={colors.info} />
          <Text style={styles.quickValue}>{toBnDigits(transactions.length)}</Text>
          <Text style={styles.quickLabel}>সম্পন্ন পিকআপ</Text>
        </Card>
        <Card style={styles.quick}>
          <Ionicons name="trending-up-outline" size={22} color={colors.accent} />
          <Text style={styles.quickValue}>{formatTaka(average)}</Text>
          <Text style={styles.quickLabel}>গড় প্রতি পিকআপ</Text>
        </Card>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>
      <Text style={styles.listTitle}>লেনদেনের ইতিহাস</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="আয় ও লেনদেন"
        subtitle="সব পেমেন্টের হিসাব"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        right={<IconButton icon="stats-chart-outline" onPress={() => navigation.navigate('CollectorStats')} accessibilityLabel="পরিসংখ্যান" />}
      />
      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={
            error ? (
              <EmptyState icon="cloud-offline-outline" title="লোড করা যায়নি" actionLabel="আবার চেষ্টা" onAction={load} />
            ) : (
              <EmptyState icon="wallet-outline" title="কোনো লেনদেন নেই" message="পিকআপ সম্পন্ন করে পেমেন্ট করলে এখানে দেখা যাবে" />
            )
          }
        />
      )}
      <BottomNav items={collectorNavItems(navigation)} active="earnings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, flexGrow: 1 },
  totalCard: { borderRadius: radius.xl, padding: spacing.xl },
  totalLabel: { fontSize: font.sm + 1, color: 'rgba(255,255,255,0.85)' },
  totalAmount: { fontSize: 36, fontWeight: '800', color: colors.white, marginTop: 2 },
  periodRow: { flexDirection: 'row', marginTop: spacing.lg, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.md, paddingVertical: spacing.md },
  periodItem: { flex: 1, alignItems: 'center' },
  periodValue: { fontSize: font.md, fontWeight: '800', color: colors.white },
  periodLabel: { fontSize: font.xs + 1, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  periodDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  quickRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  quick: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  quickValue: { fontSize: font.lg, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  quickLabel: { fontSize: font.xs + 1, color: colors.textGray, marginTop: 2 },
  filters: { gap: spacing.sm, paddingVertical: spacing.lg },
  listTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  txn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  txnIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txnTitle: { fontSize: font.md, fontWeight: '700', color: colors.text },
  txnSub: { fontSize: font.sm, color: colors.textGray, marginTop: 1 },
  txnDate: { fontSize: font.xs + 1, color: colors.textLight, marginTop: 2 },
  txnAmount: { fontSize: font.md + 1, fontWeight: '800', color: colors.success },
});

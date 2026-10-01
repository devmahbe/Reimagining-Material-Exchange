import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import { getCollectorPickups } from '../../services/pickupService';
import { getCollectorRating } from '../../services/reviewService';
import { AppHeader, Card, LoadingView, SectionHeader } from '../../components/ui';
import { findCatalogMaterial } from '../../constants/materials';
import { ACTIVE_STATUSES } from '../../constants/status';
import { BN_DAYS_SHORT, BN_MONTHS_SHORT, formatNumber, formatTaka, getAveragePrice, toBnDigits, toDate } from '../../utils/helpers';
import colors from '../../constants/colors';
import { font, radius, spacing } from '../../constants/theme';

const PERIODS = [
  { key: 'week', label: '৭ দিন' },
  { key: 'month', label: 'এই মাস' },
  { key: 'year', label: 'এই বছর' },
];

const CHART_HEIGHT = 140;

const buildBuckets = (period) => {
  const now = new Date();
  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
      return { key: d.toDateString(), label: BN_DAYS_SHORT[d.getDay()], match: (x) => x.toDateString() === d.toDateString() };
    });
  }
  if (period === 'month') {
    return [1, 2, 3, 4, 5].map((w) => ({
      key: `w${w}`,
      label: `সপ্তাহ ${toBnDigits(w)}`,
      match: (x) => x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear() && Math.ceil(x.getDate() / 7) === w,
    }));
  }
  return BN_MONTHS_SHORT.map((m, i) => ({
    key: m,
    label: m,
    match: (x) => x.getMonth() === i && x.getFullYear() === now.getFullYear(),
  }));
};

const periodStart = (period) => {
  const now = new Date();
  if (period === 'week') return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
};

export default function CollectorStatsScreen({ navigation }) {
  const [period, setPeriod] = useState('week');
  const [pickups, setPickups] = useState([]);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    try {
      const [list, r] = await Promise.all([getCollectorPickups(uid), getCollectorRating(uid).catch(() => ({ average: 0, count: 0 }))]);
      setPickups(list);
      setRating(r);
    } catch (e) {
      // leave previous data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ── Aggregate ────────────────────────────────────────────
  const start = periodStart(period);
  const completed = pickups
    .filter((p) => p.status === 'completed')
    .map((p) => ({ ...p, _date: toDate(p.completedAt) }))
    .filter((p) => p._date && p._date >= start);
  const active = pickups.filter((p) => ACTIVE_STATUSES.includes(p.status));
  const amountOf = (p) => p.actualEarnings ?? p.estimatedEarnings ?? 0;

  const totalAmount = completed.reduce((s, p) => s + amountOf(p), 0);
  let totalWeight = 0;
  const materialMap = {};
  completed.forEach((p) => {
    (p.materials || []).forEach((m) => {
      const qty = Number(m.quantity) || 0;
      const key = m.name;
      const entry = materialMap[key] || { name: m.name, qty: 0, unit: m.unit, value: 0, catalog: findCatalogMaterial(m) };
      entry.qty += qty;
      entry.value += getAveragePrice(m) * qty;
      materialMap[key] = entry;
      if (m.unit === 'কেজি') totalWeight += qty;
    });
  });
  const topMaterials = Object.values(materialMap).sort((a, b) => b.value - a.value).slice(0, 5);
  const topTotal = topMaterials.reduce((s, m) => s + m.value, 0);

  const buckets = buildBuckets(period).map((b) => ({
    ...b,
    amount: completed.filter((p) => b.match(p._date)).reduce((s, p) => s + amountOf(p), 0),
  }));
  const maxBucket = Math.max(1, ...buckets.map((b) => b.amount));

  const finishedOrActive = completed.length + active.length;
  const completionRate = finishedOrActive ? Math.round((completed.length / finishedOrActive) * 100) : 0;

  return (
    <View style={styles.container}>
      <AppHeader title="পরিসংখ্যান" subtitle="আপনার কাজের সারসংক্ষেপ" onBack={() => navigation.goBack()}>
        <View style={styles.periods}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p.key} style={[styles.period, period === p.key && styles.periodActive]} onPress={() => setPeriod(p.key)}>
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </AppHeader>

      {loading ? (
        <LoadingView />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          <View style={styles.grid}>
            {[
              { icon: 'cash-outline', color: colors.success, bg: colors.successSoft, value: formatTaka(totalAmount), label: 'মোট লেনদেন' },
              { icon: 'cube-outline', color: colors.info, bg: colors.infoSoft, value: toBnDigits(completed.length), label: 'সম্পন্ন পিকআপ' },
              { icon: 'barbell-outline', color: colors.purple, bg: colors.purpleSoft, value: `${formatNumber(totalWeight)} কেজি`, label: 'মোট ওজন' },
              {
                icon: 'star-outline',
                color: colors.accent,
                bg: colors.accentSoft,
                value: rating.count ? toBnDigits(rating.average.toFixed(1)) : '—',
                label: rating.count ? `রেটিং (${toBnDigits(rating.count)})` : 'রেটিং',
              },
            ].map((s) => (
              <Card key={s.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon} size={20} color={s.color} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </Card>
            ))}
          </View>

          <SectionHeader title="লেনদেনের গ্রাফ" />
          <Card>
            <View style={styles.chart}>
              {buckets.map((b) => (
                <View key={b.key} style={styles.barCol}>
                  <Text style={styles.barValue} numberOfLines={1}>{b.amount ? formatNumber(b.amount) : ''}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: Math.max(b.amount ? 6 : 0, (b.amount / maxBucket) * CHART_HEIGHT) }]} />
                  </View>
                  <Text style={styles.barLabel} numberOfLines={1}>{b.label}</Text>
                </View>
              ))}
            </View>
          </Card>

          <SectionHeader title="কাজের হার" />
          <Card>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>সম্পন্ন হার</Text>
              <Text style={styles.rateValue}>{toBnDigits(completionRate)}%</Text>
            </View>
            <View style={styles.progress}>
              <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
            </View>
            <Text style={styles.rateHint}>
              {toBnDigits(completed.length)}টি সম্পন্ন • {toBnDigits(active.length)}টি চলমান
            </Text>
          </Card>

          <SectionHeader title="শীর্ষ উপাদান" />
          <Card>
            {topMaterials.length === 0 ? (
              <Text style={styles.emptyText}>এই সময়ে কোনো সম্পন্ন পিকআপ নেই</Text>
            ) : (
              topMaterials.map((m, i) => {
                const pct = topTotal ? Math.round((m.value / topTotal) * 100) : 0;
                return (
                  <View key={m.name} style={[styles.matRow, i === topMaterials.length - 1 && { marginBottom: 0 }]}>
                    <View style={[styles.matIcon, { backgroundColor: m.catalog?.bg || colors.primarySoft }]}>
                      <MaterialCommunityIcons name={m.catalog?.icon || 'recycle'} size={18} color={m.catalog?.color || colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.matHead}>
                        <Text style={styles.matName}>{m.name}</Text>
                        <Text style={styles.matValue}>{formatTaka(m.value)}</Text>
                      </View>
                      <View style={styles.matTrack}>
                        <View style={[styles.matFill, { width: `${pct}%`, backgroundColor: m.catalog?.color || colors.primary }]} />
                      </View>
                      <Text style={styles.matQty}>{formatNumber(m.qty)} {m.unit} • {toBnDigits(pct)}%</Text>
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  periods: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.md, padding: 4, marginTop: spacing.lg },
  period: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 38, borderRadius: radius.sm + 2 },
  periodActive: { backgroundColor: colors.white },
  periodText: { color: colors.white, fontWeight: '700', fontSize: font.sm },
  periodTextActive: { color: colors.primary },
  body: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { width: '47%', flexGrow: 1, padding: spacing.lg },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: font.xl, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  statLabel: { fontSize: font.sm - 1, color: colors.textGray, marginTop: 2 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barCol: { flex: 1, alignItems: 'center' },
  barValue: { fontSize: 9, color: colors.textGray, marginBottom: 4, height: 12 },
  barTrack: { height: CHART_HEIGHT, width: '70%', maxWidth: 28, justifyContent: 'flex-end', backgroundColor: colors.background, borderRadius: 6, overflow: 'hidden' },
  bar: { width: '100%', backgroundColor: colors.primary, borderRadius: 6 },
  barLabel: { fontSize: 10, color: colors.textGray, marginTop: 6 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateLabel: { fontSize: font.md, fontWeight: '600', color: colors.text },
  rateValue: { fontSize: font.xl, fontWeight: '800', color: colors.primary },
  progress: { height: 10, borderRadius: 5, backgroundColor: colors.background, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
  rateHint: { fontSize: font.sm, color: colors.textGray, marginTop: spacing.sm },
  emptyText: { fontSize: font.sm + 1, color: colors.textGray, textAlign: 'center', paddingVertical: spacing.lg },
  matRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  matIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  matHead: { flexDirection: 'row', justifyContent: 'space-between' },
  matName: { fontSize: font.md, fontWeight: '700', color: colors.text },
  matValue: { fontSize: font.md, fontWeight: '700', color: colors.text },
  matTrack: { height: 6, borderRadius: 3, backgroundColor: colors.background, marginTop: 6, overflow: 'hidden' },
  matFill: { height: '100%', borderRadius: 3 },
  matQty: { fontSize: font.xs + 1, color: colors.textGray, marginTop: 4 },
});

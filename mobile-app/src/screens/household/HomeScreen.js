import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../../config/firebase';
import { getUserProfile } from '../../services/userService';
import { getHouseholdPickups } from '../../services/pickupService';
import { getUnreadCount } from '../../services/chatService';
import { householdNavItems } from '../../navigation/navItems';
import { AppHeader, BottomNav, Card, IconButton, SectionHeader, StatusBadge } from '../../components/ui';
import { MATERIALS } from '../../constants/materials';
import { ACTIVE_STATUSES } from '../../constants/status';
import { formatPriceRange, formatRelativeDay, formatTaka, toBnDigits } from '../../utils/helpers';
import colors from '../../constants/colors';
import { font, radius, shadow, spacing } from '../../constants/theme';

export default function HouseholdHomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const [p, list, u] = await Promise.all([
      getUserProfile(uid).catch(() => null),
      getHouseholdPickups(uid).catch(() => []),
      getUnreadCount(uid).catch(() => 0),
    ]);
    setProfile(p);
    setPickups(list);
    setUnread(u);
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

  const activePickup = pickups.find((p) => p.status === 'pending' || ACTIVE_STATUSES.includes(p.status));
  const completed = pickups.filter((p) => p.status === 'completed');
  const totalEarned = completed.reduce((s, p) => s + (p.actualEarnings || p.estimatedEarnings || 0), 0);
  const firstName = (profile?.name || '').split(' ')[0];

  return (
    <View style={styles.container}>
      <AppHeader
        title={firstName ? `স্বাগতম, ${firstName}` : 'স্বাগতম!'}
        subtitle="আজই পুনর্ব্যবহারযোগ্য সামগ্রী বিক্রি করুন"
        right={
          <>
            <IconButton icon="notifications-outline" onPress={() => navigation.navigate('Notifications')} accessibilityLabel="বিজ্ঞপ্তি" />
            <IconButton icon="settings-outline" onPress={() => navigation.navigate('Settings')} accessibilityLabel="সেটিংস" />
          </>
        }
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{toBnDigits(pickups.length)}</Text>
            <Text style={styles.summaryLabel}>মোট অনুরোধ</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{toBnDigits(completed.length)}</Text>
            <Text style={styles.summaryLabel}>সম্পন্ন</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatTaka(totalEarned)}</Text>
            <Text style={styles.summaryLabel}>মোট আয়</Text>
          </View>
        </View>
      </AppHeader>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {/* Primary action */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('MaterialSelection')} style={styles.heroWrap}>
          <LinearGradient colors={[colors.accent, colors.accentLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>পিকআপের অনুরোধ করুন</Text>
              <Text style={styles.heroSub}>সংগ্রাহক আপনার দরজা থেকে সামগ্রী নিয়ে যাবে</Text>
              <View style={styles.heroCta}>
                <Text style={styles.heroCtaText}>শুরু করুন</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.accent} />
              </View>
            </View>
            <MaterialCommunityIcons name="truck-fast-outline" size={64} color="rgba(255,255,255,0.9)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Active pickup */}
        {activePickup ? (
          <>
            <SectionHeader title="চলমান পিকআপ" />
            <Card onPress={() => navigation.navigate('TrackPickup', { requestId: activePickup.id })}>
              <View style={styles.activeTop}>
                <StatusBadge status={activePickup.status} />
                <Text style={styles.activeAmount}>{formatTaka(activePickup.estimatedEarnings)}</Text>
              </View>
              <Text style={styles.activeMaterials} numberOfLines={1}>
                {(activePickup.materials || []).map((m) => m.name).join(', ')}
              </Text>
              <View style={styles.activeMeta}>
                <Ionicons name="calendar-outline" size={15} color={colors.textGray} />
                <Text style={styles.activeMetaText}>
                  {formatRelativeDay(activePickup.schedule?.date)}, {activePickup.schedule?.timeSlot}
                </Text>
              </View>
              <View style={styles.trackLink}>
                <Text style={styles.trackLinkText}>ট্র্যাক করুন</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </View>
            </Card>
          </>
        ) : null}

        {/* Quick actions */}
        <View style={styles.quickRow}>
          {[
            { icon: 'pricetags-outline', label: 'আজকের দর', color: colors.primary, bg: colors.primarySoft, route: 'PriceList' },
            { icon: 'time-outline', label: 'ইতিহাস', color: colors.info, bg: colors.infoSoft, route: 'History' },
            { icon: 'chatbubbles-outline', label: 'বার্তা', color: colors.purple, bg: colors.purpleSoft, route: 'Messages' },
          ].map((q) => (
            <TouchableOpacity key={q.route} style={styles.quickCard} onPress={() => navigation.navigate(q.route)}>
              <View style={[styles.quickIcon, { backgroundColor: q.bg }]}>
                <Ionicons name={q.icon} size={22} color={q.color} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Materials */}
        <SectionHeader title="আজকের মূল্য তালিকা" actionLabel="সব দেখুন" onAction={() => navigation.navigate('PriceList')} />
        <View style={styles.grid}>
          {MATERIALS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={styles.materialCard}
              onPress={() => navigation.navigate('MaterialSelection', { preselect: m.id })}
            >
              <View style={[styles.materialIcon, { backgroundColor: m.bg }]}>
                <MaterialCommunityIcons name={m.icon} size={26} color={m.color} />
              </View>
              <Text style={styles.materialName} numberOfLines={1}>{m.name}</Text>
              <Text style={[styles.materialPrice, { color: m.color }]}>{formatPriceRange(m)}</Text>
              <Text style={styles.materialUnit}>প্রতি {m.unit}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomNav items={householdNavItems(navigation, unread)} active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summaryRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: font.lg, fontWeight: '800', color: colors.white },
  summaryLabel: { fontSize: font.xs + 1, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  body: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  heroWrap: { borderRadius: radius.xl, ...shadow.md },
  hero: { borderRadius: radius.xl, padding: spacing.xl, flexDirection: 'row', alignItems: 'center' },
  heroTitle: { fontSize: font.xl, fontWeight: '800', color: colors.white },
  heroSub: { fontSize: font.sm, color: 'rgba(255,255,255,0.92)', marginTop: 4, lineHeight: 19 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  heroCtaText: { color: colors.accent, fontWeight: '700', fontSize: font.sm },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeAmount: { fontSize: font.lg, fontWeight: '800', color: colors.primary },
  activeMaterials: { fontSize: font.md, fontWeight: '600', color: colors.text, marginTop: spacing.md },
  activeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  activeMetaText: { fontSize: font.sm, color: colors.textGray },
  trackLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: spacing.sm },
  trackLinkText: { color: colors.primary, fontWeight: '700', fontSize: font.sm },
  quickRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  quickCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadow.sm,
  },
  quickIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: font.sm, fontWeight: '600', color: colors.text, marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  materialCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  materialIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  materialName: { fontSize: font.sm + 1, fontWeight: '700', color: colors.text },
  materialPrice: { fontSize: font.sm, fontWeight: '700', marginTop: 2 },
  materialUnit: { fontSize: font.xs, color: colors.textGray },
});

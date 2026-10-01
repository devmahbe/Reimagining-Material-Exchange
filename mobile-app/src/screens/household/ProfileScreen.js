import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Alert } from '../../utils/alert';
import { authErrorMessage, getUserProfile, logout, ROLES, updateUserProfile } from '../../services/userService';
import { getCollectorPickups, getHouseholdPickups } from '../../services/pickupService';
import { getCollectorRating } from '../../services/reviewService';
import { AppButton, AppHeader, Avatar, BottomNav, Card, FormField, SectionHeader } from '../../components/ui';
import { collectorNavItems, householdNavItems } from '../../navigation/navItems';
import AccountSwitcher from '../../components/AccountSwitcher';
import { formatPhone, formatTaka, isValidPhone, normalizePhone, toBnDigits } from '../../utils/helpers';
import colors from '../../constants/colors';
import { font, radius, spacing } from '../../constants/theme';

function MenuItem({ icon, label, onPress, color = colors.primary, danger }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: danger ? colors.errorSoft : colors.primarySoft }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : color} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: colors.error }]}>{label}</Text>
      {!danger ? <Ionicons name="chevron-forward" size={18} color={colors.textLight} /> : null}
    </TouchableOpacity>
  );
}

function Sheet({ visible, title, onClose, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textGray} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, amount: 0, rating: null });
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const isCollector = profile?.role === ROLES.COLLECTOR;
  const isEmailUser = auth.currentUser?.providerData?.some((p) => p.providerId === 'password');

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const p = await getUserProfile(uid);
      setProfile(p);
      const collector = p?.role === ROLES.COLLECTOR;
      const pickups = collector ? await getCollectorPickups(uid) : await getHouseholdPickups(uid);
      const completed = pickups.filter((r) => r.status === 'completed');
      const rating = collector ? await getCollectorRating(uid).catch(() => null) : null;
      setStats({
        total: pickups.length,
        completed: completed.length,
        amount: completed.reduce((s, r) => s + (r.actualEarnings || r.estimatedEarnings || 0), 0),
        rating,
      });
    } catch (error) {
      // keep whatever was loaded
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openEdit = () => {
    setEditName(profile?.name || '');
    setEditPhone(profile?.phone || '');
    setEditAddress(profile?.address || '');
    setErrors({});
    setEditOpen(true);
  };

  const saveProfile = async () => {
    const next = {};
    if (!editName.trim()) next.name = 'নাম খালি রাখা যাবে না';
    if (editPhone.trim() && !isValidPhone(editPhone)) next.phone = 'সঠিক ফোন নম্বর লিখুন (01XXXXXXXXX)';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const data = {
        name: editName.trim(),
        phone: editPhone.trim() ? normalizePhone(editPhone) : '',
        address: editAddress.trim(),
      };
      await updateUserProfile(auth.currentUser.uid, data);
      setProfile((prev) => ({ ...prev, ...data }));
      setEditOpen(false);
      Alert.alert('সফল ✅', 'প্রোফাইল আপডেট হয়েছে');
    } catch (error) {
      Alert.alert('ত্রুটি', 'প্রোফাইল আপডেট করা যায়নি');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (newPw.length < 6) {
      setErrors({ pw: 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন' });
      return;
    }
    setSaving(true);
    try {
      await updatePassword(auth.currentUser, newPw);
      setPwOpen(false);
      setNewPw('');
      Alert.alert('সফল ✅', 'পাসওয়ার্ড পরিবর্তন হয়েছে');
    } catch (error) {
      Alert.alert('ত্রুটি', authErrorMessage(error, 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () =>
    Alert.alert('লগআউট', 'আপনি কি লগআউট করতে চান?', [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'লগআউট',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout(navigation);
          } catch (error) {
            Alert.alert('ত্রুটি', 'লগআউট করা যায়নি');
          }
        },
      },
    ]);

  const showSupport = () =>
    Alert.alert('সহায়তা ও সাপোর্ট', 'ইমেইল: support@bhangari.com\nফোন: 01700-000000\nসময়: সকাল ৯টা - রাত ৯টা');

  return (
    <View style={styles.container}>
      <AppHeader title="প্রোফাইল" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <Avatar name={profile?.name} size={76} />
          <Text style={styles.name}>{profile?.name || 'ব্যবহারকারী'}</Text>
          <Text style={styles.email}>{profile?.email || auth.currentUser?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name={isCollector ? 'bicycle-outline' : 'home-outline'} size={14} color={colors.primary} />
            <Text style={styles.roleText}>{isCollector ? 'সংগ্রাহক' : 'পরিবার'}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{toBnDigits(stats.total)}</Text>
              <Text style={styles.statLabel}>{isCollector ? 'গৃহীত পিকআপ' : 'মোট অনুরোধ'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{toBnDigits(stats.completed)}</Text>
              <Text style={styles.statLabel}>সম্পন্ন</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {isCollector
                  ? stats.rating?.count ? `★ ${toBnDigits(stats.rating.average.toFixed(1))}` : '—'
                  : formatTaka(stats.amount)}
              </Text>
              <Text style={styles.statLabel}>{isCollector ? 'রেটিং' : 'মোট আয়'}</Text>
            </View>
          </View>
        </Card>

        <SectionHeader title="যোগাযোগের তথ্য" />
        <Card style={{ paddingVertical: spacing.sm }}>
          <View style={styles.infoLine}>
            <Ionicons name="call-outline" size={18} color={colors.textGray} />
            <Text style={styles.infoText}>{formatPhone(profile?.phone) || 'ফোন নম্বর যোগ করা হয়নি'}</Text>
          </View>
          <View style={[styles.infoLine, { borderBottomWidth: 0 }]}>
            <Ionicons name="location-outline" size={18} color={colors.textGray} />
            <Text style={styles.infoText}>{profile?.address || 'ঠিকানা যোগ করা হয়নি'}</Text>
          </View>
        </Card>

        <SectionHeader title="অ্যাকাউন্ট" />
        <Card style={styles.menuCard}>
          <MenuItem icon="swap-horizontal-outline" label="অ্যাকাউন্ট পরিবর্তন / যোগ করুন" onPress={() => setSwitcherOpen(true)} />
          <MenuItem icon="create-outline" label="প্রোফাইল সম্পাদনা" onPress={openEdit} />
          {isEmailUser ? (
            <MenuItem icon="lock-closed-outline" label="পাসওয়ার্ড পরিবর্তন" onPress={() => { setNewPw(''); setErrors({}); setPwOpen(true); }} />
          ) : null}
          {isCollector ? (
            <>
              <MenuItem icon="wallet-outline" label="আয় ও লেনদেন" onPress={() => navigation.navigate('Earnings')} />
              <MenuItem icon="stats-chart-outline" label="পরিসংখ্যান" onPress={() => navigation.navigate('CollectorStats')} />
            </>
          ) : (
            <MenuItem icon="time-outline" label="পিকআপ ইতিহাস" onPress={() => navigation.navigate('History')} />
          )}
          <MenuItem icon="pricetags-outline" label="মূল্য তালিকা" onPress={() => navigation.navigate('PriceList')} />
          <MenuItem icon="settings-outline" label="সেটিংস" onPress={() => navigation.navigate('Settings')} />
          <MenuItem icon="help-circle-outline" label="সহায়তা ও সাপোর্ট" onPress={showSupport} />
        </Card>

        <Card style={[styles.menuCard, { marginTop: spacing.lg }]}>
          <MenuItem icon="log-out-outline" label="লগআউট" onPress={handleLogout} danger />
        </Card>

        <Text style={styles.version}>ভাঙ্গারি এক্সচেঞ্জ v১.০.০ • Team Doctor Strange</Text>
      </ScrollView>

      <BottomNav items={isCollector ? collectorNavItems(navigation) : householdNavItems(navigation)} active="profile" />

      <AccountSwitcher visible={switcherOpen} onClose={() => setSwitcherOpen(false)} navigation={navigation} />

      <Sheet visible={editOpen} title="প্রোফাইল সম্পাদনা" onClose={() => setEditOpen(false)}>
        <FormField label="নাম" icon="person-outline" value={editName} onChangeText={setEditName} error={errors.name} />
        <FormField label="ফোন নম্বর" icon="call-outline" value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" maxLength={14} placeholder="01XXXXXXXXX" error={errors.phone} />
        <FormField label="ঠিকানা" icon="location-outline" value={editAddress} onChangeText={setEditAddress} multiline placeholder="বাড়ি, রাস্তা, এলাকা, শহর" />
        <AppButton title="সংরক্ষণ করুন" icon="checkmark" onPress={saveProfile} loading={saving} />
      </Sheet>

      <Sheet visible={pwOpen} title="পাসওয়ার্ড পরিবর্তন" onClose={() => setPwOpen(false)}>
        <FormField
          label="নতুন পাসওয়ার্ড"
          icon="lock-closed-outline"
          value={newPw}
          onChangeText={(t) => { setNewPw(t); setErrors({}); }}
          secureTextEntry
          placeholder="কমপক্ষে ৬ অক্ষর"
          error={errors.pw}
        />
        <AppButton title="পরিবর্তন করুন" icon="checkmark" onPress={savePassword} loading={saving} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  profileCard: { alignItems: 'center', paddingTop: spacing.xxl },
  name: { fontSize: font.xl + 2, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  email: { fontSize: font.sm, color: colors.textGray, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  roleText: { color: colors.primary, fontWeight: '700', fontSize: font.sm },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    alignSelf: 'stretch',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: font.lg, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: font.xs + 1, color: colors.textGray, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.borderLight },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoText: { flex: 1, fontSize: font.md, color: colors.text },
  menuCard: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56 },
  menuIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: font.md, color: colors.text, fontWeight: '600' },
  version: { textAlign: 'center', color: colors.textLight, fontSize: font.xs + 1, marginTop: spacing.xl },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    padding: spacing.xl,
  },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.md },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontSize: font.xl, fontWeight: '800', color: colors.text },
});

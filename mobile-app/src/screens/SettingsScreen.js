import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { Alert } from '../utils/alert';
import { getCurrentUserProfile, logout } from '../services/userService';
import { AppHeader, Avatar, Card, SectionHeader } from '../components/ui';
import AccountSwitcher from '../components/AccountSwitcher';
import colors from '../constants/colors';
import { font, radius, spacing } from '../constants/theme';

const SETTINGS_KEY = '@bhangari_settings';

function Row({ icon, iconColor = colors.primary, title, subtitle, onPress, right, last }) {
  const content = (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <View style={[styles.rowIcon, { backgroundColor: `${iconColor}1A` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textLight} /> : null}
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity> : content;
}

export default function SettingsScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState({ notificationsEnabled: true, soundEnabled: true });
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    getCurrentUserProfile().then(setProfile).catch(() => {});
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((saved) => saved && setSettings((s) => ({ ...s, ...JSON.parse(saved) })))
      .catch(() => {});
  }, []);

  const toggle = (key) => (value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
  };

  const handleLogout = () =>
    Alert.alert('লগআউট', 'আপনি কি লগআউট করতে চান?', [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'লগআউট',
        style: 'destructive',
        onPress: () => logout(navigation).catch(() => Alert.alert('ত্রুটি', 'লগআউট করা যায়নি')),
      },
    ]);

  const switchProps = (key) => ({
    value: settings[key],
    onValueChange: toggle(key),
    trackColor: { false: colors.border, true: colors.primaryLight },
    thumbColor: settings[key] ? colors.primary : '#f4f3f4',
  });

  const isCollector = profile?.role === 'collector';

  return (
    <View style={styles.container}>
      <AppHeader title="সেটিংস" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={styles.account} onPress={() => navigation.navigate('Profile')}>
          <Avatar name={profile?.name} size={54} />
          <View style={{ flex: 1 }}>
            <Text style={styles.accountName}>{profile?.name || 'ব্যবহারকারী'}</Text>
            <Text style={styles.accountEmail}>{profile?.email || auth.currentUser?.email}</Text>
            <Text style={styles.accountRole}>{isCollector ? 'সংগ্রাহক অ্যাকাউন্ট' : 'পরিবার অ্যাকাউন্ট'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </Card>

        <SectionHeader title="বিজ্ঞপ্তি" />
        <Card style={styles.group}>
          <Row icon="notifications-outline" title="অ্যাপের বিজ্ঞপ্তি" subtitle="পিকআপ আপডেট দেখান" right={<Switch {...switchProps('notificationsEnabled')} />} />
          <Row icon="volume-medium-outline" title="বিজ্ঞপ্তি সাউন্ড" subtitle="নতুন বার্তায় শব্দ" right={<Switch {...switchProps('soundEnabled')} />} last />
        </Card>

        <SectionHeader title="অ্যাকাউন্ট" />
        <Card style={styles.group}>
          <Row
            icon="swap-horizontal-outline"
            title="অ্যাকাউন্ট পরিবর্তন / যোগ করুন"
            subtitle="একই ডিভাইসে একাধিক অ্যাকাউন্ট"
            onPress={() => setSwitcherOpen(true)}
          />
          <Row icon="person-outline" title="প্রোফাইল সম্পাদনা" subtitle="নাম, ফোন, ঠিকানা" onPress={() => navigation.navigate('Profile')} />
          {isCollector ? (
            <Row icon="wallet-outline" title="পেমেন্ট ও লেনদেন" subtitle="নগদ, মোবাইল ওয়ালেট, ব্যাংক (ডেমো)" onPress={() => navigation.navigate('Earnings')} />
          ) : (
            <Row icon="time-outline" title="পিকআপ ইতিহাস" subtitle="সব অনুরোধ ও পেমেন্ট" onPress={() => navigation.navigate('History')} />
          )}
          <Row icon="pricetags-outline" title="আজকের দর" onPress={() => navigation.navigate('PriceList')} last />
        </Card>

        <SectionHeader title="সহায়তা" />
        <Card style={styles.group}>
          <Row
            icon="help-circle-outline"
            iconColor={colors.info}
            title="সাহায্য কেন্দ্র"
            subtitle="সাধারণ প্রশ্ন"
            onPress={() =>
              Alert.alert(
                'সাধারণ প্রশ্নাবলী',
                '• পিকআপ কীভাবে দেব: হোম স্ক্রিনে "পিকআপের অনুরোধ করুন" চাপুন\n\n• দাম কীভাবে ঠিক হয়: সংগ্রাহক পিকআপের সময় ওজন করে দাম ঠিক করেন\n\n• পেমেন্ট কীভাবে পাব: পিকআপ শেষে সংগ্রাহক নগদ, মোবাইল ওয়ালেট বা ব্যাংকে পরিশোধ করবেন, রসিদ অ্যাপে পাবেন'
              )
            }
          />
          <Row
            icon="call-outline"
            iconColor={colors.info}
            title="আমাদের সাথে যোগাযোগ"
            subtitle="support@bhangari.com • 01700-000000"
            onPress={() => Linking.openURL('mailto:support@bhangari.com').catch(() => {})}
          />
          <Row
            icon="document-text-outline"
            iconColor={colors.textGray}
            title="শর্তাবলী ও গোপনীয়তা"
            onPress={() =>
              Alert.alert(
                'শর্তাবলী ও গোপনীয়তা',
                'ভাঙ্গারি এক্সচেঞ্জ ব্যবহার করে আপনি সঠিক তথ্য দিতে সম্মত হচ্ছেন। আপনার ফোন নম্বর ও ঠিকানা শুধুমাত্র আপনার পিকআপ গ্রহণকারী সংগ্রাহকের সাথে শেয়ার হয় এবং তৃতীয় পক্ষকে দেওয়া হয় না।'
              )
            }
            last
          />
        </Card>

        <SectionHeader title="সম্পর্কে" />
        <Card style={styles.group}>
          <Row icon="information-circle-outline" iconColor={colors.textGray} title="অ্যাপ ভার্সন" subtitle="v১.০.০" right={null} />
          <Row icon="people-outline" iconColor={colors.textGray} title="ডেভেলপার" subtitle="Team: Doctor Strange, Section B" right={null} last />
        </Card>

        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>লগআউট</Text>
        </TouchableOpacity>
      </ScrollView>
      <AccountSwitcher visible={switcherOpen} onClose={() => setSwitcherOpen(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  account: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  accountName: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  accountEmail: { fontSize: font.sm, color: colors.textGray, marginTop: 1 },
  accountRole: { fontSize: font.xs + 1, color: colors.primary, fontWeight: '700', marginTop: 3 },
  group: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: font.md, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: font.sm - 1, color: colors.textGray, marginTop: 2 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: colors.white,
    marginTop: spacing.xxl,
  },
  logoutText: { color: colors.error, fontWeight: '700', fontSize: font.md },
});

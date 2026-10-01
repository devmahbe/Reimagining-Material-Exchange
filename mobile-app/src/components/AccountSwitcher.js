import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert } from '../utils/alert';
import {
  beginAddAccount,
  getSignedInAccounts,
  MAX_ACCOUNTS,
  signOutAccount,
  switchAccount,
} from '../services/accountService';
import { goHome } from '../services/userService';
import { Avatar } from './ui';
import { toBnDigits } from '../utils/helpers';
import colors from '../constants/colors';
import { font, radius, spacing } from '../constants/theme';

const roleLabel = (role) => (role === 'collector' ? 'সংগ্রাহক' : role === 'household' ? 'পরিবার' : 'প্রোফাইল অসম্পূর্ণ');

/**
 * Bottom sheet listing every account signed in on this device.
 * Tap an account to switch to it, or add another account (up to MAX_ACCOUNTS).
 */
export default function AccountSwitcher({ visible, onClose, navigation }) {
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busySlot, setBusySlot] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setAccounts(await getSignedInAccounts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) load();
  }, [visible]);

  const handleSwitch = async (account) => {
    if (account.active) {
      onClose();
      return;
    }
    setBusySlot(account.slot);
    try {
      await switchAccount(account.slot);
      onClose();
      if (account.role) goHome(navigation, account.role);
      else navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } finally {
      setBusySlot(null);
    }
  };

  const handleAdd = async () => {
    const result = await beginAddAccount();
    if (!result) {
      Alert.alert('সর্বোচ্চ অ্যাকাউন্ট', `একসাথে সর্বোচ্চ ${toBnDigits(MAX_ACCOUNTS)}টি অ্যাকাউন্টে লগইন থাকা যায়। নতুন যোগ করতে একটি থেকে লগআউট করুন।`);
      return;
    }
    onClose();
    navigation.push('Login', { addingAccount: true, previousSlot: result.previous });
  };

  const handleSignOut = (account) =>
    Alert.alert('লগআউট', `${account.name} অ্যাকাউন্ট থেকে লগআউট করবেন?`, [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'লগআউট',
        style: 'destructive',
        onPress: async () => {
          await signOutAccount(account.slot).catch(() => {});
          load();
        },
      },
    ]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>অ্যাকাউন্ট</Text>
          <Text style={styles.subtitle}>
            এই ডিভাইসে একসাথে সর্বোচ্চ {toBnDigits(MAX_ACCOUNTS)}টি অ্যাকাউন্টে লগইন রাখা যায়
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xxl }} />
          ) : (
            accounts.map((account) => (
              <TouchableOpacity
                key={account.slot}
                style={[styles.row, account.active && styles.rowActive]}
                onPress={() => handleSwitch(account)}
                disabled={!!busySlot}
              >
                <Avatar
                  name={account.name}
                  size={46}
                  bg={account.role === 'collector' ? colors.accentSoft : colors.primarySoft}
                  color={account.role === 'collector' ? colors.accent : colors.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{account.name}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {roleLabel(account.role)} • {account.email}
                  </Text>
                </View>
                {busySlot === account.slot ? (
                  <ActivityIndicator color={colors.primary} />
                ) : account.active ? (
                  <View style={styles.activeBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={styles.activeText}>চালু</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => handleSignOut(account)} hitSlop={10} accessibilityLabel="লগআউট">
                    <Ionicons name="log-out-outline" size={20} color={colors.textLight} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))
          )}

          {!loading && accounts.length < MAX_ACCOUNTS ? (
            <TouchableOpacity style={styles.addRow} onPress={handleAdd}>
              <View style={styles.addIcon}>
                <Ionicons name="person-add-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.addText}>আরেকটি অ্যাকাউন্ট যোগ করুন</Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    padding: spacing.xl,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.lg },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: font.sm, color: colors.textGray, marginTop: 4, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  name: { fontSize: font.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.sm - 1, color: colors.textGray, marginTop: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeText: { fontSize: font.sm, fontWeight: '700', color: colors.primary },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryLight,
    marginTop: spacing.xs,
  },
  addIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: font.md, fontWeight: '700', color: colors.primary },
});

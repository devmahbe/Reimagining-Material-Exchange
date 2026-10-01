import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../config/firebase';
import { getConversations } from '../services/chatService';
import { getUserProfile } from '../services/userService';
import { navItemsForRole } from '../navigation/navItems';
import { AppHeader, Avatar, BottomNav, Chip, EmptyState, LoadingView } from '../components/ui';
import { getTimeAgo, toBnDigits } from '../utils/helpers';
import colors from '../constants/colors';
import { font, radius, spacing } from '../constants/theme';

const FILTERS = [
  { key: 'all', label: 'সব' },
  { key: 'unread', label: 'অপঠিত' },
  { key: 'household', label: 'পরিবার' },
  { key: 'collector', label: 'সংগ্রাহক' },
];

export default function MessagesScreen({ navigation }) {
  const [role, setRole] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      setError(false);
      const [me, convs] = await Promise.all([getUserProfile(uid).catch(() => null), getConversations(uid)]);
      setRole(me?.role || null);
      // Resolve the other person's name and role
      const withUsers = await Promise.all(
        convs.map(async (c) => {
          const other = await getUserProfile(c.otherUserId).catch(() => null);
          return { ...c, name: other?.name || 'অজানা ব্যবহারকারী', userRole: other?.role || 'unknown' };
        })
      );
      setConversations(withUsers);
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

  const term = search.trim().toLowerCase();
  const visible = conversations.filter((c) => {
    if (term && !c.name.toLowerCase().includes(term) && !(c.lastMessage || '').toLowerCase().includes(term)) return false;
    if (filter === 'unread') return c.unreadCount > 0;
    if (filter === 'household' || filter === 'collector') return c.userRole === filter;
    return true;
  });
  const unreadTotal = conversations.reduce((s, c) => s + c.unreadCount, 0);

  const renderItem = ({ item }) => {
    const unread = item.unreadCount > 0;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('ChatScreen', { recipientId: item.otherUserId, recipientName: item.name })}
      >
        <View>
          <Avatar name={item.name} size={50} bg={item.userRole === 'collector' ? colors.accentSoft : colors.primarySoft} color={item.userRole === 'collector' ? colors.accent : colors.primary} />
          <View style={styles.roleDot}>
            <Ionicons name={item.userRole === 'collector' ? 'bicycle' : 'home'} size={10} color={colors.white} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowHead}>
            <Text style={[styles.name, unread && styles.bold]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.time, unread && { color: colors.primary }]}>{getTimeAgo(item.time)}</Text>
          </View>
          <View style={styles.rowHead}>
            <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
              {item.lastFromMe ? 'আপনি: ' : ''}{item.lastMessage}
            </Text>
            {unread ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{toBnDigits(item.unreadCount)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="বার্তা"
        subtitle={unreadTotal ? `${toBnDigits(unreadTotal)}টি অপঠিত বার্তা` : 'আপনার সব কথোপকথন'}
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      >
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="নাম বা বার্তা খুঁজুন..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </AppHeader>

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.conversationId}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={styles.filters}>
              {FILTERS.map((f) => (
                <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
              ))}
            </View>
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={
            error ? (
              <EmptyState icon="cloud-offline-outline" title="বার্তা লোড করা যায়নি" message="ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন" actionLabel="আবার চেষ্টা" onAction={load} />
            ) : (
              <EmptyState
                icon="chatbubbles-outline"
                title={search || filter !== 'all' ? 'কিছু পাওয়া যায়নি' : 'কোনো বার্তা নেই'}
                message="পিকআপ গ্রহণ হলে পরিবার ও সংগ্রাহক একে অপরকে বার্তা পাঠাতে পারবেন"
              />
            )
          }
        />
      )}

      {role ? <BottomNav items={navItemsForRole(role, navigation, unreadTotal)} active="messages" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
    marginTop: spacing.lg,
  },
  searchInput: { flex: 1, fontSize: font.md, color: colors.text, paddingVertical: spacing.sm },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  list: { padding: spacing.lg, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  sep: { height: spacing.sm },
  roleDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { flex: 1, fontSize: font.md + 1, fontWeight: '600', color: colors.text },
  bold: { fontWeight: '800' },
  time: { fontSize: font.xs + 1, color: colors.textLight },
  preview: { flex: 1, fontSize: font.sm + 1, color: colors.textGray, marginTop: 3 },
  previewUnread: { color: colors.text, fontWeight: '600' },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  unreadText: { color: colors.white, fontSize: font.xs, fontWeight: '800' },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import { Alert } from '../utils/alert';
import { getConversationId, sendMessage, subscribeToConversation } from '../services/chatService';
import { getUserProfile } from '../services/userService';
import { AppHeader, Avatar, EmptyState, LoadingView } from '../components/ui';
import { formatDateBangla, formatTimeBangla, isSameDay, toDate } from '../utils/helpers';
import colors from '../constants/colors';
import { font, radius, spacing } from '../constants/theme';

const QUICK_REPLIES = ['আসসালামু আলাইকুম', 'আমি রওনা দিয়েছি', 'কখন আসবেন?', 'ধন্যবাদ!'];

export default function ChatScreen({ navigation, route }) {
  const { recipientId, recipientName, requestId } = route.params;
  const insets = useSafeAreaInsets();
  const uid = auth.currentUser?.uid;
  const conversationId = uid ? getConversationId(uid, recipientId) : null;
  const listRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState(null);

  useEffect(() => {
    if (!conversationId) return undefined;
    const unsubscribe = subscribeToConversation(
      conversationId,
      uid,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      () => {
        setError(true);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [conversationId, uid]);

  useEffect(() => {
    getUserProfile(recipientId).then(setRecipient).catch(() => {});
  }, [recipientId]);

  const handleSend = async (value = text) => {
    const body = value.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await sendMessage({ senderId: uid, recipientId, text: body, requestId });
      if (value === text) setText('');
    } catch (e) {
      Alert.alert('বার্তা পাঠানো যায়নি', 'ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন');
    } finally {
      setSending(false);
    }
  };

  const scrollToEnd = () => listRef.current?.scrollToEnd({ animated: true });

  const renderItem = ({ item, index }) => {
    const mine = item.senderId === uid;
    const date = toDate(item.createdAt);
    const prev = index > 0 ? toDate(messages[index - 1].createdAt) : null;
    const showDate = date && (!prev || !isSameDay(prev, date));
    return (
      <View>
        {showDate ? (
          <View style={styles.dateSep}>
            <Text style={styles.dateText}>{isSameDay(date, new Date()) ? 'আজ' : formatDateBangla(date, { short: true })}</Text>
          </View>
        ) : null}
        <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.msgText, mine && { color: colors.white }]}>{item.text}</Text>
            <View style={styles.metaRow}>
              <Text style={[styles.msgTime, mine && { color: 'rgba(255,255,255,0.75)' }]}>{formatTimeBangla(date)}</Text>
              {mine ? (
                <Ionicons name={item.read ? 'checkmark-done' : 'checkmark'} size={14} color={item.read ? '#A7F3D0' : 'rgba(255,255,255,0.75)'} />
              ) : null}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const phone = recipient?.phone;

  return (
    <View style={styles.container}>
      <AppHeader
        title={recipient?.name || recipientName || 'কথোপকথন'}
        subtitle={recipient?.role === 'collector' ? 'সংগ্রাহক' : recipient?.role === 'household' ? 'পরিবার' : 'ভাঙ্গারি এক্সচেঞ্জ ব্যবহারকারী'}
        onBack={() => navigation.goBack()}
        right={<Avatar name={recipient?.name || recipientName} size={40} bg="rgba(255,255,255,0.2)" color={colors.white} />}
      />

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {loading ? (
          <LoadingView />
        ) : error ? (
          <EmptyState icon="cloud-offline-outline" title="বার্তা লোড করা যায়নি" message="ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন" />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            onContentSizeChange={scrollToEnd}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <EmptyState
                icon="chatbubble-ellipses-outline"
                title="কথোপকথন শুরু করুন"
                message={`${recipient?.name || recipientName || ''} কে প্রথম বার্তা পাঠান`}
              />
            }
          />
        )}

        {messages.length === 0 && !loading && !error ? (
          <View style={styles.quickRow}>
            {QUICK_REPLIES.map((q) => (
              <TouchableOpacity key={q} style={styles.quick} onPress={() => handleSend(q)}>
                <Text style={styles.quickText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          {phone ? (
            <TouchableOpacity
              style={styles.sideBtn}
              onPress={() => Linking.openURL(`tel:${phone}`).catch(() => {})}
              accessibilityLabel="কল করুন"
            >
              <Ionicons name="call-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="বার্তা লিখুন..."
            placeholderTextColor={colors.textLight}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
            onPress={() => handleSend()}
            disabled={!text.trim() || sending}
            accessibilityLabel="পাঠান"
          >
            {sending ? <ActivityIndicator color={colors.white} size="small" /> : <Ionicons name="send" size={20} color={colors.white} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, flexGrow: 1 },
  dateSep: { alignItems: 'center', marginVertical: spacing.md },
  dateText: {
    fontSize: font.xs + 1,
    color: colors.textGray,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.white, borderBottomLeftRadius: 4 },
  msgText: { fontSize: font.md, color: colors.text, lineHeight: 21 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  msgTime: { fontSize: font.xs, color: colors.textLight },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  quick: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.primarySoft },
  quickText: { color: colors.primary, fontSize: font.sm, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sideBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.background,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: font.md,
    color: colors.text,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { backgroundColor: colors.textLight },
});

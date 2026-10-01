import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toDate } from '../utils/helpers';

// Resolved on every call so it always uses the active account's connection
const messagesRef = () => collection(db, 'messages');

export const getConversationId = (uidA, uidB) => [uidA, uidB].sort().join('_');

const byOldest = (a, b) => (toDate(a.createdAt)?.getTime() || 0) - (toDate(b.createdAt)?.getTime() || 0);

/**
 * Listen to a conversation. Security rules only allow reading messages you
 * sent or received, so we run two queries that the rules can verify
 * (sent + received) and merge them on the client.
 */
export const subscribeToConversation = (conversationId, uid, onMessages, onError) => {
  let sent = [];
  let received = [];
  const emit = () => onMessages([...sent, ...received].sort(byOldest));

  const unsubSent = onSnapshot(
    query(messagesRef(), where('conversationId', '==', conversationId), where('senderId', '==', uid)),
    (snap) => {
      sent = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    onError
  );
  const unsubReceived = onSnapshot(
    query(messagesRef(), where('conversationId', '==', conversationId), where('recipientId', '==', uid)),
    (snap) => {
      received = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
      // Mark incoming unread messages as read
      snap.docs
        .filter((d) => d.data().read === false)
        .forEach((d) => updateDoc(d.ref, { read: true }).catch(() => {}));
    },
    onError
  );

  return () => {
    unsubSent();
    unsubReceived();
  };
};

export const sendMessage = ({ senderId, recipientId, text, requestId }) =>
  addDoc(messagesRef(), {
    conversationId: getConversationId(senderId, recipientId),
    senderId,
    recipientId,
    text: text.trim(),
    requestId: requestId || null,
    createdAt: new Date().toISOString(),
    read: false,
  });

/** Build the conversation list for a user from messages they sent/received */
export const getConversations = async (uid) => {
  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(query(messagesRef(), where('senderId', '==', uid))),
    getDocs(query(messagesRef(), where('recipientId', '==', uid))),
  ]);

  const convMap = new Map();
  const unread = {};
  const process = (snap) => {
    snap.forEach((d) => {
      const msg = d.data();
      const otherUserId = msg.senderId === uid ? msg.recipientId : msg.senderId;
      const time = toDate(msg.createdAt)?.getTime() || 0;
      const existing = convMap.get(msg.conversationId);
      if (!existing || time > existing.time) {
        convMap.set(msg.conversationId, {
          conversationId: msg.conversationId,
          otherUserId,
          lastMessage: msg.text,
          lastFromMe: msg.senderId === uid,
          time,
        });
      }
      if (msg.recipientId === uid && msg.read === false) {
        unread[msg.conversationId] = (unread[msg.conversationId] || 0) + 1;
      }
    });
  };
  process(sentSnap);
  process(receivedSnap);

  return Array.from(convMap.values())
    .map((c) => ({ ...c, unreadCount: unread[c.conversationId] || 0 }))
    .sort((a, b) => b.time - a.time);
};

export const getUnreadCount = async (uid) => {
  const snap = await getDocs(query(messagesRef(), where('recipientId', '==', uid), where('read', '==', false)));
  return snap.size;
};

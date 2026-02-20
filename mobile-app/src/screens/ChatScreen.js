import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import colors from '../constants/colors';

export default function ChatScreen({ navigation, route }) {
  const { recipientId, recipientName, requestId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef();
  const currentUser = auth.currentUser;

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    // Create conversation ID (sorted to ensure consistency)
    const conversationId = [currentUser.uid, recipientId].sort().join('_');

    // Real-time listener for messages
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
      setLoading(false);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return unsubscribe;
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const conversationId = [currentUser.uid, recipientId].sort().join('_');
    
    try {
      await addDoc(collection(db, 'messages'), {
        conversationId,
        senderId: currentUser.uid,
        recipientId,
        text: newMessage.trim(),
        requestId: requestId || null,
        createdAt: new Date().toISOString(),
        read: false,
      });

      setNewMessage('');
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.log('Error sending message:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← ফিরুন</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {recipientName?.charAt(0) || '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>{recipientName}</Text>
            <Text style={styles.headerStatus}>অনলাইন</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.headerIcon}>ℹ️</Text>
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
          ) : messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>কথোপকথন শুরু করুন</Text>
              <Text style={styles.emptySubtext}>
                {recipientName} কে আপনার প্রথম মেসেজ পাঠান
              </Text>
            </View>
          ) : (
            messages.map((msg, index) => {
              const isMyMessage = msg.senderId === currentUser.uid;
              const showDate = index === 0 || 
                new Date(messages[index - 1].createdAt).toDateString() !== 
                new Date(msg.createdAt).toDateString();

              return (
                <View key={msg.id}>
                  {showDate && (
                    <View style={styles.dateSeparator}>
                      <Text style={styles.dateText}>
                        {new Date(msg.createdAt).toLocaleDateString('bn-BD', {
                          day: 'numeric',
                          month: 'long',
                        })}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageContainer,
                      isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isMyMessage ? styles.myMessage : styles.theirMessage,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isMyMessage ? styles.myMessageText : styles.theirMessageText,
                        ]}
                      >
                        {msg.text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
                        ]}
                      >
                        {formatTime(msg.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="মেসেজ লিখুন..."
            placeholderTextColor={colors.textLight}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <LinearGradient
              colors={newMessage.trim() ? [colors.primary, colors.primaryLight] : ['#ccc', '#ccc']}
              style={styles.sendButtonGradient}
            >
              <Text style={styles.sendIcon}>✈️</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 10,
  },
  backButton: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerIcon: {
    fontSize: 20,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textGray,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: 'center',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: colors.textGray,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attachIcon: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 20,
  },
});

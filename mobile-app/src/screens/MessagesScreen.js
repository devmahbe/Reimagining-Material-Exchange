import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, orderBy, addDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import colors from '../constants/colors';

export default function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      // Mock conversations for now - in real app, query from Firestore
      const mockConversations = [
        {
          id: '1',
          name: 'রহিম সংগ্রাহক',
          lastMessage: 'আমি ১০ মিনিটে পৌঁছাবো',
          timestamp: new Date(Date.now() - 300000), // 5 min ago
          unreadCount: 2,
          userType: 'collector',
          avatar: '👷',
        },
        {
          id: '2',
          name: 'করিম পরিবার',
          lastMessage: 'ধন্যবাদ, আগামীকাল ঠিক আছে',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          unreadCount: 0,
          userType: 'household',
          avatar: '🏠',
        },
        {
          id: '3',
          name: 'সাপোর্ট টিম',
          lastMessage: 'আপনার অনুরোধটি প্রক্রিয়াধীন আছে',
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          unreadCount: 0,
          userType: 'support',
          avatar: '💬',
        },
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.log('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'এখন';
    if (minutes < 60) return `${minutes} মিনিট আগে`;
    if (hours < 24) return `${hours} ঘন্টা আগে`;
    if (days === 1) return 'গতকাল';
    return `${days} দিন আগে`;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← ফিরুন</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>বার্তা</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.headerIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="খুঁজুন..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      {/* Conversations List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>কোন বার্তা নেই</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'কোন ফলাফল পাওয়া যায়নি' : 'নতুন বার্তা শুরু করুন'}
            </Text>
          </View>
        ) : (
          filteredConversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationCard}
              onPress={() => navigation.navigate('ChatScreen', { 
                recipientId: conversation.id,
                recipientName: conversation.name
              })}
            >
              <View style={styles.avatarContainer}>
                <Text style={styles.avatar}>{conversation.avatar}</Text>
                {conversation.unreadCount > 0 && (
                  <View style={styles.onlineBadge} />
                )}
              </View>

              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>{conversation.name}</Text>
                  <Text style={styles.timestamp}>
                    {formatTimestamp(conversation.timestamp)}
                  </Text>
                </View>

                <View style={styles.messagePreview}>
                  <Text
                    style={[
                      styles.lastMessage,
                      conversation.unreadCount > 0 && styles.unreadMessage
                    ]}
                    numberOfLines={1}
                  >
                    {conversation.lastMessage}
                  </Text>
                  {conversation.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>{conversation.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <Text style={styles.quickActionIcon}>🏠</Text>
          <Text style={styles.quickActionLabel}>পরিবার</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Text style={styles.quickActionIcon}>👷</Text>
          <Text style={styles.quickActionLabel}>সংগ্রাহক</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Text style={styles.quickActionIcon}>❓</Text>
          <Text style={styles.quickActionLabel}>সাপোর্ট</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCream,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  headerIcon: {
    fontSize: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: 'white',
  },
  content: {
    flex: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    fontSize: 40,
    width: 55,
    height: 55,
    backgroundColor: colors.bgCream,
    borderRadius: 28,
    textAlign: 'center',
    lineHeight: 55,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    backgroundColor: '#4CAF50',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textLight,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.textGray,
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.textDark,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  quickActionLabel: {
    fontSize: 11,
    color: colors.textGray,
    fontWeight: '500',
  },
});

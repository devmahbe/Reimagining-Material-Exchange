import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../constants/colors';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    // Mock notifications - in real app, fetch from Firestore
    const mockNotifications = [
      {
        id: '1',
        type: 'pickup_accepted',
        title: 'পিকআপ গৃহীত হয়েছে',
        message: 'রহিম সংগ্রাহক আপনার পিকআপ অনুরোধটি গ্রহণ করেছেন',
        timestamp: new Date(Date.now() - 600000), // 10 min ago
        read: false,
        icon: '✅',
        color: '#4CAF50',
      },
      {
        id: '2',
        type: 'pickup_completed',
        title: 'পিকআপ সম্পন্ন',
        message: 'আপনার ১৫ জানুয়ারির পিকআপ সফলভাবে সম্পন্ন হয়েছে। মোট: ৳২৫০',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        read: false,
        icon: '✓',
        color: '#4CAF50',
      },
      {
        id: '3',
        type: 'price_update',
        title: 'দাম আপডেট',
        message: 'প্লাস্টিক বোতলের দাম বেড়েছে: এখন ৳২০-২৫/কেজি',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        read: true,
        icon: '📈',
        color: '#FF9800',
      },
      {
        id: '4',
        type: 'payment',
        title: 'পেমেন্ট সফল',
        message: 'আপনার ওয়ালেটে ৳২৫০ যোগ হয়েছে',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        read: true,
        icon: '💰',
        color: '#2196F3',
      },
      {
        id: '5',
        type: 'reminder',
        title: 'পিকআপ রিমাইন্ডার',
        message: 'আগামীকাল সকাল ১০:০০ এ আপনার পিকআপ নির্ধারিত আছে',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        read: true,
        icon: '⏰',
        color: '#9C27B0',
      },
      {
        id: '6',
        type: 'new_feature',
        title: 'নতুন ফিচার',
        message: 'এখন আপনি সরাসরি অ্যাপ থেকে সংগ্রাহকদের রেটিং দিতে পারবেন',
        timestamp: new Date(Date.now() - 259200000), // 3 days ago
        read: true,
        icon: '🎉',
        color: '#E91E63',
      },
      {
        id: '7',
        type: 'system',
        title: 'সিস্টেম মেইনটেন্যান্স',
        message: 'আগামী রবিবার রাত ২:00 থেকে ৪:00 পর্যন্ত সিস্টেম আপডেট হবে',
        timestamp: new Date(Date.now() - 345600000), // 4 days ago
        read: true,
        icon: '🔧',
        color: '#607D8B',
      },
    ];

    setNotifications(mockNotifications);
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
    if (days < 7) return `${days} দিন আগে`;
    return timestamp.toLocaleDateString('bn-BD');
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

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
        <Text style={styles.headerTitle}>বিজ্ঞপ্তি</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>সব পড়া হয়েছে</Text>
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={{ width: 60 }} />}
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            সব ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
            নতুন ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>কোন বিজ্ঞপ্তি নেই</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'unread' ? 'সব বিজ্ঞপ্তি পড়া হয়ে গেছে' : 'নতুন বিজ্ঞপ্তি এখানে দেখাবে'}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.notificationCardUnread
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View style={[styles.iconContainer, { backgroundColor: notification.color + '20' }]}>
                <Text style={styles.notificationIcon}>{notification.icon}</Text>
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>
                  {formatTimestamp(notification.timestamp)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteNotification(notification.id)}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
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
  markAllRead: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textGray,
  },
  filterTabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationCardUnread: {
    backgroundColor: '#F1F8E9',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIcon: {
    fontSize: 22,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.textGray,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: colors.textLight,
  },
  deleteButton: {
    padding: 5,
  },
  deleteIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
    opacity: 0.5,
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
});

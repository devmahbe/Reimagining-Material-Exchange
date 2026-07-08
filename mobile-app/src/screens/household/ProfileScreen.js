import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import colors from '../../constants/colors';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ totalRequests: 0, totalEarnings: 0, completedPickups: 0 });
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setEditName(data.name || '');
        setEditPhone(data.phone || '');
        setEditAddress(data.address || '');
      }

      // Load stats from pickupRequests
      const requestsSnap = await getDocs(query(
        collection(db, 'pickupRequests'),
        where('userId', '==', user.uid)
      ));
      const allRequests = requestsSnap.docs.map(d => d.data());
      const completed = allRequests.filter(r => r.status === 'completed');
      const totalEarnings = completed.reduce(
        (sum, r) => sum + (r.actualEarnings || r.estimatedEarnings || 0), 0
      );

      setStats({
        totalRequests: allRequests.length,
        completedPickups: completed.length,
        totalEarnings,
      });
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('ত্রুটি', 'নাম খালি রাখা যাবে না');
      return;
    }
    setSaving(true);
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, 'users', user.uid), {
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
      });
      setUserData(prev => ({ ...prev, name: editName.trim(), phone: editPhone.trim(), address: editAddress.trim() }));
      setEditModal(false);
      Alert.alert('সফল ✅', 'প্রোফাইল আপডেট হয়েছে');
    } catch (error) {
      Alert.alert('ত্রুটি', 'প্রোফাইল আপডেট ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    Alert.prompt(
      'পাসওয়ার্ড পরিবর্তন',
      'নতুন পাসওয়ার্ড লিখুন (কমপক্ষে ৬ অক্ষর)',
      async (newPass) => {
        if (!newPass || newPass.length < 6) {
          Alert.alert('ত্রুটি', 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন');
          return;
        }
        try {
          await updatePassword(auth.currentUser, newPass);
          Alert.alert('সফল ✅', 'পাসওয়ার্ড পরিবর্তন হয়েছে');
        } catch (error) {
          if (error.code === 'auth/requires-recent-login') {
            Alert.alert('পুনরায় লগইন', 'নিরাপত্তার জন্য আবার লগইন করুন তারপর পাসওয়ার্ড পরিবর্তন করুন');
          } else {
            Alert.alert('ত্রুটি', 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে');
          }
        }
      },
      'secure-text'
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'লগআউট',
      'আপনি কি নিশ্চিত যে আপনি লগআউট করতে চান?',
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'হ্যাঁ, লগআউট',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('ত্রুটি', 'লগআউট করা যায়নি');
            }
          }
        }
      ]
    );
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
        <Text style={styles.headerTitle}>প্রোফাইল</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData?.name?.charAt(0).toUpperCase() || '👤'}
            </Text>
          </View>
          <Text style={styles.profileName}>{userData?.name || 'ব্যবহারকারী'}</Text>
          <Text style={styles.profileEmail}>{userData?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {userData?.role === 'household' ? '🏠 পরিবার' : '👷 সংগ্রাহক'}
            </Text>
          </View>
        </View>

        {/* Edit Profile Modal */}
        <Modal visible={editModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>প্রোফাইল সম্পাদনা</Text>

              <Text style={styles.inputLabel}>নাম</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="আপনার নাম"
                placeholderTextColor={colors.textLight}
              />

              <Text style={styles.inputLabel}>ফোন নম্বর</Text>
              <TextInput
                style={styles.modalInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="01XXXXXXXXX"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>ঠিকানা</Text>
              <TextInput
                style={[styles.modalInput, { height: 70 }]}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="আপনার ঠিকানা"
                placeholderTextColor={colors.textLight}
                multiline
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setEditModal(false)}
                >
                  <Text style={styles.modalCancelText}>বাতিল</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  <Text style={styles.modalSaveText}>{saving ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalRequests}</Text>
            <Text style={styles.statLabel}>মোট অনুরোধ</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completedPickups}</Text>
            <Text style={styles.statLabel}>সম্পন্ন</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>৳{stats.totalEarnings}</Text>
            <Text style={styles.statLabel}>মোট আয়</Text>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setEditModal(true)}>
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={styles.menuText}>ব্যক্তিগত তথ্য সম্পাদনা</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>পাসওয়ার্ড পরিবর্তন</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.menuIcon}>📜</Text>
            <Text style={styles.menuText}>লেনদেনের ইতিহাস</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('PriceList')}
          >
            <Text style={styles.menuIcon}>💰</Text>
            <Text style={styles.menuText}>মূল্য তালিকা</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('ভাষা', 'বর্তমানে শুধু বাংলা ভাষা সমর্থিত। ভবিষ্যতে ইংরেজি যোগ হবে।')}
          >
            <Text style={styles.menuIcon}>🌐</Text>
            <Text style={styles.menuText}>ভাষা পরিবর্তন</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('সাপোর্ট', 'ইমেইল: support@bhangari.com\nফোন: 01700-000000\nসময়: সকাল ৯টা - রাত ৯টা')}
          >
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>সহায়তা ও সাপোর্ট</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('শর্তাবলী', 'ভাঙ্গারি এক্সচেঞ্জ ব্যবহার করে আপনি আমাদের শর্তাবলী মেনে নিচ্ছেন। বিস্তারিত জানতে ওয়েবসাইট ভিজিট করুন।')}
          >
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>শর্তাবলী ও নীতিমালা</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>ভাঙ্গারি এক্সচেঞ্জ v1.0.0</Text>
          <Text style={styles.appInfoText}>দল: Doctor Strange | বিভাগ: B</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 লগআউট</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: colors.bgCream,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textGray,
    textAlign: 'center',
  },
  menuSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 18,
    color: colors.textLight,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  appInfoText: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textGray,
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: colors.textDark,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textGray,
  },
  modalSaveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  logoutButton: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
});

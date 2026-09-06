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
import { Ionicons } from '@expo/vector-icons';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import colors from '../../constants/colors';

function MenuItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={menuItemStyles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.primary} style={menuItemStyles.icon} />
      <Text style={menuItemStyles.label}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

const menuItemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  icon: { marginRight: 14, width: 24, textAlign: 'center' },
  label: { flex: 1, fontSize: 15, color: colors.textDark, fontWeight: '500' },
});

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ totalRequests: 0, totalEarnings: 0, completedPickups: 0 });
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

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
    setNewPw('');
    setPwModal(true);
  };

  const handleSavePassword = async () => {
    if (!newPw || newPw.length < 6) {
      Alert.alert('ত্রুটি', 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন');
      return;
    }
    setPwSaving(true);
    try {
      await updatePassword(auth.currentUser, newPw);
      setPwModal(false);
      setNewPw('');
      Alert.alert('সফল ✅', 'পাসওয়ার্ড পরিবর্তন হয়েছে');
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert('পুনরায় লগইন', 'নিরাপত্তার জন্য আবার লগইন করুন, তারপর পাসওয়ার্ড পরিবর্তন করুন');
      } else {
        Alert.alert('ত্রুটি', 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে');
      }
    } finally {
      setPwSaving(false);
    }
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
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>প্রোফাইল</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {userData?.name ? (
              <Text style={styles.avatarText}>{userData.name.charAt(0).toUpperCase()}</Text>
            ) : (
              <Ionicons name="person" size={36} color="white" />
            )}
          </View>
          <Text style={styles.profileName}>{userData?.name || 'ব্যবহারকারী'}</Text>
          <Text style={styles.profileEmail}>{userData?.email}</Text>
          <View style={styles.roleBadge}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons
                name={userData?.role === 'household' ? 'home-outline' : 'construct-outline'}
                size={14}
                color={colors.primary}
              />
              <Text style={styles.roleText}>
                {userData?.role === 'household' ? 'পরিবার ব্যবহারকারী' : 'সংগ্রাহক'}
              </Text>
            </View>
          </View>
        </View>

        {/* Change Password Modal */}
        <Modal visible={pwModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>পাসওয়ার্ড পরিবর্তন</Text>
              <Text style={styles.inputLabel}>নতুন পাসওয়ার্ড</Text>
              <TextInput
                style={styles.modalInput}
                value={newPw}
                onChangeText={setNewPw}
                placeholder="কমপক্ষে ৬ অক্ষর"
                placeholderTextColor={colors.textLight}
                secureTextEntry
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setPwModal(false)}
                >
                  <Text style={styles.modalCancelText}>বাতিল</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSavePassword}
                  disabled={pwSaving}
                >
                  <Text style={styles.modalSaveText}>
                    {pwSaving ? 'সংরক্ষণ...' : 'পরিবর্তন করুন'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
          <MenuItem icon="person-outline" label="ব্যক্তিগত তথ্য সম্পাদনা" onPress={() => setEditModal(true)} />
          <MenuItem icon="lock-closed-outline" label="পাসওয়ার্ড পরিবর্তন" onPress={handleChangePassword} />
          <MenuItem icon="time-outline" label="লেনদেনের ইতিহাস" onPress={() => navigation.navigate('History')} />
          <MenuItem icon="cash-outline" label="মূল্য তালিকা" onPress={() => navigation.navigate('PriceList')} />
          <MenuItem icon="globe-outline" label="ভাষা পরিবর্তন" onPress={() => Alert.alert('ভাষা', 'বর্তমানে শুধু বাংলা ভাষা সমর্থিত।')} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('সাপোর্ট', 'ইমেইল: support@bhangari.com\nফোন: 01700-000000\nসময়: সকাল ৯টা - রাত ৯টা')}
          >
            <Ionicons name="help-circle-outline" size={22} color={colors.textGray} style={styles.menuIcon} />
            <Text style={styles.menuText}>সহায়তা ও সাপোর্ট</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
          <MenuItem icon="document-text-outline" label="শর্তাবলী ও নীতিমালা" onPress={() => Alert.alert('শর্তাবলী', 'ভাঙ্গারি এক্সচেঞ্জ ব্যবহার করে আপনি আমাদের শর্তাবলী মেনে নিচ্ছেন।')} />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>ভাঙ্গারি এক্সচেঞ্জ v1.0.0</Text>
          <Text style={styles.appInfoText}>দল: Doctor Strange | বিভাগ: B</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>লগআউট</Text>
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
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
});


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import colors from '../../constants/colors';
import banglaText from '../../constants/banglaText';

const CATEGORIES = [
  { id: 1, name: banglaText.paper,       icon: 'newspaper-outline',      price: '৳৮–১২', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 2, name: banglaText.plastic,     icon: 'cube-outline',            price: '৳১৫–২৫', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 3, name: banglaText.metal,       icon: 'construct-outline',       price: '৳৪০–৬০', color: '#6B7280', bg: '#F9FAFB' },
  { id: 4, name: banglaText.glass,       icon: 'wine-outline',            price: '৳৫–১০',  color: '#06B6D4', bg: '#ECFEFF' },
  { id: 5, name: banglaText.electronics, icon: 'phone-portrait-outline',  price: '৳৫০+',   color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 6, name: banglaText.clothes,     icon: 'shirt-outline',           price: '৳১০–২০', color: '#EC4899', bg: '#FDF2F8' },
];

export default function HouseholdHomeScreen({ navigation }) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getDoc(doc(db, 'users', user.uid))
      .then(snap => { if (snap.exists()) setUserName(snap.data().name || ''); })
      .catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* ── Header ── */}
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>স্বাগতম{userName ? `, ${userName}` : '!'}</Text>
          <Text style={styles.headerSub}>আজই পুনর্ব্যবহারযোগ্য সামগ্রী বিক্রয় করুন</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAvatarBtn} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* ── Hero action ── */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => navigation.navigate('MaterialSelection')}
          activeOpacity={0.9}
        >
          <LinearGradient colors={[colors.accent, colors.accentLight]} style={styles.heroGradient}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>পিকআপ অনুরোধ করুন</Text>
              <Text style={styles.heroSub}>আপনার দরজায় থেকে সামগ্রী সংগ্রহ</Text>
            </View>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="recycle" size={40} color="rgba(255,255,255,0.9)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Quick actions ── */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('PriceList')}>
            <View style={[styles.quickIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="cash-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>আজকের দর</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('MaterialSelection')}>
            <View style={[styles.quickIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar-outline" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.quickLabel}>সময় নির্ধারণ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('History')}>
            <View style={[styles.quickIconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="time-outline" size={22} color={colors.accent} />
            </View>
            <Text style={styles.quickLabel}>ইতিহাস</Text>
          </TouchableOpacity>
        </View>

        {/* ── Materials today ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>আজকের মূল্য তালিকা</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PriceList')}>
            <Text style={styles.seeAll}>সব দেখুন →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => navigation.navigate('MaterialSelection')}
            >
              <View style={[styles.catIconBox, { backgroundColor: cat.bg }]}>
                <Ionicons name={cat.icon} size={26} color={cat.color} />
              </View>
              <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
              <Text style={[styles.catPrice, { color: cat.color }]}>{cat.price}/কেজি</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View style={styles.bottomNav}>
        <NavItem icon="home" label="হোম" active onPress={() => {}} />
        <NavItem icon="chatbubbles-outline" label="বার্তা" onPress={() => navigation.navigate('Messages')} />
        <NavItem icon="time-outline" label="ইতিহাস" onPress={() => navigation.navigate('History')} />
        <NavItem icon="person-outline" label="প্রোফাইল" onPress={() => navigation.navigate('Profile')} />
      </View>
    </SafeAreaView>
  );
}

function NavItem({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons
        name={active ? icon.replace('-outline', '') : icon}
        size={24}
        color={active ? colors.primary : colors.textLight}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerLeft: { flex: 1 },
  headerGreeting: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },

  // Body
  body: { flex: 1, paddingHorizontal: 16 },

  // Hero card
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 14,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  heroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 22,
  },
  heroLeft: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  heroIcon: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  quickCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  quickIconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  quickLabel: { fontSize: 11, fontWeight: '600', color: colors.textBody, textAlign: 'center' },

  // Section header
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Category grid
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  categoryCard: {
    width: '30.5%',
    backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  catIconBox: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  catName: { fontSize: 12, fontWeight: '600', color: colors.textDark, marginBottom: 3, textAlign: 'center' },
  catPrice: { fontSize: 11, fontWeight: '700' },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingTop: 10, paddingBottom: 18,
    borderTopWidth: 1, borderTopColor: colors.border,
    justifyContent: 'space-around',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  navItem: { alignItems: 'center', flex: 1 },
  navLabel: { fontSize: 10, color: colors.textLight, marginTop: 4, fontWeight: '500' },
  navLabelActive: { color: colors.primary, fontWeight: '700' },
});

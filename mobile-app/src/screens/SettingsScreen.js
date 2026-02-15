import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import colors from '../constants/colors';

export default function SettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);

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
        <Text style={styles.headerTitle}>সেটিংস</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>বিজ্ঞপ্তি</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>পুশ বিজ্ঞপ্তি</Text>
                <Text style={styles.settingSubtitle}>অনুরোধ আপডেট পান</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔊</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>বিজ্ঞপ্তি সাউন্ড</Text>
                <Text style={styles.settingSubtitle}>নতুন বার্তায় শব্দ</Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={soundEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>অ্যাকাউন্ট</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>👤</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>প্রোফাইল সম্পাদনা</Text>
                <Text style={styles.settingSubtitle}>নাম, ঠিকানা, ফোন</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔒</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>পাসওয়ার্ড পরিবর্তন</Text>
                <Text style={styles.settingSubtitle}>নিরাপত্তা আপডেট</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>💳</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>পেমেন্ট পদ্ধতি</Text>
                <Text style={styles.settingSubtitle}>bKash, Rocket যোগ করুন</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>অ্যাপ পছন্দ</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🌐</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>ভাষা</Text>
                <Text style={styles.settingSubtitle}>বাংলা</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>📍</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>লোকেশন অ্যাক্সেস</Text>
                <Text style={styles.settingSubtitle}>নিকটবর্তী সংগ্রাহক খুঁজুন</Text>
              </View>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={locationEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🎨</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>থিম</Text>
                <Text style={styles.settingSubtitle}>লাইট মোড</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>সহায়তা</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>❓</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>সাহায্য কেন্দ্র</Text>
                <Text style={styles.settingSubtitle}>FAQ এবং গাইড</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>💬</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>আমাদের সাথে যোগাযোগ</Text>
                <Text style={styles.settingSubtitle}>সাপোর্ট টিম</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>⭐</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>অ্যাপ রেটিং দিন</Text>
                <Text style={styles.settingSubtitle}>Play Store এ রিভিউ</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>আইনি</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>📋</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>শর্তাবলী</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔐</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>গোপনীয়তা নীতি</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>সম্পর্কে</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>ℹ️</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>অ্যাপ ভার্সন</Text>
                <Text style={styles.settingSubtitle}>v1.0.0</Text>
              </View>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>👥</Text>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>ডেভেলপার</Text>
                <Text style={styles.settingSubtitle}>Team: Doctor Strange, Section B</Text>
              </View>
            </View>
          </View>
        </View>

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
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textGray,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginHorizontal: 20,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.textGray,
  },
  arrow: {
    fontSize: 18,
    color: colors.textLight,
    marginLeft: 10,
  },
});

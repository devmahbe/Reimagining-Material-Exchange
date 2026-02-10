import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../constants/colors';
import banglaText from '../../constants/banglaText';

export default function HouseholdHomeScreen({ navigation }) {
  const materialCategories = [
    { id: 1, name: banglaText.paper, icon: '📰', price: '৳৮-১২' },
    { id: 2, name: banglaText.plastic, icon: '🥤', price: '৳১৫-২৫' },
    { id: 3, name: banglaText.metal, icon: '🔧', price: '৳৪০-৬০' },
    { id: 4, name: banglaText.glass, icon: '🍾', price: '৳৫-১০' },
    { id: 5, name: banglaText.electronics, icon: '📱', price: '৳৫০+' },
    { id: 6, name: banglaText.clothes, icon: '👕', price: '৳১০-২০' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>{banglaText.welcome}!</Text>
            <Text style={styles.headerSubtitle}>পরিবার ব্যবহারকারী</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={styles.welcomeCard}
        >
          <Text style={styles.welcomeTitle}>{banglaText.welcomeMessage}</Text>
          <Text style={styles.welcomeSubtitle}>
            আজই আপনার পুনর্ব্যবহারযোগ্য সামগ্রী বিক্রয় করুন
          </Text>
        </LinearGradient>

        {/* Today's Prices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{banglaText.todaysPrices}</Text>
          <View style={styles.categoryGrid}>
            {materialCategories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryIconText}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryPrice}>{category.price}{banglaText.perKg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity style={styles.primaryButton}>
          <LinearGradient
            colors={[colors.secondary, colors.secondaryLight]}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>📦 {banglaText.requestPickup}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionCard}>
            <Text style={styles.quickActionIcon}>💰</Text>
            <Text style={styles.quickActionText}>{banglaText.viewPrices}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <Text style={styles.quickActionIcon}>📅</Text>
            <Text style={styles.quickActionText}>{banglaText.schedule}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <Text style={styles.quickActionIcon}>📜</Text>
            <Text style={styles.quickActionText}>{banglaText.history}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIconActive}>🏠</Text>
          <Text style={styles.navLabelActive}>হোম</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>💬</Text>
          <Text style={styles.navLabel}>{banglaText.messages}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📜</Text>
          <Text style={styles.navLabel}>{banglaText.history}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>{banglaText.profile}</Text>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  profileButton: {
    width: 45,
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  welcomeCard: {
    margin: 20,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 15,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    backgroundColor: colors.bgCream,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryPrice: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 11,
    color: colors.textDark,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
  },
  navIconActive: {
    fontSize: 24,
    marginBottom: 4,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  navLabelActive: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  navLabel: {
    fontSize: 11,
    color: colors.textLight,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import colors from '../../constants/colors';

const screenWidth = Dimensions.get('window').width;

export default function CollectorStatsScreen({ navigation }) {
  const [period, setPeriod] = useState('week'); // week, month, year
  const [stats, setStats] = useState({
    totalEarnings: 2850,
    totalPickups: 23,
    totalWeight: 145,
    averageRating: 4.8,
    completionRate: 95,
  });

  const [earningsData, setEarningsData] = useState([
    { day: 'রবি', amount: 450 },
    { day: 'সোম', amount: 320 },
    { day: 'মঙ্গল', amount: 580 },
    { day: 'বুধ', amount: 410 },
    { day: 'বৃহ', amount: 490 },
    { day: 'শুক্র', amount: 380 },
    { day: 'শনি', amount: 220 },
  ]);

  const [topMaterials, setTopMaterials] = useState([
    { name: 'কাগজ', weight: 45, earnings: 450, percentage: 35 },
    { name: 'প্লাস্টিক', weight: 38, earnings: 760, percentage: 28 },
    { name: 'ধাতু', weight: 25, earnings: 1250, percentage: 20 },
    { name: 'ইলেকট্রনিক্স', weight: 12, earnings: 600, percentage: 10 },
    { name: 'কাপড়', weight: 25, earnings: 250, percentage: 7 },
  ]);

  const getMaxEarning = () => Math.max(...earningsData.map(d => d.amount));

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
        <Text style={styles.headerTitle}>আয় ও পরিসংখ্যান</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
          onPress={() => setPeriod('week')}
        >
          <Text style={[styles.periodText, period === 'week' && styles.periodTextActive]}>
            সপ্তাহ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
          onPress={() => setPeriod('month')}
        >
          <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>
            মাস
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'year' && styles.periodButtonActive]}
          onPress={() => setPeriod('year')}
        >
          <Text style={[styles.periodText, period === 'year' && styles.periodTextActive]}>
            বছর
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Stats Cards */}
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={['#4CAF50', '#66BB6A']}
            style={styles.mainStatCard}
          >
            <Text style={styles.mainStatIcon}>💰</Text>
            <Text style={styles.mainStatValue}>৳{stats.totalEarnings}</Text>
            <Text style={styles.mainStatLabel}>মোট আয়</Text>
            <Text style={styles.mainStatSubtext}>এই সপ্তাহ</Text>
          </LinearGradient>

          <View style={styles.miniStatsColumn}>
            <View style={styles.miniStatCard}>
              <Text style={styles.miniStatIcon}>📦</Text>
              <Text style={styles.miniStatValue}>{stats.totalPickups}</Text>
              <Text style={styles.miniStatLabel}>পিকআপ</Text>
            </View>
            <View style={styles.miniStatCard}>
              <Text style={styles.miniStatIcon}>⚖️</Text>
              <Text style={styles.miniStatValue}>{stats.totalWeight}kg</Text>
              <Text style={styles.miniStatLabel}>মোট ওজন</Text>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>পারফরম্যান্স</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricIcon}>⭐</Text>
                <Text style={styles.metricValue}>{stats.averageRating}</Text>
              </View>
              <Text style={styles.metricLabel}>রেটিং</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(stats.averageRating / 5) * 100}%`, backgroundColor: '#FF9800' }]} />
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricIcon}>✓</Text>
                <Text style={styles.metricValue}>{stats.completionRate}%</Text>
              </View>
              <Text style={styles.metricLabel}>সম্পন্ন হার</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${stats.completionRate}%`, backgroundColor: '#4CAF50' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Earnings Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>দৈনিক আয়</Text>
            <Text style={styles.totalAmount}>৳{stats.totalEarnings}</Text>
          </View>

          <View style={styles.chart}>
            {earningsData.map((item, index) => {
              const maxHeight = 150;
              const barHeight = (item.amount / getMaxEarning()) * maxHeight;
              
              return (
                <View key={index} style={styles.chartBar}>
                  <Text style={styles.chartAmount}>৳{item.amount}</Text>
                  <View style={styles.barContainer}>
                    <LinearGradient
                      colors={[colors.primary, colors.primaryLight]}
                      style={[styles.bar, { height: barHeight }]}
                    />
                  </View>
                  <Text style={styles.chartDay}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Materials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>জনপ্রিয় উপাদান</Text>
          
          {topMaterials.map((material, index) => (
            <View key={index} style={styles.materialCard}>
              <View style={styles.materialHeader}>
                <Text style={styles.materialRank}>#{index + 1}</Text>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialName}>{material.name}</Text>
                  <Text style={styles.materialWeight}>{material.weight} কেজি</Text>
                </View>
                <Text style={styles.materialEarnings}>৳{material.earnings}</Text>
              </View>
              
              <View style={styles.materialProgress}>
                <View style={[styles.materialProgressBar, { width: `${material.percentage}%` }]}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.materialProgressFill}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>অন্যান্য তথ্য</Text>
          
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatIcon}>🏆</Text>
              <Text style={styles.quickStatValue}>12</Text>
              <Text style={styles.quickStatLabel}>সেরা সংগ্রাহক ব্যাজ</Text>
            </View>

            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatIcon}>👥</Text>
              <Text style={styles.quickStatValue}>45</Text>
              <Text style={styles.quickStatLabel}>সক্রিয় গ্রাহক</Text>
            </View>

            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatIcon}>📍</Text>
              <Text style={styles.quickStatValue}>8.5 km</Text>
              <Text style={styles.quickStatLabel}>গড় দূরত্ব</Text>
            </View>

            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatIcon}>⏱️</Text>
              <Text style={styles.quickStatValue}>25 মিনিট</Text>
              <Text style={styles.quickStatLabel}>গড় সময়</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 30 }} />
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 15,
    padding: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textGray,
  },
  periodTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 12,
    marginBottom: 20,
  },
  mainStatCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mainStatIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  mainStatValue: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 5,
  },
  mainStatLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 2,
  },
  mainStatSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  miniStatsColumn: {
    gap: 12,
  },
  miniStatCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: (screenWidth - 60) / 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  miniStatIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  miniStatLabel: {
    fontSize: 11,
    color: colors.textGray,
  },
  section: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 15,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textDark,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textGray,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.bgCream,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  chart: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  chartAmount: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 5,
  },
  barContainer: {
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 24,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartDay: {
    fontSize: 11,
    color: colors.textGray,
    marginTop: 8,
  },
  materialCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  materialRank: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    width: 40,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 2,
  },
  materialWeight: {
    fontSize: 12,
    color: colors.textGray,
  },
  materialEarnings: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  materialProgress: {
    height: 6,
    backgroundColor: colors.bgCream,
    borderRadius: 3,
    overflow: 'hidden',
  },
  materialProgressBar: {
    height: '100%',
  },
  materialProgressFill: {
    flex: 1,
    borderRadius: 3,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickStatCard: {
    width: (screenWidth - 54) / 2,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickStatIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    color: colors.textGray,
    textAlign: 'center',
  },
});

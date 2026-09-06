import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import colors from '../../constants/colors';

const screenWidth = Dimensions.get('window').width;

const WEEK_DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4'];
const MONTH_LABELS = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

export default function CollectorStatsScreen({ navigation }) {
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalPickups: 0,
    totalWeight: 0,
    averageRating: 0,
    completionRate: 0,
  });
  const [earningsData, setEarningsData] = useState(
    WEEK_DAYS.map(day => ({ day, amount: 0 }))
  );
  const [topMaterials, setTopMaterials] = useState([]);

  useEffect(() => {
    loadStats(period);
  }, [period]);

  const loadStats = async (selectedPeriod) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      const now = new Date();
      let startDate;

      if (selectedPeriod === 'week') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      } else if (selectedPeriod === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      // All completed pickups by this collector
      const completedSnap = await getDocs(query(
        collection(db, 'pickupRequests'),
        where('collectorId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc')
      ));
      const allCompleted = completedSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter to current period
      const periodPickups = allCompleted.filter(p =>
        p.completedAt && new Date(p.completedAt) >= startDate
      );

      // Pending/active pickups for completion rate
      const activeSnap = await getDocs(query(
        collection(db, 'pickupRequests'),
        where('collectorId', '==', user.uid),
        where('status', 'in', ['accepted', 'on-the-way', 'at-location'])
      ));

      // Aggregate stats
      let totalEarnings = 0;
      let totalWeight = 0;
      const materialMap = {};
      const chartMap = {};

      periodPickups.forEach(p => {
        const earnings = p.actualEarnings || p.estimatedEarnings || 0;
        totalEarnings += earnings;

        // Chart key
        const date = new Date(p.completedAt);
        let key;
        if (selectedPeriod === 'week') {
          key = WEEK_DAYS[date.getDay()];
        } else if (selectedPeriod === 'month') {
          key = `W${Math.ceil(date.getDate() / 7)}`;
        } else {
          key = MONTH_LABELS[date.getMonth()];
        }
        chartMap[key] = (chartMap[key] || 0) + earnings;

        // Materials
        (p.materials || []).forEach(m => {
          const qty = parseFloat(m.quantity) || 0;
          const price = parseFloat(String(m.price || '0').replace(/[^0-9.]/g, '')) || 0;
          const mat = materialMap[m.name] || { name: m.name, weight: 0, earnings: 0 };
          mat.weight += qty;
          mat.earnings += price * qty;
          if (m.unit === 'কেজি' || m.unit === 'kg') totalWeight += qty;
          materialMap[m.name] = mat;
        });
      });

      // Build chart data
      let chartData;
      if (selectedPeriod === 'week') {
        chartData = WEEK_DAYS.map(day => ({ day, amount: chartMap[day] || 0 }));
      } else if (selectedPeriod === 'month') {
        chartData = WEEK_LABELS.map(w => ({ day: w, amount: chartMap[w] || 0 }));
      } else {
        chartData = MONTH_LABELS.map(m => ({ day: m, amount: chartMap[m] || 0 }));
      }
      setEarningsData(chartData);

      // Top materials
      const sorted = Object.values(materialMap)
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 5);
      const totalMaterialEarnings = sorted.reduce((s, m) => s + m.earnings, 0);
      setTopMaterials(sorted.map(m => ({
        ...m,
        earnings: Math.round(m.earnings),
        weight: Math.round(m.weight * 10) / 10,
        percentage: totalMaterialEarnings > 0
          ? Math.round((m.earnings / totalMaterialEarnings) * 100) : 0,
      })));

      // User rating
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data() || {};
      const completionRate = (activeSnap.size + periodPickups.length) > 0
        ? Math.round((periodPickups.length / (activeSnap.size + periodPickups.length)) * 100)
        : (periodPickups.length > 0 ? 100 : 0);

      setStats({
        totalEarnings,
        totalPickups: periodPickups.length,
        totalWeight: Math.round(totalWeight * 10) / 10,
        averageRating: userData.rating ? parseFloat(userData.rating.toFixed(1)) : 0,
        completionRate,
      });
    } catch (error) {
      console.log('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxEarning = () => {
    const max = Math.max(...earningsData.map(d => d.amount));
    return max > 0 ? max : 1;
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
        </View>
      ) : null}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Stats Cards */}
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={['#4CAF50', '#66BB6A']}
            style={styles.mainStatCard}
          >
            <Text style={styles.mainStatIcon}>💰</Text>
            <Text style={styles.mainStatValue}>৳{stats.totalEarnings.toLocaleString('bn-BD')}</Text>
            <Text style={styles.mainStatLabel}>মোট আয়</Text>
            <Text style={styles.mainStatSubtext}>
              {period === 'week' ? 'এই সপ্তাহ' : period === 'month' ? 'এই মাস' : 'এই বছর'}
            </Text>
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
              <Text style={styles.quickStatIcon}>📦</Text>
              <Text style={styles.quickStatValue}>{stats.totalPickups}</Text>
              <Text style={styles.quickStatLabel}>মোট পিকআপ</Text>
            </View>

            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatIcon}>⚖️</Text>
              <Text style={styles.quickStatValue}>{stats.totalWeight} kg</Text>
              <Text style={styles.quickStatLabel}>মোট ওজন</Text>
            </View>

            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatIcon}>⭐</Text>
              <Text style={styles.quickStatValue}>{stats.averageRating || '—'}</Text>
              <Text style={styles.quickStatLabel}>রেটিং</Text>
            </View>

            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatIcon}>✓</Text>
              <Text style={styles.quickStatValue}>{stats.completionRate}%</Text>
              <Text style={styles.quickStatLabel}>সম্পন্ন হার</Text>
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
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  loadingText: {
    marginTop: 8,
    color: colors.textGray,
    fontSize: 14,
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

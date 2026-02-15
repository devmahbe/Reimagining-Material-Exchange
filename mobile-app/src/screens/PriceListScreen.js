import React, { useState } from 'react';
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

export default function PriceListScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'সব', icon: '📦' },
    { id: 'paper', name: 'কাগজ', icon: '📰' },
    { id: 'plastic', name: 'প্লাস্টিক', icon: '🥤' },
    { id: 'metal', name: 'ধাতু', icon: '🔧' },
    { id: 'glass', name: 'কাচ', icon: '🍾' },
    { id: 'electronics', name: 'ইলেকট্রনিক্স', icon: '📱' },
    { id: 'clothes', name: 'কাপড়', icon: '👕' },
  ];

  const priceData = [
    {
      category: 'paper',
      items: [
        { name: 'সংবাদপত্র', price: '৳৮-১০/কেজি', quality: 'পরিষ্কার ও শুকনো', trend: 'up' },
        { name: 'সাদা কাগজ', price: '৳১০-১২/কেজি', quality: 'প্রিন্ট ছাড়া', trend: 'up' },
        { name: 'বই ও কপি', price: '৳৭-৯/কেজি', quality: 'যেকোনো অবস্থায়', trend: 'stable' },
        { name: 'কার্টন বক্স', price: '৳৬-৮/কেজি', quality: 'সমতল করা', trend: 'down' },
        { name: 'ম্যাগাজিন', price: '৳৫-৭/কেজি', quality: 'রঙিন কাগজ', trend: 'stable' },
      ],
    },
    {
      category: 'plastic',
      items: [
        { name: 'পানির বোতল (PET)', price: '৳২০-২৫/কেজি', quality: 'পরিষ্কার', trend: 'up' },
        { name: 'প্লাস্টিক ব্যাগ', price: '৳১০-১৫/কেজি', quality: 'যেকোনো রঙ', trend: 'stable' },
        { name: 'হার্ড প্লাস্টিক', price: '৳২৫-৩০/কেজি', quality: 'ভাঙা না', trend: 'up' },
        { name: 'প্লাস্টিক পাত্র', price: '৳১৫-২০/কেজি', quality: 'পরিষ্কার', trend: 'stable' },
        { name: 'পলিথিন', price: '৳৮-১২/কেজি', quality: 'মিশ্র', trend: 'down' },
      ],
    },
    {
      category: 'metal',
      items: [
        { name: 'লোহা', price: '৳৪০-৫০/কেজি', quality: 'জং ছাড়া', trend: 'up' },
        { name: 'অ্যালুমিনিয়াম', price: '৳৮০-১০০/কেজি', quality: 'বিশুদ্ধ', trend: 'up' },
        { name: 'তামা', price: '৳৪০০-৪৫০/কেজি', quality: 'বিশুদ্ধ', trend: 'up' },
        { name: 'পিতল', price: '৳২৫০-৩০০/কেজি', quality: 'বিশুদ্ধ', trend: 'stable' },
        { name: 'টিন', price: '৳৩০-৪০/কেজি', quality: 'যেকোনো', trend: 'stable' },
        { name: 'স্টিল', price: '৳৪৫-৫৫/কেজি', quality: 'মরিচা ছাড়া', trend: 'up' },
      ],
    },
    {
      category: 'glass',
      items: [
        { name: 'কাচের বোতল', price: '৳৮-১০/কেজি', quality: 'ভাঙা না', trend: 'stable' },
        { name: 'জানালার কাচ', price: '৳৫-৭/কেজি', quality: 'বড় টুকরা', trend: 'stable' },
        { name: 'মিশ্র কাচ', price: '৩-৫/কেজি', quality: 'ভাঙা', trend: 'down' },
      ],
    },
    {
      category: 'electronics',
      items: [
        { name: 'মোবাইল ফোন', price: '৳৫০-২০০/পিস', quality: 'কাজ না করলেও', trend: 'up' },
        { name: 'ল্যাপটপ', price: '৳৫০০-২০০০/পিস', quality: 'অবস্থা অনুসারে', trend: 'up' },
        { name: 'ক্যাবল ও তার', price: '৳১০০-১৫০/কেজি', quality: 'তামার তার', trend: 'up' },
        { name: 'সার্কিট বোর্ড', price: '৳২০০-৩০০/কেজি', quality: 'কম্পিউটার থেকে', trend: 'stable' },
        { name: 'ব্যাটারি', price: '৳৫০-১০০/কেজি', quality: 'যেকোনো', trend: 'stable' },
      ],
    },
    {
      category: 'clothes',
      items: [
        { name: 'সুতি কাপড়', price: '৳১৫-২০/কেজি', quality: 'পরিষ্কার', trend: 'stable' },
        { name: 'জিন্স', price: '৳১০-১৫/কেজি', quality: 'যেকোনো', trend: 'stable' },
        { name: 'মিশ্র কাপড়', price: '৳৮-১২/কেজি', quality: 'পুরাতন', trend: 'down' },
        { name: 'জুতা', price: '৳৫-১০/পেয়ার', quality: 'যেকোনো', trend: 'stable' },
      ],
    },
  ];

  const filteredData = selectedCategory === 'all' 
    ? priceData 
    : priceData.filter(item => item.category === selectedCategory);

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return '#4CAF50';
    if (trend === 'down') return '#f44336';
    return colors.textGray;
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
        <Text style={styles.headerTitle}>আজকের দর</Text>
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Update Notice */}
      <View style={styles.updateNotice}>
        <Text style={styles.updateIcon}>⏰</Text>
        <Text style={styles.updateText}>সর্বশেষ আপডেট: আজ সকাল ৯:০০</Text>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat.id && styles.categoryChipTextActive
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Price List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredData.map((categoryData, index) => {
          const category = categories.find(c => c.id === categoryData.category);
          return (
            <View key={index} style={styles.categorySection}>
              <View style={styles.categorySectionHeader}>
                <Text style={styles.categorySectionIcon}>{category?.icon}</Text>
                <Text style={styles.categorySectionTitle}>{category?.name}</Text>
              </View>

              {categoryData.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.priceCard}>
                  <View style={styles.priceCardLeft}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuality}>• {item.quality}</Text>
                  </View>

                  <View style={styles.priceCardRight}>
                    <View style={styles.priceRow}>
                      <Text style={styles.itemPrice}>{item.price}</Text>
                      <Text style={[styles.trendIcon, { color: getTrendColor(item.trend) }]}>
                        {getTrendIcon(item.trend)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>দর পরিবর্তনশীল</Text>
            <Text style={styles.infoText}>
              উপাদানের মান, পরিমাণ এবং বাজার অবস্থার উপর ভিত্তি করে দাম পরিবর্তন হতে পারে। সঠিক দাম জানতে সংগ্রাহকের সাথে যোগাযোগ করুন।
            </Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>প্রবণতা চিহ্ন:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <Text style={styles.legendIcon}>📈</Text>
              <Text style={styles.legendText}>দাম বাড়ছে</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendIcon}>➡️</Text>
              <Text style={styles.legendText}>স্থিতিশীল</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendIcon}>📉</Text>
              <Text style={styles.legendText}>দাম কমছে</Text>
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
  refreshIcon: {
    fontSize: 20,
  },
  updateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  updateIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  updateText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
  },
  categoryFilter: {
    maxHeight: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryFilterContent: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bgCream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },
  categoryChipTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  categorySection: {
    marginTop: 20,
    marginHorizontal: 15,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categorySectionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  categorySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  priceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  priceCardLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  itemQuality: {
    fontSize: 12,
    color: colors.textGray,
  },
  priceCardRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  trendIcon: {
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    marginHorizontal: 15,
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
  legend: {
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
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 10,
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
  },
  legendText: {
    fontSize: 13,
    color: colors.textGray,
  },
});

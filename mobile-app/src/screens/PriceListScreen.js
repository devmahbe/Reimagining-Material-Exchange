import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppButton, AppHeader, BottomBar, Chip, EmptyState } from '../components/ui';
import { getMaterialById, MATERIALS, PRICE_LIST } from '../constants/materials';
import { getCurrentUserProfile } from '../services/userService';
import { formatDateBangla, formatPriceRange } from '../utils/helpers';
import colors from '../constants/colors';
import { font, radius, spacing } from '../constants/theme';

const TREND = {
  up: { icon: 'trending-up', color: colors.success, label: 'বাড়ছে' },
  down: { icon: 'trending-down', color: colors.error, label: 'কমছে' },
  stable: { icon: 'remove', color: colors.textGray, label: 'স্থিতিশীল' },
};

export default function PriceListScreen({ navigation }) {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState(null);
  const showRequestButton = role === 'household';

  useEffect(() => {
    getCurrentUserProfile().then((p) => setRole(p?.role || null)).catch(() => {});
  }, []);

  const term = search.trim();
  const sections = PRICE_LIST.filter((s) => category === 'all' || s.category === category)
    .map((s) => ({ ...s, items: s.items.filter((i) => !term || i.name.includes(term)) }))
    .filter((s) => s.items.length > 0);

  return (
    <View style={styles.container}>
      <AppHeader title="আজকের দর" subtitle={`বাজার দর • ${formatDateBangla(new Date())}`} onBack={() => navigation.goBack()}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="উপাদান খুঁজুন..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </AppHeader>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="সব" active={category === 'all'} onPress={() => setCategory('all')} />
          {MATERIALS.map((m) => (
            <Chip key={m.id} label={m.name} active={category === m.id} onPress={() => setCategory(m.id)} />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {sections.length === 0 ? (
          <EmptyState icon="search-outline" title="কিছু পাওয়া যায়নি" message="অন্য নাম দিয়ে খুঁজে দেখুন" />
        ) : (
          sections.map((section) => {
            const mat = getMaterialById(section.category);
            return (
              <View key={section.category} style={styles.section}>
                <View style={styles.sectionHead}>
                  <View style={[styles.sectionIcon, { backgroundColor: mat.bg }]}>
                    <MaterialCommunityIcons name={mat.icon} size={20} color={mat.color} />
                  </View>
                  <Text style={styles.sectionTitle}>{mat.name}</Text>
                </View>
                <View style={styles.card}>
                  {section.items.map((item, i) => {
                    const trend = TREND[item.trend] || TREND.stable;
                    return (
                      <View key={item.name} style={[styles.row, i === section.items.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemQuality}>{item.quality}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.itemPrice}>
                            {formatPriceRange(item)}
                            <Text style={styles.itemUnit}> /{item.unit}</Text>
                          </Text>
                          <View style={styles.trend}>
                            <Ionicons name={trend.icon} size={13} color={trend.color} />
                            <Text style={[styles.trendText, { color: trend.color }]}>{trend.label}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}

        <View style={styles.info}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            দাম উপাদানের মান, পরিমাণ ও বাজার অবস্থার উপর নির্ভর করে। চূড়ান্ত দাম সংগ্রাহক পিকআপের সময় ওজন করে নির্ধারণ করবেন।
          </Text>
        </View>
      </ScrollView>

      {showRequestButton ? (
        <BottomBar>
          <AppButton title="পিকআপ অনুরোধ করুন" icon="add-circle-outline" onPress={() => navigation.navigate('MaterialSelection', category !== 'all' ? { preselect: category } : undefined)} />
        </BottomBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
    marginTop: spacing.lg,
  },
  searchInput: { flex: 1, fontSize: font.md, color: colors.text, paddingVertical: spacing.sm },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  body: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  section: { marginTop: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  sectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  itemName: { fontSize: font.md, fontWeight: '600', color: colors.text },
  itemQuality: { fontSize: font.xs + 1, color: colors.textGray, marginTop: 2 },
  itemPrice: { fontSize: font.md, fontWeight: '800', color: colors.primary },
  itemUnit: { fontSize: font.xs + 1, fontWeight: '500', color: colors.textGray },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  trendText: { fontSize: font.xs, fontWeight: '600' },
  info: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.infoSoft, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl },
  infoText: { flex: 1, fontSize: font.sm, color: colors.textBody, lineHeight: 20 },
});

import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Alert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUserProfile } from '../../services/userService';
import { AppButton, AppHeader, BottomBar, Card, FormField, SectionHeader } from '../../components/ui';
import { BN_DAYS_SHORT, BN_MONTHS_SHORT, isValidPhone, normalizePhone, toBnDigits } from '../../utils/helpers';
import colors from '../../constants/colors';
import { font, radius, spacing } from '../../constants/theme';

const TIME_SLOTS = [
  { id: 1, time: 'সকাল ৮টা - ১০টা', value: '08:00-10:00', start: 8 },
  { id: 2, time: 'সকাল ১০টা - ১২টা', value: '10:00-12:00', start: 10 },
  { id: 3, time: 'দুপুর ১২টা - ২টা', value: '12:00-14:00', start: 12 },
  { id: 4, time: 'দুপুর ২টা - ৪টা', value: '14:00-16:00', start: 14 },
  { id: 5, time: 'বিকাল ৪টা - ৬টা', value: '16:00-18:00', start: 16 },
  { id: 6, time: 'সন্ধ্যা ৬টা - ৮টা', value: '18:00-20:00', start: 18 },
];

const buildDates = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    return {
      key: date.toDateString(),
      date,
      isToday: i === 0,
      dayLabel: i === 0 ? 'আজ' : i === 1 ? 'কাল' : BN_DAYS_SHORT[date.getDay()],
      dayNum: toBnDigits(date.getDate()),
      month: BN_MONTHS_SHORT[date.getMonth()],
      display: i === 0 ? 'আজ' : i === 1 ? 'আগামীকাল' : `${toBnDigits(date.getDate())} ${BN_MONTHS_SHORT[date.getMonth()]}`,
    };
  });
};

// A slot is bookable if it starts at least one hour from now
const isSlotAvailable = (dateItem, slot) => !dateItem.isToday || slot.start > new Date().getHours() + 1;

export default function SchedulePickupScreen({ navigation, route }) {
  const { materials, images } = route.params;
  const dates = useMemo(buildDates, []);
  const todayHasSlots = TIME_SLOTS.some((s) => isSlotAvailable(dates[0], s));
  const [selectedDate, setSelectedDate] = useState(todayHasSlots ? dates[0] : dates[1]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [userName, setUserName] = useState('');
  const [errors, setErrors] = useState({});

  // Pre-fill contact details from the user's profile
  useEffect(() => {
    getCurrentUserProfile()
      .then((p) => {
        if (!p) return;
        setUserName(p.name || '');
        setAddress((a) => a || p.address || '');
        setPhone((ph) => ph || p.phone || '');
      })
      .catch(() => {});
  }, []);

  const chooseDate = (d) => {
    setSelectedDate(d);
    if (selectedSlot && !isSlotAvailable(d, selectedSlot)) setSelectedSlot(null);
  };

  const handleContinue = () => {
    const next = {};
    if (!selectedSlot) next.slot = 'একটি সময় নির্বাচন করুন';
    if (!address.trim()) next.address = 'পিকআপের ঠিকানা লিখুন';
    if (!isValidPhone(phone)) next.phone = 'সঠিক ফোন নম্বর লিখুন (01XXXXXXXXX)';
    setErrors(next);
    if (Object.keys(next).length) {
      if (next.slot) Alert.alert('সময় নির্বাচন করুন', next.slot);
      return;
    }

    const scheduled = new Date(selectedDate.date);
    scheduled.setHours(selectedSlot.start, 0, 0, 0);

    navigation.navigate('RequestConfirmation', {
      materials,
      images,
      schedule: {
        date: scheduled.toISOString(),
        dateDisplay: selectedDate.display,
        timeSlot: selectedSlot.time,
        timeValue: selectedSlot.value,
      },
      address: address.trim(),
      phone: normalizePhone(phone),
      notes: notes.trim(),
      userName,
    });
  };

  return (
    <View style={styles.container}>
      <AppHeader title="সময় নির্ধারণ" subtitle="ধাপ ২/৩ — কখন ও কোথায়?" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <SectionHeader title="তারিখ" style={{ marginTop: 0 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dates.map((d) => {
              const disabled = d.isToday && !todayHasSlots;
              const active = selectedDate?.key === d.key;
              return (
                <TouchableOpacity
                  key={d.key}
                  disabled={disabled}
                  onPress={() => chooseDate(d)}
                  style={[styles.dateCard, active && styles.dateCardActive, disabled && styles.disabled]}
                >
                  <Text style={[styles.dateDay, active && styles.textOnActive]}>{d.dayLabel}</Text>
                  <Text style={[styles.dateNum, active && styles.textOnActive]}>{d.dayNum}</Text>
                  <Text style={[styles.dateMonth, active && styles.textOnActive]}>{d.month}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <SectionHeader title="সময়" />
          <View style={styles.slotGrid}>
            {TIME_SLOTS.map((slot) => {
              const available = isSlotAvailable(selectedDate, slot);
              const active = selectedSlot?.id === slot.id;
              return (
                <TouchableOpacity
                  key={slot.id}
                  disabled={!available}
                  onPress={() => setSelectedSlot(slot)}
                  style={[styles.slot, active && styles.slotActive, !available && styles.disabled]}
                >
                  <Ionicons name="time-outline" size={16} color={active ? colors.white : colors.primary} />
                  <Text style={[styles.slotText, active && styles.textOnActive]}>{slot.time}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <SectionHeader title="যোগাযোগের তথ্য" />
          <Card>
            <FormField
              label="পিকআপের ঠিকানা *"
              icon="location-outline"
              placeholder="বাড়ি নং, রাস্তা, এলাকা, শহর"
              value={address}
              onChangeText={(t) => { setAddress(t); setErrors((e) => ({ ...e, address: null })); }}
              multiline
              error={errors.address}
            />
            <FormField
              label="ফোন নম্বর *"
              icon="call-outline"
              placeholder="01XXXXXXXXX"
              keyboardType="phone-pad"
              maxLength={14}
              value={phone}
              onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: null })); }}
              error={errors.phone}
            />
            <FormField
              label="অতিরিক্ত নির্দেশনা (ঐচ্ছিক)"
              icon="chatbox-ellipses-outline"
              placeholder="যেমন: গেটের পাশে রাখা থাকবে"
              value={notes}
              onChangeText={setNotes}
              multiline
              style={{ marginBottom: 0 }}
            />
          </Card>
        </ScrollView>

        <BottomBar>
          <AppButton title="পর্যালোচনা করুন" icon="arrow-forward" onPress={handleContinue} />
        </BottomBar>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  dateRow: { gap: spacing.sm, paddingRight: spacing.lg },
  dateCard: {
    width: 68,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  dateCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateDay: { fontSize: font.xs + 1, color: colors.textGray, fontWeight: '600' },
  dateNum: { fontSize: font.xl + 2, fontWeight: '800', color: colors.text, marginVertical: 2 },
  dateMonth: { fontSize: font.xs + 1, color: colors.textGray },
  textOnActive: { color: colors.white },
  disabled: { opacity: 0.35 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: font.sm, fontWeight: '600', color: colors.text },
});

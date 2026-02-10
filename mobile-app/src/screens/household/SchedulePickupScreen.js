import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../constants/colors';
import banglaText from '../../constants/banglaText';

export default function SchedulePickupScreen({ navigation, route }) {
  const { materials, images } = route.params;
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Generate next 7 days
  const getDates = () => {
    const dates = [];
    const today = new Date();
    const dayNames = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        day: dayNames[date.getDay()],
        date: date.getDate(),
        month: date.getMonth() + 1,
        full: date,
        display: i === 0 ? 'আজ' : i === 1 ? 'আগামীকাল' : `${date.getDate()}/${date.getMonth() + 1}`
      });
    }
    return dates;
  };

  const timeSlots = [
    { id: 1, time: 'সকাল ৮-১০টা', value: '08:00-10:00' },
    { id: 2, time: 'সকাল ১০-১২টা', value: '10:00-12:00' },
    { id: 3, time: 'দুপুর ১২-২টা', value: '12:00-14:00' },
    { id: 4, time: 'দুপুর ২-৪টা', value: '14:00-16:00' },
    { id: 5, time: 'বিকাল ৪-৬টা', value: '16:00-18:00' },
    { id: 6, time: 'সন্ধ্যা ৬-৮টা', value: '18:00-20:00' },
  ];

  const dates = getDates();

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('সতর্কতা', 'অনুগ্রহ করে তারিখ এবং সময় নির্বাচন করুন');
      return;
    }

    if (!address.trim()) {
      Alert.alert('সতর্কতা', 'অনুগ্রহ করে ঠিকানা লিখুন');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('সতর্কতা', 'অনুগ্রহ করে ফোন নম্বর লিখুন');
      return;
    }

    navigation.navigate('RequestConfirmation', {
      materials,
      images,
      date: selectedDate,
      time: selectedTime,
      address,
      phone,
      notes
    });
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
        <Text style={styles.headerTitle}>সময়সূচী নির্ধারণ</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selected Materials Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>নির্বাচিত উপাদান</Text>
          <View style={styles.materialTags}>
            {materials.map(m => (
              <View key={m.id} style={styles.materialTag}>
                <Text style={styles.materialTagText}>
                  {m.icon} {m.name} × {m.quantity}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 তারিখ নির্বাচন করুন</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateCard,
                  selectedDate?.date === date.date && styles.dateCardSelected
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dateDay,
                  selectedDate?.date === date.date && styles.dateTextSelected
                ]}>
                  {date.day}
                </Text>
                <Text style={[
                  styles.dateNumber,
                  selectedDate?.date === date.date && styles.dateTextSelected
                ]}>
                  {date.date}
                </Text>
                <Text style={[
                  styles.dateLabel,
                  selectedDate?.date === date.date && styles.dateTextSelected
                ]}>
                  {date.display}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ সময় নির্বাচন করুন</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map(slot => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlot,
                  selectedTime?.id === slot.id && styles.timeSlotSelected
                ]}
                onPress={() => setSelectedTime(slot)}
              >
                <Text style={[
                  styles.timeText,
                  selectedTime?.id === slot.id && styles.timeTextSelected
                ]}>
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 যোগাযোগের তথ্য</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ঠিকানা *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="বাড়ি নং, রাস্তা, এলাকা"
              placeholderTextColor={colors.textLight}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ফোন নম্বর *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="01XXXXXXXXX"
              placeholderTextColor={colors.textLight}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>অতিরিক্ত নির্দেশনা (ঐচ্ছিক)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="বিশেষ নির্দেশনা যদি থাকে..."
              placeholderTextColor={colors.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <LinearGradient
            colors={[colors.secondary, colors.secondaryLight]}
            style={styles.confirmButtonGradient}
          >
            <Text style={styles.confirmButtonText}>
              নিশ্চিত করুন →
            </Text>
          </LinearGradient>
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
  summaryCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textGray,
    marginBottom: 10,
  },
  materialTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  materialTag: {
    backgroundColor: colors.bgCream,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  materialTagText: {
    fontSize: 13,
    color: colors.textDark,
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
  dateScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dateDay: {
    fontSize: 12,
    color: colors.textGray,
    marginBottom: 5,
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 5,
  },
  dateLabel: {
    fontSize: 11,
    color: colors.textGray,
  },
  dateTextSelected: {
    color: 'white',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  timeText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  timeTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.textDark,
    borderWidth: 2,
    borderColor: colors.border,
    textAlignVertical: 'top',
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

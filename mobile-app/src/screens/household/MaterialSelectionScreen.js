import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../constants/colors';
import banglaText from '../../constants/banglaText';

export default function MaterialSelectionScreen({ navigation }) {
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [images, setImages] = useState([]);

  const materials = [
    { id: 1, name: 'কাগজ', icon: '📰', price: '৳৮-১২', unit: 'কেজি' },
    { id: 2, name: 'প্লাস্টিক', icon: '🥤', price: '৳১৫-২৫', unit: 'কেজি' },
    { id: 3, name: 'ধাতু', icon: '🔧', price: '৳৪০-৬০', unit: 'কেজি' },
    { id: 4, name: 'কাচ', icon: '🍾', price: '৳৫-১০', unit: 'কেজি' },
    { id: 5, name: 'ইলেকট্রনিক্স', icon: '📱', price: '৳৫০+', unit: 'পিস' },
    { id: 6, name: 'কাপড়', icon: '👕', price: '৳১০-২০', unit: 'কেজি' },
  ];

  const toggleMaterial = (material) => {
    const exists = selectedMaterials.find(m => m.id === material.id);
    
    if (exists) {
      setSelectedMaterials(selectedMaterials.filter(m => m.id !== material.id));
    } else {
      setSelectedMaterials([...selectedMaterials, { ...material, quantity: 1 }]);
    }
  };

  const updateQuantity = (materialId, change) => {
    setSelectedMaterials(selectedMaterials.map(m => {
      if (m.id === materialId) {
        const newQty = Math.max(1, m.quantity + change);
        return { ...m, quantity: newQty };
      }
      return m;
    }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('অনুমতি প্রয়োজন', 'ছবি নির্বাচন করতে অনুমতি দিন');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('অনুমতি প্রয়োজন', 'ক্যামেরা ব্যবহার করতে অনুমতি দিন');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleContinue = () => {
    if (selectedMaterials.length === 0) {
      Alert.alert('সতর্কতা', 'অনুগ্রহ করে অন্তত একটি উপাদান নির্বাচন করুন');
      return;
    }

    navigation.navigate('SchedulePickup', { 
      materials: selectedMaterials,
      images: images 
    });
  };

  const getTotalEstimate = () => {
    let total = 0;
    selectedMaterials.forEach(m => {
      const avgPrice = parseInt(m.price.match(/\d+/)[0]);
      total += avgPrice * m.quantity;
    });
    return total;
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
        <Text style={styles.headerTitle}>উপাদান নির্বাচন করুন</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionText}>
            আপনার বিক্রয় করতে চান এমন উপাদান নির্বাচন করুন
          </Text>
        </View>

        {/* Material Grid */}
        <View style={styles.materialGrid}>
          {materials.map((material) => {
            const isSelected = selectedMaterials.find(m => m.id === material.id);
            
            return (
              <TouchableOpacity
                key={material.id}
                style={[
                  styles.materialCard,
                  isSelected && styles.materialCardSelected
                ]}
                onPress={() => toggleMaterial(material)}
              >
                <Text style={styles.materialIcon}>{material.icon}</Text>
                <Text style={styles.materialName}>{material.name}</Text>
                <Text style={styles.materialPrice}>{material.price}/{material.unit}</Text>
                
                {isSelected && (
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQuantity(material.id, -1)}
                    >
                      <Text style={styles.qtyButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{isSelected.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQuantity(material.id, 1)}
                    >
                      <Text style={styles.qtyButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📷 ছবি যোগ করুন (ঐচ্ছিক)</Text>
          <Text style={styles.sectionSubtitle}>
            স্পষ্ট মূল্যায়নের জন্য উপাদানের ছবি তুলুন
          </Text>

          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Text style={styles.photoButtonIcon}>📸</Text>
              <Text style={styles.photoButtonText}>ক্যামেরা</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <Text style={styles.photoButtonIcon}>🖼️</Text>
              <Text style={styles.photoButtonText}>গ্যালারি</Text>
            </TouchableOpacity>
          </View>

          {images.length > 0 && (
            <View style={styles.imagePreview}>
              <Text style={styles.imageCount}>
                ✅ {images.length} টি ছবি যোগ করা হয়েছে
              </Text>
            </View>
          )}
        </View>

        {/* Estimate */}
        {selectedMaterials.length > 0 && (
          <View style={styles.estimateCard}>
            <Text style={styles.estimateLabel}>আনুমানিক মূল্য</Text>
            <Text style={styles.estimateAmount}>৳{getTotalEstimate()}</Text>
            <Text style={styles.estimateNote}>
              * প্রকৃত মূল্য পরিদর্শনের পর নির্ধারিত হবে
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      {selectedMaterials.length > 0 && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <LinearGradient
              colors={[colors.secondary, colors.secondaryLight]}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>
                পরবর্তী: সময়সূচী নির্ধারণ →
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  instructionCard: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textDark,
    textAlign: 'center',
  },
  materialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 15,
  },
  materialCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  materialCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
  },
  materialIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 5,
  },
  materialPrice: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 10,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 10,
    backgroundColor: colors.bgCream,
    borderRadius: 20,
    padding: 5,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    minWidth: 30,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textGray,
    marginBottom: 15,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  photoButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  imagePreview: {
    marginTop: 15,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 15,
    borderRadius: 12,
  },
  imageCount: {
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '600',
  },
  estimateCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 8,
  },
  estimateAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  estimateNote: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

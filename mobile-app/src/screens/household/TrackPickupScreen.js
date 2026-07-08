import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import colors from '../../constants/colors';

const buildMapHTML = (address) => {
  const safeAddress = (address || 'Dhaka, Bangladesh').replace(/'/g, "\\'");
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    #map { height:100vh; width:100%; }
    .loading { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
      font-family:sans-serif; font-size:14px; color:#555; z-index:1000; background:white;
      padding:10px 20px; border-radius:20px; box-shadow:0 2px 8px rgba(0,0,0,0.2); }
  </style>
</head>
<body>
  <div class="loading" id="loader">📍 লোকেশন খুঁজছি...</div>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([23.8103, 90.4125], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    var customIcon = L.divIcon({
      html: '<div style="background:#2E7D32;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
      iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32], className: ''
    });

    var address = '${safeAddress}, Dhaka, Bangladesh';
    fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(address) + '&format=json&limit=1',
      { headers: { 'Accept-Language': 'bn,en', 'User-Agent': 'BhangariExchange/1.0' } }
    )
    .then(function(r){ return r.json(); })
    .then(function(data){
      document.getElementById('loader').style.display = 'none';
      if (data && data.length > 0) {
        var lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
        map.setView([lat, lon], 16);
        L.marker([lat, lon], { icon: customIcon }).addTo(map)
          .bindPopup('<b>📍 পিকআপ ঠিকানা</b><br>' + '${safeAddress}').openPopup();
      } else {
        var marker = L.marker([23.8103, 90.4125], { icon: customIcon }).addTo(map)
          .bindPopup('<b>📍 পিকআপ ঠিকানা</b><br>' + '${safeAddress}').openPopup();
      }
    })
    .catch(function(){ document.getElementById('loader').style.display = 'none'; });
  </script>
</body>
</html>`;
};

export default function TrackPickupScreen({ navigation, route }) {
  const { requestId } = route.params;
  const [request, setRequest] = useState(null);
  const [collector, setCollector] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for pickup status
    const unsubscribe = onSnapshot(
      doc(db, 'pickupRequests', requestId),
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = { id: docSnapshot.id, ...docSnapshot.data() };
          setRequest(data);

          // Load collector info if accepted
          if (data.collectorId) {
            const collectorDoc = await getDoc(doc(db, 'users', data.collectorId));
            if (collectorDoc.exists()) {
              setCollector({ id: collectorDoc.id, ...collectorDoc.data() });
            }
          }
          setLoading(false);
        }
      },
      (error) => {
        console.log('Error loading pickup:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [requestId]);

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        label: 'অপেক্ষমাণ',
        icon: '⏳',
        color: colors.secondary,
        message: 'একজন সংগ্রাহক খুঁজছি...',
      },
      accepted: {
        label: 'গৃহীত',
        icon: '✅',
        color: colors.primary,
        message: 'সংগ্রাহক আপনার অনুরোধ গ্রহণ করেছেন',
      },
      'on-the-way': {
        label: 'পথে আছেন',
        icon: '🚗',
        color: '#FF9800',
        message: 'সংগ্রাহক আপনার ঠিকানায় আসছেন',
      },
      'at-location': {
        label: 'পৌঁছেছেন',
        icon: '📍',
        color: '#9C27B0',
        message: 'সংগ্রাহক আপনার ঠিকানায় পৌঁছেছেন',
      },
      'in-progress': {
        label: 'সংগ্রহ করছেন',
        icon: '📦',
        color: '#2196F3',
        message: 'সংগ্রাহক উপাদান সংগ্রহ করছেন',
      },
      completed: {
        label: 'সম্পন্ন',
        icon: '✓',
        color: colors.success,
        message: 'পিকআপ সফলভাবে সম্পন্ন হয়েছে!',
      },
      cancelled: {
        label: 'বাতিল',
        icon: '✕',
        color: '#f44336',
        message: 'পিকআপ বাতিল করা হয়েছে',
      },
    };

    return statusMap[status] || statusMap.pending;
  };

  const makePhoneCall = (phone) => {
    const phoneNumber = `tel:${phone}`;
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneNumber);
        } else {
          Alert.alert('ত্রুটি', 'ফোন কল করা যাচ্ছে না');
        }
      })
      .catch((err) => console.log(err));
  };

  const sendMessage = () => {
    if (collector) {
      navigation.navigate('ChatScreen', {
        recipientId: collector.id,
        recipientName: collector.name,
      });
    }
  };

  if (loading || !request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(request.status);

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
        <Text style={styles.headerTitle}>পিকআপ ট্র্যাক করুন</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Timeline */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconContainer, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
          </View>
          <Text style={styles.statusLabel}>{statusInfo.label}</Text>
          <Text style={styles.statusMessage}>{statusInfo.message}</Text>
        </View>

        {/* Progress Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.cardTitle}>অগ্রগতি</Text>
          
          <View style={styles.timelineContainer}>
            {[
              { key: 'pending', label: 'অনুরোধ প্রেরণ', time: request.createdAt },
              { key: 'accepted', label: 'সংগ্রাহক গ্রহণ', time: request.acceptedAt },
              { key: 'on-the-way', label: 'পথে রয়েছেন', time: request.onTheWayAt },
              { key: 'at-location', label: 'পৌঁছেছেন', time: request.atLocationAt },
              { key: 'completed', label: 'সম্পন্ন', time: request.completedAt },
            ].map((step, index) => {
              const isCompleted = step.time;
              const isCurrent = request.status === step.key;

              return (
                <View key={step.key} style={styles.timelineStep}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isCompleted && styles.timelineDotCompleted,
                      isCurrent && styles.timelineDotCurrent,
                    ]}>
                      {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    {index < 4 && (
                      <View style={[
                        styles.timelineLine,
                        isCompleted && styles.timelineLineCompleted,
                      ]} />
                    )}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={[
                      styles.timelineLabel,
                      isCompleted && styles.timelineLabelCompleted,
                    ]}>
                      {step.label}
                    </Text>
                    {step.time && (
                      <Text style={styles.timelineTime}>
                        {new Date(step.time).toLocaleTimeString('bn-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Collector Info */}
        {collector && (
          <View style={styles.collectorCard}>
            <Text style={styles.cardTitle}>সংগ্রাহকের তথ্য</Text>
            
            <View style={styles.collectorInfo}>
              <View style={styles.collectorAvatar}>
                <Text style={styles.collectorAvatarText}>
                  {collector.name?.charAt(0) || '👷'}
                </Text>
              </View>
              <View style={styles.collectorDetails}>
                <Text style={styles.collectorName}>{collector.name}</Text>
                <Text style={styles.collectorPhone}>{collector.phone}</Text>
                {collector.rating && (
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>⭐ {collector.rating.toFixed(1)}</Text>
                    <Text style={styles.ratingCount}>
                      ({collector.totalRatings || 0} রিভিউ)
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.collectorActions}>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => makePhoneCall(collector.phone)}
              >
                <Text style={styles.callIcon}>📞</Text>
                <Text style={styles.callText}>কল করুন</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.messageButton}
                onPress={sendMessage}
              >
                <Text style={styles.messageIcon}>💬</Text>
                <Text style={styles.messageText}>মেসেজ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pickup Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>পিকআপের বিবরণ</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>তারিখ</Text>
            <Text style={styles.detailValue}>
              {new Date(request.schedule?.date).toLocaleDateString('bn-BD')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>সময়</Text>
            <Text style={styles.detailValue}>{request.schedule?.timeSlot}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ঠিকানা</Text>
            <Text style={styles.detailValue}>{request.address}</Text>
          </View>

          <View style={styles.materialsSection}>
            <Text style={styles.detailLabel}>উপাদান</Text>
            {request.materials?.map((material, index) => (
              <View key={index} style={styles.materialRow}>
                <Text style={styles.materialIcon}>{material.icon || '📦'}</Text>
                <Text style={styles.materialName}>{material.name}</Text>
                <Text style={styles.materialQuantity}>
                  {material.quantity} {material.unit}
                </Text>
              </View>
            ))}
          </View>

          {request.estimatedEarnings && (
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>আনুমানিক আয়</Text>
              <Text style={styles.earningsValue}>৳{request.estimatedEarnings}</Text>
            </View>
          )}
        </View>

        {/* OpenStreetMap */}
        {request.address && (
          <View style={styles.mapCard}>
            <Text style={styles.cardTitle}>🗺️ ঠিকানার মানচিত্র</Text>
            <View style={styles.mapContainer}>
              <WebView
                source={{ html: buildMapHTML(request.address) }}
                style={styles.map}
                scrollEnabled={false}
                originWhitelist={['*']}
                javaScriptEnabled
              />
            </View>
          </View>
        )}

        {/* Show rating option if completed and not yet rated */}
        {request.status === 'completed' && !request.userRating && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => navigation.navigate('RateCollector', {
              requestId: request.id,
              collectorId: collector?.id,
              collectorName: collector?.name,
            })}
          >
            <Text style={styles.rateButtonText}>⭐ সংগ্রাহককে রেটিং দিন</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textGray,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 10,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 40,
  },
  statusLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 16,
    color: colors.textGray,
    textAlign: 'center',
  },
  timelineCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  timelineContainer: {
    paddingVertical: 8,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotCompleted: {
    backgroundColor: colors.success,
  },
  timelineDotCurrent: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: colors.success,
  },
  timelineRight: {
    flex: 1,
    paddingTop: 2,
  },
  timelineLabel: {
    fontSize: 16,
    color: colors.textGray,
    marginBottom: 4,
  },
  timelineLabelCompleted: {
    color: colors.text,
    fontWeight: '600',
  },
  timelineTime: {
    fontSize: 14,
    color: colors.textLight,
  },
  collectorCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  collectorInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  collectorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  collectorAvatarText: {
    fontSize: 28,
    color: 'white',
    fontWeight: '700',
  },
  collectorDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  collectorName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  collectorPhone: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: colors.textGray,
  },
  collectorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    padding: 14,
    borderRadius: 12,
  },
  callIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  callText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
  },
  messageIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  messageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    fontSize: 16,
    color: colors.textGray,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
  },
  materialsSection: {
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  materialIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  materialName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  materialQuantity: {
    fontSize: 14,
    color: colors.textGray,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
  },
  earningsLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
  },
  mapCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  rateButton: {
    backgroundColor: colors.secondary,
    margin: 20,
    marginTop: 0,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  rateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

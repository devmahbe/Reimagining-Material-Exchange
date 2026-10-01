import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { font, radius, spacing } from '../constants/theme';
import { geocodeAddress, mapsSearchUrl } from '../services/geocodeService';

// react-native-webview has no web implementation, so it is only loaded on native.
const WebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;
const cartoApiKey = process.env.EXPO_PUBLIC_CARTO_API_KEY;

// JSON-encode a value for embedding inside a <script> tag ("<" is escaped so
// a value can never contain "</script>").
const toScriptValue = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

/**
 * Build a self-contained Leaflet map page. All dynamic values are passed
 * through JSON.stringify so an address can never break out of the script,
 * and the popup text is set with textContent (no HTML injection).
 */
const buildMapHtml = ({ lat, lon, label }) => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
  .pin { width: 30px; height: 30px; border-radius: 50% 50% 50% 0; background: #1B6B45;
         transform: rotate(-45deg); border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.35); }
  .leaflet-popup-content { font-family: sans-serif; font-size: 13px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var LAT = ${toScriptValue(lat)};
  var LON = ${toScriptValue(lon)};
  var LABEL = ${toScriptValue(label)};
  var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([LAT, LON], 16);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoApiKey || '')}', {
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);
  var icon = L.divIcon({ html: '<div class="pin"></div>', className: '', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -30] });
  var popup = document.createElement('div');
  popup.textContent = LABEL;
  L.marker([LAT, LON], { icon: icon }).addTo(map).bindPopup(popup);
</script>
</body>
</html>`;

export default function MapPreview({ address, height = 200 }) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    let active = true;
    setCoords(null);
    geocodeAddress(address).then((result) => {
      if (active) setCoords(result);
    });
    return () => {
      active = false;
    };
  }, [address]);

  const html = useMemo(
    () => (coords ? buildMapHtml({ lat: coords.lat, lon: coords.lon, label: address || 'পিকআপ ঠিকানা' }) : null),
    [coords, address]
  );

  const openInMaps = () => Linking.openURL(mapsSearchUrl(address)).catch(() => {});

  return (
    <View>
      <View style={[styles.mapBox, { height }]}>
        {!html ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>লোকেশন খোঁজা হচ্ছে...</Text>
          </View>
        ) : Platform.OS === 'web' ? (
          React.createElement('iframe', {
            srcDoc: html,
            title: 'map',
            style: { border: 0, width: '100%', height: '100%' },
          })
        ) : (
          <WebView
            source={{ html }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            nestedScrollEnabled
            style={styles.webview}
          />
        )}
      </View>
      {coords && !coords.exact ? (
        <Text style={styles.approx}>সঠিক ঠিকানা পাওয়া যায়নি — কাছাকাছি এলাকা দেখানো হচ্ছে</Text>
      ) : null}
      <TouchableOpacity style={styles.openBtn} onPress={openInMaps}>
        <Ionicons name="navigate-outline" size={18} color={colors.primary} />
        <Text style={styles.openText}>Google Maps-এ দিকনির্দেশনা দেখুন</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapBox: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  webview: { flex: 1, backgroundColor: colors.surface },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.sm, color: colors.textGray, fontSize: font.sm },
  approx: { marginTop: spacing.sm, fontSize: font.xs + 1, color: colors.warning },
  openBtn: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  openText: { color: colors.primary, fontWeight: '700', fontSize: font.sm + 1 },
});

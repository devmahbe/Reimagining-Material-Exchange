import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { initAccounts } from '../services/accountService';
import { getUserProfile, homeRouteFor } from '../services/userService';
import colors from '../constants/colors';
import { font, spacing } from '../constants/theme';

/**
 * Restores every saved Firebase session (one per signed-in account), picks
 * the last active account and sends the user to the right home screen, or
 * to Login.
 */
export default function SplashScreen({ navigation }) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      let route = 'Login';
      try {
        const user = await initAccounts();
        if (user) {
          const profile = await getUserProfile(user.uid);
          // A signed-in user without a profile finishes setup on the Login screen
          route = profile ? homeRouteFor(profile.role) : 'Login';
        }
      } catch (error) {
        route = 'Login';
      }
      if (mounted) navigation.reset({ index: 0, routes: [{ name: route }] });
    })();
    return () => {
      mounted = false;
    };
  }, [navigation]);

  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.container}>
      <View style={styles.logo}>
        <MaterialCommunityIcons name="recycle" size={56} color={colors.primary} />
      </View>
      <Text style={styles.title}>ভাঙ্গারি এক্সচেঞ্জ</Text>
      <Text style={styles.subtitle}>পরিবেশ বান্ধব ভবিষ্যৎ গড়ি</Text>
      <ActivityIndicator color={colors.white} style={{ marginTop: spacing.xxxl }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: { fontSize: font.xxxl, fontWeight: '800', color: colors.white },
  subtitle: { fontSize: font.md, color: 'rgba(255,255,255,0.85)', marginTop: spacing.sm },
});

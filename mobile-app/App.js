import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import colors from './src/constants/colors';

// Auth screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

// Household screens
import HouseholdHomeScreen from './src/screens/household/HomeScreen';
import MaterialSelectionScreen from './src/screens/household/MaterialSelectionScreen';
import SchedulePickupScreen from './src/screens/household/SchedulePickupScreen';
import RequestConfirmationScreen from './src/screens/household/RequestConfirmationScreen';
import HistoryScreen from './src/screens/household/HistoryScreen';
import ProfileScreen from './src/screens/household/ProfileScreen';
import TrackPickupScreen from './src/screens/household/TrackPickupScreen';
import RateCollectorScreen from './src/screens/household/RateCollectorScreen';

// Collector screens
import CollectorHomeScreen from './src/screens/collector/CollectorHomeScreen';
import RequestDetailsScreen from './src/screens/collector/RequestDetailsScreen';
import CollectorStatsScreen from './src/screens/collector/CollectorStatsScreen';
import EarningsScreen from './src/screens/collector/EarningsScreen';

// Shared screens
import PaymentScreen from './src/screens/PaymentScreen';
import PaymentReceiptScreen from './src/screens/PaymentReceiptScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ChatScreen from './src/screens/ChatScreen';
import PriceListScreen from './src/screens/PriceListScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: colors.background },
              cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
              gestureEnabled: true,
            }}
          >
            {/* Auth Screens */}
            <Stack.Screen name="Splash" component={SplashScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} />

            {/* Household Screens */}
            <Stack.Screen name="HouseholdHome" component={HouseholdHomeScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="MaterialSelection" component={MaterialSelectionScreen} />
            <Stack.Screen name="SchedulePickup" component={SchedulePickupScreen} />
            <Stack.Screen name="RequestConfirmation" component={RequestConfirmationScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="TrackPickup" component={TrackPickupScreen} />
            <Stack.Screen name="RateCollector" component={RateCollectorScreen} />

            {/* Collector Screens */}
            <Stack.Screen name="CollectorHome" component={CollectorHomeScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
            <Stack.Screen name="CollectorStats" component={CollectorStatsScreen} />
            <Stack.Screen name="Earnings" component={EarningsScreen} />

            {/* Shared Screens */}
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="PaymentReceipt" component={PaymentReceiptScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
            <Stack.Screen name="PriceList" component={PriceListScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

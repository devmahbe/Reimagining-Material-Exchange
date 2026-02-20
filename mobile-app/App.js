import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// Import screens
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
import MessagesScreen from './src/screens/MessagesScreen';
import ChatScreen from './src/screens/ChatScreen';
import PriceListScreen from './src/screens/PriceListScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Auth Screens */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          
          {/* Household Screens */}
          <Stack.Screen name="HouseholdHome" component={HouseholdHomeScreen} />
          <Stack.Screen name="MaterialSelection" component={MaterialSelectionScreen} />
          <Stack.Screen name="SchedulePickup" component={SchedulePickupScreen} />
          <Stack.Screen name="RequestConfirmation" component={RequestConfirmationScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="TrackPickup" component={TrackPickupScreen} />
          <Stack.Screen name="RateCollector" component={RateCollectorScreen} />
          
          {/* Collector Screens */}
          <Stack.Screen name="CollectorHome" component={CollectorHomeScreen} />
          <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
          <Stack.Screen name="CollectorStats" component={CollectorStatsScreen} />
          <Stack.Screen name="Earnings" component={EarningsScreen} />
          
          {/* Shared Screens */}
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
          <Stack.Screen name="PriceList" component={PriceListScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/presentation/context/AuthContext';
import { VehicleProvider } from '../src/presentation/context/VehicleContext';
import { Colors } from '../src/core/constants';

// Prevent auto hide
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Dynamically import NotificationService to avoid crash if native module is unavailable
        if (Platform.OS !== 'web') {
          try {
            const { registerForPushNotifications } = require('../src/data/services/NotificationService');
            await registerForPushNotifications();
          } catch (notifError) {
            console.warn('Push notification setup failed (non-critical):', notifError);
          }
        }

        // Small delay to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Preparation error:', e);
      } finally {
        setAppReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    };
    prepare();
  }, []);

  // Set up notification response listener
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let subscription: any;
    try {
      const Notifications = require('expo-notifications');
      subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response?.notification?.request?.content?.data;
        console.log('Notification tapped:', data);
      });
    } catch (e) {
      console.warn('Notification listener setup failed:', e);
    }

    return () => {
      subscription?.remove?.();
    };
  }, []);

  if (isLoading || !appReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>AutoSuivi TN</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" options={{ animation: 'fade' }} />
        <Stack.Screen name="tabs" options={{ animation: 'fade' }} />
        <Stack.Screen 
          name="vehicles/form" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="maintenance/form" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <VehicleProvider>
        <RootLayoutNav />
      </VehicleProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
});

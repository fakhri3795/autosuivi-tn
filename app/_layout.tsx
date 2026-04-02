import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
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

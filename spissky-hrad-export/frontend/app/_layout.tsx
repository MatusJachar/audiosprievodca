import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { useTourStore } from '../store/tourStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

export default function RootLayout() {
  const loadLanguage = useLanguageStore((state) => state.loadLanguage);
  const fetchTourStops = useTourStore((state) => state.fetchTourStops);
  const fetchUserProgress = useTourStore((state) => state.fetchUserProgress);

  useEffect(() => {
    loadLanguage();
    fetchTourStops();
    fetchUserProgress('default-user');
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="language-select" options={{ headerShown: false }} />
        <Stack.Screen name="tour" options={{ headerShown: false }} />
        <Stack.Screen name="stop-detail" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="admin-content" options={{ headerShown: false }} />
        <Stack.Screen name="admin-login" options={{ headerShown: false }} />
        <Stack.Screen name="shop" options={{ headerShown: false }} />
        <Stack.Screen name="travel-info" options={{ headerShown: false }} />
        <Stack.Screen name="discover-region" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

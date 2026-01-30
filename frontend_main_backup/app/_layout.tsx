import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { useTourStore } from '../store/tourStore';

export default function RootLayout() {
  const loadLanguage = useLanguageStore((state) => state.loadLanguage);
  const fetchTourStops = useTourStore((state) => state.fetchTourStops);
  const fetchUserProgress = useTourStore((state) => state.fetchUserProgress);

  useEffect(() => {
    // Load saved language on app start
    loadLanguage();
    
    // Fetch tour data
    fetchTourStops();
    
    // Fetch user progress (using a default user ID for now)
    fetchUserProgress('default-user');
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="language-select" options={{ title: 'Select Language' }} />
      <Stack.Screen name="tour" options={{ headerShown: false }} />
      <Stack.Screen name="stop-detail" options={{ title: 'Tour Stop' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="admin-content" options={{ headerShown: false }} />
      <Stack.Screen name="admin-login" options={{ headerShown: false }} />
    </Stack>
  );
}
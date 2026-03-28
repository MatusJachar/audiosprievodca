import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { useTourStore } from '../store/tourStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Linking } from 'react-native';

export default function RootLayout() {
  const loadLanguage = useLanguageStore((state) => state.loadLanguage);
  const fetchTourStops = useTourStore((state) => state.fetchTourStops);
  const fetchUserProgress = useTourStore((state) => state.fetchUserProgress);

  useEffect(() => {
    loadLanguage();
    fetchTourStops();
    fetchUserProgress('default-user');
    
    // Handle deep links
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log('[DeepLink] Received:', url);
      
      // Handle audioguide:// scheme
      if (url.startsWith('audioguide://')) {
        const path = url.replace('audioguide://', '');
        if (path.startsWith('partner/')) {
          // Navigate to partners page
          console.log('[DeepLink] Navigate to partners');
        } else if (path.startsWith('stop/')) {
          const stopId = path.replace('stop/', '').split('?')[0];
          console.log('[DeepLink] Navigate to stop:', stopId);
        }
      }
    };

    // Listen for incoming deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened from a deep link
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
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
        <Stack.Screen name="partners" options={{ headerShown: false }} />
        <Stack.Screen name="clear-cache" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

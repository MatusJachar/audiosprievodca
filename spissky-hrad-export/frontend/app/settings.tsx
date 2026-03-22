import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTourStore } from '../store/tourStore';
import { useLanguageStore, LANGUAGES } from '../store/languageStore';
import { OfflineCacheManager } from '../utils/offlineCacheManager';

export default function Settings() {
  const { userProgress, resetProgress, isOfflineMode, toggleOfflineMode, downloadAllContent } = useTourStore();
  const { selectedLanguage, setLanguage } = useLanguageStore();

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset your tour progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetProgress('default-user'),
        },
      ]
    );
  };

  const handleClearAllCache = async () => {
    Alert.alert(
      'Clear All Cache',
      'This will clear all downloaded audio and fix the "disk full" error. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await OfflineCacheManager.clearCache();
              Alert.alert('Success', 'Cache cleared successfully! The app should work normally now.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache. Try restarting the app.');
            }
          },
        },
      ]
    );
  };

  const handleDownloadContent = async () => {
    // Check if FileSystem is available
    if (!OfflineCacheManager.isFileSystemAvailable()) {
      Alert.alert(
        'Expo Go Limitation',
        'Offline downloads require a standalone app build. Expo Go has storage restrictions.\n\nUse online streaming mode instead - it works great!',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Download Tour',
      'Download all tour content for offline use?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            await downloadAllContent();
            Alert.alert('Success', 'Tour content downloaded successfully!');
          },
        },
      ]
    );
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === selectedLanguage);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => router.push('/language-select')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="language" size={24} color="#4A90D9" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Tour Language</Text>
                <Text style={styles.settingValue}>
                  {currentLanguage?.flag} {currentLanguage?.name}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#aaa" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <Ionicons name="stats-chart" size={24} color="#4CAF50" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Completed Stops</Text>
                <Text style={styles.settingValue}>
                  {userProgress?.completed_stops.length || 0} stops
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.settingCard} onPress={handleResetProgress}>
            <View style={styles.settingLeft}>
              <Ionicons name="refresh" size={24} color="#FF5252" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Reset Progress</Text>
                <Text style={styles.settingSubtext}>Clear all completed stops</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#aaa" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offline Mode</Text>
          <TouchableOpacity
            style={styles.settingCard}
            onPress={toggleOfflineMode}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name={isOfflineMode ? 'cloud-offline' : 'cloud'}
                size={24}
                color="#2196F3"
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Offline Mode</Text>
                <Text style={styles.settingSubtext}>
                  {isOfflineMode ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.toggle,
                isOfflineMode && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  isOfflineMode && styles.toggleThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingCard}
            onPress={handleDownloadContent}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="download" size={24} color="#4A90D9" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Download Tour</Text>
                <Text style={styles.settingSubtext}>
                  Download all content for offline use
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#aaa" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin</Text>
          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => router.push('/admin')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark" size={24} color="#FF5252" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Admin Panel</Text>
                <Text style={styles.settingSubtext}>
                  Edit tour stops and generate audio
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#aaa" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Troubleshooting</Text>
          <TouchableOpacity
            style={styles.settingCard}
            onPress={handleClearAllCache}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-bin" size={24} color="#FF5252" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Clear All Cache</Text>
                <Text style={styles.settingSubtext}>
                  Fix "disk full" errors
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#aaa" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => router.push('/clear-cache')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="refresh-circle" size={24} color="#FF9800" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Advanced Cache Options</Text>
                <Text style={styles.settingSubtext}>
                  Debug and fix content issues
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#aaa" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <Ionicons name="business" size={24} color="#4A90D9" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Spiš Castle Audio Tour</Text>
                <Text style={styles.settingSubtext}>Version 1.0.0</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 60, backgroundColor: '#1a1a1a' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, padding: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#aaa', textTransform: 'uppercase', marginBottom: 12 },
  settingCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 8 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 },
  settingValue: { fontSize: 14, color: '#4A90D9' },
  settingSubtext: { fontSize: 14, color: '#aaa' },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: '#2a2a2a', padding: 2 },
  toggleActive: { backgroundColor: '#4CAF50' },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleThumbActive: { transform: [{ translateX: 20 }] },
});

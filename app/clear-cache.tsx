import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

export default function ClearCache() {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    try {
      setIsClearing(true);
      await AsyncStorage.clear();
      Alert.alert(
        'Cache Cleared',
        'All cached data has been removed. Please restart the app to fetch fresh data.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error clearing cache:', error);
      Alert.alert('Error', 'Failed to clear cache. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Ionicons name="trash" size={80} color="#FF5252" />
        
        <Text style={styles.title}>Clear Cache</Text>
        <Text style={styles.description}>
          This will remove all cached tour data and force a fresh download from the server.
          Use this if you're experiencing issues with audio or content not updating.
        </Text>
        
        <TouchableOpacity
          style={[styles.clearButton, isClearing && styles.clearButtonDisabled]}
          onPress={handleClearCache}
          disabled={isClearing}
        >
          <Ionicons name="trash" size={24} color="#fff" />
          <Text style={styles.clearButtonText}>
            {isClearing ? 'Clearing...' : 'Clear All Cache'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.warning}>
          ⚠️ This action cannot be undone. You'll need an internet connection to re-download tour data.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5252',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 40,
    gap: 8,
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
  clearButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  warning: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
});

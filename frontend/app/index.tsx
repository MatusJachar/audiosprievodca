import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <Ionicons name="castle" size={80} color="#FFD700" />
        
        <Text style={styles.title}>Spiš Castle</Text>
        <Text style={styles.subtitle}>Audio Tour Guide</Text>
        
        <Text style={styles.description}>
          Explore one of the largest castle complexes in Europe with our interactive audio guide in 8 languages.
        </Text>
        
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/language-select')}
        >
          <Text style={styles.startButtonText}>Start Tour</Text>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="language" size={24} color="#FFD700" />
            <Text style={styles.featureText}>8 Languages</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="location" size={24} color="#FFD700" />
            <Text style={styles.featureText}>13 Stops</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="cloud-offline" size={24} color="#FFD700" />
            <Text style={styles.featureText}>Offline Mode</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#FFD700',
    marginTop: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 40,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  features: {
    flexDirection: 'row',
    marginTop: 48,
    gap: 24,
  },
  feature: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#aaa',
  },
});
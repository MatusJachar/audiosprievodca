import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Index() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    fetchBackgroundImage();
  }, []);

  const fetchBackgroundImage = async () => {
    try {
      console.log('Fetching background from:', `${API_URL}/api/images/background`);
      const response = await fetch(`${API_URL}/api/images/background`);
      const data = await response.json();
      console.log('Background response:', { hasImage: !!data.background_image_base64, length: data.background_image_base64?.length });
      if (data.background_image_base64) {
        const imageUri = `data:image/png;base64,${data.background_image_base64}`;
        console.log('Setting background image, length:', imageUri.length);
        setBackgroundImage(imageUri);
      }
    } catch (error) {
      console.error('Error fetching background:', error);
    }
  };

  const content = (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.overlay} />
      
      <View style={styles.content}>
        <Ionicons name="business" size={80} color="#FFD700" />
        
        <Text style={styles.title}>Spiš Castle</Text>
        <Text style={styles.subtitle}>Audio Tour Guide</Text>
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionBold}>
            Explore, Discover and Immerse yourself in the largest U.N.E.S.C.O castle complexes in Europe.
          </Text>
          <Text style={styles.description}>
            Our audio guide will take you through centuries of history, architecture and legends.
          </Text>
        </View>
        
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

  if (backgroundImage) {
    return (
      <ImageBackground source={{ uri: backgroundImage }} style={styles.backgroundImage} blurRadius={2}>
        {content}
      </ImageBackground>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    fontSize: 20,
    color: '#aaa',
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 28,
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
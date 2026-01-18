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
        {/* Castle Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="business" size={90} color="#FFD700" />
        </View>
        
        {/* Title Section */}
        <Text style={styles.title}>Spiš Castle</Text>
        <Text style={styles.subtitle}>Audio Tour Guide</Text>
        
        {/* Divider */}
        <View style={styles.divider} />
        
        {/* Description Section */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionBold}>
            Explore, Discover & Immerse yourself
          </Text>
          <Text style={styles.descriptionHighlight}>
            in the largest UNESCO World Heritage
          </Text>
          <Text style={styles.descriptionHighlight}>
            castle complex in Europe
          </Text>
        </View>
        
        <Text style={styles.descriptionSecondary}>
          Our audio guide will take you through centuries{'\n'}of history, architecture and legends
        </Text>
        
        {/* Start Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/language-select')}
        >
          <Text style={styles.startButtonText}>Start Tour</Text>
          <Ionicons name="arrow-forward" size={24} color="#000" />
        </TouchableOpacity>
        
        {/* Quick Access Buttons */}
        <View style={styles.quickButtons}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/travel-info')}
          >
            <Ionicons name="bus" size={22} color="#FFD700" />
            <Text style={styles.quickButtonText}>How to Get Here</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/shop')}
          >
            <Ionicons name="cart" size={22} color="#FFD700" />
            <Text style={styles.quickButtonText}>Shop & Tickets</Text>
          </TouchableOpacity>
        </View>
        
        {/* Features Section */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="language" size={32} color="#FFD700" />
            </View>
            <Text style={styles.featureNumber}>9</Text>
            <Text style={styles.featureText}>Languages</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="location" size={32} color="#FFD700" />
            </View>
            <Text style={styles.featureNumber}>13</Text>
            <Text style={styles.featureText}>Tour Stops</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="cloud-offline" size={32} color="#FFD700" />
            </View>
            <Text style={styles.featureNumber}>✓</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 22,
    color: '#FFD700',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 2,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#FFD700',
    marginVertical: 20,
    borderRadius: 2,
  },
  descriptionContainer: {
    alignItems: 'center',
  },
  descriptionBold: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  descriptionHighlight: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
    lineHeight: 26,
  },
  descriptionSecondary: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
    fontStyle: 'italic',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    marginTop: 32,
    gap: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  features: {
    flexDirection: 'row',
    marginTop: 48,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 16,
  },
  feature: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  featureIcon: {
    marginBottom: 8,
  },
  featureNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 2,
  },
  featureText: {
    fontSize: 13,
    color: '#ccc',
    fontWeight: '500',
  },
  featureDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

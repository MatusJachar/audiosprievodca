import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// New color scheme - Deep royal blue/purple theme
const COLORS = {
  primary: '#4A90D9',      // Royal blue
  secondary: '#7B68EE',    // Medium slate blue
  accent: '#E8B923',       // Golden accent
  dark: '#1a1a2e',         // Dark background
  darker: '#0f0f1a',       // Darker shade
  text: '#ffffff',
  textSecondary: '#b8c5d6',
};

export default function Index() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const fetchBackgroundImage = async () => {
    try {
      const response = await fetch(`${API_URL}/api/images/background`);
      const data = await response.json();
      if (data.background_image_base64) {
        setBackgroundImage(`data:image/png;base64,${data.background_image_base64}`);
      }
    } catch (error) {
      console.error('Error fetching background:', error);
    }
  };

  useEffect(() => {
    fetchBackgroundImage();
  }, []);

  const content = (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(26,26,46,0.3)', 'rgba(26,26,46,0.7)', 'rgba(15,15,26,0.95)']}
        style={styles.overlay}
      />
      
      {/* Admin Button - Top Right Corner */}
      <TouchableOpacity
        style={styles.adminButton}
        onPress={() => router.push('/admin-login')}
      >
        <Ionicons name="settings-outline" size={22} color={COLORS.accent} />
      </TouchableOpacity>
      
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Title Section */}
        <Text style={styles.title}>Spišský hrad</Text>
        <Text style={styles.subtitle}>Audiosprievodca</Text>
        
        {/* Decorative Line */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Ionicons name="shield" size={20} color={COLORS.accent} />
          <View style={styles.dividerLine} />
        </View>
        
        {/* Slovak Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Ponorte sa do histórie jedného z najväčších hradných komplexov v Európe.
          </Text>
          <Text style={styles.descriptionHighlight}>
            Naša interaktívna audioprehliadka vás prevedie storočiami histórie, architektúry a legiend.
          </Text>
        </View>
        
        {/* Start Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/language-select')}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Text style={styles.startButtonText}>Začať prehliadku</Text>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Features Section */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="language" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.featureNumber}>9</Text>
            <Text style={styles.featureText}>Jazykov</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="location" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.featureNumber}>8</Text>
            <Text style={styles.featureText}>Zastávok</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="cloud-offline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.featureNumber}>✓</Text>
            <Text style={styles.featureText}>Offline</Text>
          </View>
        </View>
        
        {/* UNESCO Badge */}
        <View style={styles.unescoBadge}>
          <Ionicons name="ribbon" size={16} color={COLORS.accent} />
          <Text style={styles.unescoText}>UNESCO Svetové dedičstvo</Text>
        </View>
      </View>
    </View>
  );

  // Use local background image if API background not loaded
  const backgroundSource = backgroundImage 
    ? { uri: backgroundImage }
    : require('../assets/images/background.png');

  return (
    <ImageBackground source={backgroundSource} style={styles.backgroundImage}>
      {content}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  adminButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(26,26,46,0.7)',
    padding: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(74,144,217,0.3)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    width: 50,
    height: 1,
    backgroundColor: COLORS.accent,
    opacity: 0.5,
  },
  descriptionContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  descriptionHighlight: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  startButton: {
    width: '100%',
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  features: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,26,46,0.6)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(74,144,217,0.2)',
    marginBottom: 20,
  },
  feature: {
    flex: 1,
    alignItems: 'center',
  },
  featureIcon: {
    marginBottom: 8,
  },
  featureNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  featureDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(74,144,217,0.3)',
  },
  unescoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232,185,35,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(232,185,35,0.3)',
  },
  unescoText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
});

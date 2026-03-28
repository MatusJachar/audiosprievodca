import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import BackgroundWrapper from '../components/BackgroundWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function DiscoverRegion() {
  const handleOpenStore = (platform: 'ios' | 'android') => {
    const urls = {
      ios: 'https://apps.apple.com/app/spis-region-guide',
      android: 'https://play.google.com/store/apps/details?id=com.spisregion.guide',
    };
    Linking.openURL(urls[platform]).catch(() => {
      Alert.alert('Coming Soon', 'The Spiš Region Guide app will be available soon!');
    });
  };

  const handleBookGuide = () => {
    Linking.openURL('tel:+421901234567').catch(() => {
      Alert.alert('Book a Guide', 'Call us at +421 901 234 567 to book your personal guide!');
    });
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>What's Nearby</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroEmoji}>🏰 ⛰️ 🏛️</Text>
            <Text style={styles.heroTitle}>Discover Spiš Region</Text>
            <Text style={styles.heroSubtitle}>
              There's so much more to explore!
            </Text>
          </View>

          {/* Two Cards Side by Side */}
          <View style={styles.cardsRow}>
            {/* Card 1: Digital Guide App */}
            <View style={styles.card}>
              <View style={styles.cardBadge}>
                <Text style={styles.badgeText}>BEST VALUE</Text>
              </View>
              
              <View style={styles.cardIcon}>
                <Ionicons name="phone-portrait" size={36} color="#4A90D9" />
              </View>
              
              <Text style={styles.cardTitle}>📱 App Guide</Text>
              <Text style={styles.cardSubtitle}>Explore at your pace</Text>
              
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>✓ 50+ attractions</Text>
                <Text style={styles.featureItem}>✓ Works offline</Text>
                <Text style={styles.featureItem}>✓ 9 languages</Text>
                <Text style={styles.featureItem}>✓ Keep forever</Text>
              </View>
              
              <View style={styles.priceBox}>
                <Text style={styles.priceOld}>€9.99</Text>
                <Text style={styles.priceNew}>€3.99</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.cardButton}
                onPress={() => handleOpenStore('android')}
              >
                <Ionicons name="download" size={16} color="#000" />
                <Text style={styles.cardButtonText}>Get App</Text>
              </TouchableOpacity>
            </View>

            {/* Card 2: Personal Tour Guide */}
            <View style={[styles.card, styles.cardGreen]}>
              <View style={[styles.cardBadge, styles.badgeGreen]}>
                <Text style={styles.badgeText}>PREMIUM</Text>
              </View>
              
              <View style={[styles.cardIcon, styles.iconGreen]}>
                <Ionicons name="person" size={36} color="#4CAF50" />
              </View>
              
              <Text style={styles.cardTitle}>👨‍🏫 Personal</Text>
              <Text style={styles.cardSubtitle}>VIP with local expert</Text>
              
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>✓ Licensed guide</Text>
                <Text style={styles.featureItem}>✓ Custom tour</Text>
                <Text style={styles.featureItem}>✓ Hidden gems</Text>
                <Text style={styles.featureItem}>✓ Up to 8 people</Text>
              </View>
              
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Full Day</Text>
                <Text style={styles.priceGuide}>€70</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.cardButton, styles.buttonGreen]}
                onPress={handleBookGuide}
              >
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={[styles.cardButtonText, { color: '#fff' }]}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* What You'll Discover */}
          <View style={styles.highlightsSection}>
            <Text style={styles.highlightsTitle}>🗺️ What You'll Discover</Text>
            <View style={styles.highlightsGrid}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightEmoji}>🏛️</Text>
                <Text style={styles.highlightName}>Levoča</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightEmoji}>⛰️</Text>
                <Text style={styles.highlightName}>Slovak Paradise</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightEmoji}>⛪</Text>
                <Text style={styles.highlightName}>Wooden Churches</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightEmoji}>🏔️</Text>
                <Text style={styles.highlightName}>High Tatras</Text>
              </View>
            </View>
          </View>

          {/* Testimonial */}
          <View style={styles.testimonial}>
            <Text style={styles.testimonialQuote}>
              "Perfect combination - app for driving, guide for Levoča!"
            </Text>
            <Text style={styles.testimonialAuthor}>— Thomas, Austria ⭐⭐⭐⭐⭐</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 56,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90D9',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 4,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4A90D9',
    alignItems: 'center',
  },
  cardGreen: {
    borderColor: '#4CAF50',
  },
  cardBadge: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  badgeGreen: {
    backgroundColor: '#4CAF50',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,215,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconGreen: {
    backgroundColor: 'rgba(76,175,80,0.2)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 11,
    color: '#ccc',
    paddingVertical: 3,
  },
  priceBox: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  priceOld: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  priceNew: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90D9',
  },
  priceLabel: {
    fontSize: 11,
    color: '#888',
  },
  priceGuide: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90D9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    width: '100%',
  },
  buttonGreen: {
    backgroundColor: '#4CAF50',
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  highlightsSection: {
    marginBottom: 16,
  },
  highlightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  highlightItem: {
    width: '23%',
    backgroundColor: 'rgba(30,30,30,0.9)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  highlightEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  highlightName: {
    fontSize: 9,
    color: '#fff',
    textAlign: 'center',
  },
  testimonial: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90D9',
  },
  testimonialQuote: {
    fontSize: 13,
    color: '#ddd',
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    fontSize: 11,
    color: '#4A90D9',
    marginTop: 8,
  },
});

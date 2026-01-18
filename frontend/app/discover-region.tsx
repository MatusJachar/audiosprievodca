import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import BackgroundWrapper from '../components/BackgroundWrapper';

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
    // Replace with actual booking link or phone number
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
              Don't leave yet! There's so much more to explore around you
            </Text>
          </View>

          {/* Choose Your Adventure */}
          <Text style={styles.chooseTitle}>Choose Your Adventure</Text>

          {/* Option 1: Digital Guide App */}
          <TouchableOpacity style={styles.optionCard} activeOpacity={0.9}>
            <View style={styles.optionHeader}>
              <View style={styles.optionIconBg}>
                <Ionicons name="phone-portrait" size={32} color="#FFD700" />
              </View>
              <View style={styles.optionBadge}>
                <Text style={styles.badgeText}>BEST VALUE</Text>
              </View>
            </View>
            
            <Text style={styles.optionTitle}>📱 Digital Guide App</Text>
            <Text style={styles.optionTagline}>Explore at your own pace</Text>
            
            <View style={styles.optionFeatures}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>50+ attractions with audio</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Works offline - no internet needed</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Multi-day itineraries included</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>9 languages supported</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Keep forever - use anytime</Text>
              </View>
            </View>
            
            <View style={styles.priceSection}>
              <View style={styles.priceRow}>
                <Text style={styles.priceOld}>€9.99</Text>
                <Text style={styles.priceNew}>€4.99</Text>
              </View>
              <Text style={styles.priceNote}>🔥 50% OFF - Limited time!</Text>
            </View>
            
            <View style={styles.storeButtons}>
              <TouchableOpacity 
                style={styles.storeButton}
                onPress={() => handleOpenStore('ios')}
              >
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={styles.storeText}>App Store</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.storeButton}
                onPress={() => handleOpenStore('android')}
              >
                <Ionicons name="logo-google-playstore" size={20} color="#fff" />
                <Text style={styles.storeText}>Google Play</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Option 2: Personal Guide */}
          <TouchableOpacity style={styles.optionCard2} activeOpacity={0.9}>
            <View style={styles.optionHeader}>
              <View style={[styles.optionIconBg, { backgroundColor: 'rgba(76,175,80,0.2)' }]}>
                <Ionicons name="person" size={32} color="#4CAF50" />
              </View>
              <View style={[styles.optionBadge, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.badgeText}>PREMIUM</Text>
              </View>
            </View>
            
            <Text style={styles.optionTitle}>👨‍🏫 Personal Tour Guide</Text>
            <Text style={styles.optionTagline}>VIP experience with local expert</Text>
            
            <View style={styles.optionFeatures}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Licensed local expert guide</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Customized tour to your interests</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Hidden gems & local secrets</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Transport included (optional)</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>Groups up to 8 people</Text>
              </View>
            </View>
            
            <View style={styles.priceSection}>
              <Text style={styles.priceGuide}>From €80 / half day</Text>
              <Text style={styles.priceNoteGuide}>Full day tours available</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={handleBookGuide}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.bookButtonText}>Book Your Guide</Text>
            </TouchableOpacity>
            
            <Text style={styles.availabilityNote}>
              📅 Book 24h in advance • Available daily
            </Text>
          </TouchableOpacity>

          {/* Nearby Highlights */}
          <View style={styles.highlightsSection}>
            <Text style={styles.highlightsTitle}>🗺️ What You'll Discover</Text>
            <View style={styles.highlightsGrid}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightEmoji}>🏛️</Text>
                <Text style={styles.highlightName}>Levoča</Text>
                <Text style={styles.highlightDesc}>UNESCO town</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightEmoji}>⛰️</Text>
                <Text style={styles.highlightName}>Slovak Paradise</Text>
                <Text style={styles.highlightDesc}>Gorges & waterfalls</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightEmoji}>⛪</Text>
                <Text style={styles.highlightName}>Wooden Churches</Text>
                <Text style={styles.highlightDesc}>UNESCO heritage</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightEmoji}>🏔️</Text>
                <Text style={styles.highlightName}>High Tatras</Text>
                <Text style={styles.highlightDesc}>Alpine peaks</Text>
              </View>
            </View>
          </View>

          {/* Testimonial */}
          <View style={styles.testimonial}>
            <Text style={styles.testimonialQuote}>
              "We used both - the app for driving around and a personal guide for Levoča. Perfect combination!"
            </Text>
            <Text style={styles.testimonialAuthor}>— Thomas & Family, Austria ⭐⭐⭐⭐⭐</Text>
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
    paddingVertical: 24,
    marginBottom: 20,
  },
  heroEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  chooseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    marginBottom: 16,
  },
  optionCard2: {
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginBottom: 20,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  optionIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,215,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  optionTagline: {
    fontSize: 15,
    color: '#aaa',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  optionFeatures: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#ddd',
    flex: 1,
  },
  priceSection: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceOld: {
    fontSize: 20,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  priceNew: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  priceNote: {
    fontSize: 14,
    color: '#FF6B6B',
    marginTop: 8,
    fontWeight: '600',
  },
  priceGuide: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  priceNoteGuide: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  storeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  storeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  storeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  availabilityNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  highlightsSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  highlightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  highlightItem: {
    width: '48%',
    backgroundColor: 'rgba(30,30,30,0.9)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  highlightEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  highlightName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  highlightDesc: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  testimonial: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  testimonialQuote: {
    fontSize: 15,
    color: '#ddd',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  testimonialAuthor: {
    fontSize: 13,
    color: '#FFD700',
    marginTop: 12,
    fontWeight: '600',
  },
});

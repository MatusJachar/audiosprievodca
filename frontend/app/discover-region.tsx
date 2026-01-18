import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import BackgroundWrapper from '../components/BackgroundWrapper';

export default function DiscoverRegion() {
  const handleOpenStore = (platform: 'ios' | 'android') => {
    // Replace with actual app store links when available
    const urls = {
      ios: 'https://apps.apple.com/app/spis-region-guide',
      android: 'https://play.google.com/store/apps/details?id=com.spisregion.guide',
    };
    
    Linking.openURL(urls[platform]).catch(() => {
      Alert.alert('Coming Soon', 'The Spiš Region Guide app will be available soon!');
    });
  };

  const attractions = [
    { icon: 'business', name: 'Medieval Towns', desc: 'Levoča, Kežmarok, Spišská Sobota' },
    { icon: 'water', name: 'Natural Wonders', desc: 'Slovak Paradise, Tatra Mountains' },
    { icon: 'home', name: 'Folk Architecture', desc: 'Wooden churches, traditional villages' },
    { icon: 'restaurant', name: 'Local Cuisine', desc: 'Traditional restaurants & recipes' },
    { icon: 'map', name: 'Hidden Gems', desc: 'Off-the-beaten-path locations' },
    { icon: 'camera', name: 'Photo Spots', desc: 'Instagram-worthy viewpoints' },
  ];

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discover More</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Ionicons name="compass" size={60} color="#FFD700" />
            <Text style={styles.heroTitle}>Spiš Region Guide</Text>
            <Text style={styles.heroSubtitle}>Your Complete Adventure Companion</Text>
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={14} color="#000" />
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.description}>
              Loved exploring Spiš Castle? There's so much more to discover in this magical region of Slovakia!
            </Text>
            <Text style={styles.description}>
              Our premium Spiš Region Guide app takes you beyond the castle walls to explore hidden gems, medieval towns, stunning nature, and authentic Slovak culture.
            </Text>
          </View>

          {/* What's Included */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <View style={styles.attractionsGrid}>
              {attractions.map((item, index) => (
                <View key={index} style={styles.attractionItem}>
                  <View style={styles.attractionIcon}>
                    <Ionicons name={item.icon as any} size={28} color="#FFD700" />
                  </View>
                  <Text style={styles.attractionName}>{item.name}</Text>
                  <Text style={styles.attractionDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Premium Features</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                <Text style={styles.featureText}>50+ attractions with audio guides</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                <Text style={styles.featureText}>Offline maps & navigation</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                <Text style={styles.featureText}>Local restaurant recommendations</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                <Text style={styles.featureText}>Multi-day trip itineraries</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                <Text style={styles.featureText}>9 languages supported</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                <Text style={styles.featureText}>Regular content updates</Text>
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.pricingSection}>
            <Text style={styles.pricingTitle}>One-Time Purchase</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceOld}>€9.99</Text>
              <Text style={styles.priceNew}>€4.99</Text>
            </View>
            <Text style={styles.pricingNote}>Launch special - 50% off!</Text>
          </View>

          {/* Download Buttons */}
          <View style={styles.downloadSection}>
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={() => handleOpenStore('ios')}
            >
              <Ionicons name="logo-apple" size={24} color="#fff" />
              <View>
                <Text style={styles.downloadLabel}>Download on</Text>
                <Text style={styles.downloadStore}>App Store</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={() => handleOpenStore('android')}
            >
              <Ionicons name="logo-google-playstore" size={24} color="#fff" />
              <View>
                <Text style={styles.downloadLabel}>Get it on</Text>
                <Text style={styles.downloadStore}>Google Play</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Testimonial */}
          <View style={styles.testimonialSection}>
            <Ionicons name="chatbubble-ellipses" size={28} color="#FFD700" />
            <Text style={styles.testimonialText}>
              "This app made our trip to Slovakia unforgettable! We discovered places we never would have found on our own."
            </Text>
            <Text style={styles.testimonialAuthor}>— Maria, Germany</Text>
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
    paddingVertical: 30,
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 20,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
  },
  attractionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attractionItem: {
    width: '47%',
    backgroundColor: 'rgba(30,30,30,0.9)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  attractionIcon: {
    marginBottom: 10,
  },
  attractionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  attractionDesc: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  featuresList: {
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 16,
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  featureText: {
    fontSize: 15,
    color: '#fff',
    flex: 1,
  },
  pricingSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(139,69,19,0.4)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  pricingTitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  priceOld: {
    fontSize: 24,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  priceNew: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  pricingNote: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '600',
  },
  downloadSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  downloadLabel: {
    fontSize: 11,
    color: '#888',
  },
  downloadStore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  testimonialSection: {
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  testimonialText: {
    fontSize: 15,
    color: '#ccc',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
    marginBottom: 12,
  },
  testimonialAuthor: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
});

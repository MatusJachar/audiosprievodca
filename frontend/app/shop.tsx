import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import BackgroundWrapper from '../components/BackgroundWrapper';

export default function Shop() {
  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
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
          <Text style={styles.headerTitle}>Shop & Tickets</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tickets Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="ticket" size={28} color="#FFD700" />
              <Text style={styles.sectionTitle}>Entrance Tickets</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Purchase your castle entrance tickets online and skip the queue!
            </Text>
            
            <View style={styles.priceList}>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Adult</Text>
                <Text style={styles.priceValue}>€8.00</Text>
              </View>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Student / Senior</Text>
                <Text style={styles.priceValue}>€5.00</Text>
              </View>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Child (6-15)</Text>
                <Text style={styles.priceValue}>€3.00</Text>
              </View>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Family (2+2)</Text>
                <Text style={styles.priceValue}>€18.00</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.buyButton}
              onPress={() => handleOpenLink('https://www.spisskyhrad.sk/en/tickets/')}
            >
              <Ionicons name="cart" size={22} color="#000" />
              <Text style={styles.buyButtonText}>Buy Tickets Online</Text>
            </TouchableOpacity>
          </View>

          {/* Castle Shop */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bag" size={28} color="#FFD700" />
              <Text style={styles.sectionTitle}>Castle Gift Shop</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Discover unique souvenirs, books, and medieval-themed gifts.
            </Text>
            
            <View style={styles.shopItems}>
              <View style={styles.shopItem}>
                <Ionicons name="book" size={32} color="#FFD700" />
                <Text style={styles.shopItemName}>History Books</Text>
              </View>
              <View style={styles.shopItem}>
                <Ionicons name="shirt" size={32} color="#FFD700" />
                <Text style={styles.shopItemName}>T-Shirts</Text>
              </View>
              <View style={styles.shopItem}>
                <Ionicons name="gift" size={32} color="#FFD700" />
                <Text style={styles.shopItemName}>Souvenirs</Text>
              </View>
              <View style={styles.shopItem}>
                <Ionicons name="image" size={32} color="#FFD700" />
                <Text style={styles.shopItemName}>Postcards</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.shopButton}
              onPress={() => handleOpenLink('https://www.spisskyhrad.sk/en/shop/')}
            >
              <Ionicons name="storefront" size={22} color="#FFD700" />
              <Text style={styles.shopButtonText}>Visit Online Shop</Text>
            </TouchableOpacity>
          </View>

          {/* Audio Guide */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="headset" size={28} color="#FFD700" />
              <Text style={styles.sectionTitle}>Audio Guide</Text>
            </View>
            <View style={styles.audioGuideInfo}>
              <View style={styles.audioGuideFeature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.audioGuideText}>You're using it now!</Text>
              </View>
              <View style={styles.audioGuideFeature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.audioGuideText}>9 languages available</Text>
              </View>
              <View style={styles.audioGuideFeature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.audioGuideText}>Offline mode supported</Text>
              </View>
              <View style={styles.audioGuideFeature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.audioGuideText}>13 tour stops + legends</Text>
              </View>
            </View>
            <View style={styles.freeTag}>
              <Text style={styles.freeTagText}>FREE with your visit</Text>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={28} color="#FFD700" />
              <Text style={styles.sectionTitle}>Need Help?</Text>
            </View>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleOpenLink('mailto:info@spisskyhrad.sk')}
            >
              <Ionicons name="mail" size={22} color="#FFD700" />
              <Text style={styles.contactText}>info@spisskyhrad.sk</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL('tel:+421534541336')}
            >
              <Ionicons name="call" size={22} color="#FFD700" />
              <Text style={styles.contactText}>+421 53 454 1336</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleOpenLink('https://www.spisskyhrad.sk')}
            >
              <Ionicons name="globe" size={22} color="#FFD700" />
              <Text style={styles.contactText}>www.spisskyhrad.sk</Text>
            </TouchableOpacity>
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
  section: {
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionDescription: {
    fontSize: 15,
    color: '#aaa',
    marginBottom: 20,
    lineHeight: 22,
  },
  priceList: {
    marginBottom: 20,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  priceLabel: {
    fontSize: 16,
    color: '#ccc',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  shopItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  shopItem: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  shopItemName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  audioGuideInfo: {
    marginBottom: 16,
  },
  audioGuideFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  audioGuideText: {
    fontSize: 16,
    color: '#fff',
  },
  freeTag: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  freeTagText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  contactText: {
    fontSize: 16,
    color: '#fff',
  },
});

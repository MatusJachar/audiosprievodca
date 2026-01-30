import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type ContentSection = 'background' | 'shop' | 'travel' | 'discover';

interface ShopContent {
  ticket_adult: string;
  ticket_student: string;
  ticket_child: string;
  ticket_family: string;
  tickets_url: string;
  shop_url: string;
  contact_email: string;
  contact_phone: string;
  contact_website: string;
}

interface TravelContent {
  location_name: string;
  location_detail: string;
  by_car: string;
  by_bus: string;
  bus_schedule_url: string;
  by_train: string;
  train_schedule_url: string;
  opening_hours_summer: string;
  opening_hours_spring: string;
  opening_hours_winter: string;
}

interface DiscoverContent {
  app_price_old: string;
  app_price_new: string;
  app_discount_text: string;
  app_store_ios: string;
  app_store_android: string;
  guide_price: string;
  guide_phone: string;
  testimonial_text: string;
  testimonial_author: string;
}

export default function AdminContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeSection, setActiveSection] = useState<ContentSection>('background');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Background image state
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  
  // Content states
  const [shopContent, setShopContent] = useState<ShopContent>({
    ticket_adult: '€10.00',
    ticket_student: '€7.00',
    ticket_child: '€5.00',
    ticket_family: '€22.00',
    tickets_url: 'https://www.spisskyhrad.sk/en/tickets/',
    shop_url: 'https://www.spisskyhrad.sk/en/shop/',
    contact_email: 'info@spisskyhrad.sk',
    contact_phone: '+421 53 454 1336',
    contact_website: 'https://www.spisskyhrad.sk',
  });
  
  const [travelContent, setTravelContent] = useState<TravelContent>({
    location_name: 'Spišské Podhradie',
    location_detail: '053 04, Slovakia',
    by_car: 'From D1 highway, exit towards Levoča, then continue to Spišské Podhradie.',
    by_bus: 'Take bus to Spišské Podhradie. Walk 30-45 minutes to castle.',
    bus_schedule_url: 'https://cp.hnonline.sk/',
    by_train: 'Train to Spišské Vlachy, then transfer to Spišské Podhradie.',
    train_schedule_url: 'https://www.zssk.sk/en/',
    opening_hours_summer: '9:00 - 18:00',
    opening_hours_spring: '9:00 - 16:00',
    opening_hours_winter: 'Closed',
  });
  
  const [discoverContent, setDiscoverContent] = useState<DiscoverContent>({
    app_price_old: '€9.99',
    app_price_new: '€4.99',
    app_discount_text: '🔥 50% OFF - Limited time!',
    app_store_ios: '',
    app_store_android: '',
    guide_price: 'From €80 / half day',
    guide_phone: '+421 901 234 567',
    testimonial_text: 'We used both - the app for driving around and a personal guide for Levoča.',
    testimonial_author: 'Thomas & Family, Austria ⭐⭐⭐⭐⭐',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchContent();
    }
  }, [isAuthenticated, activeSection]);

  // Fetch background image on load
  useEffect(() => {
    if (isAuthenticated) {
      fetchBackgroundImage();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    const auth = await AsyncStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    } else {
      router.replace('/admin-login');
    }
    setChecking(false);
  };

  const fetchBackgroundImage = async () => {
    try {
      const response = await fetch(`${API_URL}/api/images/background`);
      const data = await response.json();
      if (data.background_image_base64) {
        setBackgroundImage(data.background_image_base64);
      }
    } catch (error) {
      console.error('Error fetching background:', error);
    }
  };

  const pickBackgroundImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploadingImage(true);
      try {
        const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const response = await fetch(`${API_URL}/api/images/background`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64 }),
        });

        if (response.ok) {
          Alert.alert('Success', 'Background image updated successfully!');
          setBackgroundImage(base64);
        } else {
          Alert.alert('Error', 'Failed to upload background image');
        }
      } catch (error) {
        Alert.alert('Error', 'Network error occurred');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const fetchContent = async () => {
    if (activeSection === 'background') {
      return; // Background is handled separately
    }
    
    setLoading(true);
    try {
      let endpoint = '';
      switch (activeSection) {
        case 'shop':
          endpoint = '/api/content/shop';
          break;
        case 'travel':
          endpoint = '/api/content/travel-info';
          break;
        case 'discover':
          endpoint = '/api/content/discover';
          break;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();
      
      switch (activeSection) {
        case 'shop':
          setShopContent(prev => ({ ...prev, ...data }));
          break;
        case 'travel':
          setTravelContent(prev => ({ ...prev, ...data }));
          break;
        case 'discover':
          setDiscoverContent(prev => ({ ...prev, ...data }));
          break;
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      let endpoint = '';
      let body = {};
      
      switch (activeSection) {
        case 'shop':
          endpoint = '/api/content/shop';
          body = shopContent;
          break;
        case 'travel':
          endpoint = '/api/content/travel-info';
          body = travelContent;
          break;
        case 'discover':
          endpoint = '/api/content/discover';
          body = discoverContent;
          break;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Content saved successfully!');
      } else {
        Alert.alert('Error', 'Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  const renderBackgroundEditor = () => (
    <View style={styles.editorContainer}>
      <Text style={styles.editorTitle}>🖼️ Main Background Image</Text>
      <Text style={styles.editorSubtitle}>
        This image appears on the home screen. Change it for different seasons or special events.
      </Text>
      
      <TouchableOpacity
        style={styles.backgroundButton}
        onPress={pickBackgroundImage}
        disabled={uploadingImage}
      >
        {backgroundImage ? (
          <Image 
            source={{ uri: `data:image/png;base64,${backgroundImage}` }} 
            style={styles.backgroundPreview}
          />
        ) : (
          <View style={styles.backgroundPlaceholder}>
            <Ionicons name="image-outline" size={64} color="#666" />
            <Text style={styles.placeholderText}>No background image</Text>
            <Text style={styles.placeholderSubtext}>Tap to upload</Text>
          </View>
        )}
        {uploadingImage && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.changeImageButton}
        onPress={pickBackgroundImage}
        disabled={uploadingImage}
      >
        <Ionicons name="camera" size={20} color="#000" />
        <Text style={styles.changeImageButtonText}>
          {backgroundImage ? 'Change Image' : 'Upload Image'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.tipBox}>
        <Ionicons name="bulb" size={20} color="#FFD700" />
        <Text style={styles.tipText}>
          Tip: Use a 16:9 landscape image for best results. Recommended size: 1920x1080 pixels.
        </Text>
      </View>
      
      <View style={styles.seasonSuggestions}>
        <Text style={styles.seasonTitle}>Seasonal suggestions:</Text>
        <Text style={styles.seasonItem}>🌸 Spring: Castle with blooming meadows</Text>
        <Text style={styles.seasonItem}>☀️ Summer: Sunny castle view</Text>
        <Text style={styles.seasonItem}>🍂 Autumn: Golden foliage around castle</Text>
        <Text style={styles.seasonItem}>❄️ Winter: Snow-covered castle</Text>
      </View>
    </View>
  );

  const renderShopEditor = () => (
    <View style={styles.editorContainer}>
      <Text style={styles.editorTitle}>Ticket Prices</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Adult Ticket</Text>
        <TextInput
          style={styles.input}
          value={shopContent.ticket_adult}
          onChangeText={(text) => setShopContent(prev => ({ ...prev, ticket_adult: text }))}
          placeholder="€10.00"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Student/Senior Ticket</Text>
        <TextInput
          style={styles.input}
          value={shopContent.ticket_student}
          onChangeText={(text) => setShopContent(prev => ({ ...prev, ticket_student: text }))}
          placeholder="€7.00"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Child Ticket (6-15)</Text>
        <TextInput
          style={styles.input}
          value={shopContent.ticket_child}
          onChangeText={(text) => setShopContent(prev => ({ ...prev, ticket_child: text }))}
          placeholder="€5.00"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Family Ticket (2+2)</Text>
        <TextInput
          style={styles.input}
          value={shopContent.ticket_family}
          onChangeText={(text) => setShopContent(prev => ({ ...prev, ticket_family: text }))}
          placeholder="€22.00"
          placeholderTextColor="#666"
        />
      </View>
      
      <Text style={styles.editorTitle}>Links</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Tickets URL</Text>
        <TextInput
          style={styles.input}
          value={shopContent.tickets_url}
          onChangeText={(text) => setShopContent(prev => ({ ...prev, tickets_url: text }))}
          placeholder="https://..."
          placeholderTextColor="#666"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Shop URL</Text>
        <TextInput
          style={styles.input}
          value={shopContent.shop_url}
          onChangeText={(text) => setShopContent(prev => ({ ...prev, shop_url: text }))}
          placeholder="https://..."
          placeholderTextColor="#666"
          autoCapitalize="none"
        />
      </View>
      
      <Text style={styles.editorTitle}>Contact</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={shopContent.contact_email}
          onChangeText={(text) => setShopContent(prev => ({ ...prev, contact_email: text }))}
          placeholder="info@..."
          placeholderTextColor="#666"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone</Text>
        <TextInput
          style={styles.input}
          value={shopContent.contact_phone}
          onChangeText={(text) => setShopContent(prev => ({ ...prev, contact_phone: text }))}
          placeholder="+421..."
          placeholderTextColor="#666"
          keyboardType="phone-pad"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Website</Text>
        <TextInput
          style={styles.input}
          value={shopContent.contact_website}
          onChangeText={(text) => setShopContent(prev => ({ ...prev, contact_website: text }))}
          placeholder="https://..."
          placeholderTextColor="#666"
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderTravelEditor = () => (
    <View style={styles.editorContainer}>
      <Text style={styles.editorTitle}>Location</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location Name</Text>
        <TextInput
          style={styles.input}
          value={travelContent.location_name}
          onChangeText={(text) => setTravelContent(prev => ({ ...prev, location_name: text }))}
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location Detail</Text>
        <TextInput
          style={styles.input}
          value={travelContent.location_detail}
          onChangeText={(text) => setTravelContent(prev => ({ ...prev, location_detail: text }))}
          placeholderTextColor="#666"
        />
      </View>
      
      <Text style={styles.editorTitle}>Opening Hours</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Summer (Jun-Sep)</Text>
        <TextInput
          style={styles.input}
          value={travelContent.opening_hours_summer}
          onChangeText={(text) => setTravelContent(prev => ({ ...prev, opening_hours_summer: text }))}
          placeholder="9:00 - 18:00"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Spring/Autumn</Text>
        <TextInput
          style={styles.input}
          value={travelContent.opening_hours_spring}
          onChangeText={(text) => setTravelContent(prev => ({ ...prev, opening_hours_spring: text }))}
          placeholder="9:00 - 16:00"
          placeholderTextColor="#666"
        />
      </View>
      
      <Text style={styles.editorTitle}>Transportation</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>By Car</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={travelContent.by_car}
          onChangeText={(text) => setTravelContent(prev => ({ ...prev, by_car: text }))}
          multiline
          numberOfLines={3}
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>By Bus</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={travelContent.by_bus}
          onChangeText={(text) => setTravelContent(prev => ({ ...prev, by_bus: text }))}
          multiline
          numberOfLines={3}
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Bus Schedule URL</Text>
        <TextInput
          style={styles.input}
          value={travelContent.bus_schedule_url}
          onChangeText={(text) => setTravelContent(prev => ({ ...prev, bus_schedule_url: text }))}
          autoCapitalize="none"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>By Train</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={travelContent.by_train}
          onChangeText={(text) => setTravelContent(prev => ({ ...prev, by_train: text }))}
          multiline
          numberOfLines={3}
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Train Schedule URL</Text>
        <TextInput
          style={styles.input}
          value={travelContent.train_schedule_url}
          onChangeText={(text) => setTravelContent(prev => ({ ...prev, train_schedule_url: text }))}
          autoCapitalize="none"
          placeholderTextColor="#666"
        />
      </View>
    </View>
  );

  const renderDiscoverEditor = () => (
    <View style={styles.editorContainer}>
      <Text style={styles.editorTitle}>Regional App Promo</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Original Price</Text>
        <TextInput
          style={styles.input}
          value={discoverContent.app_price_old}
          onChangeText={(text) => setDiscoverContent(prev => ({ ...prev, app_price_old: text }))}
          placeholder="€9.99"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Discounted Price</Text>
        <TextInput
          style={styles.input}
          value={discoverContent.app_price_new}
          onChangeText={(text) => setDiscoverContent(prev => ({ ...prev, app_price_new: text }))}
          placeholder="€4.99"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Discount Text</Text>
        <TextInput
          style={styles.input}
          value={discoverContent.app_discount_text}
          onChangeText={(text) => setDiscoverContent(prev => ({ ...prev, app_discount_text: text }))}
          placeholder="🔥 50% OFF!"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>iOS App Store URL</Text>
        <TextInput
          style={styles.input}
          value={discoverContent.app_store_ios}
          onChangeText={(text) => setDiscoverContent(prev => ({ ...prev, app_store_ios: text }))}
          autoCapitalize="none"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Android Play Store URL</Text>
        <TextInput
          style={styles.input}
          value={discoverContent.app_store_android}
          onChangeText={(text) => setDiscoverContent(prev => ({ ...prev, app_store_android: text }))}
          autoCapitalize="none"
          placeholderTextColor="#666"
        />
      </View>
      
      <Text style={styles.editorTitle}>Personal Guide</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Guide Price</Text>
        <TextInput
          style={styles.input}
          value={discoverContent.guide_price}
          onChangeText={(text) => setDiscoverContent(prev => ({ ...prev, guide_price: text }))}
          placeholder="From €80 / half day"
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Guide Phone</Text>
        <TextInput
          style={styles.input}
          value={discoverContent.guide_phone}
          onChangeText={(text) => setDiscoverContent(prev => ({ ...prev, guide_phone: text }))}
          keyboardType="phone-pad"
          placeholderTextColor="#666"
        />
      </View>
      
      <Text style={styles.editorTitle}>Testimonial</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Testimonial Text</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={discoverContent.testimonial_text}
          onChangeText={(text) => setDiscoverContent(prev => ({ ...prev, testimonial_text: text }))}
          multiline
          numberOfLines={3}
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Testimonial Author</Text>
        <TextInput
          style={styles.input}
          value={discoverContent.testimonial_author}
          onChangeText={(text) => setDiscoverContent(prev => ({ ...prev, testimonial_author: text }))}
          placeholderTextColor="#666"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Content</Text>
        <TouchableOpacity onPress={saveContent} disabled={saving || activeSection === 'background'}>
          {saving ? (
            <ActivityIndicator size="small" color="#FFD700" />
          ) : (
            <Ionicons name="checkmark" size={24} color={activeSection === 'background' ? '#666' : '#FFD700'} />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Section Tabs - Scrollable */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeSection === 'background' && styles.tabActive]}
            onPress={() => setActiveSection('background')}
          >
            <Ionicons 
              name="image" 
              size={20} 
              color={activeSection === 'background' ? '#000' : '#FFD700'} 
            />
            <Text style={[styles.tabText, activeSection === 'background' && styles.tabTextActive]}>
              Background
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeSection === 'shop' && styles.tabActive]}
            onPress={() => setActiveSection('shop')}
          >
            <Ionicons 
              name="cart" 
              size={20} 
              color={activeSection === 'shop' ? '#000' : '#FFD700'} 
            />
            <Text style={[styles.tabText, activeSection === 'shop' && styles.tabTextActive]}>
              Shop
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeSection === 'travel' && styles.tabActive]}
            onPress={() => setActiveSection('travel')}
          >
            <Ionicons 
              name="bus" 
              size={20} 
              color={activeSection === 'travel' ? '#000' : '#FFD700'} 
            />
            <Text style={[styles.tabText, activeSection === 'travel' && styles.tabTextActive]}>
              Travel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeSection === 'discover' && styles.tabActive]}
            onPress={() => setActiveSection('discover')}
          >
            <Ionicons 
              name="compass" 
              size={20} 
              color={activeSection === 'discover' ? '#000' : '#FFD700'} 
            />
            <Text style={[styles.tabText, activeSection === 'discover' && styles.tabTextActive]}>
              Discover
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeSection === 'background' && renderBackgroundEditor()}
          {activeSection === 'shop' && renderShopEditor()}
          {activeSection === 'travel' && renderTravelEditor()}
          {activeSection === 'discover' && renderDiscoverEditor()}
          
          {activeSection !== 'background' && (
            <TouchableOpacity style={styles.saveButton} onPress={saveContent} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#000" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0c0c0c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 56,
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,215,0,0.1)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FFD700',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  tabTextActive: {
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  editorContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  editorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTourTypeStore, TOUR_ROUTES, TourType } from '../store/tourTypeStore';
import { useLanguageStore } from '../store/languageStore';
import { useTourStore } from '../store/tourStore';
import BackgroundWrapper from '../components/BackgroundWrapper';
import { OfflineCacheManager } from '../utils/offlineCacheManager';
import { useState } from 'react';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function TourSelect() {
  const { selectedTourType, setTourType } = useTourTypeStore();
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const { tourStops, fetchTourStops } = useTourStore();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ total: 0, downloaded: 0, currentItem: '' });

  const handleTourSelect = async (tourType: TourType) => {
    await setTourType(tourType);
  };

  const handleContinue = async () => {
    // Check if already cached
    const isCached = await OfflineCacheManager.isTourCached(selectedLanguage);
    
    if (isCached) {
      router.push('/tour');
    } else {
      setShowDownloadModal(true);
    }
  };

  const handleDownloadTour = async () => {
    try {
      setDownloading(true);
      
      // Fetch tour stops if not already loaded
      if (tourStops.length === 0) {
        await fetchTourStops();
      }

      // Download tour data for offline use
      await OfflineCacheManager.downloadTourForOffline(
        tourStops,
        selectedLanguage,
        API_URL || '',
        (progress) => {
          setDownloadProgress(progress);
        }
      );

      setDownloading(false);
      setShowDownloadModal(false);
      
      Alert.alert(
        'Download Complete!',
        'Tour is now available offline. Enjoy your visit!',
        [{ text: 'Start Tour', onPress: () => router.push('/tour') }]
      );
    } catch (error) {
      setDownloading(false);
      Alert.alert(
        'Download Failed',
        'Unable to download tour. You can still use online mode.',
        [
          { text: 'Try Again', onPress: handleDownloadTour },
          { text: 'Use Online', onPress: () => router.push('/tour') }
        ]
      );
    }
  };

  const handleSkipDownload = () => {
    setShowDownloadModal(false);
    router.push('/tour');
  };

  const renderTourCard = (tourType: TourType) => {
    const route = TOUR_ROUTES[tourType];
    const isSelected = selectedTourType === tourType;
    const totalStops = route.stopNumbers.length; // Only count numbered stops, not legends

    return (
      <TouchableOpacity
        key={route.id}
        style={[
          styles.tourCard,
          isSelected && styles.tourCardSelected,
        ]}
        onPress={() => handleTourSelect(tourType)}
      >
        <View style={styles.tourCardHeader}>
          <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
            <Ionicons name={route.icon as any} size={32} color={isSelected ? '#000' : '#FFD700'} />
          </View>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
          )}
        </View>

        <Text style={[styles.tourName, isSelected && styles.tourNameSelected]}>
          {route.name}
        </Text>
        
        <Text style={styles.tourDescription}>{route.description}</Text>

        <View style={styles.tourDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="location" size={16} color="#FFD700" />
            <Text style={styles.detailText}>{totalStops} stops</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color="#FFD700" />
            <Text style={styles.detailText}>{route.duration}</Text>
          </View>
        </View>

        <View style={styles.includesSection}>
          <Text style={styles.includesTitle}>Includes:</Text>
          <Text style={styles.includesText}>
            • {route.stopNumbers.length} tour stops
          </Text>
          <Text style={styles.includesText}>
            • {route.totalLegends} legend {route.totalLegends > 1 ? 'stories' : 'story'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Ionicons name="map" size={48} color="#FFD700" />
            <Text style={styles.title}>Choose Your Tour</Text>
            <Text style={styles.subtitle}>Select the experience that fits your time</Text>
          </View>
        </View>
        
        <ScrollView 
          style={styles.tourList} 
          contentContainerStyle={styles.tourListContent}
          showsVerticalScrollIndicator={false}
        >
          {renderTourCard('express')}
          {renderTourCard('family')}
          {renderTourCard('complete')}
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    padding: 16,
    paddingLeft: 24,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },
  tourList: {
    flex: 1,
  },
  tourListContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  tourCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tourCardSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#2a2a2a',
  },
  tourCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSelected: {
    backgroundColor: '#FFD700',
  },
  selectedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  tourName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tourNameSelected: {
    color: '#FFD700',
  },
  tourDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 16,
  },
  tourDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: '600',
  },
  includesSection: {
    gap: 4,
  },
  includesTitle: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  includesText: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 30,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});

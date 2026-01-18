import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Dimensions } from 'react-native';
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
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 16) / 3; // 3 cards with padding and gaps

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
    router.push('/tour');
  };

  const handleDownloadTour = async () => {
    try {
      setDownloading(true);
      
      if (tourStops.length === 0) {
        await fetchTourStops();
      }
      
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
      console.error('[TourSelect] Download error:', error);
      setDownloading(false);
      Alert.alert(
        'Download Failed',
        'Unable to download tour. You can still use online mode.',
        [
          { text: 'Try Again', onPress: handleDownloadTour },
          { text: 'Use Online', onPress: () => {
            setShowDownloadModal(false);
            router.push('/tour');
          }}
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
    const totalStops = route.stopNumbers.length;

    // Card colors based on tour type
    const cardColors = {
      express: { bg: '#1a1a2e', accent: '#00d9ff', icon: 'flash' },
      family: { bg: '#1a2e1a', accent: '#4CAF50', icon: 'people' },
      complete: { bg: '#2e1a1a', accent: '#FFD700', icon: 'trophy' },
    };
    const colors = cardColors[tourType];

    return (
      <TouchableOpacity
        key={route.id}
        style={[
          styles.tourCard,
          { backgroundColor: colors.bg },
          isSelected && [styles.tourCardSelected, { borderColor: colors.accent }],
        ]}
        onPress={() => handleTourSelect(tourType)}
        activeOpacity={0.8}
      >
        {/* Selection indicator */}
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark" size={14} color="#000" />
          </View>
        )}

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: isSelected ? colors.accent : 'rgba(255,255,255,0.1)' }]}>
          <Ionicons 
            name={colors.icon as any} 
            size={28} 
            color={isSelected ? '#000' : colors.accent} 
          />
        </View>

        {/* Tour Name */}
        <Text style={[styles.tourName, isSelected && { color: colors.accent }]} numberOfLines={1}>
          {route.name.replace(' Tour', '')}
        </Text>

        {/* Duration Badge */}
        <View style={styles.durationBadge}>
          <Ionicons name="time-outline" size={12} color="#fff" />
          <Text style={styles.durationText}>{route.duration}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>{totalStops}</Text>
            <Text style={styles.statLabel}>stops</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>{route.totalLegends}</Text>
            <Text style={styles.statLabel}>legends</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.tourDescription} numberOfLines={3}>
          {route.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Ionicons name="compass" size={40} color="#FFD700" />
            <Text style={styles.title}>Choose Your Adventure</Text>
            <Text style={styles.subtitle}>Select the tour that fits your time</Text>
          </View>
        </View>
        
        {/* Tour Cards Grid - 3 side by side */}
        <View style={styles.cardsContainer}>
          <View style={styles.cardsRow}>
            {renderTourCard('express')}
            {renderTourCard('family')}
            {renderTourCard('complete')}
          </View>
        </View>

        {/* Selected Tour Info */}
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedLabel}>Selected:</Text>
          <Text style={styles.selectedName}>{TOUR_ROUTES[selectedTourType].name}</Text>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Start Tour</Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Download Modal */}
      <Modal
        visible={showDownloadModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="download" size={48} color="#FFD700" />
              <Text style={styles.modalTitle}>Download Tour</Text>
              <Text style={styles.modalSubtitle}>
                Download tour content for offline access
              </Text>
            </View>

            {downloading ? (
              <View style={styles.downloadProgress}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.progressText}>
                  Downloading... {downloadProgress.downloaded}/{downloadProgress.total}
                </Text>
                <Text style={styles.progressItem}>
                  {downloadProgress.currentItem}
                </Text>
              </View>
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={handleDownloadTour}
                >
                  <Ionicons name="download" size={20} color="#000" />
                  <Text style={styles.downloadButtonText}>Download Now</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkipDownload}
                >
                  <Text style={styles.skipButtonText}>Use Online Mode</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 12,
    paddingLeft: 20,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 6,
    textAlign: 'center',
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  tourCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    paddingTop: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    minHeight: 280,
  },
  tourCardSelected: {
    borderWidth: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tourName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 12,
  },
  durationText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    justifyContent: 'center',
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#333',
  },
  tourDescription: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 4,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  selectedLabel: {
    fontSize: 14,
    color: '#888',
  },
  selectedName: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },
  downloadProgress: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  progressText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  progressItem: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },
  modalButtons: {
    gap: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#aaa',
  },
});

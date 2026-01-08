import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTourStore } from '../store/tourStore';
import { useLanguageStore } from '../store/languageStore';
import { useTourTypeStore } from '../store/tourTypeStore';
import { useEffect, useMemo, useState } from 'react';
import BackgroundWrapper from '../components/BackgroundWrapper';
import { OfflineCacheManager } from '../utils/offlineCacheManager';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Tour() {
  const { tourStops, userProgress, loading, fetchTourStops, fetchUserProgress } = useTourStore();
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const { getTourRoute } = useTourTypeStore();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ total: 0, downloaded: 0, currentItem: '' });
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'complete' | 'error'>('idle');

  useEffect(() => {
    if (tourStops.length === 0) {
      fetchTourStops();
    }
    if (!userProgress) {
      fetchUserProgress('default-user');
    }
    
    // Check if tour is already cached for offline use
    const checkOfflineStatus = async () => {
      try {
        const isCached = await OfflineCacheManager.isTourCached(selectedLanguage);
        setIsOfflineCached(isCached);
        console.log('[Tour] Offline cache status:', isCached ? 'CACHED' : 'NOT CACHED');
      } catch (error) {
        console.warn('[Tour] Could not check offline status:', error);
      }
    };
    checkOfflineStatus();
  }, [selectedLanguage]);

  // Handle download for offline mode
  const handleDownloadForOffline = async () => {
    // Check if on web - offline not supported
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available on Web',
        'Offline mode is only available in the mobile app. Please use Expo Go to download tour for offline access.',
        [{ text: 'OK', onPress: () => setShowDownloadModal(false) }]
      );
      return;
    }
    
    try {
      setDownloadStatus('downloading');
      setDownloading(true);
      
      console.log('[Tour] Starting offline download for language:', selectedLanguage);
      console.log('[Tour] Tour stops to download:', filteredTourStops.length);
      
      await OfflineCacheManager.downloadTourForOffline(
        filteredTourStops,
        selectedLanguage,
        API_URL || '',
        (progress) => {
          console.log('[Tour] Download progress:', progress.downloaded, '/', progress.total, '-', progress.currentItem);
          setDownloadProgress(progress);
        }
      );

      setDownloadStatus('complete');
      setIsOfflineCached(true);
      setDownloading(false);
      
      // Auto-close modal after success
      setTimeout(() => {
        setShowDownloadModal(false);
        setDownloadStatus('idle');
        Alert.alert(
          '✅ Download Complete!',
          `Tour is now available offline in ${getLanguageName(selectedLanguage)}. Enjoy your visit to Spiš Castle!`
        );
      }, 1500);
      
    } catch (error) {
      console.error('[Tour] Download error:', error);
      setDownloadStatus('error');
      setDownloading(false);
    }
  };

  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      en: 'English', sk: 'Slovak', de: 'German', pl: 'Polish',
      ru: 'Russian', es: 'Spanish', hu: 'Hungarian', zh: 'Chinese', fr: 'French'
    };
    return names[code] || code;
  };

  // Filter tour stops based on selected tour type
  const filteredTourStops = useMemo(() => {
    const tourRoute = getTourRoute();
    
    return tourStops.filter(stop => {
      // Check if it's a legend stop
      const isLegendStop = stop.stop_name && stop.stop_name.startsWith('Legend ');
      
      if (isLegendStop) {
        // For legend stops, check if the index is in legendIndexes
        // Legend stops have stop_name like "Legend 1", "Legend 2", etc.
        const legendMatch = stop.stop_name?.match(/Legend (\d+)/);
        if (legendMatch) {
          const legendNumber = parseInt(legendMatch[1]);
          const legendIndex = legendNumber - 1; // Convert to 0-based index
          return tourRoute.legendIndexes.includes(legendIndex);
        }
        return false;
      } else {
        // For regular stops, check if stop_number is in stopNumbers
        return tourRoute.stopNumbers.includes(stop.stop_number);
      }
    });
  }, [tourStops, getTourRoute]);

  const isStopCompleted = (stopId: string) => {
    return userProgress?.completed_stops.includes(stopId) || false;
  };

  // Calculate progress based on filtered stops
  const completedInTour = useMemo(() => {
    const filteredIds = filteredTourStops.map(stop => stop.id);
    return userProgress?.completed_stops.filter(id => filteredIds.includes(id)).length || 0;
  }, [filteredTourStops, userProgress]);

  const totalCount = filteredTourStops.length;
  const progressPercentage = totalCount > 0 ? (completedInTour / totalCount) * 100 : 0;

  const renderTourStop = ({ item }: { item: any }) => {
    const content = item.content?.[selectedLanguage] || item.content?.['en'] || { title: 'Loading...', description: '' };
    const completed = isStopCompleted(item.id);
    // Check if it's a legend - either by stop_name or by missing stop_number
    const isLegendStop = !item.stop_number || (item.stop_name && item.stop_name.includes('Legend'));
    
    return (
      <TouchableOpacity
        style={styles.stopCard}
        onPress={() => router.push({ 
          pathname: '/stop-detail', 
          params: { stopId: item.id } 
        })}
      >
        <View style={styles.stopNumber}>
          {isLegendStop ? (
            <Ionicons name="book" size={28} color="#000" />
          ) : (
            <Text style={styles.stopNumberText}>{item.stop_number}</Text>
          )}
        </View>
        
        <View style={styles.stopContent}>
          <Text style={styles.stopTitle} numberOfLines={1} ellipsizeMode="tail">
            {content?.title || 'Loading...'}
          </Text>
          <Text style={styles.stopDescription}>
            {content?.description || ''}
          </Text>
        </View>
        
        <View style={styles.stopActions}>
          {completed && (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          )}
          <Ionicons name={isLegendStop ? "book" : "play-circle"} size={32} color="#FFD700" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && tourStops.length === 0) {
    return (
      <BackgroundWrapper>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading tour...</Text>
        </View>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{getTourRoute().name}</Text>
          <Text style={styles.headerSubtitle}>{getTourRoute().duration}</Text>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedInTour} / {totalCount} completed
          </Text>
        </View>
      </View>
      
      {/* Tour Stops List */}
      <FlatList
        data={filteredTourStops}
        renderItem={renderTourStop}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#aaa',
  },
  listContent: {
    padding: 16,
  },
  stopCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
    minHeight: 80,
  },
  stopNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stopNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  stopContent: {
    flex: 1,
    paddingRight: 8,
  },
  stopTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  stopDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    maxHeight: 40,
    overflow: 'hidden',
  },
  stopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

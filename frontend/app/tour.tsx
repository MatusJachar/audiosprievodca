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
      
      // Use all tourStops if filteredTourStops is empty
      const stopsToDownload = filteredTourStops.length > 0 ? filteredTourStops : tourStops;
      
      console.log('[Tour] API_URL:', API_URL);
      console.log('[Tour] Starting offline download for language:', selectedLanguage);
      console.log('[Tour] Tour stops to download:', stopsToDownload.length);
      console.log('[Tour] First stop:', stopsToDownload[0]?.id);
      
      if (stopsToDownload.length === 0) {
        throw new Error('No tour stops available to download');
      }
      
      if (!API_URL) {
        throw new Error('API URL not configured');
      }
      
      await OfflineCacheManager.downloadTourForOffline(
        stopsToDownload,
        selectedLanguage,
        API_URL,
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
          <View style={styles.headerActions}>
            {/* Download for Offline Button */}
            <TouchableOpacity 
              onPress={() => setShowDownloadModal(true)} 
              style={[
                styles.downloadHeaderButton,
                isOfflineCached && styles.downloadHeaderButtonCached
              ]}
            >
              <Ionicons 
                name={isOfflineCached ? "checkmark-circle" : "cloud-download"} 
                size={20} 
                color={isOfflineCached ? "#4CAF50" : "#FFD700"} 
              />
              <Text style={[
                styles.downloadHeaderText,
                isOfflineCached && styles.downloadHeaderTextCached
              ]}>
                {isOfflineCached ? "Offline Ready" : "Download"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Ionicons name="settings" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
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
      
      {/* Download for Offline Modal */}
      <Modal
        visible={showDownloadModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !downloading && setShowDownloadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              {downloadStatus === 'complete' ? (
                <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              ) : downloadStatus === 'error' ? (
                <Ionicons name="alert-circle" size={64} color="#FF5252" />
              ) : (
                <Ionicons name="cloud-download" size={64} color="#FFD700" />
              )}
              
              <Text style={styles.modalTitle}>
                {downloadStatus === 'complete' ? 'Download Complete!' :
                 downloadStatus === 'error' ? 'Download Failed' :
                 isOfflineCached ? 'Tour Already Downloaded' : 'Download for Offline'}
              </Text>
              
              <Text style={styles.modalSubtitle}>
                {downloadStatus === 'complete' ? 'Your tour is ready for offline use!' :
                 downloadStatus === 'error' ? 'Something went wrong. Please try again.' :
                 isOfflineCached ? `Tour is cached in ${getLanguageName(selectedLanguage)}` :
                 `Download ${filteredTourStops.length} stops for offline access`}
              </Text>
            </View>

            {/* Download Progress */}
            {downloading && (
              <View style={styles.downloadProgressSection}>
                <ActivityIndicator size="large" color="#FFD700" />
                <View style={styles.progressBarContainer}>
                  <View style={styles.downloadProgressBar}>
                    <View 
                      style={[
                        styles.downloadProgressFill, 
                        { width: `${(downloadProgress.downloaded / Math.max(downloadProgress.total, 1)) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressPercentage}>
                    {downloadProgress.total > 0 
                      ? Math.round((downloadProgress.downloaded / downloadProgress.total) * 100)
                      : 0}%
                  </Text>
                </View>
                <Text style={styles.progressText}>
                  Downloading {downloadProgress.downloaded}/{downloadProgress.total} stops
                </Text>
                <Text style={styles.progressCurrentItem}>
                  {downloadProgress.currentItem}
                </Text>
              </View>
            )}

            {/* Modal Actions */}
            {!downloading && downloadStatus !== 'complete' && (
              <View style={styles.modalActions}>
                {!isOfflineCached && (
                  <TouchableOpacity
                    style={styles.downloadNowButton}
                    onPress={handleDownloadForOffline}
                  >
                    <Ionicons name="download" size={20} color="#000" />
                    <Text style={styles.downloadNowButtonText}>Download Now</Text>
                  </TouchableOpacity>
                )}
                
                {isOfflineCached && (
                  <TouchableOpacity
                    style={styles.redownloadButton}
                    onPress={handleDownloadForOffline}
                  >
                    <Ionicons name="refresh" size={20} color="#FFD700" />
                    <Text style={styles.redownloadButtonText}>Re-download Tour</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setShowDownloadModal(false)}
                >
                  <Text style={styles.closeModalButtonText}>
                    {isOfflineCached ? 'Close' : 'Use Online Mode'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Error Actions */}
            {downloadStatus === 'error' && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.downloadNowButton}
                  onPress={handleDownloadForOffline}
                >
                  <Ionicons name="refresh" size={20} color="#000" />
                  <Text style={styles.downloadNowButtonText}>Try Again</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => {
                    setShowDownloadModal(false);
                    setDownloadStatus('idle');
                  }}
                >
                  <Text style={styles.closeModalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Platform Notice */}
            {Platform.OS === 'web' && (
              <View style={styles.platformNotice}>
                <Ionicons name="information-circle" size={20} color="#FFD700" />
                <Text style={styles.platformNoticeText}>
                  Offline mode is only available in the mobile app (Expo Go)
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  // Header actions container
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  downloadHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  downloadHeaderButtonCached: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  downloadHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  downloadHeaderTextCached: {
    color: '#4CAF50',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  downloadProgressSection: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  downloadProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  downloadProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    minWidth: 40,
    textAlign: 'right',
  },
  progressCurrentItem: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
  },
  downloadNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  downloadNowButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  redownloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 8,
  },
  redownloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  closeModalButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
  },
  closeModalButtonText: {
    fontSize: 14,
    color: '#888',
  },
  platformNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  platformNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#FFD700',
    lineHeight: 16,
  },
});

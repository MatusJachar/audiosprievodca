import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTourStore } from '../store/tourStore';
import { useLanguageStore } from '../store/languageStore';
import { useTourTypeStore } from '../store/tourTypeStore';
import { useEffect, useMemo, useState, useRef } from 'react';
import { OfflineCacheManager } from '../utils/offlineCacheManager';
import { LinearGradient } from 'expo-linear-gradient';
import BackgroundWrapper from '../components/BackgroundWrapper';

const API_URL = 'http://178.104.72.151:8002';

// Color scheme
const COLORS = {
  primary: '#4A90D9',
  secondary: '#7B68EE',
  accent: '#E8B923',
  dark: '#1a1a2e',
  darker: '#0f0f1a',
  card: '#252542',
  text: '#ffffff',
  textSecondary: '#b8c5d6',
  success: '#4CAF50',
};

export default function Tour() {
  const tourStops = useTourStore((state) => state.tourStops);
  const userProgress = useTourStore((state) => state.userProgress);
  const loading = useTourStore((state) => state.loading);
  const fetchTourStops = useTourStore((state) => state.fetchTourStops);
  const fetchUserProgress = useTourStore((state) => state.fetchUserProgress);
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const { getTourRoute } = useTourTypeStore();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ total: 0, downloaded: 0, currentItem: '' });
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'complete' | 'error'>('idle');
  const [initialPreloadStatus, setInitialPreloadStatus] = useState<string>('');
  const initialPreloadDone = useRef(false);

  useEffect(() => {
    fetchTourStops();
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

  // Initial preload: When user enters tour, preload first 3 stops
  useEffect(() => {
    const runInitialPreload = async () => {
      if (!API_URL || tourStops.length === 0 || initialPreloadDone.current) return;
      
      initialPreloadDone.current = true;
      const tourRoute = getTourRoute();
      
      console.log(`[Tour] Starting initial preload for ${tourRoute.name}`);
      console.log(`[Tour] Tour route: ${tourRoute.stopNumbers.join(' → ')}`);
      setInitialPreloadStatus('Preparing tour...');
      
      try {
        // Preload first 3 stops
        await OfflineCacheManager.preloadNextStops(
          0,
          tourStops,
          selectedLanguage,
          API_URL,
          3,
          tourRoute.stopNumbers
        );
        
        setInitialPreloadStatus('');
        console.log('[Tour] Initial preload complete');
      } catch (error) {
        console.error('[Tour] Initial preload error:', error);
        setInitialPreloadStatus('');
      }
    };

    const timer = setTimeout(runInitialPreload, 2000);
    return () => clearTimeout(timer);
  }, [tourStops.length, selectedLanguage]);

  // Handle download for offline mode
  const handleDownloadForOffline = async () => {
    try {
      setDownloadStatus('downloading');
      setDownloading(true);
      
      // Use all tourStops if filteredTourStops is empty
      const stopsToDownload = filteredTourStops.length > 0 ? filteredTourStops : tourStops;
      
      console.log('[Tour] API_URL:', API_URL);
      console.log('[Tour] Starting offline download for language:', selectedLanguage);
      console.log('[Tour] Tour stops to download:', stopsToDownload.length);
      
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
    console.log('[Filter] tourStops count:', tourStops.length);
    if (tourStops.length === 0) return [];
    const STOP_NUMBERS = [1, 2, 4, 6, 8, 11, 12];
    const result = tourStops.filter(stop => {
      if (stop.stop_name && stop.stop_name.startsWith('Legend ')) {
        return stop.stop_name === 'Legend 3';
      }
      return STOP_NUMBERS.includes(Number(stop.stop_number));
    }).sort((a, b) => {
      if (a.stop_number && b.stop_number) return Number(a.stop_number) - Number(b.stop_number);
      if (a.stop_number) return -1;
      return 1;
    });
    console.log('[Filter] result count:', result.length);
    return result;
  }, [tourStops]);

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
          <Ionicons name={isLegendStop ? "book" : "play-circle"} size={32} color="#4A90D9" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && tourStops.length === 0) {
    return (
      <BackgroundWrapper>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#4A90D9" />
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
                color={isOfflineCached ? "#4CAF50" : "#4A90D9"} 
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
          <Text style={styles.headerTitle}>Spissky hrad Tour</Text>
          <Text style={styles.headerSubtitle}>8 zastavok | 45-60 minut</Text>
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

      {/* Initial Preload Status */}
      {initialPreloadStatus !== '' && (
        <View style={styles.preloadStatusBar}>
          <ActivityIndicator size="small" color="#4A90D9" />
          <Text style={styles.preloadStatusText}>{initialPreloadStatus}</Text>
        </View>
      )}
      
      {/* Download Banner - Only show if NOT cached */}
      {!isOfflineCached && (
        <TouchableOpacity 
          style={styles.offlineBanner}
          onPress={() => setShowDownloadModal(true)}
        >
          <View style={styles.offlineBannerIcon}>
            <Ionicons name="cloud-download" size={32} color="#000" />
          </View>
          <View style={styles.offlineBannerText}>
            <Text style={styles.offlineBannerTitle}>Download for Offline Use</Text>
            <Text style={styles.offlineBannerSubtitle}>
              Tap here to save tour for use without internet
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#000" />
        </TouchableOpacity>
      )}
      
      {/* Tour Stops List */}
      <FlatList
        data={filteredTourStops}
        renderItem={renderTourStop}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => (
          <View style={styles.listFooter}>
            {/* Nearby Restaurants - GastroFlow Deep Link */}
            <TouchableOpacity
              style={styles.gastroFlowButton}
              onPress={async () => {
                // Try deep link first, fallback to partners page
                try {
                  const canOpen = await Linking.canOpenURL('gastroflow://restaurants');
                  if (canOpen) {
                    // Track referral
                    fetch(`${API_URL}/api/deeplink/referral`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        source_app: 'audioguide',
                        target_app: 'gastroflow',
                        referral_type: 'direct',
                      }),
                    }).catch(() => {});
                    await Linking.openURL('gastroflow://restaurants?ref=audioguide');
                  } else {
                    router.push('/partners');
                  }
                } catch {
                  router.push('/partners');
                }
              }}
            >
              <View style={styles.gastroFlowIcon}>
                <Ionicons name="restaurant" size={24} color="#000" />
              </View>
              <View style={styles.gastroFlowText}>
                <Text style={styles.gastroFlowTitle}>Restauracie v okoli</Text>
                <Text style={styles.gastroFlowSubtitle}>Najdite najlepsie jedlo blizko hradu</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#000" />
            </TouchableOpacity>

            {/* Partners link */}
            <TouchableOpacity
              style={styles.partnersButton}
              onPress={() => router.push('/partners')}
            >
              <Ionicons name="business" size={20} color={COLORS.primary} />
              <Text style={styles.partnersButtonText}>Vsetci partneri a sluzby</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
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
                <Ionicons name="cloud-download" size={64} color="#4A90D9" />
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
                <ActivityIndicator size="large" color="#4A90D9" />
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
                    <Ionicons name="refresh" size={20} color="#4A90D9" />
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

            {/* Info Notice */}
            {!downloading && downloadStatus !== 'complete' && (
              <View style={styles.platformNotice}>
                <Ionicons name="information-circle" size={20} color="#4A90D9" />
                <Text style={styles.platformNoticeText}>
                  Downloads audio for offline use. Works on all platforms.
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
    color: '#4A90D9',
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
    backgroundColor: '#4A90D9',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#aaa',
  },
  listContent: {
    padding: 16,
  },
  preloadStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    gap: 8,
  },
  preloadStatusText: {
    color: '#4A90D9',
    fontSize: 13,
    fontWeight: '500',
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
    backgroundColor: '#4A90D9',
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
  // PROMINENT OFFLINE BANNER
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90D9',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  offlineBannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  offlineBannerText: {
    flex: 1,
  },
  offlineBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  offlineBannerSubtitle: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.7)',
  },
  offlineBannerCached: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  offlineBannerCachedText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '600',
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
    color: '#4A90D9',
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
    backgroundColor: '#4A90D9',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90D9',
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
    backgroundColor: '#4A90D9',
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
    borderColor: '#4A90D9',
    gap: 8,
  },
  redownloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90D9',
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
    color: '#4A90D9',
    lineHeight: 16,
  },
  listFooter: {
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  gastroFlowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE66D',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  gastroFlowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gastroFlowText: {
    flex: 1,
  },
  gastroFlowTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  gastroFlowSubtitle: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 2,
  },
  partnersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74,144,217,0.1)',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(74,144,217,0.2)',
  },
  partnersButtonText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

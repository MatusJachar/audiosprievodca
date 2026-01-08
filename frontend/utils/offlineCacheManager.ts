import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'offline_audio_';
const TOUR_CACHED_PREFIX = 'tour_cached_';

export class OfflineCacheManager {
  
  // Save audio to cache
  static async saveAudio(stopId: string, language: string, audioBase64: string): Promise<boolean> {
    if (!audioBase64 || audioBase64.length === 0) return false;
    
    try {
      const key = `${CACHE_PREFIX}${stopId}_${language}`;
      await AsyncStorage.setItem(key, audioBase64);
      return true;
    } catch (error) {
      console.error('Failed to save audio:', error);
      return false;
    }
  }

  // Get cached audio as data URI
  static async getCachedAudioUri(stopId: string, language: string): Promise<string | null> {
    try {
      const key = `${CACHE_PREFIX}${stopId}_${language}`;
      const cached = await AsyncStorage.getItem(key);
      
      if (cached && cached.length > 0) {
        return `data:audio/mp3;base64,${cached}`;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Check if tour is cached
  static async isTourCached(language: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(`${TOUR_CACHED_PREFIX}${language}`);
      return cached === 'true';
    } catch {
      return false;
    }
  }

  // Download tour for offline
  static async downloadTourForOffline(
    tourStops: any[],
    language: string,
    apiUrl: string,
    onProgress?: (progress: { total: number; downloaded: number; currentItem: string }) => void
  ): Promise<void> {
    const total = tourStops.length;
    let downloaded = 0;

    for (const stop of tourStops) {
      const title = stop.content?.[language]?.title || stop.content?.['en']?.title || `Stop ${stop.stop_number}`;
      
      onProgress?.({ total, downloaded, currentItem: title });

      try {
        const response = await fetch(`${apiUrl}/api/tour-stops/${stop.id}`);
        if (response.ok) {
          const data = await response.json();
          const audio = data.audio?.[language];
          if (audio) {
            await this.saveAudio(stop.id, language, audio);
          }
        }
      } catch (e) {
        // Continue even if one fails
      }
      
      downloaded++;
      onProgress?.({ total, downloaded, currentItem: title });
    }

    await AsyncStorage.setItem(`${TOUR_CACHED_PREFIX}${language}`, 'true');
    onProgress?.({ total, downloaded: total, currentItem: 'Complete!' });
  }

  // Clear cache
  static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX) || k.startsWith(TOUR_CACHED_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (e) {
      // Ignore
    }
  }

  // For compatibility
  static isFileSystemAvailable(): boolean {
    return false;
  }
}

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// FileSystem doesn't work on web - use AsyncStorage as fallback
const IS_WEB = Platform.OS === 'web';
const CACHE_DIR = IS_WEB ? null : `${FileSystem.documentDirectory}tour_cache/`;

interface DownloadProgress {
  total: number;
  downloaded: number;
  currentItem: string;
}

export class OfflineCacheManager {
  
  // Ensure cache directory exists (mobile only)
  static async ensureCacheDir() {
    if (IS_WEB) return; // Skip on web
    
    if (!CACHE_DIR) {
      throw new Error('Cache directory not available');
    }
    
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  }

  // Download and cache audio for a specific stop
  static async downloadAudio(stopId: string, language: string, audioBase64: string): Promise<string> {
    if (IS_WEB) {
      // On web, store in AsyncStorage (has size limits but works)
      const key = `audio_${stopId}_${language}`;
      await AsyncStorage.setItem(key, audioBase64);
      return `data:audio/mp3;base64,${audioBase64}`;
    }
    
    // On mobile, use FileSystem
    await this.ensureCacheDir();
    
    const fileName = `${stopId}_${language}.mp3`;
    const fileUri = `${CACHE_DIR}${fileName}`;
    
    try {
      await FileSystem.writeAsStringAsync(fileUri, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return fileUri;
    } catch (error) {
      console.error('[Cache] Error downloading audio:', error);
      throw error;
    }
  }

  // Check if audio is cached
  static async isAudioCached(stopId: string, language: string): Promise<boolean> {
    if (IS_WEB) {
      const key = `audio_${stopId}_${language}`;
      const cached = await AsyncStorage.getItem(key);
      return cached !== null;
    }
    
    const fileName = `${stopId}_${language}.mp3`;
    const fileUri = `${CACHE_DIR}${fileName}`;
    
    const info = await FileSystem.getInfoAsync(fileUri);
    return info.exists;
  }

  // Get cached audio file URI or base64
  static async getCachedAudioUri(stopId: string, language: string): Promise<string | null> {
    if (IS_WEB) {
      const key = `audio_${stopId}_${language}`;
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        return `data:audio/mp3;base64,${cached}`;
      }
      return null;
    }
    
    const fileName = `${stopId}_${language}.mp3`;
    const fileUri = `${CACHE_DIR}${fileName}`;
    
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      return fileUri;
    }
    return null;
  }

  // Download entire tour for offline use
  static async downloadTourForOffline(
    tourStops: any[],
    language: string,
    apiUrl: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    await this.ensureCacheDir();
    
    const total = tourStops.length;
    let downloaded = 0;

    for (const stop of tourStops) {
      try {
        onProgress?.({
          total,
          downloaded,
          currentItem: stop.content?.[language]?.title || `Stop ${stop.stop_number || 'Legend'}`,
        });

        // Check if already cached
        const isCached = await this.isAudioCached(stop.id, language);
        if (isCached) {
          console.log(`[Cache] Stop ${stop.id} already cached, skipping`);
          downloaded++;
          continue;
        }

        // Fetch full stop data with audio
        const response = await fetch(`${apiUrl}/api/tour-stops/${stop.id}`);
        if (!response.ok) {
          console.warn(`[Cache] Failed to fetch stop ${stop.id}`);
          downloaded++;
          continue;
        }

        const stopData = await response.json();
        const audioBase64 = stopData.audio?.[language];

        if (audioBase64) {
          await this.downloadAudio(stop.id, language, audioBase64);
          console.log(`[Cache] Downloaded audio for stop ${stop.id}`);
        }

        downloaded++;
      } catch (error) {
        console.error(`[Cache] Error downloading stop ${stop.id}:`, error);
        downloaded++;
      }
    }

    // Mark tour as cached
    await AsyncStorage.setItem(`tour_cached_${language}`, 'true');
    
    onProgress?.({
      total,
      downloaded: total,
      currentItem: 'Complete!',
    });
  }

  // Check if tour is fully cached
  static async isTourCached(language: string): Promise<boolean> {
    const cached = await AsyncStorage.getItem(`tour_cached_${language}`);
    return cached === 'true';
  }

  // Clear all cached audio
  static async clearCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      }
      
      // Clear cache markers
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('tour_cached_'));
      await AsyncStorage.multiRemove(cacheKeys);
      
      console.log('[Cache] Cache cleared successfully');
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }

  // Get cache size
  static async getCacheSize(): Promise<number> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) return 0;
      
      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
      let totalSize = 0;
      
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
        if (fileInfo.exists && 'size' in fileInfo) {
          totalSize += fileInfo.size || 0;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('[Cache] Error getting cache size:', error);
      return 0;
    }
  }
}

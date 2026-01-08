import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// FileSystem doesn't work on web - use AsyncStorage as fallback
const IS_WEB = Platform.OS === 'web';

// Safely get cache directory - FileSystem.documentDirectory can be null on web
const getCacheDir = (): string | null => {
  if (IS_WEB) return null;
  if (!FileSystem.documentDirectory) return null;
  return `${FileSystem.documentDirectory}tour_cache/`;
};

interface DownloadProgress {
  total: number;
  downloaded: number;
  currentItem: string;
}

export class OfflineCacheManager {
  
  // Ensure cache directory exists (mobile only)
  static async ensureCacheDir(): Promise<boolean> {
    if (IS_WEB) return false; // Not supported on web
    
    const cacheDir = getCacheDir();
    if (!cacheDir) {
      console.warn('[Cache] Cache directory not available');
      return false;
    }
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        console.log('[Cache] Created cache directory:', cacheDir);
      }
      return true;
    } catch (error) {
      console.error('[Cache] Error creating cache directory:', error);
      return false;
    }
  }

  // Download and cache audio for a specific stop
  static async downloadAudio(stopId: string, language: string, audioBase64: string): Promise<string | null> {
    // Validate input
    if (!audioBase64 || audioBase64.length === 0) {
      console.warn('[Cache] No audio data to download for stop:', stopId);
      return null;
    }

    if (IS_WEB) {
      // On web, store in AsyncStorage (has size limits but works for small files)
      try {
        const key = `audio_${stopId}_${language}`;
        // AsyncStorage has ~6MB limit per key on some platforms
        if (audioBase64.length > 5 * 1024 * 1024) {
          console.warn('[Cache] Audio too large for web storage:', stopId);
          return null;
        }
        await AsyncStorage.setItem(key, audioBase64);
        return `data:audio/mp3;base64,${audioBase64}`;
      } catch (error) {
        console.warn('[Cache] Failed to store audio on web:', error);
        return null;
      }
    }
    
    // On mobile, use FileSystem
    const cacheDir = getCacheDir();
    if (!cacheDir) {
      console.warn('[Cache] Cache directory not available');
      return null;
    }

    const dirReady = await this.ensureCacheDir();
    if (!dirReady) {
      console.warn('[Cache] Could not prepare cache directory');
      return null;
    }
    
    const fileName = `${stopId}_${language}.mp3`;
    const fileUri = `${cacheDir}${fileName}`;
    
    try {
      await FileSystem.writeAsStringAsync(fileUri, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Verify file was written
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        console.log(`[Cache] Successfully cached audio: ${fileName} (${Math.round((info.size || 0) / 1024)}KB)`);
        return fileUri;
      }
      
      console.warn('[Cache] File not found after write:', fileUri);
      return null;
    } catch (error) {
      console.error('[Cache] Error downloading audio:', error);
      return null;
    }
  }

  // Check if audio is cached
  static async isAudioCached(stopId: string, language: string): Promise<boolean> {
    try {
      if (IS_WEB) {
        const key = `audio_${stopId}_${language}`;
        const cached = await AsyncStorage.getItem(key);
        return cached !== null && cached.length > 0;
      }
      
      const cacheDir = getCacheDir();
      if (!cacheDir) return false;
      
      const fileName = `${stopId}_${language}.mp3`;
      const fileUri = `${cacheDir}${fileName}`;
      
      const info = await FileSystem.getInfoAsync(fileUri);
      return info.exists;
    } catch (error) {
      console.warn('[Cache] Error checking cache status:', error);
      return false;
    }
  }

  // Get cached audio file URI or base64
  static async getCachedAudioUri(stopId: string, language: string): Promise<string | null> {
    try {
      if (IS_WEB) {
        const key = `audio_${stopId}_${language}`;
        const cached = await AsyncStorage.getItem(key);
        if (cached && cached.length > 0) {
          console.log(`[Cache] Found web-cached audio for stop ${stopId}`);
          return `data:audio/mp3;base64,${cached}`;
        }
        return null;
      }
      
      const cacheDir = getCacheDir();
      if (!cacheDir) return null;
      
      const fileName = `${stopId}_${language}.mp3`;
      const fileUri = `${cacheDir}${fileName}`;
      
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        console.log(`[Cache] Found cached audio file: ${fileUri}`);
        return fileUri;
      }
      return null;
    } catch (error) {
      console.warn('[Cache] Error getting cached audio:', error);
      return null;
    }
  }

  // Download entire tour for offline use
  static async downloadTourForOffline(
    tourStops: any[],
    language: string,
    apiUrl: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    console.log('[Cache] Starting offline download...');
    console.log('[Cache] Platform:', Platform.OS);
    console.log('[Cache] Tour stops:', tourStops.length);
    console.log('[Cache] Language:', language);
    console.log('[Cache] API URL:', apiUrl);

    // Check if caching is supported
    if (!IS_WEB) {
      const dirReady = await this.ensureCacheDir();
      if (!dirReady) {
        throw new Error('Unable to create cache directory');
      }
    }
    
    const total = tourStops.length;
    let downloaded = 0;
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const stop of tourStops) {
      const stopTitle = stop.content?.[language]?.title || 
                        stop.content?.['en']?.title || 
                        `Stop ${stop.stop_number || 'Legend'}`;
      
      try {
        onProgress?.({
          total,
          downloaded,
          currentItem: stopTitle,
        });

        // Check if already cached
        const isCached = await this.isAudioCached(stop.id, language);
        if (isCached) {
          console.log(`[Cache] Stop ${stop.stop_number || stop.stop_name} already cached, skipping`);
          skipCount++;
          downloaded++;
          continue;
        }

        // Fetch full stop data with audio
        console.log(`[Cache] Fetching stop ${stop.stop_number || stop.stop_name}...`);
        const response = await fetch(`${apiUrl}/api/tour-stops/${stop.id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.warn(`[Cache] Failed to fetch stop ${stop.id}: ${response.status}`);
          errorCount++;
          downloaded++;
          continue;
        }

        const stopData = await response.json();
        const audioBase64 = stopData.audio?.[language];

        if (audioBase64 && audioBase64.length > 0) {
          console.log(`[Cache] Downloaded audio for stop ${stop.stop_number || stop.stop_name} (${Math.round(audioBase64.length / 1024)}KB)`);
          const savedUri = await this.downloadAudio(stop.id, language, audioBase64);
          if (savedUri) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          console.warn(`[Cache] No audio available for stop ${stop.id} in language ${language}`);
          errorCount++;
        }

        downloaded++;
      } catch (error) {
        console.error(`[Cache] Error downloading stop ${stop.id}:`, error);
        errorCount++;
        downloaded++;
      }
    }

    // Mark tour as cached (even if some stops failed - they can be fetched online)
    await AsyncStorage.setItem(`tour_cached_${language}`, 'true');
    
    console.log('[Cache] Download complete!');
    console.log(`[Cache] Summary: ${successCount} downloaded, ${skipCount} already cached, ${errorCount} errors`);
    
    onProgress?.({
      total,
      downloaded: total,
      currentItem: 'Complete!',
    });
  }

  // Check if tour is fully cached
  static async isTourCached(language: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(`tour_cached_${language}`);
      return cached === 'true';
    } catch (error) {
      console.warn('[Cache] Error checking tour cache status:', error);
      return false;
    }
  }

  // Clear all cached audio
  static async clearCache(): Promise<void> {
    try {
      // Clear file cache on mobile
      if (!IS_WEB) {
        const cacheDir = getCacheDir();
        if (cacheDir) {
          const dirInfo = await FileSystem.getInfoAsync(cacheDir);
          if (dirInfo.exists) {
            await FileSystem.deleteAsync(cacheDir, { idempotent: true });
            console.log('[Cache] Deleted cache directory');
          }
        }
      }
      
      // Clear AsyncStorage cache markers and web audio cache
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith('tour_cached_') || key.startsWith('audio_')
      );
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`[Cache] Cleared ${cacheKeys.length} cache entries from AsyncStorage`);
      }
      
      console.log('[Cache] Cache cleared successfully');
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }

  // Get cache size (mobile only)
  static async getCacheSize(): Promise<number> {
    if (IS_WEB) return 0;
    
    try {
      const cacheDir = getCacheDir();
      if (!cacheDir) return 0;
      
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) return 0;
      
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      let totalSize = 0;
      
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${cacheDir}${file}`);
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

  // Format bytes to human readable string
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

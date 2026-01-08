import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// FileSystem doesn't work on web - use AsyncStorage as fallback
const IS_WEB = Platform.OS === 'web';

// Safely get cache directory with fallbacks
const getCacheDir = (): string | null => {
  if (IS_WEB) return null;
  
  // Try documentDirectory first, then cacheDirectory
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  if (!baseDir) {
    console.warn('[Cache] No FileSystem directory available');
    return null;
  }
  return `${baseDir}tour_cache/`;
};

interface DownloadProgress {
  total: number;
  downloaded: number;
  currentItem: string;
}

export class OfflineCacheManager {
  
  // Check if FileSystem is available
  static isFileSystemAvailable(): boolean {
    if (IS_WEB) return false;
    return !!(FileSystem.documentDirectory || FileSystem.cacheDirectory);
  }

  // Ensure cache directory exists (mobile only)
  static async ensureCacheDir(): Promise<boolean> {
    if (IS_WEB) return false;
    
    const cacheDir = getCacheDir();
    if (!cacheDir) {
      console.warn('[Cache] Using AsyncStorage fallback (FileSystem not available)');
      return false; // Will use AsyncStorage fallback
    }
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        console.log('[Cache] Created cache directory:', cacheDir);
      }
      return true;
    } catch (error) {
      console.error('[Cache] Error creating cache directory, using AsyncStorage:', error);
      return false; // Will use AsyncStorage fallback
    }
  }

  // Download and cache audio for a specific stop
  static async downloadAudio(stopId: string, language: string, audioBase64: string): Promise<string | null> {
    if (!audioBase64 || audioBase64.length === 0) {
      console.warn('[Cache] No audio data to download for stop:', stopId);
      return null;
    }

    const cacheDir = getCacheDir();
    const useFileSystem = cacheDir && !IS_WEB;

    if (useFileSystem) {
      // Try FileSystem first
      try {
        const dirReady = await this.ensureCacheDir();
        if (dirReady) {
          const fileName = `${stopId}_${language}.mp3`;
          const fileUri = `${cacheDir}${fileName}`;
          
          await FileSystem.writeAsStringAsync(fileUri, audioBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          const info = await FileSystem.getInfoAsync(fileUri);
          if (info.exists) {
            console.log(`[Cache] Saved to FileSystem: ${fileName} (${Math.round((info.size || 0) / 1024)}KB)`);
            return fileUri;
          }
        }
      } catch (error) {
        console.warn('[Cache] FileSystem failed:', error);
      }
    }

    // For Expo Go where storage is limited, just mark as "streamable"
    // Don't actually store the huge base64 - it will be fetched on-demand
    try {
      const key = `audio_meta_${stopId}_${language}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        stopId,
        language,
        size: audioBase64.length,
        cached: false, // Mark as metadata only, will stream when needed
        timestamp: Date.now()
      }));
      console.log(`[Cache] Marked for streaming: ${stopId} (${Math.round(audioBase64.length / 1024)}KB)`);
      return `stream://${stopId}/${language}`;
    } catch (error) {
      console.error('[Cache] Failed to save metadata:', error);
      return null;
    }
  }

  // Check if audio is cached
  static async isAudioCached(stopId: string, language: string): Promise<boolean> {
    try {
      // Check FileSystem first
      const cacheDir = getCacheDir();
      if (cacheDir && !IS_WEB) {
        const fileName = `${stopId}_${language}.mp3`;
        const fileUri = `${cacheDir}${fileName}`;
        const info = await FileSystem.getInfoAsync(fileUri);
        if (info.exists) return true;
      }
      
      // Check AsyncStorage
      const key = `audio_${stopId}_${language}`;
      const cached = await AsyncStorage.getItem(key);
      if (cached) return true;
      
      // Check chunked storage
      const chunks = await AsyncStorage.getItem(`${key}_chunks`);
      if (chunks) return true;
      
      return false;
    } catch (error) {
      console.warn('[Cache] Error checking cache:', error);
      return false;
    }
  }

  // Get cached audio
  static async getCachedAudioUri(stopId: string, language: string): Promise<string | null> {
    try {
      // Check FileSystem first
      const cacheDir = getCacheDir();
      if (cacheDir && !IS_WEB) {
        const fileName = `${stopId}_${language}.mp3`;
        const fileUri = `${cacheDir}${fileName}`;
        const info = await FileSystem.getInfoAsync(fileUri);
        if (info.exists) {
          console.log(`[Cache] Found in FileSystem: ${fileUri}`);
          return fileUri;
        }
      }
      
      // Check AsyncStorage
      const key = `audio_${stopId}_${language}`;
      
      // Check for chunked storage first
      const numChunksStr = await AsyncStorage.getItem(`${key}_chunks`);
      if (numChunksStr) {
        const numChunks = parseInt(numChunksStr);
        let audioBase64 = '';
        for (let i = 0; i < numChunks; i++) {
          const chunk = await AsyncStorage.getItem(`${key}_${i}`);
          if (chunk) audioBase64 += chunk;
        }
        if (audioBase64) {
          console.log(`[Cache] Retrieved from AsyncStorage (chunked): ${stopId}`);
          return `data:audio/mp3;base64,${audioBase64}`;
        }
      }
      
      // Check single-key storage
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        console.log(`[Cache] Retrieved from AsyncStorage: ${stopId}`);
        return `data:audio/mp3;base64,${cached}`;
      }
      
      return null;
    } catch (error) {
      console.warn('[Cache] Error getting cached audio:', error);
      return null;
    }
  }

  // Download entire tour for offline use - SEQUENTIAL with progress updates
  static async downloadTourForOffline(
    tourStops: any[],
    language: string,
    apiUrl: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    console.log('[Cache] ====== STARTING OFFLINE DOWNLOAD ======');
    console.log('[Cache] Platform:', Platform.OS);
    console.log('[Cache] Tour stops:', tourStops.length);
    console.log('[Cache] Language:', language);
    console.log('[Cache] API URL:', apiUrl);

    if (!tourStops || tourStops.length === 0) {
      throw new Error('No tour stops to download');
    }

    if (!apiUrl) {
      throw new Error('API URL not configured');
    }

    const total = tourStops.length;
    let downloaded = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const stop of tourStops) {
      const stopTitle = stop.content?.[language]?.title || 
                        stop.content?.['en']?.title || 
                        `Stop ${stop.stop_number || 'Unknown'}`;
      
      // Update progress BEFORE starting download
      onProgress?.({
        total,
        downloaded,
        currentItem: `Downloading: ${stopTitle}`,
      });

      try {
        console.log(`[Cache] Fetching: ${stopTitle}...`);
        
        // Fetch full stop data with audio
        const response = await fetch(`${apiUrl}/api/tour-stops/${stop.id}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        
        if (!response.ok) {
          console.warn(`[Cache] ✗ API error for ${stopTitle}: ${response.status}`);
          errorCount++;
          downloaded++;
          continue;
        }

        const stopData = await response.json();
        const audioBase64 = stopData.audio?.[language];

        if (audioBase64 && audioBase64.length > 0) {
          // Save to AsyncStorage (works on all platforms)
          try {
            const key = `offline_audio_${stop.id}_${language}`;
            await AsyncStorage.setItem(key, audioBase64);
            console.log(`[Cache] ✓ Saved: ${stopTitle} (${Math.round(audioBase64.length / 1024)}KB)`);
            successCount++;
          } catch (storageError) {
            console.warn(`[Cache] Storage error for ${stopTitle}:`, storageError);
            errorCount++;
          }
        } else {
          console.warn(`[Cache] No audio for ${stopTitle} in ${language}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`[Cache] ✗ Error downloading ${stopTitle}:`, error);
        errorCount++;
      }
      
      downloaded++;
      
      // Update progress AFTER each download
      onProgress?.({
        total,
        downloaded,
        currentItem: `Downloaded: ${stopTitle}`,
      });
    }

    // Mark tour as cached
    await AsyncStorage.setItem(`tour_cached_${language}`, 'true');
    
    console.log('[Cache] ====== DOWNLOAD COMPLETE ======');
    console.log(`[Cache] Success: ${successCount}, Errors: ${errorCount}`);
    
    onProgress?.({
      total,
      downloaded: total,
      currentItem: 'Complete!',
    });
  }

  // Check if tour is cached
  static async isTourCached(language: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(`tour_cached_${language}`);
      return cached === 'true';
    } catch {
      return false;
    }
  }

  // Clear all cache
  static async clearCache(): Promise<void> {
    try {
      // Clear FileSystem cache
      const cacheDir = getCacheDir();
      if (cacheDir && !IS_WEB) {
        try {
          const info = await FileSystem.getInfoAsync(cacheDir);
          if (info.exists) {
            await FileSystem.deleteAsync(cacheDir, { idempotent: true });
          }
        } catch (e) {
          console.warn('[Cache] Could not clear FileSystem:', e);
        }
      }
      
      // Clear AsyncStorage cache
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith('tour_cached_') || 
        key.startsWith('audio_')
      );
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      
      console.log('[Cache] Cache cleared');
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }
}

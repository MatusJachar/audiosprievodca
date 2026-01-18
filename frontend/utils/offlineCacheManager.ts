import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CACHE_DIR = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}audio_cache/` : null;
const TOUR_CACHED_PREFIX = 'tour_cached_';

export class OfflineCacheManager {
  
  // Check if FileSystem is available (standalone app, not Expo Go on some devices)
  static isFileSystemAvailable(): boolean {
    return Platform.OS !== 'web' && !!FileSystem.documentDirectory;
  }

  // Ensure cache directory exists
  static async ensureCacheDir(): Promise<boolean> {
    if (!CACHE_DIR) return false;
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
      return true;
    } catch (error) {
      console.error('Failed to create cache directory:', error);
      return false;
    }
  }

  // Save audio to FileSystem (for standalone builds)
  static async saveAudio(stopId: string, language: string, audioBase64: string): Promise<boolean> {
    if (!audioBase64 || audioBase64.length === 0) return false;
    
    // Try FileSystem first (works in standalone builds)
    if (this.isFileSystemAvailable() && CACHE_DIR) {
      try {
        await this.ensureCacheDir();
        const filePath = `${CACHE_DIR}${stopId}_${language}.mp3`;
        await FileSystem.writeAsStringAsync(filePath, audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log(`Saved to FileSystem: ${stopId}_${language}.mp3`);
        return true;
      } catch (error) {
        console.warn('FileSystem save failed, trying AsyncStorage:', error);
      }
    }
    
    // Fallback to AsyncStorage (limited size)
    try {
      const key = `offline_audio_${stopId}_${language}`;
      await AsyncStorage.setItem(key, audioBase64);
      console.log(`Saved to AsyncStorage: ${stopId}_${language}`);
      return true;
    } catch (error) {
      console.error('Failed to save audio:', error);
      return false;
    }
  }

  // Get cached audio URI
  static async getCachedAudioUri(stopId: string, language: string): Promise<string | null> {
    // Try FileSystem first
    if (this.isFileSystemAvailable() && CACHE_DIR) {
      try {
        const filePath = `${CACHE_DIR}${stopId}_${language}.mp3`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          console.log(`Found in FileSystem: ${filePath}`);
          return filePath; // Return file:// URI directly
        }
      } catch (error) {
        console.warn('FileSystem read failed:', error);
      }
    }
    
    // Try AsyncStorage
    try {
      const key = `offline_audio_${stopId}_${language}`;
      const cached = await AsyncStorage.getItem(key);
      if (cached && cached.length > 0) {
        console.log(`Found in AsyncStorage: ${stopId}_${language}`);
        return `data:audio/mp3;base64,${cached}`;
      }
    } catch (error) {
      console.warn('AsyncStorage read failed:', error);
    }
    
    return null;
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
    console.log('=== Starting Offline Download ===');
    console.log(`FileSystem available: ${this.isFileSystemAvailable()}`);
    console.log(`Cache directory: ${CACHE_DIR}`);
    console.log(`Tour stops: ${tourStops.length}`);
    console.log(`Language: ${language}`);
    
    const total = tourStops.length;
    let downloaded = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const stop of tourStops) {
      const title = stop.content?.[language]?.title || stop.content?.['en']?.title || `Stop ${stop.stop_number}`;
      
      onProgress?.({ total, downloaded, currentItem: `Downloading: ${title}` });

      try {
        // Fetch full stop data with audio
        const response = await fetch(`${apiUrl}/api/tour-stops/${stop.id}`);
        if (response.ok) {
          const data = await response.json();
          const audio = data.audio?.[language];
          if (audio && audio.length > 0) {
            const saved = await this.saveAudio(stop.id, language, audio);
            if (saved) {
              successCount++;
              console.log(`✓ Downloaded: ${title}`);
            } else {
              errorCount++;
              console.warn(`✗ Failed to save: ${title}`);
            }
          } else {
            console.warn(`No audio for: ${title}`);
          }
        }
      } catch (e) {
        errorCount++;
        console.error(`Error downloading ${title}:`, e);
      }
      
      downloaded++;
      onProgress?.({ total, downloaded, currentItem: title });
    }

    // Mark tour as cached
    await AsyncStorage.setItem(`${TOUR_CACHED_PREFIX}${language}`, 'true');
    
    console.log('=== Download Complete ===');
    console.log(`Success: ${successCount}, Errors: ${errorCount}`);
    
    onProgress?.({ total, downloaded: total, currentItem: 'Complete!' });
  }

  // Get cache size
  static async getCacheSize(): Promise<number> {
    let totalSize = 0;
    
    // Check FileSystem cache
    if (this.isFileSystemAvailable() && CACHE_DIR) {
      try {
        const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
        if (dirInfo.exists) {
          const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
          for (const file of files) {
            const fileInfo = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
            if (fileInfo.exists && 'size' in fileInfo) {
              totalSize += fileInfo.size || 0;
            }
          }
        }
      } catch (error) {
        console.warn('Error getting cache size:', error);
      }
    }
    
    return totalSize;
  }

  // Clear cache
  static async clearCache(): Promise<void> {
    console.log('Clearing offline cache...');
    
    // Clear FileSystem cache
    if (this.isFileSystemAvailable() && CACHE_DIR) {
      try {
        const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
          console.log('FileSystem cache cleared');
        }
      } catch (error) {
        console.warn('Error clearing FileSystem cache:', error);
      }
    }
    
    // Clear AsyncStorage cache
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => 
        k.startsWith('offline_audio_') || k.startsWith(TOUR_CACHED_PREFIX)
      );
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`Cleared ${cacheKeys.length} AsyncStorage entries`);
      }
    } catch (error) {
      console.warn('Error clearing AsyncStorage cache:', error);
    }
    
    console.log('Cache cleared');
  }

  // Format bytes to human readable
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Check if a specific stop is cached
  static async isStopCached(stopId: string, language: string): Promise<boolean> {
    // Check FileSystem
    if (this.isFileSystemAvailable() && CACHE_DIR) {
      try {
        const filePath = `${CACHE_DIR}${stopId}_${language}.mp3`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) return true;
      } catch {}
    }
    
    // Check AsyncStorage
    try {
      const key = `offline_audio_${stopId}_${language}`;
      const cached = await AsyncStorage.getItem(key);
      if (cached && cached.length > 100) return true;
    } catch {}
    
    return false;
  }

  // Preload next stops in background (for poor coverage areas like stops 10-13)
  // This version is TOUR-ROUTE AWARE - follows the actual tour order
  static async preloadNextStops(
    currentStopNumber: number | null,
    tourStops: any[],
    language: string,
    apiUrl: string,
    preloadCount: number = 3,
    tourRoute?: number[] // Optional: specific tour route order
  ): Promise<{ preloaded: number; skipped: number; failed: number }> {
    const result = { preloaded: 0, skipped: 0, failed: 0 };
    
    console.log(`[Preload] ========================================`);
    console.log(`[Preload] Starting preload from stop ${currentStopNumber}`);
    console.log(`[Preload] Will preload next ${preloadCount} stops`);
    console.log(`[Preload] Language: ${language}`);
    console.log(`[Preload] Tour route provided: ${tourRoute ? 'YES' : 'NO'}`);
    console.log(`[Preload] FileSystem available: ${this.isFileSystemAvailable()}`);

    let stopsToPreload: any[] = [];

    if (tourRoute && tourRoute.length > 0) {
      // TOUR-ROUTE AWARE: Follow the actual tour order
      console.log(`[Preload] Using tour route: ${tourRoute.join(' → ')}`);
      
      // Find current position in tour route
      const currentIndex = currentStopNumber !== null 
        ? tourRoute.indexOf(currentStopNumber)
        : -1;
      
      if (currentIndex === -1) {
        // If currentStopNumber is null or 0, start from beginning (initial preload)
        const nextStopNumbers = tourRoute.slice(0, preloadCount);
        console.log(`[Preload] Initial preload - stops: ${nextStopNumbers.join(', ')}`);
        
        stopsToPreload = nextStopNumbers
          .map(num => tourStops.find(s => s.stop_number === num))
          .filter(s => s !== undefined);
      } else {
        // Get next N stops in the tour route order
        const nextStopNumbers = tourRoute.slice(currentIndex + 1, currentIndex + 1 + preloadCount);
        console.log(`[Preload] Next stops in tour: ${nextStopNumbers.join(', ')}`);
        
        stopsToPreload = nextStopNumbers
          .map(num => tourStops.find(s => s.stop_number === num))
          .filter(s => s !== undefined);
      }
    } else {
      // Fallback: Sequential order (for Complete tour or when no route provided)
      if (currentStopNumber === null || currentStopNumber === 0) {
        // Initial preload: get first N stops
        const sortedStops = tourStops
          .filter(s => s.stop_number !== null && s.stop_number !== undefined)
          .sort((a, b) => a.stop_number - b.stop_number);
        stopsToPreload = sortedStops.slice(0, preloadCount);
      } else {
        const sortedStops = tourStops
          .filter(s => s.stop_number !== null && s.stop_number !== undefined)
          .sort((a, b) => a.stop_number - b.stop_number);
        
        const currentIndex = sortedStops.findIndex(s => s.stop_number === currentStopNumber);
        if (currentIndex === -1) {
          console.log('[Preload] Current stop not found in tour');
          return result;
        }
        stopsToPreload = sortedStops.slice(currentIndex + 1, currentIndex + 1 + preloadCount);
      }
    }

    if (stopsToPreload.length === 0) {
      console.log('[Preload] No more stops to preload');
      return result;
    }

    console.log(`[Preload] Stops to preload: ${stopsToPreload.map(s => s.stop_number || s.stop_name).join(', ')}`);

    // Preload each stop in background
    for (const stop of stopsToPreload) {
      try {
        // Check if already cached
        const isCached = await this.isStopCached(stop.id, language);
        if (isCached) {
          console.log(`[Preload] Stop ${stop.stop_number || stop.stop_name} already cached, skipping`);
          result.skipped++;
          continue;
        }

        console.log(`[Preload] Downloading stop ${stop.stop_number || stop.stop_name}...`);
        
        // Fetch audio
        const response = await fetch(`${apiUrl}/api/tour-stops/${stop.id}`);
        if (response.ok) {
          const data = await response.json();
          const audio = data.audio?.[language];
          
          if (audio && audio.length > 0) {
            const saved = await this.saveAudio(stop.id, language, audio);
            if (saved) {
              console.log(`[Preload] ✓ Stop ${stop.stop_number || stop.stop_name} preloaded successfully`);
              result.preloaded++;
            } else {
              console.warn(`[Preload] ✗ Stop ${stop.stop_number || stop.stop_name} save failed`);
              result.failed++;
            }
          } else {
            console.warn(`[Preload] Stop ${stop.stop_number || stop.stop_name} has no audio for ${language}`);
            result.failed++;
          }
        } else {
          console.warn(`[Preload] Failed to fetch stop ${stop.stop_number || stop.stop_name}`);
          result.failed++;
        }
      } catch (error) {
        console.error(`[Preload] Error preloading stop ${stop.stop_number || stop.stop_name}:`, error);
        result.failed++;
      }
    }

    console.log(`[Preload] Complete: ${result.preloaded} preloaded, ${result.skipped} skipped, ${result.failed} failed`);
    console.log(`[Preload] ========================================`);
    
    return result;
  }

  // Smart preload for poor coverage areas (stops 10-13)
  // Preloads more aggressively when in these areas
  static async smartPreload(
    currentStopNumber: number | null,
    tourStops: any[],
    language: string,
    apiUrl: string
  ): Promise<void> {
    if (!currentStopNumber) return;

    // Define poor coverage zones and their preload settings
    const POOR_COVERAGE_ZONES = [
      { start: 9, end: 13, preloadCount: 4, name: 'Upper Castle (poor coverage)' },
      { start: 1, end: 3, preloadCount: 2, name: 'Entrance area' },
    ];

    // Check if we're in a poor coverage zone
    const zone = POOR_COVERAGE_ZONES.find(
      z => currentStopNumber >= z.start && currentStopNumber <= z.end
    );

    if (zone) {
      console.log(`[SmartPreload] In ${zone.name}, preloading ${zone.preloadCount} stops`);
      await this.preloadNextStops(currentStopNumber, tourStops, language, apiUrl, zone.preloadCount);
    } else {
      // Default: preload next 2 stops
      console.log(`[SmartPreload] Standard area, preloading 2 stops`);
      await this.preloadNextStops(currentStopNumber, tourStops, language, apiUrl, 2);
    }
  }

  // Multi-language preload - downloads next stops in multiple languages
  // Perfect for international visitors at the castle
  static async multiLanguagePreload(
    currentStopNumber: number | null,
    tourStops: any[],
    primaryLanguage: string,
    apiUrl: string,
    additionalLanguages: string[] = ['en', 'sk', 'hu', 'pl']
  ): Promise<{ languages: Record<string, { preloaded: number; skipped: number; failed: number }> }> {
    const result: { languages: Record<string, { preloaded: number; skipped: number; failed: number }> } = {
      languages: {}
    };

    if (!currentStopNumber) {
      console.log('[MultiPreload] No stop number, skipping');
      return result;
    }

    // Build unique list of languages to preload (primary first, then additional)
    const languagesToPreload = [primaryLanguage];
    for (const lang of additionalLanguages) {
      if (!languagesToPreload.includes(lang)) {
        languagesToPreload.push(lang);
      }
    }

    console.log(`[MultiPreload] ========================================`);
    console.log(`[MultiPreload] Starting multi-language preload`);
    console.log(`[MultiPreload] Current stop: ${currentStopNumber}`);
    console.log(`[MultiPreload] Languages: ${languagesToPreload.join(', ')}`);

    // Determine preload count based on zone
    let preloadCount = 2;
    if (currentStopNumber >= 9 && currentStopNumber <= 13) {
      preloadCount = 4; // Poor coverage zone - preload more
      console.log(`[MultiPreload] Poor coverage zone - preloading ${preloadCount} stops per language`);
    }

    // Preload each language
    for (const lang of languagesToPreload) {
      console.log(`[MultiPreload] --- Preloading ${lang.toUpperCase()} ---`);
      const langResult = await this.preloadNextStops(
        currentStopNumber,
        tourStops,
        lang,
        apiUrl,
        preloadCount
      );
      result.languages[lang] = langResult;
    }

    // Summary
    const totalPreloaded = Object.values(result.languages).reduce((sum, r) => sum + r.preloaded, 0);
    const totalSkipped = Object.values(result.languages).reduce((sum, r) => sum + r.skipped, 0);
    console.log(`[MultiPreload] ========================================`);
    console.log(`[MultiPreload] Complete: ${totalPreloaded} files preloaded, ${totalSkipped} skipped`);
    console.log(`[MultiPreload] ========================================`);

    return result;
  }
}

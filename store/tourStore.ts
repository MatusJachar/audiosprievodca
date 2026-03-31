import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TourStopContent {
  title: string;
  description: string;
}

export interface TourStop {
  id: string;
  stop_number: number;
  stop_name?: string;
  image_base64?: string;
  content: Record<string, TourStopContent>;
  audio: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface UserProgress {
  id: string;
  user_id: string;
  completed_stops: string[];
  last_played_stop?: string;
  updated_at: string;
}

interface TourState {
  tourStops: TourStop[];
  userProgress: UserProgress | null;
  currentPlayingStop: string | null;
  isOfflineMode: boolean;
  loading: boolean;
  error: string | null;
  
  fetchTourStops: () => Promise<void>;
  fetchUserProgress: (userId: string) => Promise<void>;
  markStopComplete: (userId: string, stopId: string) => Promise<void>;
  resetProgress: (userId: string) => Promise<void>;
  setCurrentPlayingStop: (stopId: string | null) => void;
  toggleOfflineMode: () => void;
  downloadAllContent: () => Promise<void>;
}

const API_URL = 'http://178.104.72.151:8002';

export const useTourStore = create<TourState>((set, get) => ({
  tourStops: [],
  userProgress: null,
  currentPlayingStop: null,
  isOfflineMode: false,
  loading: false,
  error: null,
  
  fetchTourStops: async () => {
    set({ loading: true, error: null });
    try {
      console.log('[TourStore] Fetching tour stops from:', `${API_URL}/api/tour-stops`);
      
      const response = await fetch(`${API_URL}/api/tour-stops`);
      if (!response.ok) throw new Error('Failed to fetch tour stops');
      const data = await response.json();
      
      const transformed = data.map((stop: any) => {
        const content: Record<string, any> = {};
        const audio: Record<string, string> = {};
        
        (stop.translations || []).forEach((t: any) => {
          content[t.language_code] = { title: t.title, description: t.description };
          if (t.audio_url) {
            audio[t.language_code] = t.audio_url.startsWith('http')
              ? t.audio_url
              : `${API_URL}${t.audio_url}`;
          }
        });

        // Backend returns content{} directly (not translations[])
        if (stop.content && Object.keys(stop.content).length > 0 && Object.keys(content).length === 0) {
          const audioFromNumber: Record<string, string> = {};
          const langs = ['en', 'sk', 'de', 'pl', 'hu', 'ru', 'es', 'zh', 'fr'];
          
          if (stop.stop_number) {
            langs.forEach(lang => {
              audioFromNumber[lang] = `${API_URL}/api/uploads/audio/stop${stop.stop_number}_${lang}.mp3`;
            });
          } else if (stop.stop_name) {
            const match = stop.stop_name.match(/Legend (\d+)/);
            if (match) {
              langs.forEach(lang => {
                audioFromNumber[lang] = `${API_URL}/api/uploads/audio/legend_${match[1]}_${lang}.mp3`;
              });
            }
          }
          return { ...stop, audio: audioFromNumber };
        }
        
        return { ...stop, content, audio };
      });
      
      if (transformed.length > 0) {
        const firstStop = transformed[0];
        console.log('[TourStore] First stop content keys:', Object.keys(firstStop.content || {}));
        console.log('[TourStore] First stop audio keys:', Object.keys(firstStop.audio || {}));
      }
      
      set({ tourStops: transformed, loading: false, error: null });
      
      try {
        const metadataOnly = data.map((stop: TourStop) => ({
          id: stop.id,
          stop_number: stop.stop_number,
          stop_name: stop.stop_name,
          content: stop.content,
          image_base64: stop.image_base64,
          created_at: stop.created_at,
          updated_at: stop.updated_at,
        }));
        await AsyncStorage.setItem('tourStops', JSON.stringify(metadataOnly));
        console.log('[TourStore] Cached metadata for', metadataOnly.length, 'tour stops');
      } catch (cacheError) {
        console.error('[TourStore] Cache error:', cacheError);
      }
    } catch (error) {
      console.error('[TourStore] Network error:', error);
      
      try {
        const cached = await AsyncStorage.getItem('tourStops');
        if (cached) {
          const data = JSON.parse(cached);
          set({ tourStops: data, loading: false, isOfflineMode: true });
          console.log('[TourStore] Loaded from cache (offline mode)');
        } else {
          set({ error: 'No internet connection and no cached data available', loading: false });
        }
      } catch (cacheError) {
        set({ error: 'Failed to load tour data', loading: false });
        console.error('[TourStore] Cache load error:', cacheError);
      }
    }
  },
  
  fetchUserProgress: async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/progress/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch progress');
      const data = await response.json();
      set({ userProgress: data });
      await AsyncStorage.setItem('userProgress', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching progress:', error);
      try {
        const cached = await AsyncStorage.getItem('userProgress');
        if (cached) {
          set({ userProgress: JSON.parse(cached) });
        }
      } catch (e) {
        console.error('Error loading cached progress:', e);
      }
    }
  },
  
  markStopComplete: async (userId: string, stopId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/progress/${userId}/complete/${stopId}`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to mark stop complete');
      
      const currentProgress = get().userProgress;
      if (currentProgress) {
        const updatedProgress = {
          ...currentProgress,
          completed_stops: [...currentProgress.completed_stops, stopId],
        };
        set({ userProgress: updatedProgress });
        await AsyncStorage.setItem('userProgress', JSON.stringify(updatedProgress));
      }
    } catch (error) {
      console.error('Error marking stop complete:', error);
    }
  },
  
  resetProgress: async (userId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/progress/${userId}/reset`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to reset progress');
      
      const currentProgress = get().userProgress;
      if (currentProgress) {
        const resetProgress = {
          ...currentProgress,
          completed_stops: [],
          last_played_stop: null,
        };
        set({ userProgress: resetProgress });
        await AsyncStorage.setItem('userProgress', JSON.stringify(resetProgress));
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  },
  
  setCurrentPlayingStop: (stopId: string | null) => {
    set({ currentPlayingStop: stopId });
  },
  
  toggleOfflineMode: () => {
    set((state) => ({ isOfflineMode: !state.isOfflineMode }));
  },
  
  downloadAllContent: async () => {
    set({ loading: true });
    try {
      await AsyncStorage.setItem('offlineReady', 'true');
      console.log('[TourStore] Offline mode enabled (audio will stream from backend)');
      set({ isOfflineMode: true, loading: false });
    } catch (error) {
      console.error('[TourStore] Error enabling offline mode:', error);
      set({ loading: false });
    }
  },
}));
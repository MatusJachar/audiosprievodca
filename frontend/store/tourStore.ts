import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TourStopContent {
  title: string;
  description: string;
}

export interface TourStop {
  id: string;
  stop_number: number;
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

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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
      
      // Debug: Check audio data for first stop
      if (data.length > 0) {
        const firstStop = data[0];
        console.log('[TourStore] First stop audio keys:', Object.keys(firstStop.audio || {}));
        console.log('[TourStore] First stop has English audio:', !!firstStop.audio?.en);
        console.log('[TourStore] English audio length:', firstStop.audio?.en?.length || 0);
      }
      
      set({ tourStops: data, loading: false });
      
      // Cache data locally
      await AsyncStorage.setItem('tourStops', JSON.stringify(data));
      console.log('[TourStore] Tour stops cached successfully');
    } catch (error) {
      console.error('[TourStore] Error fetching tour stops:', error);
      // Try to load from cache
      try {
        const cached = await AsyncStorage.getItem('tourStops');
        if (cached) {
          console.log('[TourStore] Loading from cache');
          const cachedData = JSON.parse(cached);
          if (cachedData.length > 0) {
            console.log('[TourStore] Cached first stop has English audio:', !!cachedData[0].audio?.en);
          }
          set({ tourStops: cachedData, loading: false });
        } else {
          set({ error: 'Failed to load tour data', loading: false });
        }
      } catch (e) {
        set({ error: 'Failed to load tour data', loading: false });
      }
    }
  },
  
  fetchUserProgress: async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/progress/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch progress');
      const data = await response.json();
      set({ userProgress: data });
      
      // Cache progress
      await AsyncStorage.setItem('userProgress', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Try to load from cache
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
      
      // Update local state
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
      
      // Update local state
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
      const { tourStops } = get();
      // All content is already base64, so it's downloaded when we fetch
      await AsyncStorage.setItem('offlineReady', 'true');
      set({ isOfflineMode: true, loading: false });
    } catch (error) {
      console.error('Error downloading content:', error);
      set({ loading: false });
    }
  },
}));
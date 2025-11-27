import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TourType = 'family' | 'complete' | 'express';

interface TourRoute {
  id: TourType;
  name: string;
  description: string;
  icon: string;
  duration: string;
  stopNumbers: number[];
  legendIndexes: number[]; // 0-based indexes for legends array
}

export const TOUR_ROUTES: Record<TourType, TourRoute> = {
  family: {
    id: 'family',
    name: 'Family Tour',
    description: 'Kid-friendly stops with entertaining legends',
    icon: 'people',
    duration: '~1 hour',
    stopNumbers: [1, 2, 4, 8, 9, 11, 12],
    legendIndexes: [0, 3], // 1st and 4th legends
  },
  complete: {
    id: 'complete',
    name: 'Complete Tour',
    description: 'Experience the full castle with all stops and legends',
    icon: 'trophy',
    duration: '~2.5 hours',
    stopNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    legendIndexes: [0, 1, 2, 3], // All 4 legends
  },
  express: {
    id: 'express',
    name: 'Express Tour',
    description: 'Highlights and must-see stops for visitors on the go',
    icon: 'flash',
    duration: '~45 minutes',
    stopNumbers: [1, 2, 3, 7, 8, 11, 12],
    legendIndexes: [2], // 3rd legend
  },
};

interface TourTypeState {
  selectedTourType: TourType;
  setTourType: (tourType: TourType) => Promise<void>;
  getTourRoute: () => TourRoute;
}

export const useTourTypeStore = create<TourTypeState>((set, get) => ({
  selectedTourType: 'complete',

  setTourType: async (tourType: TourType) => {
    set({ selectedTourType: tourType });
    try {
      await AsyncStorage.setItem('selectedTourType', tourType);
    } catch (error) {
      console.error('Error saving tour type:', error);
    }
  },

  getTourRoute: () => {
    const { selectedTourType } = get();
    return TOUR_ROUTES[selectedTourType];
  },
}));

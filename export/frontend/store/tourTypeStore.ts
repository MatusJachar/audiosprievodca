import { create } from 'zustand';

// Tour types available in the app
export type TourType = 'complete';

interface TourRoute {
  id: TourType;
  name: string;
  description: string;
  duration: string;
  stopNumbers: number[];
  legendIndexes: number[];
}

// Tour routes configuration - showing all stops
export const TOUR_ROUTES: Record<TourType, TourRoute> = {
  complete: {
    id: 'complete',
    name: 'Complete Tour',
    description: 'Full castle experience with all stops and legends',
    duration: '90 min',
    stopNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    legendIndexes: [0, 1, 2, 3], // All 4 legends
  },
};

interface TourTypeState {
  selectedTourType: TourType;
  setTourType: (type: TourType) => void;
  getTourRoute: () => TourRoute;
}

export const useTourTypeStore = create<TourTypeState>((set, get) => ({
  selectedTourType: 'complete',
  setTourType: (type) => set({ selectedTourType: type }),
  getTourRoute: () => {
    const { selectedTourType } = get();
    return TOUR_ROUTES[selectedTourType];
  },
}));

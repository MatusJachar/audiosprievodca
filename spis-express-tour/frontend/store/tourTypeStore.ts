import { create } from 'zustand';

// This app has only one tour - the Express+ tour
// Stops: 1, 2, 3, 4, 6, 7, 8, 11, 12 + Legend L3 (The Ghost of Spiš Castle)

export const TOUR_STOPS = [1, 2, 3, 4, 6, 7, 8, 11, 12];
export const LEGEND_INDEX = 2; // L3 - The Ghost of Spiš Castle (0-indexed as 3rd legend)

interface TourTypeState {
  getTourStops: () => number[];
  getLegendIndex: () => number;
}

export const useTourTypeStore = create<TourTypeState>(() => ({
  getTourStops: () => TOUR_STOPS,
  getLegendIndex: () => LEGEND_INDEX,
}));

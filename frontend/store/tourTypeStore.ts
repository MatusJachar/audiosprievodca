import { create } from 'zustand';

// Tour configuration: 7 stops + 1 legend
// Stops: 1, 2, 4, 6, 8, 11, 12 + Legend 3 (Ghost of Spiš Castle)

export const TOUR_STOP_NUMBERS = [1, 2, 4, 6, 8, 11, 12];
export const LEGEND_INDEXES = [2]; // Legend 3 only (0-indexed = 2)

interface TourRoute {
  name: string;
  description: string;
  stopNumbers: number[];
  legendIndexes: number[];
}

export const TOUR_ROUTE: TourRoute = {
  name: 'Spišský hrad Tour',
  description: '7 tour stops + 1 legend',
  stopNumbers: TOUR_STOP_NUMBERS,
  legendIndexes: LEGEND_INDEXES,
};

interface TourTypeState {
  getTourRoute: () => TourRoute;
  getStopNumbers: () => number[];
  getLegendIndexes: () => number[];
}

export const useTourTypeStore = create<TourTypeState>(() => ({
  getTourRoute: () => TOUR_ROUTE,
  getStopNumbers: () => TOUR_STOP_NUMBERS,
  getLegendIndexes: () => LEGEND_INDEXES,
}));

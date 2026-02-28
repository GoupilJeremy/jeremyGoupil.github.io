import { create } from "zustand";
import type { EventCategory, EraId, HistoricalEvent } from "../types";

interface AppState {
  // Timeline
  currentYear: number;
  setCurrentYear: (year: number) => void;
  isPlaying: boolean;
  togglePlaying: () => void;

  // Selection
  selectedEvent: HistoricalEvent | null;
  setSelectedEvent: (event: HistoricalEvent | null) => void;

  // Filters
  activeCategories: EventCategory[];
  toggleCategory: (category: EventCategory) => void;
  activeEra: EraId | null;
  setActiveEra: (era: EraId | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // UI
  isPanelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Timeline
  currentYear: 2026,
  setCurrentYear: (year) => set({ currentYear: year }),
  isPlaying: false,
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),

  // Selection
  selectedEvent: null,
  setSelectedEvent: (event) =>
    set({ selectedEvent: event, isPanelOpen: event !== null }),

  // Filters
  activeCategories: [],
  toggleCategory: (category) =>
    set((state) => ({
      activeCategories: state.activeCategories.includes(category)
        ? state.activeCategories.filter((c) => c !== category)
        : [...state.activeCategories, category],
    })),
  activeEra: null,
  setActiveEra: (era) => set({ activeEra: era }),

  // Search
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  // UI
  isPanelOpen: false,
  setPanelOpen: (open) => set({ isPanelOpen: open }),
}));

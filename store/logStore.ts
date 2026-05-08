'use client';

import { create } from 'zustand';
import { computeGutScore } from '@/lib/gutScore';

export interface TodayLog {
  dayNumber: number;
  date: string;
  // Morning
  energy: number;
  sleepQuality: number;
  morningCheckedIn: boolean;
  // During day
  waterGlasses: number;
  // Evening
  mood: number;
  bloating: number;
  bmFrequency: number;
  bmType: number;
  bmPain: string;
  symptoms: string[];
  notes: string;
  fermentedFood: boolean;
  boneBroth: boolean;
  eliminatedAvoided: boolean;
  exerciseDone: boolean;
  exerciseType: string;
  exerciseDuration: number;
  eveningCheckedIn: boolean;
  // Computed
  gutScore: number;
  // Supplements
  supplementsTaken: Record<string, boolean>;
  // Meals
  mealsEaten: Record<string, boolean>;
}

export interface LogStore {
  todayLog: TodayLog | null;
  isLoading: boolean;
  pbAvailable: boolean;
  
  setTodayLog: (log: TodayLog) => void;
  updateTodayLog: (updates: Partial<TodayLog>) => void;
  toggleSupplement: (key: string) => void;
  toggleMeal: (slot: string) => void;
  incrementWater: () => void;
  decrementWater: () => void;
  computeGutScore: () => number;
  setPbAvailable: (available: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useLogStore = create<LogStore>((set, get) => ({
  todayLog: null,
  isLoading: false,
  pbAvailable: false,
  
  setTodayLog: (log) => set({ todayLog: log }),
  
  updateTodayLog: (updates) => {
    const current = get().todayLog;
    if (!current) return;
    const updated = { ...current, ...updates };
    set({ todayLog: updated });
  },
  
  toggleSupplement: (key) => {
    const current = get().todayLog;
    if (!current) return;
    const supplementsTaken = {
      ...current.supplementsTaken,
      [key]: !current.supplementsTaken[key],
    };
    set({ todayLog: { ...current, supplementsTaken } });
  },
  
  toggleMeal: (slot) => {
    const current = get().todayLog;
    if (!current) return;
    const mealsEaten = {
      ...current.mealsEaten,
      [slot]: !current.mealsEaten[slot],
    };
    set({ todayLog: { ...current, mealsEaten } });
  },
  
  incrementWater: () => {
    const current = get().todayLog;
    if (!current) return;
    set({ todayLog: { ...current, waterGlasses: Math.min(current.waterGlasses + 1, 12) } });
  },
  
  decrementWater: () => {
    const current = get().todayLog;
    if (!current) return;
    set({ todayLog: { ...current, waterGlasses: Math.max(current.waterGlasses - 1, 0) } });
  },
  
  computeGutScore: () => {
    const current = get().todayLog;
    if (!current) return 0;
    const total = Object.keys(current.supplementsTaken).length;
    return computeGutScore({
      supplementsTaken: current.supplementsTaken,
      totalSupplements: total,
      mealsEaten: current.mealsEaten,
      waterGlasses: current.waterGlasses,
      energy: current.energy,
      bloating: current.bloating,
    });
  },
  
  setPbAvailable: (available) => set({ pbAvailable: available }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

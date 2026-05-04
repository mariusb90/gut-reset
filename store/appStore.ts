'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppState {
  userId: string;
  startDate: string | null;
  goals: string[];
  configuredSupplements: string[];
  onboardingComplete: boolean;
  notificationsEnabled: boolean;
  
  // Actions
  setStartDate: (date: string) => void;
  setGoals: (goals: string[]) => void;
  setConfiguredSupplements: (supplements: string[]) => void;
  completeOnboarding: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  userId: 'local-user',
  startDate: null,
  goals: [],
  configuredSupplements: ['probiotics', 'l-glutamine', 'omega-3', 'vitamin-d3-k2', 'magnesium-glycinate'],
  onboardingComplete: false,
  notificationsEnabled: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      
      setStartDate: (date) => set({ startDate: date }),
      setGoals: (goals) => set({ goals }),
      setConfiguredSupplements: (supplements) => set({ configuredSupplements: supplements }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      reset: () => set(INITIAL_STATE),
    }),
    {
      name: 'gut-reset-app-store',
    }
  )
);

// Helper: compute current day number from start date
export function getCurrentDayNumber(startDate: string | null): number {
  if (!startDate) return 1;
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(14, diff));
}

export function getPhase(dayNumber: number): 'elimination' | 'stabilisation' | 'restoration' {
  if (dayNumber <= 3) return 'elimination';
  if (dayNumber <= 7) return 'stabilisation';
  return 'restoration';
}

export function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'elimination': return 'Elimination Phase';
    case 'stabilisation': return 'Stabilisation Phase';
    case 'restoration': return 'Restoration Phase';
    default: return '';
  }
}

export function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'elimination': return '#EF4444';
    case 'stabilisation': return '#F59E0B';
    case 'restoration': return '#4A7C59';
    default: return '#4A7C59';
  }
}

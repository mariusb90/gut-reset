export interface DailyLog {
  id?: string;
  user: string;
  day_number: number;
  log_date: string;
  energy: number;
  mood: number;
  sleep_quality: number;
  water_glasses: number;
  bloating: number;
  bm_frequency: number;
  bm_type: number;
  bm_pain: string;
  symptoms: string[];
  notes: string;
  gut_score: number;
  morning_checked_in: boolean;
  evening_checked_in: boolean;
  fermented_food: boolean;
  bone_broth: boolean;
  eliminated_avoided: boolean;
  exercise_done: boolean;
  exercise_type: string;
  exercise_duration: number;
  created?: string;
  updated?: string;
}

export interface SupplementLog {
  id?: string;
  user: string;
  log_date: string;
  supplement_id: string;
  taken: boolean;
  time_taken?: string;
}

export interface MealLog {
  id?: string;
  user: string;
  log_date: string;
  day_number: number;
  meal_slot: string;
  eaten: boolean;
}

export type Sex = 'male' | 'female' | 'other' | '';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete' | '';
export type DietaryFlag = 'dairy-free' | 'gluten-free' | 'nut-free' | 'egg-free' | 'pescatarian' | 'vegan' | 'vegetarian';

export interface PersonalProfile {
  age: number | null;
  sex: Sex;
  weight_kg: number | null;
  height_cm: number | null;
  activity_level: ActivityLevel;
}

export interface FoodPreferences {
  dietary_flags: DietaryFlag[];
  food_dislikes: string[];
}

export interface UserProfile {
  id?: string;
  user: string;
  start_date: string;
  goals: string[];
  notifications_enabled: boolean;
  onboarding_complete: boolean;
  configured_supplements: string[];
  age?: number | null;
  sex?: Sex;
  weight_kg?: number | null;
  height_cm?: number | null;
  activity_level?: ActivityLevel;
  dietary_flags?: DietaryFlag[];
  food_dislikes?: string[];
}

export interface Baseline {
  id?: string;
  user: string;
  energy: number;
  bloating: number;
  mood: number;
  bowel_pattern: string;
  notes: string;
}

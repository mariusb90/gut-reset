'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card, PhaseBadge } from '@/components/ui/Card';
import { useAppStore, getCurrentDayNumber } from '@/store/appStore';
import { getMealPersonalisation, mealPlan } from '@/data/mealPlan';
import { getLocalMealLogs, setLocalMealLogs } from '@/lib/storage';

type MealSlotKey = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';

const MEAL_SLOTS: { key: MealSlotKey; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'snack1', label: 'Morning Snack', emoji: '🍎' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️' },
  { key: 'snack2', label: 'Afternoon Snack', emoji: '🫐' },
  { key: 'dinner', label: 'Dinner', emoji: '🌙' },
];

export default function MealsPage() {
  const { startDate, personalDetails, foodPreferences } = useAppStore();
  const currentDay = getCurrentDayNumber(startDate);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [week, setWeek] = useState<1 | 2>(currentDay <= 7 ? 1 : 2);
  const [mealsEaten, setMealsEaten] = useState<Record<string, Record<string, boolean>>>({});
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  
  useEffect(() => {
    // Load all meal logs
    const dayData: Record<string, Record<string, boolean>> = {};
    for (let d = 1; d <= 14; d++) {
      const startDt = startDate ? new Date(startDate) : new Date();
      startDt.setDate(startDt.getDate() + d - 1);
      const dateStr = startDt.toISOString().split('T')[0];
      const stored = getLocalMealLogs(dateStr);
      if (stored) dayData[d] = stored;
    }
    setMealsEaten(dayData);
  }, [startDate]);
  
  const toggleMeal = (dayNum: number, slot: string) => {
    const startDt = startDate ? new Date(startDate) : new Date();
    startDt.setDate(startDt.getDate() + dayNum - 1);
    const dateStr = startDt.toISOString().split('T')[0];
    
    const current = mealsEaten[dayNum] || {};
    const updated = { ...current, [slot]: !current[slot] };
    
    setMealsEaten(prev => ({ ...prev, [dayNum]: updated }));
    setLocalMealLogs(dateStr, updated);
    
    // Sync to PocketBase
    fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: 'local-user',
        log_date: dateStr,
        day_number: dayNum,
        meal_slot: slot,
        eaten: updated[slot],
      }),
    }).catch(() => {});
  };
  
  const weekDays = mealPlan.filter(m => m.week === week);
  const selectedMeal = mealPlan.find(m => m.day_number === selectedDay);
  
  const getDayProgress = (dayNum: number) => {
    const eaten = mealsEaten[dayNum] || {};
    return Object.values(eaten).filter(Boolean).length;
  };
  
  return (
    <div className="min-h-dvh max-w-sm mx-auto flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Header */}
      <div className="px-4 pt-safe pt-4 pb-3 bg-white border-b" style={{ borderColor: '#E8E6E3' }}>
        <h1 className="text-xl font-bold mb-3" style={{ color: '#1C1C1A' }}>🥗 Meals</h1>
        
        {/* Week selector */}
        <div className="flex gap-2 mb-3">
          {([1, 2] as const).map((w) => (
            <button
              key={w}
              onClick={() => { setWeek(w); setSelectedDay(w === 1 ? 1 : 8); }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all"
              style={{
                backgroundColor: week === w ? '#4A7C59' : '#F5F4F2',
                color: week === w ? 'white' : '#57534E',
              }}
            >
              Week {w}
            </button>
          ))}
        </div>
        
        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {weekDays.map((day) => {
            const isToday = day.day_number === currentDay;
            const isPast = day.day_number < currentDay;
            const progress = getDayProgress(day.day_number);
            return (
              <button
                key={day.day_number}
                onClick={() => setSelectedDay(day.day_number)}
                className="flex-shrink-0 flex flex-col items-center w-12 py-2 rounded-xl cursor-pointer transition-all"
                style={{
                  backgroundColor: selectedDay === day.day_number ? '#4A7C59' : isToday ? '#E0EEE6' : 'transparent',
                  color: selectedDay === day.day_number ? 'white' : '#1C1C1A',
                }}
              >
                <span className="text-xs font-medium">D{day.day_number}</span>
                {progress > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ backgroundColor: selectedDay === day.day_number ? 'rgba(255,255,255,0.7)' : '#4A7C59' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Meal content */}
      <div className="flex-1 overflow-y-auto pb-nav px-4 py-4">
        {selectedMeal && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-bold text-lg" style={{ color: '#1C1C1A' }}>Day {selectedMeal.day_number}</h2>
              <PhaseBadge phase={selectedMeal.phase} />
              {selectedMeal.day_number === currentDay && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#4A7C59' }}>TODAY</span>
              )}
            </div>
            
            {MEAL_SLOTS.map(({ key, label, emoji }) => {
              const meal = selectedMeal[key];
              const eaten = mealsEaten[selectedMeal.day_number]?.[key] || false;
              const isExpanded = expandedSlot === key;
              const personalisation = getMealPersonalisation(meal, key, {
                age: personalDetails.age,
                sex: personalDetails.sex,
                weightKg: personalDetails.weightKg,
                heightCm: personalDetails.heightCm,
                activityLevel: personalDetails.activityLevel,
                dietaryFlags: foodPreferences.dietaryFlags,
                foodDislikes: foodPreferences.foodDislikes,
              });
              
              return (
                <Card key={key} className="mb-3">
                  <button
                    onClick={() => setExpandedSlot(isExpanded ? null : key)}
                    className="w-full flex items-center gap-3 cursor-pointer text-left"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMeal(selectedMeal.day_number, key); }}
                      className="w-7 h-7 rounded-md border-2 flex-shrink-0 flex items-center justify-center cursor-pointer"
                      style={{
                        borderColor: eaten ? '#4A7C59' : '#D2CECC',
                        backgroundColor: eaten ? '#4A7C59' : 'white',
                      }}
                    >
                      {eaten && <span className="text-white text-sm">✓</span>}
                    </button>
                    <span className="text-xl">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: '#A8A29E' }}>{label}</p>
                      <p className="text-sm font-semibold truncate" style={{ color: '#1C1C1A', textDecoration: eaten ? 'line-through' : 'none', opacity: eaten ? 0.6 : 1 }}>
                        {meal.name}
                      </p>
                      {personalisation.alternatives.length > 0 ? (
                        <div className="mt-0.5">
                          <p className="text-xs font-semibold" style={{ color: '#D97706' }}>⚠ May not suit you</p>
                          <p className="text-xs truncate" style={{ color: '#B45309' }}>{personalisation.alternatives[0].shortSwap}</p>
                        </div>
                      ) : personalisation.portion && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#4A7C59' }}>{personalisation.portion.label}</p>
                      )}
                    </div>
                    <span className="text-sm" style={{ color: '#A8A29E' }}>{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t" style={{ borderColor: '#F5F4F2' }}>
                          <p className="text-sm mb-2" style={{ color: '#44403C' }}>{meal.description}</p>
                          {personalisation.portion && (
                            <div className="rounded-xl p-3 mb-2" style={{ backgroundColor: '#F0FAF4', border: '1px solid #C1DCC9' }}>
                              <p className="text-xs font-bold mb-1" style={{ color: '#2C4A35' }}>Personal portion: {personalisation.portion.label}</p>
                              <ul className="flex flex-col gap-0.5">
                                {personalisation.portion.details.map(detail => (
                                  <li key={detail} className="text-xs" style={{ color: '#3A6146' }}>• {detail}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {personalisation.alternatives.length > 0 && (
                            <div className="rounded-xl p-3 mb-2" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D' }}>
                              <p className="text-xs font-bold mb-2" style={{ color: '#92400E' }}>⚠️ May not suit you</p>
                              <div className="flex flex-col gap-3">
                                {personalisation.alternatives.map((alt, index) => (
                                  <div key={`${alt.reason}-${index}`}>
                                    <p className="text-xs font-semibold" style={{ color: '#78350F' }}>{alt.note}</p>
                                    <p className="text-xs mt-1" style={{ color: '#92400E', lineHeight: '1.45' }}>{alt.swap}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {meal.prep_notes && (
                            <div className="bg-[#E0EEE6] rounded-xl p-3">
                              <p className="text-xs font-semibold mb-1" style={{ color: '#2C4A35' }}>Prep note:</p>
                              <p className="text-xs" style={{ color: '#3A6146' }}>{meal.prep_notes}</p>
                            </div>
                          )}
                          <button
                            onClick={() => toggleMeal(selectedMeal.day_number, key)}
                            className="w-full mt-3 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                            style={{
                              backgroundColor: eaten ? '#F5F4F2' : '#4A7C59',
                              color: eaten ? '#44403C' : 'white',
                            }}
                          >
                            {eaten ? '✓ Mark as not eaten' : 'Mark as eaten'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}

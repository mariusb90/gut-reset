'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomNav } from '@/components/ui/BottomNav';
import { GutScoreBreakdown, ScoreComponent } from '@/components/ui/GutScoreBreakdown';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { PhaseBadge, StreakBadge, Card } from '@/components/ui/Card';
import { MetricSelector, EmojiMetricSelector, BloatingSelector, WaterTracker } from '@/components/ui/MetricSelector';
import { useAppStore, getCurrentDayNumber, getPhase } from '@/store/appStore';
import { useLogStore } from '@/store/logStore';
import { supplements } from '@/data/supplements';
import { getMealPersonalisation, mealPlan } from '@/data/mealPlan';
import { getLocalLog, setLocalLog, getLocalSupplementLogs, setLocalSupplementLogs, getLocalMealLogs, setLocalMealLogs, getAllLocalLogs } from '@/lib/storage';
import { computeGutScore, computeGutScoreBreakdown } from '@/lib/gutScore';

// Bristol Stool Scale
const BRISTOL = [
  { type: 1, label: 'Hard lumps', emoji: '⚫' },
  { type: 2, label: 'Lumpy sausage', emoji: '🔵' },
  { type: 3, label: 'Cracked sausage', emoji: '🟣' },
  { type: 4, label: 'Smooth sausage ✓', emoji: '🟢' },
  { type: 5, label: 'Soft blobs', emoji: '🟡' },
  { type: 6, label: 'Mushy', emoji: '🟠' },
  { type: 7, label: 'Watery', emoji: '🔴' },
];

function computeStreak(logs: Array<{ date: string; data: unknown }>): number {
  if (!logs.length) return 0;
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let d = new Date();
  
  for (let i = 0; i < 14; i++) {
    const dateStr = d.toISOString().split('T')[0];
    const found = logs.find(l => l.date === dateStr);
    if (found && (found.data as { evening_checked_in?: boolean })?.evening_checked_in) {
      streak++;
    } else if (dateStr === today) {
      // Today not yet logged — don't break streak
    } else {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

type ViewMode = 'dashboard' | 'morning' | 'evening';

// Goal priority: energy > bloating > digestion > skin > default
function getGoalCoaching(goals: string[], energy: number): { heading: string; body: string } {
  const has = (g: string) => goals.includes(g);
  const energyDisplay = energy > 0 ? `${energy}/5` : 'starting today';
  if (has('energy')) return {
    heading: 'Tracking your energy',
    body: `Tracking energy daily helps you spot which foods and habits give you a lift. Your energy trend so far: ${energyDisplay}.`,
  };
  if (has('bloating')) return {
    heading: 'Your bloating curve',
    body: 'Bloating typically peaks Days 2-3 as pathobionts die off, then drops sharply by Day 5-7. Track it daily to see your personal curve.',
  };
  if (has('digestion')) return {
    heading: 'Digestion in progress',
    body: 'Gut transit time improves as your microbiome shifts. The Bristol Stool Scale readings you log give you the clearest signal.',
  };
  if (has('skin')) return {
    heading: 'Gut–skin connection',
    body: 'Skin often reflects gut inflammation with a 2-3 day lag. Keep logging — you\'ll likely see changes in Week 2.',
  };
  return {
    heading: 'Rebuilding from the ground up',
    body: 'You\'re rebuilding your microbiome from the ground up. Each logged day compounds the restoration.',
  };
}

function getDay7GoalTip(goals: string[]): string {
  const has = (g: string) => goals.includes(g);
  if (has('energy')) return 'Your beneficial bacteria are now producing more SCFAs — the primary fuel for sustained energy. The fatigue you felt early on should be lifting.';
  if (has('bloating')) return 'By Day 7, tight junction proteins in your gut lining are actively regenerating. Bloating should be visibly improving.';
  if (has('digestion')) return 'Your gut transit time is normalising. Bristol types 3-4 should be more consistent now.';
  return 'Week 2 is where most people notice the biggest changes. Stay consistent.';
}

export default function TodayPage() {
  const { startDate, configuredSupplements, goals, personalDetails, foodPreferences, setConfiguredSupplements } = useAppStore();
  const dayNumber = getCurrentDayNumber(startDate);
  const phase = getPhase(dayNumber);
  const today = new Date().toISOString().split('T')[0];
  const dayMeal = mealPlan.find(m => m.day_number === dayNumber);
  const configuredSupplList = supplements.filter(s => configuredSupplements.includes(s.key));

  const [view, setView] = useState<ViewMode>('dashboard');
  const [showCompletion, setShowCompletion] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [streak, setStreak] = useState(0);
  const [suppToast, setSuppToast] = useState<string | null>(null);
  
  // Log state
  const [energy, setEnergy] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [mood, setMood] = useState(3);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [bloating, setBloating] = useState(1);
  const [bmFrequency, setBmFrequency] = useState(0);
  const [bmType, setBmType] = useState(4);
  const [bmPain, setBmPain] = useState('none');
  const [notes, setNotes] = useState('');
  const [fermentedFood, setFermentedFood] = useState(false);
  const [boneBroth, setBoneBroth] = useState(false);
  const [eliminatedAvoided, setEliminatedAvoided] = useState(true);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [morningCheckedIn, setMorningCheckedIn] = useState(false);
  const [eveningCheckedIn, setEveningCheckedIn] = useState(false);
  const [supplementsTaken, setSupplementsTaken] = useState<Record<string, boolean>>({});
  const [mealsEaten, setMealsEaten] = useState<Record<string, boolean>>({});
  
  // Build breakdown data from current log state
  function buildBreakdownComponents(): ScoreComponent[] {
    const breakdown = computeGutScoreBreakdown({
      supplementsTaken,
      totalSupplements: configuredSupplList.length,
      mealsEaten,
      waterGlasses,
      energy,
      bloating,
    });

    return [
      {
        label: 'Supplements',
        emoji: '💊',
        earned: breakdown.supplements,
        max: 30,
      },
      {
        label: 'Meals',
        emoji: '🥗',
        earned: breakdown.meals,
        max: 25,
      },
      {
        label: 'Water',
        emoji: '💧',
        earned: breakdown.water,
        max: 15,
      },
      {
        label: 'Energy',
        emoji: '⚡',
        earned: breakdown.energy,
        max: 15,
        pending: !morningCheckedIn,
      },
      {
        label: 'Bloating',
        emoji: '🫧',
        earned: breakdown.bloating,
        max: 15,
        pending: !eveningCheckedIn,
      },
    ];
  }

  function buildTodaySummary(): string {
    const suppTotal = configuredSupplList.length;
    const suppTaken = Object.values(supplementsTaken).filter(Boolean).length;
    if (!morningCheckedIn && !eveningCheckedIn) {
      return 'Complete your morning and evening check-ins to see the full picture.';
    }
    if (suppTotal > 0 && suppTaken === suppTotal) {
      return `All ${suppTotal} supplements taken — +${Math.round((suppTotal / suppTotal) * 30)} pts from compliance.`;
    }
    if (suppTotal > 0 && suppTaken < suppTotal) {
      const missing = suppTotal - suppTaken;
      const potentialGain = Math.round(((suppTotal - suppTaken) / suppTotal) * 30);
      return `${missing} supplement${missing > 1 ? 's' : ''} not yet taken — up to +${potentialGain} pts still available today.`;
    }
    if (!eveningCheckedIn) {
      return 'Evening log pending — bloating contribution will update after check-in.';
    }
    return gutScore >= 80
      ? 'Excellent day — all major components scored well.'
      : 'Keep tracking to unlock the remaining points.';
  }

  const gutScore = computeGutScore({
    supplementsTaken,
    totalSupplements: configuredSupplList.length,
    mealsEaten,
    waterGlasses,
    energy,
    bloating,
  });
  
  const addSupplement = (key: string, name: string) => {
    const updated = [...configuredSupplements, key];
    setConfiguredSupplements(updated);
    fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: 'local-user', configured_supplements: updated }),
    }).catch(() => {});
    setSuppToast(`✓ ${name} added to your list`);
    setTimeout(() => setSuppToast(null), 2500);
  };

  // Essential supplements not yet in user's list
  const missingSuppSuggestions = supplements.filter(
    s => s.priority === 'Essential' && !configuredSupplements.includes(s.key)
  );


  useEffect(() => {
    const stored = getLocalLog(today) as Record<string, unknown> | null;
    if (stored) {
      if (stored.energy) setEnergy(stored.energy as number);
      if (stored.sleep_quality) setSleepQuality(stored.sleep_quality as number);
      if (stored.mood) setMood(stored.mood as number);
      if (stored.water_glasses !== undefined) setWaterGlasses(stored.water_glasses as number);
      if (stored.bloating) setBloating(stored.bloating as number);
      if (stored.bm_frequency !== undefined) setBmFrequency(stored.bm_frequency as number);
      if (stored.bm_type) setBmType(stored.bm_type as number);
      if (stored.bm_pain) setBmPain(stored.bm_pain as string);
      if (stored.notes) setNotes(stored.notes as string);
      if (stored.fermented_food !== undefined) setFermentedFood(stored.fermented_food as boolean);
      if (stored.bone_broth !== undefined) setBoneBroth(stored.bone_broth as boolean);
      if (stored.eliminated_avoided !== undefined) setEliminatedAvoided(stored.eliminated_avoided as boolean);
      if (stored.exercise_done !== undefined) setExerciseDone(stored.exercise_done as boolean);
      if (stored.morning_checked_in) setMorningCheckedIn(stored.morning_checked_in as boolean);
      if (stored.evening_checked_in) setEveningCheckedIn(stored.evening_checked_in as boolean);
    }
    
    const suppLogs = getLocalSupplementLogs(today);
    if (suppLogs) setSupplementsTaken(suppLogs);
    
    const mealLogs = getLocalMealLogs(today);
    if (mealLogs) setMealsEaten(mealLogs);
    
    // Compute streak
    const allLogs = getAllLocalLogs();
    setStreak(computeStreak(allLogs));
  }, [today]);
  
  const saveLog = useCallback((extra: Record<string, unknown> = {}) => {
    const data = {
      user: 'local-user',
      day_number: dayNumber,
      log_date: today,
      energy,
      mood,
      sleep_quality: sleepQuality,
      water_glasses: waterGlasses,
      bloating,
      bm_frequency: bmFrequency,
      bm_type: bmType,
      bm_pain: bmPain,
      notes,
      fermented_food: fermentedFood,
      bone_broth: boneBroth,
      eliminated_avoided: eliminatedAvoided,
      exercise_done: exerciseDone,
      gut_score: gutScore,
      morning_checked_in: morningCheckedIn,
      evening_checked_in: eveningCheckedIn,
      ...extra,
    };
    setLocalLog(today, data);
    setLocalSupplementLogs(today, supplementsTaken);
    setLocalMealLogs(today, mealsEaten);
    
    // Try PocketBase
    fetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(() => {});
  }, [dayNumber, today, energy, mood, sleepQuality, waterGlasses, bloating, bmFrequency, bmType, bmPain, notes, fermentedFood, boneBroth, eliminatedAvoided, exerciseDone, gutScore, morningCheckedIn, eveningCheckedIn, supplementsTaken, mealsEaten]);
  
  const finishMorning = () => {
    setMorningCheckedIn(true);
    saveLog({ morning_checked_in: true });
    setView('dashboard');
  };
  
  const finishEvening = () => {
    setEveningCheckedIn(true);
    saveLog({ evening_checked_in: true });
    setView('dashboard');
    setShowCompletion(true);
    setStreak(s => s + 1);
  };
  
  const phaseInfo = {
    elimination: { label: 'Elimination Phase', tagline: 'Clearing the way — discomfort is progress' },
    stabilisation: { label: 'Stabilisation Phase', tagline: 'Beneficial bacteria are establishing' },
    restoration: { label: 'Restoration Phase', tagline: 'Diversity growing — you\'re almost there' },
  }[phase];
  
  const phaseColor = phase === 'elimination' ? '#EF4444' : phase === 'stabilisation' ? '#F59E0B' : '#4A7C59';
  
  return (
    <div className="min-h-dvh max-w-sm mx-auto flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Supplement toast */}
      <AnimatePresence>
        {suppToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg"
            style={{ backgroundColor: '#4A7C59' }}
          >
            {suppToast}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Completion overlay */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6"
          >
            <ProgressRing value={gutScore} size={140} strokeWidth={10} showLabel label="Gut Score" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="mt-6 text-center"
            >
              <p className="text-2xl font-bold mb-1" style={{ color: '#1C1C1A' }}>Day {dayNumber} logged ✓</p>
              <p className="text-base mb-2" style={{ color: '#6B7280' }}>{phaseInfo.tagline}</p>
              <StreakBadge streak={streak} className="justify-center mb-6" />
              {dayMeal?.milestone_day && (
                <div className="bg-[#E0EEE6] rounded-2xl p-4 mb-6 text-left">
                  <p className="text-sm" style={{ color: '#2C4A35' }}>{dayMeal.milestone_content}</p>
                  {dayNumber === 7 && (
                    <p className="text-sm mt-2 pt-2" style={{ color: '#2C4A35', borderTop: '1px solid #B8D8C4' }}>{getDay7GoalTip(goals)}</p>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowCompletion(false)}
                className="w-full py-4 rounded-2xl font-semibold text-white cursor-pointer"
                style={{ backgroundColor: '#4A7C59' }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto pb-nav"
          >
            {/* Header */}
            <div className="px-4 pt-safe pt-4 pb-4 text-white" style={{ backgroundColor: phaseColor }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm opacity-80">Day {dayNumber} of 14</p>
                  <h1 className="text-xl font-bold">{phaseInfo.label}</h1>
                </div>
                <StreakBadge streak={streak} className="text-white [&>span]:text-white" />
              </div>
              <p className="text-sm opacity-75">{phaseInfo.tagline}</p>
            </div>
            
            {/* Gut Score */}
            <div className="px-4 py-4">
              <Card elevated className="text-center">
                <p className="text-sm font-medium mb-3" style={{ color: '#6B7280' }}>Today's Gut Score</p>
                <button
                  onClick={() => setShowBreakdown(true)}
                  className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A7C59] focus-visible:ring-offset-2"
                  aria-label="Show gut score breakdown"
                >
                  <ProgressRing value={gutScore} size={100} strokeWidth={10} label="/ 100" />
                </button>
                <p className="text-xs mt-1" style={{ color: '#A8A29E' }}>Tap to see breakdown</p>
                <p className="text-xs mt-3" style={{ color: '#A8A29E' }}>
                  {gutScore < 40 ? 'Keep going — early days are the hardest' : gutScore < 70 ? 'Good progress — keep logging' : 'Excellent day 🌿'}
                </p>
              </Card>
            </div>
            
            {/* Goal coaching card */}
            {(() => {
              const coaching = getGoalCoaching(goals, energy);
              return (
                <div className="px-4 pb-2">
                  <div
                    className="rounded-xl p-3 flex gap-3 items-start"
                    style={{ backgroundColor: '#F0FAF4', borderLeft: '3px solid #4A7C59' }}
                  >
                    <span className="text-base">💡</span>
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: '#2C4A35' }}>{coaching.heading}</p>
                      <p className="text-xs" style={{ color: '#4A7C59', lineHeight: '1.5' }}>{coaching.body}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Essential supplement suggestions nudge */}
            {missingSuppSuggestions.length > 0 && (
              <div className="px-4 pb-2">
                <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #FCD34D' }}>
                  <div className="px-3 pt-3 pb-2" style={{ backgroundColor: '#FFFBEB' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: '#92400E' }}>🔴 Essential supplements you don’t have yet</p>
                    <div className="flex flex-col gap-2">
                      {missingSuppSuggestions.slice(0, 2).map(supp => (
                        <div key={supp.key} className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold" style={{ color: '#78350F' }}>{supp.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#92400E', lineHeight: '1.4' }}>
                              {supp.what_it_does.length > 80 ? supp.what_it_does.substring(0, 80) + '…' : supp.what_it_does}
                            </p>
                          </div>
                          <button
                            onClick={() => addSupplement(supp.key, supp.name)}
                            className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                            style={{ backgroundColor: '#FCD34D', color: '#78350F' }}
                          >
                            Add +
                          </button>
                        </div>
                      ))}
                    </div>
                    {missingSuppSuggestions.length > 2 && (
                      <p className="text-xs mt-2" style={{ color: '#B45309' }}>
                        {missingSuppSuggestions.length - 2} more essential supplement{missingSuppSuggestions.length - 2 > 1 ? 's' : ''} not yet added — see Guide tab
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Cards */}
            <div className="px-4 flex flex-col gap-3">
              {/* Morning Check-in */}
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-base" style={{ color: '#1C1C1A' }}>🌅 Morning Check-in</p>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Energy · Sleep · Supplements</p>
                  </div>
                  {morningCheckedIn ? (
                    <span className="text-2xl">✅</span>
                  ) : (
                    <button
                      onClick={() => setView('morning')}
                      className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer text-white"
                      style={{ backgroundColor: '#4A7C59' }}
                    >
                      Log
                    </button>
                  )}
                </div>
              </Card>
              
              {/* Water */}
              <Card>
                <p className="font-semibold text-base mb-3" style={{ color: '#1C1C1A' }}>💧 Water Intake</p>
                <WaterTracker
                  value={waterGlasses}
                  onChange={(v) => { setWaterGlasses(v); setTimeout(() => saveLog({ water_glasses: v }), 300); }}
                />
              </Card>
              
              {/* Today's Meals */}
              {dayMeal && (
                <Card>
                  <p className="font-semibold text-base mb-3" style={{ color: '#1C1C1A' }}>🥗 Today's Meals</p>
                  {(['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'] as const).map((slot) => {
                    const meal = dayMeal[slot];
                    const slotLabels: Record<string, string> = { breakfast: 'Breakfast', snack1: 'Morning Snack', lunch: 'Lunch', snack2: 'Afternoon Snack', dinner: 'Dinner' };
                    const personalisation = getMealPersonalisation(meal, slot, {
                      age: personalDetails.age,
                      sex: personalDetails.sex,
                      weightKg: personalDetails.weightKg,
                      heightCm: personalDetails.heightCm,
                      activityLevel: personalDetails.activityLevel,
                      dietaryFlags: foodPreferences.dietaryFlags,
                      foodDislikes: foodPreferences.foodDislikes,
                    });
                    return (
                      <button
                        key={slot}
                        onClick={() => {
                          const updated = { ...mealsEaten, [slot]: !mealsEaten[slot] };
                          setMealsEaten(updated);
                          setTimeout(() => saveLog(), 300);
                        }}
                        className="w-full flex items-center gap-3 py-2 text-left cursor-pointer"
                      >
                        <div
                          className="w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center"
                          style={{
                            borderColor: mealsEaten[slot] ? '#4A7C59' : '#D2CECC',
                            backgroundColor: mealsEaten[slot] ? '#4A7C59' : 'white',
                          }}
                        >
                          {mealsEaten[slot] && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium" style={{ color: '#A8A29E' }}>{slotLabels[slot]}</p>
                          <p className="text-sm font-medium truncate" style={{ color: '#1C1C1A' }}>{meal.name}</p>
                          {(personalisation.alternatives.length > 0 || personalisation.portion) && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: personalisation.alternatives.length > 0 ? '#D97706' : '#4A7C59' }}>
                              {personalisation.alternatives.length > 0 ? `Swap available · ${personalisation.alternatives[0].reason}` : personalisation.portion?.label}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {(() => {
                    const flagged = (['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'] as const)
                      .map(slot => getMealPersonalisation(dayMeal[slot], slot, { age: personalDetails.age, sex: personalDetails.sex, weightKg: personalDetails.weightKg, heightCm: personalDetails.heightCm, activityLevel: personalDetails.activityLevel, dietaryFlags: foodPreferences.dietaryFlags, foodDislikes: foodPreferences.foodDislikes }))
                      .filter(item => item.alternatives.length > 0);
                    if (!flagged.length && !personalDetails.weightKg) return null;
                    return (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: '#F5F4F2' }}>
                        {personalDetails.weightKg && (
                          <p className="text-xs mb-1" style={{ color: '#4A7C59' }}>Personal portions are active in the Meals tab.</p>
                        )}
                        {flagged.length > 0 && (
                          <p className="text-xs" style={{ color: '#D97706' }}>{flagged.length} meal slot{flagged.length > 1 ? 's' : ''} have protocol-compliant swaps today.</p>
                        )}
                      </div>
                    );
                  })()}
                </Card>
              )}
              
              {/* Evening Wrap-up */}
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-base" style={{ color: '#1C1C1A' }}>🌆 Evening Wrap-up</p>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Gut · Mood · Compliance</p>
                  </div>
                  {eveningCheckedIn ? (
                    <span className="text-2xl">✅</span>
                  ) : (
                    <button
                      onClick={() => setView('evening')}
                      className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer text-white"
                      style={{ backgroundColor: '#4A7C59' }}
                    >
                      Log
                    </button>
                  )}
                </div>
              </Card>
              
              {/* Supplements quick view */}
              <Card>
                <p className="font-semibold text-base mb-3" style={{ color: '#1C1C1A' }}>💊 Supplements</p>
                <p className="text-sm mb-3" style={{ color: '#6B7280' }}>
                  {Object.values(supplementsTaken).filter(Boolean).length} of {configuredSupplList.length} taken
                </p>
                {configuredSupplList.map((supp) => (
                  <button
                    key={supp.key}
                    onClick={() => {
                      const updated = { ...supplementsTaken, [supp.key]: !supplementsTaken[supp.key] };
                      setSupplementsTaken(updated);
                      setTimeout(() => saveLog(), 300);
                    }}
                    className="w-full flex items-center gap-3 py-2 cursor-pointer text-left"
                  >
                    <div
                      className="w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center"
                      style={{
                        borderColor: supplementsTaken[supp.key] ? '#4A7C59' : '#D2CECC',
                        backgroundColor: supplementsTaken[supp.key] ? '#4A7C59' : 'white',
                      }}
                    >
                      {supplementsTaken[supp.key] && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#1C1C1A' }}>{supp.name}</span>
                  </button>
                ))}
              </Card>
              
              {/* Milestone card */}
              {dayMeal?.milestone_day && dayMeal.milestone_content && (
                <div className="bg-[#E0EEE6] rounded-2xl p-4 mb-2">
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#2C4A35' }}>📍 Day {dayNumber} Milestone</p>
                  <p className="text-sm" style={{ color: '#2C4A35' }}>{dayMeal.milestone_content}</p>
                  {dayNumber === 7 && (
                    <p className="text-sm mt-2 pt-2" style={{ color: '#2C4A35', borderTop: '1px solid #B8D8C4' }}>{getDay7GoalTip(goals)}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {view === 'morning' && (
          <motion.div
            key="morning"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="flex-1 overflow-y-auto pb-nav"
          >
            <div className="px-4 pt-safe pt-4 pb-4 flex items-center gap-3">
              <button onClick={() => setView('dashboard')} className="text-2xl cursor-pointer">←</button>
              <div>
                <p className="text-xs" style={{ color: '#6B7280' }}>Day {dayNumber}</p>
                <h2 className="font-bold text-lg" style={{ color: '#1C1C1A' }}>🌅 Morning Check-in</h2>
              </div>
            </div>
            
            <div className="px-4 flex flex-col gap-4">
              <Card>
                <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>⚡ Energy this morning</p>
                <EmojiMetricSelector value={energy} onChange={setEnergy} emojis={['😫', '😔', '😐', '😊', '😄']} />
              </Card>
              
              <Card>
                <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>😴 Sleep quality</p>
                <EmojiMetricSelector value={sleepQuality} onChange={setSleepQuality} emojis={['😫', '😔', '😐', '😊', '😴']} />
              </Card>
              
              <Card>
                <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>💊 Morning supplements</p>
                {configuredSupplList
                  .filter(s => s.time_of_day.includes('morning'))
                  .map((supp) => (
                    <button
                      key={supp.key}
                      onClick={() => setSupplementsTaken(prev => ({ ...prev, [supp.key]: !prev[supp.key] }))}
                      className="w-full flex items-center gap-3 py-3 cursor-pointer text-left border-b last:border-b-0"
                      style={{ borderColor: '#F5F4F2' }}
                    >
                      <div
                        className="w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center"
                        style={{
                          borderColor: supplementsTaken[supp.key] ? '#4A7C59' : '#D2CECC',
                          backgroundColor: supplementsTaken[supp.key] ? '#4A7C59' : 'white',
                        }}
                      >
                        {supplementsTaken[supp.key] && <span className="text-white text-sm">✓</span>}
                      </div>
                      <span className="text-sm font-medium" style={{ color: '#1C1C1A' }}>{supp.name}</span>
                    </button>
                  ))}
              </Card>
              
              <button
                onClick={finishMorning}
                className="w-full py-4 rounded-2xl font-semibold text-lg cursor-pointer text-white mb-4"
                style={{ backgroundColor: '#4A7C59' }}
              >
                Done — See Today's Plan →
              </button>
            </div>
          </motion.div>
        )}
        
        {view === 'evening' && (
          <motion.div
            key="evening"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="flex-1 overflow-y-auto pb-nav"
          >
            <div className="px-4 pt-safe pt-4 pb-4 flex items-center gap-3">
              <button onClick={() => setView('dashboard')} className="text-2xl cursor-pointer">←</button>
              <div>
                <p className="text-xs" style={{ color: '#6B7280' }}>Day {dayNumber}</p>
                <h2 className="font-bold text-lg" style={{ color: '#1C1C1A' }}>🌆 Evening Wrap-up</h2>
              </div>
            </div>
            
            <div className="px-4 flex flex-col gap-4">
              <Card>
                <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>😊 Mood today</p>
                <EmojiMetricSelector value={mood} onChange={setMood} emojis={['😢', '😔', '😐', '🙂', '😊']} />
              </Card>
              
              <Card>
                <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>🫧 Bloating level</p>
                <BloatingSelector value={bloating} onChange={setBloating} />
              </Card>
              
              <Card>
                <p className="font-semibold mb-2" style={{ color: '#1C1C1A' }}>💩 Bowel Movement</p>
                <p className="text-xs mb-2" style={{ color: '#6B7280' }}>Bristol Stool Scale — tap your type</p>
                <div className="flex flex-col gap-1">
                  {BRISTOL.map((b) => (
                    <button
                      key={b.type}
                      onClick={() => setBmType(b.type)}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 text-left cursor-pointer transition-all"
                      style={{
                        borderColor: bmType === b.type ? '#4A7C59' : '#E8E6E3',
                        backgroundColor: bmType === b.type ? '#E0EEE6' : 'white',
                      }}
                    >
                      <span>{b.emoji}</span>
                      <span className="text-sm" style={{ color: '#1C1C1A' }}>Type {b.type}: {b.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2" style={{ color: '#44403C' }}>Frequency today</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setBmFrequency(Math.max(0, bmFrequency - 1))} className="w-10 h-10 rounded-full cursor-pointer font-bold text-lg" style={{ backgroundColor: '#E0EEE6', color: '#2C4A35' }}>−</button>
                    <span className="text-2xl font-bold" style={{ color: '#1C1C1A' }}>{bmFrequency}</span>
                    <button onClick={() => setBmFrequency(bmFrequency + 1)} className="w-10 h-10 rounded-full cursor-pointer font-bold text-lg" style={{ backgroundColor: '#4A7C59', color: 'white' }}>+</button>
                  </div>
                </div>
              </Card>
              
              <Card>
                <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>✅ Compliance today</p>
                {[
                  { key: 'fermented', label: '🥒 Fermented food consumed', value: fermentedFood, set: setFermentedFood },
                  { key: 'broth', label: '🍲 Bone broth consumed', value: boneBroth, set: setBoneBroth },
                  { key: 'avoided', label: '🚫 Eliminated foods avoided', value: eliminatedAvoided, set: setEliminatedAvoided },
                  { key: 'exercise', label: '🏃 Exercise completed', value: exerciseDone, set: setExerciseDone },
                ].map(({ key, label, value, set }) => (
                  <button
                    key={key}
                    onClick={() => set(!value)}
                    className="w-full flex items-center gap-3 py-3 cursor-pointer text-left border-b last:border-b-0"
                    style={{ borderColor: '#F5F4F2' }}
                  >
                    <div
                      className="w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center"
                      style={{
                        borderColor: value ? '#4A7C59' : '#D2CECC',
                        backgroundColor: value ? '#4A7C59' : 'white',
                      }}
                    >
                      {value && <span className="text-white text-sm">✓</span>}
                    </div>
                    <span className="text-sm" style={{ color: '#1C1C1A' }}>{label}</span>
                  </button>
                ))}
              </Card>
              
              <Card>
                <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>📝 Notes</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did today feel? Any reactions, observations..."
                  className="w-full p-3 rounded-xl border-2 text-sm outline-none resize-none"
                  style={{ borderColor: '#E8E6E3', color: '#1C1C1A', minHeight: '80px' }}
                />
              </Card>
              
              <button
                onClick={finishEvening}
                className="w-full py-4 rounded-2xl font-bold text-xl cursor-pointer text-white mb-4"
                style={{ backgroundColor: '#4A7C59' }}
              >
                Complete Day {dayNumber} ✓
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <GutScoreBreakdown
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        components={buildBreakdownComponents()}
        totalScore={gutScore}
        todaySummary={buildTodaySummary()}
      />
      <BottomNav />
    </div>
  );
}

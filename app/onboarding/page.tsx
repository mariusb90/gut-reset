'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import type { ActivityLevel, DietaryFlag, Sex } from '@/lib/types';
import { supplements } from '@/data/supplements';
import { MetricSelector } from '@/components/ui/MetricSelector';
import { setLocalProfile, setLocalBaseline } from '@/lib/storage';

const DIETARY_FLAGS: { id: DietaryFlag; label: string; emoji: string }[] = [
  { id: 'dairy-free', label: 'Dairy-free', emoji: '🥥' },
  { id: 'gluten-free', label: 'Gluten-free', emoji: '🌾' },
  { id: 'nut-free', label: 'Nut-free', emoji: '🌰' },
  { id: 'egg-free', label: 'Egg-free', emoji: '🥚' },
  { id: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
];

const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string }[] = [
  { id: 'sedentary', label: 'Mostly seated' },
  { id: 'light', label: 'Light movement 1–3×/week' },
  { id: 'moderate', label: 'Training 3–5×/week' },
  { id: 'active', label: 'Hard training most days' },
  { id: 'athlete', label: 'Athlete / physical job' },
];

const GOALS = [
  { id: 'bloating', label: 'Reduce bloating & digestive discomfort', emoji: '🫁' },
  { id: 'energy', label: 'Restore energy & reduce fatigue', emoji: '⚡' },
  { id: 'clarity', label: 'Improve mental clarity & brain fog', emoji: '🧠' },
  { id: 'sleep', label: 'Better sleep', emoji: '😴' },
  { id: 'antibiotics', label: 'Recover from antibiotics / disrupted gut', emoji: '🌿' },
  { id: 'reset', label: 'General health reset & baseline', emoji: '🎯' },
];

const SCREEN_VARIANTS = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { setStartDate, setGoals, setConfiguredSupplements, setPersonalDetails, setFoodPreferences, completeOnboarding } = useAppStore();
  
  const [screen, setScreen] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [startDate, setStartDateLocal] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSupps, setSelectedSupps] = useState<string[]>(
    supplements.filter(s => s.priority === 'Essential').map(s => s.key)
  );
  const [baseline, setBaselineLocal] = useState({ energy: 3, bloating: 3, mood: 3, bowel_pattern: 'variable' });
  const [personal, setPersonalLocal] = useState({ age: '', sex: '' as Sex, weightKg: '', heightCm: '', activityLevel: 'light' as ActivityLevel });
  const [dietaryFlags, setDietaryFlagsLocal] = useState<DietaryFlag[]>([]);
  const [foodDislikesInput, setFoodDislikesInput] = useState('');
  
  const TOTAL_SCREENS = 9;
  
  const next = () => {
    if (screen < TOTAL_SCREENS - 1) setScreen(s => s + 1);
  };
  
  const back = () => {
    if (screen > 0) setScreen(s => s - 1);
  };
  
  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };
  
  const toggleSupp = (key: string) => {
    setSelectedSupps(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleDietaryFlag = (id: DietaryFlag) => {
    setDietaryFlagsLocal(prev =>
      prev.includes(id) ? prev.filter(flag => flag !== id) : [...prev, id]
    );
  };

  const foodDislikes = foodDislikesInput
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  const profilePersonal = {
    age: personal.age ? Number(personal.age) : null,
    sex: personal.sex,
    weightKg: personal.weightKg ? Number(personal.weightKg) : null,
    heightCm: personal.heightCm ? Number(personal.heightCm) : null,
    activityLevel: personal.activityLevel,
  };
  
  const finish = async () => {
    setStartDate(startDate);
    setGoals(selectedGoals);
    setConfiguredSupplements(selectedSupps);
    setPersonalDetails(profilePersonal);
    setFoodPreferences({ dietaryFlags, foodDislikes });
    
    const profile = {
      user: 'local-user',
      start_date: startDate,
      goals: selectedGoals,
      configured_supplements: selectedSupps,
      age: profilePersonal.age,
      sex: profilePersonal.sex,
      weight_kg: profilePersonal.weightKg,
      height_cm: profilePersonal.heightCm,
      activity_level: profilePersonal.activityLevel,
      dietary_flags: dietaryFlags,
      food_dislikes: foodDislikes,
      notifications_enabled: false,
      onboarding_complete: true,
    };
    
    const bl = {
      user: 'local-user',
      ...baseline,
    };
    
    setLocalProfile(profile);
    setLocalBaseline(bl);
    
    try {
      await Promise.all([
        fetch('/api/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile), signal: AbortSignal.timeout(3000) }),
        fetch('/api/baselines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bl), signal: AbortSignal.timeout(3000) }),
      ]);
    } catch {
      // Silently fail — localStorage fallback is set
    }
    
    completeOnboarding();
    router.replace('/today');
  };
  
  const screens = [
    // Screen 0: Welcome
    <motion.div key="welcome" className="flex flex-col h-full text-white text-center px-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-8xl mb-8"
        >
          🌿
        </motion.div>
        <h1 className="text-3xl font-bold mb-4">14 Days to Reset Your Gut</h1>
        <p className="text-lg opacity-90 mb-4">A science-backed protocol to restore your microbiome, reduce inflammation, and feel significantly better.</p>
        <p className="text-base opacity-75">Built around the Mediterranean diet and clinical probiotic research. No guesswork — just a clear plan, one day at a time.</p>
      </div>
      <button
        onClick={next}
        className="w-full py-4 bg-white rounded-2xl font-semibold text-lg mb-8 cursor-pointer"
        style={{ color: '#4A7C59' }}
      >
        Let's Begin →
      </button>
    </motion.div>,
    
    // Screen 1: 3 phases
    <div key="phases" className="flex flex-col h-full px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1C1C1A' }}>Three phases. One goal.</h2>
        <p className="text-base" style={{ color: '#6B7280' }}>A structured path to gut restoration.</p>
      </div>
      <div className="flex flex-col gap-4 flex-1">
        {[
          { phase: 'Days 1–3', name: 'Elimination', color: '#EF4444', bg: '#FEE2E2', desc: 'Remove the inflammatory triggers. Expect some discomfort — it\'s the pathobionts dying off.' },
          { phase: 'Days 4–7', name: 'Stabilisation', color: '#D97706', bg: '#FFF3CD', desc: 'Beneficial bacteria start colonising. Energy typically improves around Day 5.' },
          { phase: 'Days 8–14', name: 'Restoration', color: '#4A7C59', bg: '#E0EEE6', desc: 'Diversity grows. Mood, sleep, and skin often clear in this phase.' },
        ].map((p) => (
          <div key={p.name} className="bg-white rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: p.bg, color: p.color }}>
                {p.phase}
              </span>
              <span className="font-semibold" style={{ color: '#1C1C1A' }}>{p.name}</span>
            </div>
            <p className="text-sm" style={{ color: '#6B7280' }}>{p.desc}</p>
          </div>
        ))}
      </div>
      <button onClick={next} className="w-full py-4 rounded-2xl font-semibold text-lg mt-6 cursor-pointer text-white" style={{ backgroundColor: '#4A7C59' }}>
        I understand →
      </button>
    </div>,
    
    // Screen 2: Start date
    <div key="date" className="flex flex-col h-full px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1C1C1A' }}>When do you start?</h2>
        <p className="text-base" style={{ color: '#6B7280' }}>We'll count your 14 days from this date.</p>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: '#44403C' }}>Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDateLocal(e.target.value)}
          className="w-full p-3 rounded-xl border-2 text-base outline-none"
          style={{ borderColor: '#4A7C59', color: '#1C1C1A' }}
          min={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
        />
        <p className="text-xs mt-2" style={{ color: '#A8A29E' }}>Best to start on a day when you control your meals — avoid conferences, weddings, travel days.</p>
      </div>
      <div className="flex-1" />
      <button onClick={next} className="w-full py-4 rounded-2xl font-semibold text-lg cursor-pointer text-white" style={{ backgroundColor: '#4A7C59' }}>
        Set Start Date →
      </button>
    </div>,
    
    // Screen 3: Goals
    <div key="goals" className="flex flex-col h-full px-4 py-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#1C1C1A' }}>What are you hoping to achieve?</h2>
        <p className="text-sm" style={{ color: '#6B7280' }}>Select everything that applies.</p>
      </div>
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {GOALS.map((goal) => (
          <button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 transition-all text-left cursor-pointer"
            style={{
              borderColor: selectedGoals.includes(goal.id) ? '#4A7C59' : '#E8E6E3',
              backgroundColor: selectedGoals.includes(goal.id) ? '#E0EEE6' : 'white',
            }}
          >
            <span className="text-2xl">{goal.emoji}</span>
            <span className="text-sm font-medium" style={{ color: '#1C1C1A' }}>{goal.label}</span>
            {selectedGoals.includes(goal.id) && <span className="ml-auto text-lg">✓</span>}
          </button>
        ))}
      </div>
      <button onClick={next} className="w-full py-4 rounded-2xl font-semibold text-lg mt-4 cursor-pointer text-white" style={{ backgroundColor: '#4A7C59' }}>
        Continue →
      </button>
    </div>,
    

    // Screen 4: Personal profile
    <div key="profile" className="flex flex-col h-full px-4 py-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#1C1C1A' }}>Personalise portions</h2>
        <p className="text-sm" style={{ color: '#6B7280' }}>Optional, but this lets us calculate Mifflin-St Jeor TDEE and suggest better meal portions.</p>
      </div>
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <label className="bg-white rounded-2xl p-3 shadow-card">
            <span className="block text-xs font-semibold mb-2" style={{ color: '#44403C' }}>Age</span>
            <input inputMode="numeric" value={personal.age} onChange={(e) => setPersonalLocal(p => ({ ...p, age: e.target.value.replace(/\D/g, '') }))} placeholder="38" className="w-full text-base outline-none" style={{ color: '#1C1C1A' }} />
          </label>
          <label className="bg-white rounded-2xl p-3 shadow-card">
            <span className="block text-xs font-semibold mb-2" style={{ color: '#44403C' }}>Sex</span>
            <select value={personal.sex} onChange={(e) => setPersonalLocal(p => ({ ...p, sex: e.target.value as Sex }))} className="w-full text-base outline-none bg-transparent" style={{ color: '#1C1C1A' }}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="bg-white rounded-2xl p-3 shadow-card">
            <span className="block text-xs font-semibold mb-2" style={{ color: '#44403C' }}>Weight (kg)</span>
            <input inputMode="decimal" value={personal.weightKg} onChange={(e) => setPersonalLocal(p => ({ ...p, weightKg: e.target.value.replace(/[^\d.]/g, '') }))} placeholder="82" className="w-full text-base outline-none" style={{ color: '#1C1C1A' }} />
          </label>
          <label className="bg-white rounded-2xl p-3 shadow-card">
            <span className="block text-xs font-semibold mb-2" style={{ color: '#44403C' }}>Height (cm)</span>
            <input inputMode="decimal" value={personal.heightCm} onChange={(e) => setPersonalLocal(p => ({ ...p, heightCm: e.target.value.replace(/[^\d.]/g, '') }))} placeholder="178" className="w-full text-base outline-none" style={{ color: '#1C1C1A' }} />
          </label>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-card">
          <p className="text-xs font-semibold mb-2" style={{ color: '#44403C' }}>Activity level</p>
          <div className="flex flex-col gap-2">
            {ACTIVITY_OPTIONS.map(option => (
              <button key={option.id} onClick={() => setPersonalLocal(p => ({ ...p, activityLevel: option.id }))} className="p-3 rounded-xl border-2 text-left text-sm font-medium cursor-pointer" style={{ borderColor: personal.activityLevel === option.id ? '#4A7C59' : '#E8E6E3', backgroundColor: personal.activityLevel === option.id ? '#E0EEE6' : 'white', color: '#1C1C1A' }}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={next} className="w-full py-4 rounded-2xl font-semibold text-lg mt-4 cursor-pointer text-white" style={{ backgroundColor: '#4A7C59' }}>
        Continue →
      </button>
    </div>,

    // Screen 5: Food preferences
    <div key="food-preferences" className="flex flex-col h-full px-4 py-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#1C1C1A' }}>Any foods to avoid?</h2>
        <p className="text-sm" style={{ color: '#6B7280' }}>We'll flag meals and show protocol-compliant swaps inline.</p>
      </div>
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {DIETARY_FLAGS.map(flag => (
            <button key={flag.id} onClick={() => toggleDietaryFlag(flag.id)} className="flex items-center gap-2 p-3 bg-white rounded-xl border-2 text-left cursor-pointer" style={{ borderColor: dietaryFlags.includes(flag.id) ? '#4A7C59' : '#E8E6E3', backgroundColor: dietaryFlags.includes(flag.id) ? '#E0EEE6' : 'white' }}>
              <span>{flag.emoji}</span>
              <span className="text-xs font-semibold" style={{ color: '#1C1C1A' }}>{flag.label}</span>
              {dietaryFlags.includes(flag.id) && <span className="ml-auto text-sm">✓</span>}
            </button>
          ))}
        </div>
        <label className="bg-white rounded-2xl p-4 shadow-card">
          <span className="block text-sm font-semibold mb-2" style={{ color: '#1C1C1A' }}>Specific dislikes or intolerances</span>
          <textarea value={foodDislikesInput} onChange={(e) => setFoodDislikesInput(e.target.value)} placeholder="e.g. sardines, eggs, kefir" className="w-full p-3 rounded-xl border-2 text-sm outline-none resize-none" style={{ borderColor: '#E8E6E3', color: '#1C1C1A', minHeight: '90px' }} />
          <p className="text-xs mt-2" style={{ color: '#A8A29E' }}>Comma separated. We keep swaps simple and protocol-compliant.</p>
        </label>
      </div>
      <button onClick={next} className="w-full py-4 rounded-2xl font-semibold text-lg mt-4 cursor-pointer text-white" style={{ backgroundColor: '#4A7C59' }}>
        Save Preferences →
      </button>
    </div>,

    // Screen 6: Supplements
    <div key="supps" className="flex flex-col h-full px-4 py-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#1C1C1A' }}>Which supplements do you have?</h2>
        <p className="text-sm" style={{ color: '#6B7280' }}>We'll build your daily checklist around what you actually have.</p>
      </div>
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {['Essential', 'Recommended', 'Optional'].map((priority) => {
          const group = supplements.filter(s => s.priority === priority);
          if (!group.length) return null;
          return (
            <div key={priority} className="mb-2">
              <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: priority === 'Essential' ? '#991B1B' : priority === 'Recommended' ? '#92400E' : '#78716C' }}>
                {priority}
              </div>
              {group.map((supp) => (
                <button
                  key={supp.key}
                  onClick={() => toggleSupp(supp.key)}
                  className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border-2 mb-2 text-left cursor-pointer transition-all"
                  style={{
                    borderColor: selectedSupps.includes(supp.key) ? '#4A7C59' : '#E8E6E3',
                    backgroundColor: selectedSupps.includes(supp.key) ? '#E0EEE6' : 'white',
                  }}
                >
                  <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: selectedSupps.includes(supp.key) ? '#4A7C59' : '#D2CECC', backgroundColor: selectedSupps.includes(supp.key) ? '#4A7C59' : 'white' }}>
                    {selectedSupps.includes(supp.key) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#1C1C1A' }}>{supp.name}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <button onClick={next} className="w-full py-4 rounded-2xl font-semibold text-lg mt-4 cursor-pointer text-white" style={{ backgroundColor: '#4A7C59' }}>
        Set Up My Protocol →
      </button>
    </div>,
    
    // Screen 7: Baseline
    <div key="baseline" className="flex flex-col h-full px-4 py-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#1C1C1A' }}>How are you feeling right now?</h2>
        <p className="text-sm" style={{ color: '#6B7280' }}>This is your Day 0 snapshot. At Day 14, you'll see exactly how much has changed.</p>
      </div>
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <label className="block text-sm font-semibold mb-3" style={{ color: '#1C1C1A' }}>⚡ Energy right now</label>
          <MetricSelector value={baseline.energy} onChange={(v) => setBaselineLocal(b => ({ ...b, energy: v }))} />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <label className="block text-sm font-semibold mb-3" style={{ color: '#1C1C1A' }}>🫧 Bloating level</label>
          <MetricSelector value={baseline.bloating} onChange={(v) => setBaselineLocal(b => ({ ...b, bloating: v }))} color="#F59E0B" />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <label className="block text-sm font-semibold mb-3" style={{ color: '#1C1C1A' }}>😊 Mood</label>
          <MetricSelector value={baseline.mood} onChange={(v) => setBaselineLocal(b => ({ ...b, mood: v }))} />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1C1C1A' }}>💩 Current bowel pattern</label>
          <div className="flex flex-col gap-2">
            {['constipated', 'normal', 'loose', 'variable'].map((option) => (
              <button
                key={option}
                onClick={() => setBaselineLocal(b => ({ ...b, bowel_pattern: option }))}
                className="p-3 rounded-xl border-2 text-left text-sm font-medium capitalize cursor-pointer transition-all"
                style={{
                  borderColor: baseline.bowel_pattern === option ? '#4A7C59' : '#E8E6E3',
                  backgroundColor: baseline.bowel_pattern === option ? '#E0EEE6' : 'white',
                  color: '#1C1C1A',
                }}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={next} className="w-full py-4 rounded-2xl font-semibold text-lg mt-4 cursor-pointer text-white" style={{ backgroundColor: '#4A7C59' }}>
        Save Baseline →
      </button>
    </div>,
    
    // Screen 8: Ready
    <div key="ready" className="flex flex-col h-full px-4 py-6 text-center">
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-8xl mb-6"
        >
          🚀
        </motion.div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: '#1C1C1A' }}>You're set up.</h2>
        <p className="text-base mb-2" style={{ color: '#6B7280' }}>
          Your 14-day gut reset starts{' '}
          <span className="font-semibold" style={{ color: '#4A7C59' }}>
            {new Date(startDate).toDateString()}
          </span>
        </p>
        <p className="text-sm" style={{ color: '#A8A29E' }}>
          {selectedSupps.length} supplements · {selectedGoals.length || 0} goals · {dietaryFlags.length + foodDislikes.length} food preferences
        </p>
      </div>
      <button
        onClick={finish}
        className="w-full py-4 rounded-2xl font-bold text-xl cursor-pointer text-white mb-4"
        style={{ backgroundColor: '#4A7C59' }}
      >
        Start My 14 Days 🌿
      </button>
      <p className="text-xs" style={{ color: '#A8A29E' }}>
        You can add Gut Reset to your home screen for quick access and push notifications
      </p>
    </div>,
  ];
  
  return (
    <div className="min-h-dvh flex flex-col max-w-sm mx-auto"
      style={{ backgroundColor: screen === 0 ? '#4A7C59' : '#FAFAF8' }}>
      
      {/* Progress dots */}
      {screen > 0 && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={back} className="text-2xl cursor-pointer" style={{ color: '#6B7280' }}>←</button>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_SCREENS }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === screen ? '24px' : '6px',
                  backgroundColor: i === screen ? '#4A7C59' : i < screen ? '#9DC9AC' : '#D2CECC',
                }}
              />
            ))}
          </div>
          <div className="w-8" />
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            variants={SCREEN_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {screens[screen]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

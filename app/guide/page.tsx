'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { supplements } from '@/data/supplements';
import { useAppStore, getCurrentDayNumber } from '@/store/appStore';

type Section = 'profile' | 'supplements' | 'exercise' | 'shopping' | 'expect' | 'foods';

export default function GuidePage() {
  const { configuredSupplements, startDate, personalDetails, foodPreferences, setConfiguredSupplements, setPersonalDetails, setFoodPreferences } = useAppStore();
  const currentDay = getCurrentDayNumber(startDate);
  const [section, setSection] = useState<Section>('profile');
  const [expandedSupp, setExpandedSupp] = useState<string | null>(null);
  const [expandedExpect, setExpandedExpect] = useState<string | null>('days1-3');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const addSupplement = async (key: string, name: string) => {
    const updated = [...configuredSupplements, key];
    setConfiguredSupplements(updated);
    // Persist to PocketBase
    fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: 'local-user', configured_supplements: updated }),
    }).catch(() => {});
    showToast(`✓ ${name} added to your list`);
  };
  
  const navItems: { key: Section; label: string; emoji: string }[] = [
    { key: 'profile', label: 'Profile', emoji: '👤' },
    { key: 'supplements', label: 'Supplements', emoji: '💊' },
    { key: 'exercise', label: 'Exercise', emoji: '🏃' },
    { key: 'shopping', label: 'Shopping', emoji: '🛒' },
    { key: 'expect', label: 'What to Expect', emoji: '📅' },
    { key: 'foods', label: 'Foods', emoji: '🥦' },
  ];
  
  return (
    <div className="min-h-dvh max-w-sm mx-auto flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg"
            style={{ backgroundColor: '#4A7C59' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="px-4 pt-safe pt-4 pb-3 bg-white border-b" style={{ borderColor: '#E8E6E3' }}>
        <h1 className="text-xl font-bold mb-3" style={{ color: '#1C1C1A' }}>📚 Guide</h1>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium cursor-pointer transition-all"
              style={{
                backgroundColor: section === item.key ? '#4A7C59' : '#F5F4F2',
                color: section === item.key ? 'white' : '#57534E',
              }}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-nav px-4 py-4">
        

        {/* Profile section */}
        {section === 'profile' && (
          <div>
            <Card className="mb-4">
              <p className="font-semibold mb-1" style={{ color: '#1C1C1A' }}>Personalisation</p>
              <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Update your profile any time. Portions and meal swaps react immediately.</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label>
                  <span className="block text-xs font-semibold mb-1" style={{ color: '#44403C' }}>Age</span>
                  <input inputMode="numeric" value={personalDetails.age ?? ''} onChange={(e) => setPersonalDetails({ age: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null })} className="w-full p-3 rounded-xl border-2 text-sm outline-none" style={{ borderColor: '#E8E6E3', color: '#1C1C1A' }} />
                </label>
                <label>
                  <span className="block text-xs font-semibold mb-1" style={{ color: '#44403C' }}>Sex</span>
                  <select value={personalDetails.sex} onChange={(e) => setPersonalDetails({ sex: e.target.value as typeof personalDetails.sex })} className="w-full p-3 rounded-xl border-2 text-sm outline-none bg-white" style={{ borderColor: '#E8E6E3', color: '#1C1C1A' }}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>
                  <span className="block text-xs font-semibold mb-1" style={{ color: '#44403C' }}>Weight (kg)</span>
                  <input inputMode="decimal" value={personalDetails.weightKg ?? ''} onChange={(e) => setPersonalDetails({ weightKg: e.target.value ? Number(e.target.value.replace(/[^\d.]/g, '')) : null })} className="w-full p-3 rounded-xl border-2 text-sm outline-none" style={{ borderColor: '#E8E6E3', color: '#1C1C1A' }} />
                </label>
                <label>
                  <span className="block text-xs font-semibold mb-1" style={{ color: '#44403C' }}>Height (cm)</span>
                  <input inputMode="decimal" value={personalDetails.heightCm ?? ''} onChange={(e) => setPersonalDetails({ heightCm: e.target.value ? Number(e.target.value.replace(/[^\d.]/g, '')) : null })} className="w-full p-3 rounded-xl border-2 text-sm outline-none" style={{ borderColor: '#E8E6E3', color: '#1C1C1A' }} />
                </label>
              </div>
              <label>
                <span className="block text-xs font-semibold mb-1" style={{ color: '#44403C' }}>Activity</span>
                <select value={personalDetails.activityLevel} onChange={(e) => setPersonalDetails({ activityLevel: e.target.value as typeof personalDetails.activityLevel })} className="w-full p-3 rounded-xl border-2 text-sm outline-none bg-white" style={{ borderColor: '#E8E6E3', color: '#1C1C1A' }}>
                  <option value="sedentary">Mostly seated</option>
                  <option value="light">Light movement 1–3×/week</option>
                  <option value="moderate">Training 3–5×/week</option>
                  <option value="active">Hard training most days</option>
                  <option value="athlete">Athlete / physical job</option>
                </select>
              </label>
            </Card>

            <Card>
              <p className="font-semibold mb-1" style={{ color: '#1C1C1A' }}>Food preferences</p>
              <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Dietary flags and dislikes power the smart meal alternatives.</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  ['dairy-free', '🥥 Dairy-free'], ['gluten-free', '🌾 Gluten-free'], ['nut-free', '🌰 Nut-free'], ['egg-free', '🥚 Egg-free'], ['pescatarian', '🐟 Pescatarian'], ['vegetarian', '🥦 Vegetarian'], ['vegan', '🌱 Vegan'],
                ].map(([id, label]) => {
                  const active = foodPreferences.dietaryFlags.includes(id as never);
                  return (
                    <button key={id} onClick={() => setFoodPreferences({ dietaryFlags: active ? foodPreferences.dietaryFlags.filter(flag => flag !== id) : [...foodPreferences.dietaryFlags, id as never] })} className="p-2 rounded-xl border-2 text-xs font-semibold text-left cursor-pointer" style={{ borderColor: active ? '#4A7C59' : '#E8E6E3', backgroundColor: active ? '#E0EEE6' : 'white', color: '#1C1C1A' }}>
                      {label}{active ? ' ✓' : ''}
                    </button>
                  );
                })}
              </div>
              <label>
                <span className="block text-xs font-semibold mb-1" style={{ color: '#44403C' }}>Dislikes / intolerances</span>
                <textarea value={foodPreferences.foodDislikes.join(', ')} onChange={(e) => setFoodPreferences({ foodDislikes: e.target.value.split(',').map(item => item.trim()).filter(Boolean) })} className="w-full p-3 rounded-xl border-2 text-sm outline-none resize-none" style={{ borderColor: '#E8E6E3', color: '#1C1C1A', minHeight: '90px' }} placeholder="sardines, eggs, kefir" />
              </label>
              <button onClick={() => { fetch('/api/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: 'local-user', age: personalDetails.age, sex: personalDetails.sex, weight_kg: personalDetails.weightKg, height_cm: personalDetails.heightCm, activity_level: personalDetails.activityLevel, dietary_flags: foodPreferences.dietaryFlags, food_dislikes: foodPreferences.foodDislikes }) }).catch(() => {}); showToast('✓ Profile saved'); }} className="w-full mt-3 py-3 rounded-xl text-sm font-semibold cursor-pointer text-white" style={{ backgroundColor: '#4A7C59' }}>
                Save to PocketBase
              </button>
            </Card>
          </div>
        )}
        
        {/* Supplements section */}
        {section === 'supplements' && (
          <div>
            <div className="mb-4 p-4 bg-white rounded-2xl shadow-card">
              <p className="text-sm font-medium mb-1" style={{ color: '#1C1C1A' }}>Your Protocol</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{configuredSupplements.length} supplements configured. Tap any to see full details.</p>
            </div>
            
            {['Essential', 'Recommended', 'Optional'].map(priority => {
              const group = supplements.filter(s => s.priority === priority);
              if (!group.length) return null;
              return (
                <div key={priority} className="mb-4">
                  <p
                    className="text-xs font-bold uppercase tracking-wide mb-2 px-1"
                    style={{ color: priority === 'Essential' ? '#991B1B' : priority === 'Recommended' ? '#92400E' : '#78716C' }}
                  >
                    {priority}
                  </p>
                  {group.map(supp => {
                    const isConfigured = configuredSupplements.includes(supp.key);
                    return (
                      <div
                        key={supp.key}
                        className="mb-2 rounded-2xl p-4"
                        style={{
                          backgroundColor: isConfigured ? 'white' : '#F9F9F7',
                          border: `1.5px solid ${isConfigured ? '#E8E6E3' : '#E5E5E3'}`,
                          opacity: isConfigured ? 1 : 0.85,
                        }}
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedSupp(expandedSupp === supp.key ? null : supp.key)}
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-sm" style={{ color: isConfigured ? '#1C1C1A' : '#9CA3AF' }}>{supp.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: isConfigured ? '#6B7280' : '#C0BDBA' }}>
                              {supp.time_of_day.join(' · ')} · {supp.dosage.substring(0, 40)}...
                            </p>
                          </div>
                          {!isConfigured ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); addSupplement(supp.key, supp.name); }}
                              className="ml-2 flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                              style={{ backgroundColor: '#FFFBEB', color: '#92400E', border: '1.5px solid #F59E0B' }}
                            >
                              Add +
                            </button>
                          ) : (
                            <span className="text-sm ml-2" style={{ color: '#A8A29E' }}>{expandedSupp === supp.key ? '▲' : '▼'}</span>
                          )}
                        </div>
                        
                        <AnimatePresence>
                          {expandedSupp === supp.key && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-3 mt-3 border-t" style={{ borderColor: '#F5F4F2' }}>
                                <div className="flex flex-col gap-3">
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#6B7280' }}>What it does</p>
                                    <p className="text-sm" style={{ color: '#44403C' }}>{supp.what_it_does}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#6B7280' }}>Dosage</p>
                                    <p className="text-sm" style={{ color: '#44403C' }}>{supp.dosage}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#6B7280' }}>Timing</p>
                                    <p className="text-sm" style={{ color: '#44403C' }}>{supp.timing}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#6B7280' }}>What to look for</p>
                                    <p className="text-sm" style={{ color: '#44403C' }}>{supp.what_to_look_for}</p>
                                  </div>
                                  {!isConfigured && (
                                    <button
                                      onClick={() => addSupplement(supp.key, supp.name)}
                                      className="mt-1 w-full py-2 rounded-xl text-sm font-semibold cursor-pointer"
                                      style={{ backgroundColor: '#FFFBEB', color: '#92400E', border: '1.5px solid #F59E0B' }}
                                    >
                                      Add to my list
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Exercise section */}
        {section === 'exercise' && (
          <div>
            <Card className="mb-4">
              <p className="font-semibold mb-2" style={{ color: '#1C1C1A' }}>Why Exercise Matters for Gut Health</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Exercise is not optional — it's a direct therapeutic intervention. Physical activity increases vagal tone, 
                gut motility, microbiome diversity (Akkermansia muciniphila), and reduces chronic cortisol that disrupts gut barrier function.
              </p>
            </Card>
            
            {[
              {
                week: 1,
                title: 'Week 1 — Gentle Activation',
                items: [
                  { day: 'Mon', morning: '20 min walk', evening: '15 min yoga (twists + forward folds)' },
                  { day: 'Tue', morning: '25 min walk', evening: 'Rest' },
                  { day: 'Wed', morning: '20 min walk', evening: '20 min yoga (full sequence)' },
                  { day: 'Thu', morning: '25 min walk', evening: 'Rest' },
                  { day: 'Fri', morning: '25 min walk', evening: '15 min yoga' },
                  { day: 'Sat', morning: '30 min walk (leisurely)', evening: 'Rest' },
                  { day: 'Sun', morning: 'Rest', evening: '20 min restorative yoga' },
                ],
              },
              {
                week: 2,
                title: 'Week 2 — Moderate Progression',
                items: [
                  { day: 'Mon', morning: '35 min walk + bodyweight session', evening: '' },
                  { day: 'Tue', morning: '30 min yoga (deeper practice)', evening: '' },
                  { day: 'Wed', morning: 'Cycling or swimming (25 min)', evening: '' },
                  { day: 'Thu', morning: '35 min walk + bodyweight session', evening: '' },
                  { day: 'Fri', morning: '30 min walk (easy)', evening: '' },
                  { day: 'Sat', morning: 'Bodyweight session + 20 min walk', evening: '' },
                  { day: 'Sun', morning: 'Restorative yoga + 20 min gentle walk', evening: '' },
                ],
              },
            ].map(({ week, title, items }) => (
              <Card key={week} className="mb-4">
                <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>{title}</p>
                <div className="flex flex-col gap-2">
                  {items.map(item => (
                    <div key={item.day} className="flex gap-3">
                      <span className="text-xs font-bold w-8 pt-0.5" style={{ color: '#4A7C59' }}>{item.day}</span>
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: '#1C1C1A' }}>{item.morning}</p>
                        {item.evening && <p className="text-xs" style={{ color: '#6B7280' }}>{item.evening}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
            
            <Card>
              <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>Yoga Poses for Gut Motility</p>
              {[
                { pose: 'Supine twist (Supta Matsyendrasana)', duration: '45 sec each side', benefit: 'Compresses and releases ascending/descending colon; improves peristalsis' },
                { pose: 'Wind-relieving pose (Apanasana)', duration: '1 min each leg', benefit: 'Directly stimulates intestinal gas release; parasympathetic activation' },
                { pose: 'Cat-cow (Marjaryasana-Bitilasana)', duration: '10 slow cycles', benefit: 'Massages abdominal organs; improves vagal tone' },
                { pose: 'Child\'s pose (Balasana)', duration: '1 min', benefit: 'Compresses abdomen; stimulates parasympathetic; reduces cortisol' },
                { pose: 'Legs-up-the-wall (Viparita Karani)', duration: '5 min', benefit: 'Parasympathetic activation; reduces adrenal stress' },
              ].map(item => (
                <div key={item.pose} className="py-3 border-b last:border-b-0" style={{ borderColor: '#F5F4F2' }}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium" style={{ color: '#1C1C1A' }}>{item.pose}</p>
                    <span className="text-xs ml-2 flex-shrink-0" style={{ color: '#4A7C59' }}>{item.duration}</span>
                  </div>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{item.benefit}</p>
                </div>
              ))}
            </Card>
          </div>
        )}
        
        {/* Shopping section */}
        {section === 'shopping' && (
          <div>
            {[
              {
                week: 1,
                categories: [
                  { name: 'Produce', items: ['2 heads garlic', 'Lemons × 4', 'Large bag spinach', 'Bunch Swiss chard or kale', '2 heads romaine', 'Rocket (arugula)', 'Cucumber × 4', 'Cherry tomatoes', 'Tomatoes × 6', '2 red onions + 2 yellow onions', 'Sweet potatoes × 4', 'Asparagus × 1 bunch', 'Beetroot × 3 raw', 'Bell peppers (red + yellow)', '1 eggplant', '2 zucchini', '1 head broccoli', 'Avocados × 3', 'Blueberries × 2 punnets', 'Strawberries or mixed berries', 'Green bananas × 5 (firm, underripe)', 'Apples × 3', '1 pear', '1 pomegranate', 'Fresh ginger root', 'Parsley, dill, chives, rosemary, thyme'] },
                  { name: 'Proteins', items: ['Salmon fillets × 4', 'Mackerel fillets × 4', 'Chicken thighs (bone-in) × 6-8', 'Chicken breast × 2', 'Eggs × 12', 'Canned sardines × 4 tins', 'Canned tuna in EVOO × 2 tins', 'Anchovies × 1 small jar'] },
                  { name: 'Pantry', items: ['Extra-virgin olive oil (500ml+)', 'Grass-fed ghee', 'Coconut oil', 'Tahini', 'Canned white beans × 2', 'Canned chickpeas × 2', 'Red lentils 500g', 'Quinoa 500g', 'Gluten-free oats 500g', 'Chia seeds 200g', 'Ground flaxseed 200g', 'Hemp seeds 100g', 'Almonds 200g', 'Walnuts 200g', 'Dark chocolate 85%+ × 2 bars', 'Almond butter', 'Raw honey', 'Coconut milk × 2 cans', 'Kalamata olives', 'Capers', 'Bone broth × 4-6 cartons', 'Slippery elm bark powder', 'Aloe vera juice (cold-pressed)', 'Miso paste (unpasteurised)'] },
                  { name: 'Fermented & Dairy', items: ['Plain full-fat Greek yogurt × 2 large tubs', 'Kefir (milk) × 2 × 500ml bottles', 'Raw sauerkraut × 1 jar (refrigerated)', 'Kimchi × 1 jar (refrigerated)', 'Kombucha × 4 bottles (low sugar)', 'Fresh goat cheese (chèvre) × 1 log'] },
                ],
              },
              {
                week: 2,
                categories: [
                  { name: 'New This Week', items: ['Jerusalem artichokes 300g (start slowly)', 'Fennel × 2 bulbs', 'Dandelion greens', 'Leeks × 4', 'Radishes × 1 bunch', 'Mango × 2', 'Kiwi × 4', 'Pomegranate × 2', 'Limes × 3'] },
                  { name: 'New Proteins', items: ['Whole sea bass or sea bream × 2', 'Cod fillets × 2', 'Swordfish or tuna steak × 2', 'Octopus (frozen pre-cooked) or prawns 300g', 'Lamb mince 400g', 'Lamb shanks × 2', 'Whole chicken or thighs', 'Smoked salmon 150g'] },
                  { name: 'New Pantry', items: ['Buckwheat groats 300g', 'Buckwheat flour 250g', 'Brown rice 500g', 'Harissa paste', 'Preserved lemons', 'Pomegranate molasses', 'Spirulina powder', 'Bee pollen', 'Coconut milk × 2 cans'] },
                ],
              },
            ].map(({ week, categories }) => (
              <div key={week} className="mb-4">
                <h2 className="font-bold text-lg mb-3" style={{ color: '#1C1C1A' }}>Week {week} Shopping List</h2>
                {categories.map(cat => (
                  <Card key={cat.name} className="mb-3">
                    <p className="font-semibold text-sm mb-2" style={{ color: '#1C1C1A' }}>{cat.name}</p>
                    <ul className="flex flex-col gap-1">
                      {cat.items.map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm" style={{ color: '#44403C' }}>
                          <span className="mt-1 text-xs" style={{ color: '#4A7C59' }}>•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        )}
        
        {/* What to Expect section */}
        {section === 'expect' && (
          <div>
            {[
              {
                id: 'days1-3',
                title: 'Days 1–3: The Transition',
                subtitle: 'It gets worse before it gets better',
                color: '#EF4444',
                content: [
                  '**Headaches** especially Days 1-2. Caused by withdrawal from refined sugar and die-off of pathobionts. Drink extra water. Use electrolytes. Paracetamol if needed.',
                  '**Fatigue** — more tired than usual. Your gut is your second brain; when it shifts, your whole energy system recalibrates. Protect sleep.',
                  '**Bloating increase** — paradoxically, starting fermented foods and prebiotics often causes temporary increased bloating as bacteria populations shift. This is normal.',
                  '**Bowel changes** — can go either direction. Both are transitional.',
                  '**Mood dip** — Days 2-3 are often the emotional low point. Sugar/UPF withdrawal has genuine mood effects. It passes by Day 4.',
                  '**Stay the course.** These reactions are confirmation the protocol is working.',
                ],
              },
              {
                id: 'days4-7',
                title: 'Days 4–7: The Turning Points',
                subtitle: 'Watch for these positive signals',
                color: '#F59E0B',
                content: [
                  '**Day 4-5:** Energy stabilises or improves noticeably. The initial die-off is past.',
                  '**Day 5-6:** Bowel movements become more regular; Bristol type shifts toward 3-4 (ideal).',
                  '**Day 5-7:** Bloating begins reducing; gas becomes less odorous.',
                  '**Day 6-7:** First hints of mental clarity improvement — morning brain fog lifts faster.',
                  '**Day 7:** Skin sometimes shows first improvement; some people notice reduced under-eye darkness.',
                ],
              },
              {
                id: 'days8-14',
                title: 'Days 8–14: Genuine Restoration',
                subtitle: 'Signs of microbiome improvement',
                color: '#4A7C59',
                content: [
                  '**Consistent Bristol 3-4 stools** — smooth, comfortable, complete.',
                  '**Energy 4-5/5** most afternoons.',
                  '**Bloating 1-2/5** most days.',
                  '**Reduced sugar cravings** — a direct indicator of Candida regression and Bifidobacterium recovery.',
                  '**Clearer skin** — the gut-skin axis: sebum production and inflammation both reduce.',
                  '**Improved sleep** — serotonin precursor availability via the gut is improving.',
                  '**Mood lift** — often the most surprising and most welcome sign.',
                ],
              },
              {
                id: 'redflags',
                title: '🚨 Red Flags',
                subtitle: 'Stop and seek medical attention',
                color: '#EF4444',
                content: [
                  'Severe, localised abdominal pain (not general bloating)',
                  'Blood in stool (bright red or black/tarry)',
                  'High fever (>38.5°C) during the protocol',
                  'Persistent vomiting beyond Day 3',
                  'Severe diarrhoea lasting >48 hours',
                  'Signs of severe dehydration (dark urine, extreme dizziness)',
                ],
              },
            ].map(item => (
              <Card key={item.id} className="mb-3">
                <button
                  onClick={() => setExpandedExpect(expandedExpect === item.id ? null : item.id)}
                  className="w-full flex items-center justify-between cursor-pointer text-left"
                >
                  <div>
                    <p className="font-semibold" style={{ color: '#1C1C1A' }}>{item.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{item.subtitle}</p>
                  </div>
                  <span style={{ color: '#A8A29E' }}>{expandedExpect === item.id ? '▲' : '▼'}</span>
                </button>
                
                <AnimatePresence>
                  {expandedExpect === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <ul className="pt-3 mt-3 border-t flex flex-col gap-2" style={{ borderColor: '#F5F4F2' }}>
                        {item.content.map((line, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 text-xs" style={{ color: item.color }}>•</span>
                            <p className="text-sm" style={{ color: '#44403C' }}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        )}
        
        {/* Foods section */}
        {section === 'foods' && (
          <div>
            <Card className="mb-4">
              <p className="font-semibold mb-3" style={{ color: '#1C1C1A' }}>✅ Foods to Include</p>
              {[
                { cat: 'Fermented / Probiotic', items: ['Plain full-fat Greek yogurt', 'Milk or water kefir', 'Raw kimchi', 'Raw unpasteurised sauerkraut', 'Miso paste (stirred into warm water)', 'Tempeh', 'Low-sugar kombucha'] },
                { cat: 'Prebiotic Foods', items: ['Garlic (raw preferred)', 'Leeks', 'Red & yellow onions', 'Jerusalem artichoke (start small)', 'Green/underripe banana', 'Chicory root', 'Cooked and cooled potatoes/rice (resistant starch)', 'Asparagus', 'Dandelion greens'] },
                { cat: 'Anti-Inflammatory', items: ['Turmeric + black pepper', 'Fresh ginger', 'Oily fish (salmon, sardines, mackerel)', 'Extra-virgin olive oil (EVOO)', 'Dark leafy greens', 'Walnuts', 'Berries (blueberries, strawberries, raspberries)'] },
                { cat: 'Gut-Healing', items: ['Bone broth (1-2 cups daily)', 'Aloe vera (inner gel, 30-60ml)', 'Slippery elm bark', 'Cabbage (raw or fermented)', 'Collagen-rich foods'] },
              ].map(cat => (
                <div key={cat.cat} className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#4A7C59' }}>{cat.cat}</p>
                  {cat.items.map(item => (
                    <p key={item} className="text-sm py-0.5 flex items-start gap-2" style={{ color: '#44403C' }}>
                      <span className="text-xs mt-1" style={{ color: '#4A7C59' }}>•</span> {item}
                    </p>
                  ))}
                </div>
              ))}
            </Card>
            
            <Card>
              <p className="font-semibold mb-3" style={{ color: '#EF4444' }}>❌ Foods to Eliminate (Days 1–14)</p>
              {[
                { cat: 'Ultra-Processed Foods', items: ['Packaged snacks, fast food, ready meals', 'Breakfast cereals', 'Industrial bread and crackers'] },
                { cat: 'Refined Sugars', items: ['White sugar, HFCS, glucose-fructose syrup', 'Fruit juices, soft drinks'] },
                { cat: 'Industrial Seed Oils', items: ['Sunflower, canola, soybean, corn oils', 'Safflower, cottonseed oils'] },
                { cat: 'Others', items: ['All alcohol', 'Gluten (wheat, rye, barley)', 'Conventional dairy (milk, hard cheese)', 'Artificial sweeteners (aspartame, sucralose, saccharin)', 'Processed meats (deli meat, sausages)', 'Coffee (Days 1-3 only — reintroduce Day 4)'] },
              ].map(cat => (
                <div key={cat.cat} className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#EF4444' }}>{cat.cat}</p>
                  {cat.items.map(item => (
                    <p key={item} className="text-sm py-0.5 flex items-start gap-2" style={{ color: '#44403C' }}>
                      <span className="text-xs mt-1" style={{ color: '#EF4444' }}>✕</span> {item}
                    </p>
                  ))}
                </div>
              ))}
            </Card>
          </div>
        )}
        
      </div>
      
      <BottomNav />

      {/* ─── Danger Zone: Reset ─── */}
      <div style={{ padding: '24px 16px 40px', borderTop: '1px solid #E5E5E3', marginTop: '8px' }}>
        <p className="text-xs text-center mb-3" style={{ color: '#A8A29E' }}>⚠ Danger Zone</p>
        <button
          onClick={async () => {
            if (!confirm('Reset all gut reset data? This will clear your progress and restart onboarding.')) return;
            // Clear PocketBase data
            try { await fetch('/api/reset', { method: 'POST' }) } catch { /* ignore */ }
            // Clear Zustand store
            useAppStore.getState().reset();
            // Clear localStorage keys
            const keys = Object.keys(localStorage).filter(k => k.startsWith('gut-reset'));
            keys.forEach(k => localStorage.removeItem(k));
            // Redirect to root (will go to onboarding)
            window.location.href = '/';
          }}
          className="w-full py-3 rounded-xl text-sm font-medium"
          style={{ background: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA' }}
        >
          Reset all data &amp; restart onboarding
        </button>
      </div>
    </div>
  );
}

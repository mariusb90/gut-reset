export interface MealSlot {
  name: string;
  description: string;
  prep_notes: string;
}


export interface MealAlternative {
  reason: string;
  swap: string;
  shortSwap: string;
  note: string;
}

export interface PortionProfile {
  tdee: number;
  dailyCalories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

export interface MealPortion {
  label: string;
  details: string[];
}

export interface MealPersonalisation {
  alternatives: MealAlternative[];
  portion: MealPortion | null;
}

export type DietaryFlag = 'dairy-free' | 'gluten-free' | 'nut-free' | 'egg-free' | 'pescatarian' | 'vegetarian' | 'vegan';

export interface UserNutritionProfile {
  age?: number | null;
  sex?: 'male' | 'female' | 'other' | '' | null;
  weightKg?: number | null;
  heightCm?: number | null;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete' | '' | null;
  dietaryFlags?: DietaryFlag[];
  foodDislikes?: string[];
}

const DIETARY_PATTERNS: Record<DietaryFlag, { label: string; terms: string[]; swap: string; shortSwap: string }> = {
  'dairy-free': {
    label: 'Dairy-free',
    terms: ['yogurt', 'kefir', 'goat cheese', 'feta', 'cheese', 'tzatziki', 'ghee', 'chèvre', 'milk'],
    shortSwap: 'Sub dairy: use coconut yogurt or tahini',
    swap: 'Use coconut yogurt, water kefir, olive oil, tahini, avocado, or extra fermented vegetables instead of dairy.',
  },
  'gluten-free': {
    label: 'Gluten-free',
    terms: ['farro', 'pita', 'flatbread', 'wheat', 'barley', 'rye'],
    shortSwap: 'Sub gluten: use quinoa or buckwheat',
    swap: 'Use quinoa, buckwheat, brown rice, gluten-free oats, cucumber scoops, or roasted sweet potato.',
  },
  'nut-free': {
    label: 'Nut-free',
    terms: ['almond', 'walnut', 'nuts', 'nut butter', 'brazil nuts'],
    shortSwap: 'Sub nuts: use pumpkin seeds or tahini',
    swap: 'Use pumpkin seeds, hemp seeds, chia, tahini, avocado, olives, or extra berries for fats and polyphenols.',
  },
  'egg-free': {
    label: 'Egg-free',
    terms: ['egg', 'eggs', 'omelette', 'scramble', 'shakshuka'],
    shortSwap: 'Sub eggs: use tempeh or chickpea scramble',
    swap: 'Use sardines, smoked salmon, tempeh, chickpea scramble, or avocado with sauerkraut.',
  },
  pescatarian: {
    label: 'Pescatarian',
    terms: ['chicken', 'lamb', 'beef', 'bone broth', 'collagen'],
    shortSwap: 'Sub meat: use salmon, sardines, or miso broth',
    swap: 'Use salmon, sardines, mackerel, tuna, eggs if tolerated, legumes, miso broth, or marine collagen if suitable.',
  },
  vegetarian: {
    label: 'Vegetarian',
    terms: ['chicken', 'lamb', 'beef', 'salmon', 'sardines', 'mackerel', 'tuna', 'anchovies', 'octopus', 'squid', 'prawns', 'cod', 'swordfish', 'sea bream', 'bone broth', 'collagen'],
    shortSwap: 'Sub meat/fish: use lentils, tempeh, or eggs',
    swap: 'Use eggs/dairy if tolerated, lentils, chickpeas, white beans, tempeh, tofu, quinoa, tahini, miso broth, and fermented vegetables.',
  },
  vegan: {
    label: 'Vegan',
    terms: ['chicken', 'lamb', 'beef', 'salmon', 'sardines', 'mackerel', 'tuna', 'anchovies', 'octopus', 'squid', 'prawns', 'cod', 'swordfish', 'sea bream', 'bone broth', 'collagen', 'egg', 'eggs', 'yogurt', 'kefir', 'cheese', 'feta', 'goat cheese', 'honey', 'ghee', 'milk'],
    shortSwap: 'Sub animal products: use tempeh or coconut yogurt',
    swap: 'Use lentils, chickpeas, white beans, tempeh, tofu, quinoa, tahini, avocado, coconut yogurt, water kefir, miso broth, and fermented vegetables.',
  },
};

const ACTIVITY_MULTIPLIER: Record<NonNullable<UserNutritionProfile['activityLevel']>, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
  '': 1.375,
};

const MEAL_SPLIT: Record<string, number> = {
  breakfast: 0.24,
  snack1: 0.11,
  lunch: 0.27,
  snack2: 0.10,
  dinner: 0.28,
};

export function calculatePortionProfile(profile: UserNutritionProfile): PortionProfile | null {
  const age = Number(profile.age);
  const weight = Number(profile.weightKg);
  const height = Number(profile.heightCm);
  if (!age || !weight || !height || age < 10 || weight < 30 || height < 120) return null;

  const sexOffset = profile.sex === 'female' ? -161 : profile.sex === 'male' ? 5 : -78;
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + sexOffset;
  const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIER[profile.activityLevel || 'light'] || 1.375));
  // Gut-reset target: modest deficit from maintenance, high protein, Mediterranean moderate-carb.
  const dailyCalories = Math.round(Math.max(1400, Math.min(3200, tdee * 0.9)));
  const proteinGrams = Math.round(Math.min(weight * 1.8, Math.max(weight * 1.4, (dailyCalories * 0.28) / 4)));
  const carbGrams = Math.round((dailyCalories * 0.32) / 4);
  const fatGrams = Math.round((dailyCalories * 0.40) / 9);

  return { tdee, dailyCalories, proteinGrams, carbGrams, fatGrams };
}

export function getMealPersonalisation(meal: MealSlot, slot: string, profile: UserNutritionProfile): MealPersonalisation {
  const fullText = `${meal.name} ${meal.description} ${meal.prep_notes}`.toLowerCase();
  const mealName = meal.name.toLowerCase();
  const flags = profile.dietaryFlags || [];
  const dislikes = (profile.foodDislikes || []).map(d => d.trim()).filter(Boolean);
  const alternatives: MealAlternative[] = [];

  for (const flag of flags) {
    const spec = DIETARY_PATTERNS[flag];
    if (!spec) continue;
    const hit = spec.terms.find(term => fullText.includes(term));
    if (hit) {
      alternatives.push({
        reason: spec.label,
        shortSwap: spec.shortSwap,
        swap: spec.swap,
        note: `Your flag: ${spec.label}. This meal mentions "${hit}". Suggested swap below.`,
      });
    }
  }

  // Dislike check: meal name only (best-effort, approximate)
  for (const dislike of dislikes) {
    if (mealName.includes(dislike.toLowerCase())) {
      const swapText = getDislikeSwap(dislike);
      alternatives.push({
        reason: `Disliked ingredient: ${dislike}`,
        shortSwap: `Contains "${dislike}" — see swap`,
        swap: swapText,
        note: 'Approximate match on meal name. Keep the meal structure; replace only the problem ingredient.',
      });
    }
  }

  const uniqueAlternatives = alternatives.filter((alt, index, arr) =>
    arr.findIndex(other => other.reason === alt.reason && other.swap === alt.swap) === index
  );

  return {
    alternatives: uniqueAlternatives,
    portion: getMealPortion(slot, calculatePortionProfile(profile)),
  };
}

function getDislikeSwap(dislike: string): string {
  const d = dislike.toLowerCase();
  if (['salmon', 'mackerel', 'sardines', 'tuna', 'fish'].some(x => d.includes(x))) return 'Swap oily fish for chicken, eggs, tempeh, or legumes; add EVOO/flax/chia for omega-3 support.';
  if (['yogurt', 'kefir', 'dairy', 'cheese'].some(x => d.includes(x))) return 'Swap dairy ferments for coconut yogurt, water kefir, raw sauerkraut, kimchi, or miso broth.';
  if (['egg', 'eggs'].some(x => d.includes(x))) return 'Swap eggs for sardines, smoked salmon, chickpea scramble, tempeh, or avocado with fermented vegetables.';
  if (['walnut', 'almond', 'nuts', 'nut'].some(x => d.includes(x))) return 'Swap nuts for pumpkin seeds, hemp seeds, chia, tahini, avocado, olives, or extra berries.';
  if (['chicken', 'lamb', 'meat'].some(x => d.includes(x))) return 'Swap meat for salmon/sardines, eggs, lentils, chickpeas, white beans, tempeh, or quinoa.';
  return 'Use a same-category gut-reset food: fermented vegetable, prebiotic fibre, clean protein, EVOO, herbs, or low-sugar fruit.';
}

function getMealPortion(slot: string, profile: PortionProfile | null): MealPortion | null {
  if (!profile) return null;
  const split = MEAL_SPLIT[slot] || 0.2;
  const calories = Math.round(profile.dailyCalories * split);
  const protein = Math.round(profile.proteinGrams * split);
  const carbs = Math.round(profile.carbGrams * split);
  const fat = Math.round(profile.fatGrams * split);
  const proteinPortion = Math.max(90, Math.round((protein / 0.24) / 10) * 10);
  const starchPortion = Math.max(60, Math.round((carbs / 0.22) / 10) * 10);
  const fatTbsp = Math.max(1, Math.round(fat / 14));

  if (slot === 'snack1' || slot === 'snack2') {
    return {
      label: `~${calories} kcal target`,
      details: [`Protein ${protein}g`, `Carbs ${carbs}g`, `Fat ${fat}g`, 'Use one fruit/veg + one protein/fat anchor'],
    };
  }

  return {
    label: `~${calories} kcal target`,
    details: [`Protein ${protein}g ≈ ${proteinPortion}g cooked fish/chicken or 1 cup legumes`, `Carbs ${carbs}g ≈ ${starchPortion}g cooked grains/root veg`, `Fat ${fat}g ≈ ${fatTbsp} tbsp EVOO/tahini or avocado`],
  };
}

export interface DayMealPlan {
  week: 1 | 2;
  day_number: number;
  phase: 'elimination' | 'stabilisation' | 'restoration';
  breakfast: MealSlot;
  snack1: MealSlot;
  lunch: MealSlot;
  snack2: MealSlot;
  dinner: MealSlot;
  milestone_day: boolean;
  milestone_content?: string;
}

export const mealPlan: DayMealPlan[] = [
  {
    week: 1,
    day_number: 1,
    phase: 'elimination',
    milestone_day: true,
    milestone_content: "Welcome to Day 1. Your gut reset has begun. The next 3 days are the hardest - you may feel headaches, fatigue, and temporary bloating as pathobionts die off and your body clears inflammatory triggers. This is not failure; it's confirmation the protocol is working. Stay hydrated, protect your sleep, and trust the process.",
    breakfast: {
      name: "Overnight Oats with Green Banana & Yogurt",
      description: "Warm lemon water first. Overnight oats with 1 green banana (sliced), blueberries, 2 tbsp ground flaxseed, 1 tsp cinnamon, 150g Greek yogurt.",
      prep_notes: "Use gluten-free oats; soak overnight in water or unsweetened almond milk. Green banana provides resistant starch - crucial prebiotics."
    },
    snack1: {
      name: "Walnuts & Pear",
      description: "30g walnuts + 1 pear",
      prep_notes: "Walnuts provide ALA omega-3 and polyphenols. Eat the pear with skin for prebiotic pectin."
    },
    lunch: {
      name: "Greek Salad with Sardines",
      description: "Large Greek salad - romaine, cucumber, tomato, red onion, Kalamata olives, 100g canned sardines (in water/brine), EVOO + lemon dressing.",
      prep_notes: "No croutons. Dress just before eating. Sardines provide EPA/DHA directly."
    },
    snack2: {
      name: "Sauerkraut Bites & Boiled Egg",
      description: "2 tbsp raw sauerkraut on cucumber slices, 1 hard-boiled egg",
      prep_notes: "Must be raw/unpasteurised sauerkraut from the refrigerator section - pasteurised has no live cultures."
    },
    dinner: {
      name: "Baked Salmon with Asparagus & Turmeric Broth",
      description: "Baked salmon fillet (150g) with roasted asparagus (6-8 spears) + roasted sweet potato. Turmeric-ginger broth: 1 cup bone broth, 1 tsp turmeric, 1cm grated ginger, black pepper.",
      prep_notes: "Roast asparagus and sweet potato at 200°C/25 min with EVOO, salt. Asparagus is one of the best prebiotic sources."
    }
  },
  {
    week: 1,
    day_number: 2,
    phase: 'elimination',
    milestone_day: false,
    breakfast: {
      name: "Kefir Green Banana Smoothie",
      description: "Smoothie: 150ml kefir, 1 green banana, handful spinach, 1 tbsp almond butter, 1 tsp ground ginger, 1 tsp flaxseed.",
      prep_notes: "Blend until smooth. The kefir provides 30+ probiotic strains."
    },
    snack1: {
      name: "Apple & Almond Butter",
      description: "Sliced apple + 2 tbsp almond butter",
      prep_notes: "Apple skin contains quercetin and prebiotic pectin."
    },
    lunch: {
      name: "Red Lentil Soup",
      description: "Lentil soup - red lentils, cumin, coriander, garlic (3 cloves), onion, diced tomato, EVOO, lemon.",
      prep_notes: "Sauté onion + garlic first; simmer 20 min. Make a large batch - use tomorrow."
    },
    snack2: {
      name: "Honey Yogurt",
      description: "150g plain yogurt + 1 tbsp honey + 1 tsp bee pollen (optional)",
      prep_notes: "Use raw honey - it has antimicrobial properties and feeds beneficial bacteria."
    },
    dinner: {
      name: "Roast Chicken Thighs with Braised Greens",
      description: "Chicken thighs (bone-in, 2 pieces) baked with lemon, garlic, rosemary, EVOO. Side: braised dark leafy greens (Swiss chard or kale) with garlic + EVOO. + 1 cup bone broth.",
      prep_notes: "Bone-in, skin-on thighs provide collagen. Braised greens provide magnesium and folate."
    }
  },
  {
    week: 1,
    day_number: 3,
    phase: 'elimination',
    milestone_day: true,
    milestone_content: "Day 3 - you're through the hardest part. Many people hit their lowest point today. The headaches, fatigue, and mood dip are the elimination phase doing exactly what it should: clearing the inflammatory load that was making you feel suboptimal. From tomorrow, the stabilisation phase begins. Energy typically improves noticeably around Day 5.",
    breakfast: {
      name: "Scrambled Eggs with Kimchi",
      description: "Scrambled eggs (2-3 eggs) cooked in ghee with sautéed spinach, cherry tomatoes, fresh herbs. Side: 2 tbsp kimchi.",
      prep_notes: "Kimchi on the side, not cooked - preserve live cultures. This is your first probiotic-rich breakfast."
    },
    snack1: {
      name: "Celery & Guacamole",
      description: "Celery sticks with guacamole (avocado + EVOO + lemon)",
      prep_notes: "Avocado provides oleic acid, potassium, and fibre. Add a pinch of sea salt."
    },
    lunch: {
      name: "Lentil Soup & Beetroot Walnut Salad",
      description: "Leftover lentil soup + large mixed salad with rocket, roasted beetroot, walnuts, goat cheese (small amount), pomegranate seeds, EVOO dressing.",
      prep_notes: "Pomegranate seeds provide punicalagins converted to urolithins by gut bacteria - feeds Akkermansia."
    },
    snack2: {
      name: "Dark Chocolate & Herbal Tea",
      description: "30g dark chocolate (85%+) + herbal tea (ginger + chamomile)",
      prep_notes: "Dark chocolate polyphenols feed Lactobacillus and Bifidobacterium. 85%+ only."
    },
    dinner: {
      name: "Sardine & White Bean Stew",
      description: "Canned sardines, white beans, garlic, tomatoes, spinach, EVOO, herbs. + 1 cup bone broth.",
      prep_notes: "Sauté garlic, add tomatoes, then beans, then sardines and spinach. 15 min total. White beans are excellent prebiotic fibre."
    }
  },
  {
    week: 1,
    day_number: 4,
    phase: 'stabilisation',
    milestone_day: false,
    breakfast: {
      name: "Chia Pudding with Berries & Kefir",
      description: "Chia pudding made with 200ml coconut milk, 3 tbsp chia seeds (set overnight). Top with berries, 2 tbsp kefir, 1 tbsp hemp seeds.",
      prep_notes: "Chia provides prebiotic fibre + omega-3 ALA. Must set overnight - at least 6 hours."
    },
    snack1: {
      name: "Kombucha & Blueberries",
      description: "Kombucha (100ml) + handful blueberries",
      prep_notes: "Choose low-sugar, unflavoured kombucha. Blueberries feed Bifidobacterium."
    },
    lunch: {
      name: "Roasted Chickpea Quinoa Bowl",
      description: "Cooked quinoa, roasted chickpeas (1 tsp cumin, paprika, EVOO), cucumber, tomato, parsley, tahini dressing (tahini + lemon + garlic + water).",
      prep_notes: "Roast chickpeas at 200°C/20-25 min until crispy."
    },
    snack2: {
      name: "Miso Broth & Rice Crackers",
      description: "Miso broth (1 tsp unpasteurised miso in warm water) + rice crackers (gluten-free)",
      prep_notes: "Do not boil the miso - warm water only. Heat destroys the probiotic cultures."
    },
    dinner: {
      name: "Baked Mackerel with Root Vegetables",
      description: "Baked mackerel (2 fillets) with chimichurri (parsley, garlic, EVOO, red wine vinegar). Side: roasted root vegetables (parsnip, carrot, beetroot) with thyme. + 1 cup bone broth.",
      prep_notes: "Mackerel is one of the richest omega-3 sources. Chimichurri provides polyphenols from parsley and garlic."
    }
  },
  {
    week: 1,
    day_number: 5,
    phase: 'stabilisation',
    milestone_day: false,
    breakfast: {
      name: "Turmeric Yogurt Parfait",
      description: "200g Greek yogurt, 2 tbsp granola (gluten-free, low sugar), berries, 1 tbsp raw honey, 1 tsp turmeric.",
      prep_notes: "Turmeric with the yogurt - the fat in the yogurt helps absorb curcumin. Add a pinch of black pepper."
    },
    snack1: {
      name: "Bell Peppers & Hummus",
      description: "Sliced bell peppers + hummus (100g - chickpeas, tahini, lemon, garlic)",
      prep_notes: "Bell peppers provide vitamin C which aids iron absorption from the legumes."
    },
    lunch: {
      name: "Mediterranean Tuna & White Bean Salad",
      description: "Canned tuna (in EVOO), white beans, red onion, olives, capers, tomatoes, EVOO + lemon. On bed of rocket.",
      prep_notes: "Capers are high in quercetin and rutin - potent anti-inflammatory flavonoids."
    },
    snack2: {
      name: "Kiwi & Almonds",
      description: "1 kiwi + 30g almonds",
      prep_notes: "Kiwi is high in vitamin C and actinidin enzyme that aids protein digestion."
    },
    dinner: {
      name: "Herb Roast Chicken with Ratatouille",
      description: "Lemon-herb roast chicken breast with ratatouille (eggplant, zucchini, tomato, peppers, garlic, EVOO, thyme). + Miso broth.",
      prep_notes: "Ratatouille is best made ahead and reheated - flavours deepen."
    }
  },
  {
    week: 1,
    day_number: 6,
    phase: 'stabilisation',
    milestone_day: false,
    breakfast: {
      name: "Leek & Goat Cheese Omelette",
      description: "Two-egg omelette with sautéed leeks, goat cheese, fresh herbs (chives, dill). Side: 2 tbsp sauerkraut. Black coffee (reintroduce from Day 4).",
      prep_notes: "Leeks are one of the best inulin sources. Coffee (from Day 4) provides chlorogenic acid - a prebiotic polyphenol."
    },
    snack1: {
      name: "Green Smoothie",
      description: "Spinach, cucumber, green apple, lemon juice, 1cm ginger, water.",
      prep_notes: "Drink immediately - oxidation reduces nutrient content. The ginger provides gingerols, COX-2 inhibitors."
    },
    lunch: {
      name: "Lamb & Chickpea Stew",
      description: "Slow-cooked lamb and chickpea stew with cumin, coriander, cinnamon, tomatoes, garlic, onion.",
      prep_notes: "Make extra - this flavour improves overnight. Cinnamon has demonstrated anti-microbial and blood sugar effects."
    },
    snack2: {
      name: "Kefir & Flaxseed",
      description: "Kefir (150ml) with 1 tbsp ground flaxseed",
      prep_notes: "Flaxseed provides lignans and ALA. Must be ground to access the omega-3 content."
    },
    dinner: {
      name: "Grilled Salmon with Cauliflower Rice",
      description: "Grilled salmon with wilted spinach and garlic, cauliflower rice (pulse cauliflower, sauté in EVOO). Tahini drizzle. + Bone broth.",
      prep_notes: "Cauliflower rice provides sulforaphane precursors that upregulate the Nrf2 antioxidant pathway."
    }
  },
  {
    week: 1,
    day_number: 7,
    phase: 'stabilisation',
    milestone_day: true,
    milestone_content: "Halfway through Week 1 - and probably the first day you've felt genuinely good. The stabilisation phase is working: beneficial bacteria are colonising, tight junctions are beginning to repair, and your energy should be trending up. Week 2 brings the restoration phase, where microbiome diversity measurably improves and mood, sleep, and skin often follow.",
    breakfast: {
      name: "Smoothie Bowl with Superseeds",
      description: "Blended frozen berries + kefir + banana. Top with granola, bee pollen, flaxseed, pomegranate seeds.",
      prep_notes: "Bee pollen is anti-inflammatory and provides enzymes. Pomegranate seeds feed Akkermansia muciniphila."
    },
    snack1: {
      name: "Collagen Coffee",
      description: "Black coffee + 1 scoop hydrolysed collagen powder",
      prep_notes: "Collagen provides glycine and proline - structural proteins of the gut epithelium."
    },
    lunch: {
      name: "Mediterranean Mezze Spread",
      description: "Full Mediterranean spread - hummus, tzatziki (yogurt, cucumber, garlic, dill), olives, canned sardines/anchovies, roasted vegetables, gluten-free pita or cucumber for dipping.",
      prep_notes: "This is a relaxed, grazing meal - ideal for end of Week 1. Anchovies provide the most concentrated omega-3 of any fish."
    },
    snack2: {
      name: "Dark Chocolate & Herbal Tea",
      description: "30g dark chocolate + herbal tea",
      prep_notes: "You've earned it. Celebrate completing Week 1."
    },
    dinner: {
      name: "Roast Chicken Thighs with Jerusalem Artichoke",
      description: "Roast chicken thighs with Jerusalem artichoke and leeks (tray bake, EVOO, garlic, rosemary).",
      prep_notes: "Jerusalem artichoke: start with 50g maximum. It contains the highest inulin of any vegetable (~19g/100g) - incredibly powerful but introduces slowly."
    }
  },
  {
    week: 2,
    day_number: 8,
    phase: 'restoration',
    milestone_day: false,
    breakfast: {
      name: "Buckwheat Porridge with Yogurt",
      description: "Overnight buckwheat porridge: soak buckwheat groats overnight, cook 10 min. Top with yogurt, berries, raw honey, cinnamon.",
      prep_notes: "Buckwheat is gluten-free and contains rutin - an anti-inflammatory flavonoid. Excellent prebiotic fibre."
    },
    snack1: {
      name: "Fennel & Olive Tapenade",
      description: "Sliced fennel + radishes with olive tapenade",
      prep_notes: "Fennel has antispasmodic properties that reduce bloating and cramping directly."
    },
    lunch: {
      name: "Grilled Octopus & White Bean Salad",
      description: "Grilled octopus or squid salad with white beans, celery, parsley, EVOO, lemon. Alternative: Niçoise-style salad with tuna, green beans, eggs, olives.",
      prep_notes: "Octopus is high in taurine and has a unique amino acid profile beneficial for gut barrier repair."
    },
    snack2: {
      name: "Coconut Yogurt & Chia",
      description: "Fermented dairy-free option: coconut yogurt with chia seeds and berries",
      prep_notes: "A dairy-free probiotic option for those who want variety."
    },
    dinner: {
      name: "Lamb Meatballs with Eggplant",
      description: "Lamb meatballs in tomato sauce with eggplant and olives. Side: steamed broccoli. + Turmeric bone broth.",
      prep_notes: "Broccoli provides sulforaphane precursors. Steam rather than boil to preserve glucosinolates."
    }
  },
  {
    week: 2,
    day_number: 9,
    phase: 'restoration',
    milestone_day: false,
    breakfast: {
      name: "Smoked Salmon Scramble",
      description: "3-egg scramble with smoked salmon, capers, red onion, dill. Side: sliced avocado.",
      prep_notes: "Capers are extremely high in quercetin - one of the most potent anti-inflammatory flavonoids."
    },
    snack1: {
      name: "Cinnamon Apple & Almond Butter",
      description: "Apple slices + 2 tsp almond butter + pinch cinnamon",
      prep_notes: "Cinnamon has demonstrated anti-microbial activity against several pathobionts."
    },
    lunch: {
      name: "Coconut Lentil & Spinach Soup",
      description: "Large lentil and spinach soup with turmeric, ginger, garlic, coconut milk.",
      prep_notes: "The coconut milk adds caprylic acid - a natural antifungal targeting Candida without disrupting beneficial bacteria."
    },
    snack2: {
      name: "Kefir & Bee Pollen",
      description: "Kefir + 1 tbsp ground chia + 1 tsp bee pollen",
      prep_notes: "Bee pollen is anti-inflammatory and contains enzymes that support digestion."
    },
    dinner: {
      name: "Herb-Crusted Cod with Fennel & White Beans",
      description: "Baked cod with herb crust (parsley, garlic, lemon zest, EVOO). Side: roasted fennel and white beans. Miso broth.",
      prep_notes: "Cod is a lean, clean protein. The herb crust provides allicin (garlic) and chlorophyll (parsley)."
    }
  },
  {
    week: 2,
    day_number: 10,
    phase: 'restoration',
    milestone_day: true,
    milestone_content: "Day 10 - you're in the restoration phase. Your microbiome diversity is measurably improving right now. SCFA production is recovering, which means your colonocytes are getting proper fuel. Mood stabilises around this point - the serotonin precursor availability via the gut is normalising. Many people notice clearer skin and better sleep from here.",
    breakfast: {
      name: "Mango Coconut Chia Pudding",
      description: "Chia pudding with mango, coconut, lime zest, kefir.",
      prep_notes: "Mango provides amylase enzymes that aid carbohydrate digestion."
    },
    snack1: {
      name: "Mixed Nuts & Dark Chocolate",
      description: "Handful of mixed nuts + 2 squares dark chocolate (85%+)",
      prep_notes: "Walnuts and brazil nuts provide selenium and ellagic acid converted to urolithins."
    },
    lunch: {
      name: "Quinoa Tabbouleh",
      description: "Quinoa tabbouleh: quinoa (cooked and cooled = resistant starch), masses of parsley and mint, tomato, cucumber, EVOO + lemon.",
      prep_notes: "Cook quinoa, refrigerate overnight, then use cold. Retrogradation converts digestible starch to resistant starch type 3."
    },
    snack2: {
      name: "Slippery Elm Tea",
      description: "Slippery elm tea: 1 tsp slippery elm bark powder in warm water with honey.",
      prep_notes: "Slippery elm forms a gel coating over the gut lining, soothing and protecting the mucosa."
    },
    dinner: {
      name: "Roasted Sea Bass with Asparagus",
      description: "Whole roasted sea bass with herbs and lemon in a salt crust or baking paper. Side: roasted asparagus, cherry tomatoes, olives.",
      prep_notes: "Salt crust cooking preserves moisture and concentrates flavour. Sea bass is low in mercury and high in omega-3."
    }
  },
  {
    week: 2,
    day_number: 11,
    phase: 'restoration',
    milestone_day: false,
    breakfast: {
      name: "EVOO Pomegranate Yogurt Bowl",
      description: "Greek yogurt with pomegranate, walnuts, drizzle of EVOO, pinch of za'atar.",
      prep_notes: "EVOO on yogurt is a Levantine tradition and genuinely delicious. The polyphenols in EVOO feed Bifidobacterium."
    },
    snack1: {
      name: "Kimchi Avocado Rice",
      description: "Small kimchi and avocado rice bowl using cooked-and-cooled brown rice for resistant starch.",
      prep_notes: "Brown rice cooked and cooled = resistant starch type 3. An excellent prebiotic without adding a supplement."
    },
    lunch: {
      name: "Chickpea & Roasted Pepper Stew",
      description: "Chickpea and roasted red pepper stew with spinach, cumin, smoked paprika. Served with gluten-free flatbread or alone.",
      prep_notes: "Smoked paprika contains capsaicin in small amounts - anti-inflammatory and stimulates gut motility."
    },
    snack2: {
      name: "Fermented Vegetable Plate",
      description: "Fermented vegetable plate: kimchi + sauerkraut + olives + miso broth.",
      prep_notes: "This is your maximum probiotic density snack. Different fermented foods provide different strains."
    },
    dinner: {
      name: "Grilled Swordfish with Salsa Verde",
      description: "Grilled swordfish or tuna steak with salsa verde (parsley, capers, anchovies, garlic, EVOO, lemon). Side: zucchini noodles or roasted sweet potato.",
      prep_notes: "Salsa verde is an anchovy-based sauce - umami richness plus omega-3 from the anchovies."
    }
  },
  {
    week: 2,
    day_number: 12,
    phase: 'restoration',
    milestone_day: false,
    breakfast: {
      name: "Buckwheat Crepes with Berries",
      description: "Buckwheat crepes (buckwheat flour + egg + almond milk) with yogurt and berries.",
      prep_notes: "Buckwheat flour makes excellent gluten-free crepes. Thin batter, hot pan."
    },
    snack1: {
      name: "Tzatziki Crudités",
      description: "Cucumber and carrot sticks with tzatziki.",
      prep_notes: "Tzatziki is a probiotic food (yogurt base) combined with garlic - one of the best prebiotic foods."
    },
    lunch: {
      name: "Mediterranean Grain Bowl",
      description: "Farro (small portion) or gluten-free grain, roasted vegetables, feta (small amount), olives, chickpeas, EVOO dressing.",
      prep_notes: "Farro contains more protein and fibre than wheat and has a better gluten profile for gut-sensitive individuals."
    },
    snack2: {
      name: "Spirulina Berry Kefir",
      description: "Kefir smoothie with berries and spirulina (1 tsp - prebiotic + chlorophyll).",
      prep_notes: "Spirulina is a prebiotic that selectively feeds Lactobacillus and has potent anti-inflammatory properties."
    },
    dinner: {
      name: "Braised Lamb Shanks",
      description: "Braised lamb shanks with tomatoes, olives, preserved lemon, garlic. Long slow cook. Side: roasted root vegetables.",
      prep_notes: "Long slow cooking extracts collagen from the bone. The liquid becomes a natural bone broth during cooking."
    }
  },
  {
    week: 2,
    day_number: 13,
    phase: 'restoration',
    milestone_day: false,
    breakfast: {
      name: "Full Mediterranean Breakfast",
      description: "2 eggs (any style), sliced tomatoes with EVOO and oregano, olives, goat cheese, 2 tbsp kimchi, black coffee.",
      prep_notes: "Oregano contains thymol and carvacrol - potent antimicrobial compounds that inhibit pathobionts without harming beneficial species."
    },
    snack1: {
      name: "Celery & Apple Juice",
      description: "Green apple + celery juice (pressed, raw - high in glutamine-supporting nutrients)",
      prep_notes: "Raw celery juice provides apigenin and luteolin - anti-inflammatory flavonoids."
    },
    lunch: {
      name: "Prawn & Rocket Salad",
      description: "Octopus or prawn salad with rocket, capers, lemon, EVOO.",
      prep_notes: "Rocket (arugula) contains sulforaphane precursors - a powerful Nrf2 pathway activator."
    },
    snack2: {
      name: "Collagen Hot Chocolate",
      description: "Collagen hot chocolate: unsweetened cocoa, coconut milk, 1 scoop collagen powder, raw honey, cinnamon, pinch cayenne.",
      prep_notes: "Cayenne contains capsaicin which stimulates the TRPV1 receptor - anti-inflammatory and gut motility enhancing."
    },
    dinner: {
      name: "Whole Roasted Chicken with Greek Green Beans",
      description: "Whole roasted chicken (or thighs) with preserved lemon and olives, braised with white wine. Side: Greek-style green beans (fasolia) with tomato, garlic, EVOO.",
      prep_notes: "Save the chicken carcass - make bone broth overnight for your final day."
    }
  },
  {
    week: 2,
    day_number: 14,
    phase: 'restoration',
    milestone_day: true,
    milestone_content: "Day 14 - you did it. Your gut microbiome has undergone measurable shifts: increased Bifidobacterium and Lactobacillus, reduced pathobionts, improved epithelial tight junction integrity, and declining systemic inflammation markers. The benefits compound over the next 4-6 weeks as the new microbial populations establish. The most powerful thing you can do now: maintain the Mediterranean dietary pattern and the daily fermented food habit. Your gut is a garden. You've done the hard work of preparing the soil.",
    breakfast: {
      name: "Shakshuka with Sauerkraut",
      description: "Shakshuka - eggs poached in spiced tomato-pepper sauce (cumin, paprika, harissa, garlic, EVOO). Top with fresh herbs, crumbled feta, 2 tbsp sauerkraut on the side.",
      prep_notes: "The ultimate gut-reset breakfast. Eggs provide complete protein; tomatoes provide lycopene (4x more bioavailable when cooked); harissa adds capsaicin."
    },
    snack1: {
      name: "Mixed Fruit Bowl",
      description: "Full bowl of mixed fruit: pomegranate, berries, mango, kiwi.",
      prep_notes: "These feed different microbial niches - diversity of fruit = diversity of microbiome."
    },
    lunch: {
      name: "Celebration Mezze",
      description: "Long, relaxed Mediterranean mezze: hummus, baba ghanoush, tabbouleh, grilled halloumi (small amount), olives, marinated artichokes, canned fish selection.",
      prep_notes: "You've earned this. A true Mediterranean meal with all the elements that make this diet the gold standard for gut health."
    },
    snack2: {
      name: "Kombucha & Dark Chocolate",
      description: "Kombucha + 30g dark chocolate",
      prep_notes: "Celebrate. You've just completed 14 days that have measurably improved your health."
    },
    dinner: {
      name: "Whole Baked Sea Bream - Celebration Dinner",
      description: "Whole baked sea bream or salmon with roasted vegetables, EVOO, herbs, lemon. One small glass of quality red wine is acceptable on Day 14.",
      prep_notes: "Red wine on Day 14 only - polyphenol-rich, the reset is complete. Resveratrol in red wine selectively feeds Bifidobacterium."
    }
  }
];

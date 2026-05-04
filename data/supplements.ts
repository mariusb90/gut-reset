export interface Supplement {
  key: string;
  name: string;
  priority: 'Essential' | 'Recommended' | 'Optional';
  what_it_does: string;
  dosage: string;
  timing: string;
  what_to_look_for: string;
  time_of_day: ('morning' | 'midday' | 'evening')[];
  sort_order: number;
}

export const supplements: Supplement[] = [
  {
    key: 'probiotics',
    name: 'Probiotics (Multi-Strain)',
    priority: 'Essential',
    what_it_does: 'Repopulates disrupted gut flora, competes with pathobionts for adhesion sites, stimulates mucus production, modulates immune response. Key strains: L. rhamnosus GG, L. acidophilus, B. longum, B. infantis 35624, L. plantarum 299v.',
    dosage: 'Minimum 30 billion CFU/day, ideally 50+ billion',
    timing: 'Morning on an empty stomach with room-temperature water, 30 min before breakfast',
    what_to_look_for: 'Labels specifying strains by alphanumeric code (GG, 299v, NCFM). Refrigerated products. CFU guarantee at time of expiry (not just manufacture). Brands: Culturelle, Optibac, Alflorex, Garden of Life.',
    time_of_day: ['morning'],
    sort_order: 1,
  },
  {
    key: 'l-glutamine',
    name: 'L-Glutamine',
    priority: 'Essential',
    what_it_does: 'Primary fuel for enterocytes (gut lining cells). Maintains tight junction integrity; reduces intestinal permeability in both human RCTs and animal models. In a disrupted gut, plasma glutamine is typically depleted.',
    dosage: '5g daily in Week 1, 10g daily in Week 2',
    timing: 'First thing in morning in cold water on empty stomach (before breakfast). Can split: 5g morning + 5g evening.',
    what_to_look_for: 'Pharmaceutical-grade L-Glutamine powder (unflavoured). Capsules are fine but less economical. Take for 30-60 days minimum.',
    time_of_day: ['morning'],
    sort_order: 2,
  },
  {
    key: 'omega-3',
    name: 'Omega-3 (EPA/DHA)',
    priority: 'Essential',
    what_it_does: 'EPA reduces the arachidonic acid inflammatory cascade. DHA is the primary structural fatty acid in cell membranes including colonocytes. Both stimulate Resolvin/Protectin synthesis — specialised pro-resolving mediators that actively terminate inflammation.',
    dosage: '2-3g EPA+DHA combined daily during reset',
    timing: 'With the fattiest meal of the day (breakfast or dinner). Fat enhances absorption via chylomicron formation.',
    what_to_look_for: 'Triglyceride form (not ethyl ester — better absorbed). IFOS-certified for purity. EPA:DHA ratio approximately 2:1. Brands: Carlson, Nordic Naturals Ultimate Omega, Bare Biology Lion Heart.',
    time_of_day: ['morning'],
    sort_order: 3,
  },
  {
    key: 'vitamin-d3-k2',
    name: 'Vitamin D3 + K2',
    priority: 'Essential',
    what_it_does: 'Vitamin D3 upregulates tight junction proteins (claudin-1, occludin) directly. Modulates TLR4 (reduces LPS response). K2 (MK-7 form) ensures calcium is routed to bones not arteries.',
    dosage: 'D3: 4,000-5,000 IU daily. K2: 100-200mcg MK-7 daily.',
    timing: 'With breakfast or any meal containing fat.',
    what_to_look_for: 'D3 + K2 combined capsule in MCT oil base for absorption. K2 must specify MK-7 (not MK-4, shorter half-life). Reduce D3 to 2,000 IU after the reset.',
    time_of_day: ['morning'],
    sort_order: 4,
  },
  {
    key: 'magnesium-glycinate',
    name: 'Magnesium Glycinate',
    priority: 'Essential',
    what_it_does: 'Regulates bowel motility, modulates gut microbiota composition (increases Bifidobacterium and Lactobacillus), reduces HPA axis cortisol response. Glycinate form is most bioavailable and gentlest on digestion.',
    dosage: '300-400mg elemental magnesium daily',
    timing: 'Evening, 30-60 min before sleep. Also improves sleep quality, critical for gut repair.',
    what_to_look_for: '"Magnesium glycinate" or "magnesium bisglycinate" — interchangeable. Avoid magnesium oxide (poorly absorbed, causes diarrhoea).',
    time_of_day: ['evening'],
    sort_order: 5,
  },
  {
    key: 'digestive-enzymes',
    name: 'Digestive Enzymes',
    priority: 'Recommended',
    what_it_does: 'A disrupted gut produces insufficient digestive enzymes. Undigested food particles are a primary driver of gut inflammation. Enzymes ensure complete digestion, reducing fermentation of undigested substrate by pathobionts.',
    dosage: '1-2 capsules with each main meal',
    timing: 'At the start of the meal or first bite.',
    what_to_look_for: 'Comprehensive full-spectrum: amylase, protease (4.5 + 6.0), lipase, lactase, alpha-galactosidase, cellulase, bromelain/papain. Brands: Thorne Bio-Gest, Enzymedica Digest Gold, NOW Super Enzymes.',
    time_of_day: ['morning', 'midday', 'evening'],
    sort_order: 6,
  },
  {
    key: 'zinc-carnosine',
    name: 'Zinc Carnosine',
    priority: 'Recommended',
    what_it_does: 'Adheres to the gut wall with specific affinity for damaged mucosa. Reduces intestinal permeability markers (zonulin), accelerates healing of gastric ulcers and enteritis, stabilises the mucosal membrane. Direct antimicrobial activity against H. pylori.',
    dosage: '75mg twice daily (150mg/day total)',
    timing: '30 min before meals on an empty stomach for mucosal adherence. Use for the full 14 days minimum; ideally 4-6 weeks.',
    what_to_look_for: 'Must specify "zinc carnosine" or "zinc L-carnosine" — not just zinc. Brands: Jarrow Formulas Zinc Carnosine, Integrative Therapeutics Zinc-Carnosine.',
    time_of_day: ['morning', 'evening'],
    sort_order: 7,
  },
  {
    key: 'colostrum',
    name: 'Colostrum',
    priority: 'Recommended',
    what_it_does: 'Contains immunoglobulins (IgA, IgG, IgM), lactoferrin, lysozyme, growth factors (IGF-1, TGF-β, EGF). In clinical trials, colostrum reduces gut permeability better than whey protein. IgA coats the mucosal surface, preventing pathogen adhesion.',
    dosage: '1-3g/day',
    timing: 'Morning, with or without food.',
    what_to_look_for: 'Freeze-dried, not spray-dried (preserves bioactive fractions). High IgG content (>25%). Brands: Sovereign Laboratories, Kirkman Labs.',
    time_of_day: ['morning'],
    sort_order: 8,
  },
  {
    key: 'prebiotic',
    name: 'Prebiotic (FOS/GOS/Inulin)',
    priority: 'Recommended',
    what_it_does: 'Selectively fermented by beneficial bacteria (Bifidobacterium, Lactobacillus), increasing colony counts while pathobionts cannot utilise these substrates. Drives SCFA production especially butyrate.',
    dosage: '3-5g/day increasing gradually to 10g/day over 2 weeks. Starting too high causes significant gas.',
    timing: 'With meals or in smoothies.',
    what_to_look_for: 'FOS (fructooligosaccharides), GOS (galactooligosaccharides), or inulin. If eating Jerusalem artichokes, leeks, garlic, and onions daily, dietary intake may be sufficient.',
    time_of_day: ['morning', 'midday'],
    sort_order: 9,
  },
  {
    key: 'butyrate',
    name: 'Sodium Butyrate / Tributyrin',
    priority: 'Optional',
    what_it_does: 'Butyrate is the primary energy source for colonocytes. Supplementation delivers fuel directly to distal colon cells. Reduces NF-κB activation, upregulates tight junction proteins, induces regulatory T cells.',
    dosage: '300-600mg twice daily',
    timing: 'With meals. Must be enteric-coated or tributyrin form to reach colon.',
    what_to_look_for: 'Enteric-coated sodium butyrate OR tributyrin capsules. NOT powder (absorbed in small intestine). Brands: Body Bio Butyrate, Tributyrin-X. Dietary fibre-sourced butyrate is always better long-term.',
    time_of_day: ['morning', 'evening'],
    sort_order: 10,
  },
];

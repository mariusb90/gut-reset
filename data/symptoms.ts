// Symptom keys logged by users and their protocol-aware contextual notes.
// Used by the Progress tab Symptom Patterns panel.

export interface SymptomMeta {
  key: string;
  label: string;
  /** Shown when symptom has appeared 3+ times in program */
  recurringNote: string;
  /** Shown when symptom was in Week 1 but absent in Week 2 */
  resolvedNote: string;
}

export const SYMPTOM_META: SymptomMeta[] = [
  {
    key: 'headache',
    label: 'Headaches',
    recurringNote:
      'Headaches in the first week are common during the elimination phase — toxin die-off and caffeine withdrawal peak at Days 3–5 and typically resolve by Day 7.',
    resolvedNote: 'Headaches cleared in Week 2 — a sign your body is adapting to the new baseline.',
  },
  {
    key: 'fatigue',
    label: 'Fatigue',
    recurringNote:
      'Persistent low energy in Week 1 is normal as your microbiome shifts. Beneficial bacteria ramp up short-chain fatty acid production from Day 5 onward — energy typically returns by Day 8–10.',
    resolvedNote: 'Fatigue resolved in Week 2 — microbiome energy production is coming online.',
  },
  {
    key: 'bloating',
    label: 'Bloating',
    recurringNote:
      'Recurring bloating signals your gut bacteria are adjusting to higher fibre and fermented foods. If it has not improved by Day 7, try reducing fermented food volume temporarily and reintroducing gradually.',
    resolvedNote: 'Bloating cleared in Week 2 — tight junctions and microbiome balance are stabilising.',
  },
  {
    key: 'nausea',
    label: 'Nausea',
    recurringNote:
      'Nausea in the elimination phase is often linked to die-off reactions or supplement sensitivity. Try taking supplements with food and drinking an extra glass of water with each dose.',
    resolvedNote: 'Nausea resolved — your system is adapting well.',
  },
  {
    key: 'brain_fog',
    label: 'Brain fog',
    recurringNote:
      'Brain fog during elimination is a known gut–brain axis response. The gut produces ~90% of serotonin — as the microbiome rebalances, cognitive clarity typically improves markedly in Week 2.',
    resolvedNote: 'Brain fog cleared in Week 2 — gut–brain signalling is improving.',
  },
  {
    key: 'skin',
    label: 'Skin reactions',
    recurringNote:
      'Skin flares in Week 1 often reflect gut inflammation surfacing cutaneously. The gut–skin axis response typically lags 2–3 days — watch for improvement in Week 2 as the microbiome stabilises.',
    resolvedNote: 'Skin improved in Week 2 — gut–skin axis responding positively.',
  },
  {
    key: 'cramps',
    label: 'Stomach cramps',
    recurringNote:
      'Cramps during the program often indicate your digestive system is working harder to process the new dietary load. Stay well hydrated and increase fermented food intake gradually.',
    resolvedNote: 'Cramps resolved — digestive motility is settling into a healthier rhythm.',
  },
  {
    key: 'mood_low',
    label: 'Low mood',
    recurringNote:
      'Low mood during elimination is well-documented and tied to temporary gut microbiome disruption. The gut-brain connection means mood typically lifts once beneficial bacteria establish — often by Day 8–10.',
    resolvedNote: 'Mood improved in Week 2 — microbiome-brain axis responding as expected.',
  },
  {
    key: 'sleep_poor',
    label: 'Poor sleep',
    recurringNote:
      'Sleep disruption in Week 1 is common as your circadian rhythm and gut melatonin production adjust. Magnesium glycinate in the evening can help — and this typically resolves by Day 7–8.',
    resolvedNote: 'Sleep improved in Week 2 — gut-derived melatonin production is stabilising.',
  },
  {
    key: 'cravings',
    label: 'Cravings',
    recurringNote:
      'Persistent cravings signal pathobiont bacteria signalling for their preferred fuel. These should reduce significantly by Day 7–9 as beneficial bacteria outcompete them. Stay the course.',
    resolvedNote: 'Cravings dropped in Week 2 — your microbiome is shifting the signalling balance.',
  },
];

// Ordered list for display in multi-select UI
export const SYMPTOM_OPTIONS = SYMPTOM_META.map((s) => ({
  key: s.key,
  label: s.label,
}));

/**
 * Get meta for a given symptom key.
 * Falls back to a generic entry for unknown keys.
 */
export function getSymptomMeta(key: string): SymptomMeta {
  return (
    SYMPTOM_META.find((s) => s.key === key) ?? {
      key,
      label: key.replace(/_/g, ' '),
      recurringNote: 'This symptom has been recurring — consider discussing with a healthcare professional if it persists.',
      resolvedNote: 'This symptom resolved in Week 2.',
    }
  );
}

export interface GutScoreInput {
  supplementsTaken: Record<string, boolean>;
  totalSupplements: number;
  mealsEaten: Record<string, boolean>;
  waterGlasses: number;
  energy: number;
  bloating: number;
}

export interface GutScoreBreakdownValues {
  supplements: number;
  meals: number;
  water: number;
  energy: number;
  bloating: number;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

export function computeGutScoreBreakdown(log: GutScoreInput): GutScoreBreakdownValues {
  const supplementsTakenCount = Object.values(log.supplementsTaken).filter(Boolean).length;
  const mealsEatenCount = Object.values(log.mealsEaten).filter(Boolean).length;

  return {
    supplements: log.totalSupplements > 0 ? (supplementsTakenCount / log.totalSupplements) * 30 : 0,
    meals: (mealsEatenCount / 5) * 25,
    water: (Math.min(log.waterGlasses, 8) / 8) * 15,
    energy: ((log.energy || 0) / 5) * 15,
    bloating: log.bloating > 0 ? ((5 - log.bloating) / 5) * 15 : 0,
  };
}

export function computeGutScore(log: GutScoreInput): number {
  const breakdown = computeGutScoreBreakdown(log);
  const total = breakdown.supplements + breakdown.meals + breakdown.water + breakdown.energy + breakdown.bloating;
  return Math.round(clampScore(total));
}

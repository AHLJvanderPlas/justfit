/** Canonical muscle group list for exercise library. */
export const MUSCLES = [
  'chest', 'front_delt', 'lateral_delt', 'rear_delt',
  'triceps', 'biceps', 'forearms',
  'upper_back', 'lats', 'lower_back',
  'glutes', 'hamstrings', 'quads', 'adductors', 'abductors', 'calves',
  'core', 'abs', 'obliques',
  'hip_flexors', 'pelvic_floor',
  'neck', 'traps',
  'full_body',
] as const;

export type Muscle = (typeof MUSCLES)[number];

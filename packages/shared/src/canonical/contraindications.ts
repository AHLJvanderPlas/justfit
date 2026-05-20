/** Canonical contraindication tags. Match these to exercise.contraindications_json values. */
export const CONTRAINDICATIONS = [
  'lumbar_disc', 'lower_back_pain', 'knee_pain', 'knee_replacement',
  'shoulder_pain', 'shoulder_impingement', 'rotator_cuff',
  'hip_replacement', 'ankle_instability', 'wrist_pain',
  'hypertension', 'cardiac_condition', 'pregnancy', 'postnatal_early',
  'osteoporosis', 'hernia', 'diastasis_recti', 'pelvic_floor_dysfunction',
  'high_impact', 'valsalva', 'inversion', 'supine', 'prone', 'crunch',
] as const;

export type Contraindication = (typeof CONTRAINDICATIONS)[number];

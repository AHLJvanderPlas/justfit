/** Canonical equipment list. Must match exercises.equipment_required_json values. */
export const EQUIPMENT = [
  'none', 'dumbbell', 'barbell', 'kettlebell', 'resistance_band',
  'pull_up_bar', 'bench', 'cables', 'machine',
  'treadmill', 'stationary_bike', 'indoor_bike', 'rowing_machine',
  'trx', 'foam_roller', 'yoga_mat', 'jump_rope',
  'box', 'sled', 'battle_ropes',
] as const;

export type Equipment = (typeof EQUIPMENT)[number];

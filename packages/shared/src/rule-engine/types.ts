/** Shared TypeScript types for the rule engine inputs/outputs. */

export interface PhaseStructureEntry {
  week_start: number;
  week_end: number;
  name: string;
  intensity_range: [number, number]; // [low, high] 1-10
  volume_target: number; // relative multiplier, e.g. 1.0
  focus?: string;
}

export interface RuleConstraints {
  substitution_policy: 'open' | 'trainer_pool' | 'locked';
  missed_session_policy: 'skip' | 'shift' | 'doubleup';
  weekly_checks?: {
    push_pull_balance?: boolean;
    compound_isolation_ratio?: boolean;
    muscle_group_overlap?: boolean;
  };
}

export interface ExerciseSlot {
  exercise_id: string;
  exercise_source: 'global' | 'custom';
  sets: number;
  reps?: number;
  duration_sec?: number;
  rest_sec: number;
  notes?: string;
  lock_flag: 'open' | 'pool' | 'locked'; // open=freely swappable, pool=trainer-defined pool, locked=not swappable
  sub_pool_ids?: string[]; // exercise IDs allowed for 'pool' substitution
  contraindications?: string[];
  primary_muscles?: string[];
}

export interface SessionBlock {
  type: 'warmup' | 'main' | 'cooldown' | 'superset' | 'circuit';
  name?: string;
  exercises: ExerciseSlot[];
}

export interface SessionStructure {
  blocks: SessionBlock[];
}

export interface ClientIntake {
  goals_json?: Array<{ tag: string; label: string }>;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  injuries_json?: Array<{ area: string; severity: string; active: boolean; notes?: string }>;
  contraindications_json?: Array<{ tag: string; notes?: string }>;
  available_days_json?: { days: string[]; time_of_day?: string };
  session_duration_target_min?: number;
  equipment_access_json?: { items: string[] };
}

export interface PhaseTargets {
  intensity_range: [number, number];
  volume_target: number;
  focus?: string;
  phase_name?: string;
}

export interface ValidationResult {
  hardFail: ValidationIssue[];
  softWarn: ValidationIssue[];
}

export interface ValidationIssue {
  rule: string;
  exercise_id?: string;
  exercise_name?: string;
  message: string;
  contraindication?: string;
}

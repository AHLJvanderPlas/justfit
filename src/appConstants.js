// ─── SHARED APP CONSTANTS ────────────────────────────────────────────────────
// Used by App.jsx, SettingsView.jsx, and extracted view components.

// Must match CURRENT_TERMS_VERSION / CURRENT_PRIVACY_VERSION in functions/api/_shared/legalVersions.js
export const LEGAL_VERSIONS = { terms: '1.1', privacy: '1.0' };

export const GOALS = [
  { value: "health",      label: "General Health" },
  { value: "strength",    label: "Build Strength" },
  { value: "fat_loss",    label: "Lose Weight"    },
  { value: "muscle_gain", label: "Build Muscle"   },
  { value: "endurance",   label: "Endurance"      },
  { value: "mobility",    label: "Mobility & Flex"},
];

export const EXPERIENCE = [
  { value: "beginner",     label: "Beginner",     sub: "New to fitness or returning after a long break" },
  { value: "intermediate", label: "Intermediate", sub: "Training consistently for 6+ months" },
  { value: "advanced",     label: "Advanced",     sub: "Training for 2+ years, know your way around" },
];

// Short list used in onboarding (equipment selector step)
export const EQUIPMENT_OPTIONS = [
  { value: "none",             label: "No equipment",        sub: "Bodyweight only" },
  { value: "dumbbell",         label: "Dumbbells",           sub: "Adjustable or fixed" },
  { value: "resistance_bands", label: "Resistance bands",   sub: "Light to heavy bands" },
  { value: "pull_up_bar",      label: "Pull-up bar",         sub: "Door-mounted or free-standing" },
  { value: "treadmill",        label: "Treadmill",           sub: "Home or gym treadmill" },
  { value: "exercise_bike",    label: "Stationary bike",     sub: "Upright or spin bike" },
  { value: "indoor_bike",      label: "Indoor bike trainer", sub: "Road bike on trainer" },
  { value: "rowing_machine",   label: "Rowing machine",      sub: "Ergometer or water rower" },
];

// Full equipment list (label lookup + settings selector)
export const ALL_EQUIPMENT = [
  { value: "running_shoes",      label: "Running shoes" },
  { value: "trail_shoes",        label: "Trail shoes / hiking boots" },
  { value: "yoga_mat",           label: "Yoga mat" },
  { value: "dumbbell",           label: "Dumbbells" },
  { value: "resistance_bands",   label: "Resistance bands" },
  { value: "jump_rope",          label: "Jump rope" },
  { value: "exercise_mat",       label: "Exercise mat" },
  { value: "foam_roller",        label: "Foam roller" },
  { value: "kettlebell",         label: "Kettlebell" },
  { value: "pull_up_bar",        label: "Pull-up bar" },
  { value: "adjustable_bench",   label: "Adjustable bench" },
  { value: "stability_ball",     label: "Stability ball" },
  { value: "ankle_weights",      label: "Ankle weights" },
  { value: "barbell",            label: "Barbell" },
  { value: "weight_plates",      label: "Weight plates" },
  { value: "push_up_handles",    label: "Push-up handles" },
  { value: "medicine_ball",      label: "Medicine ball" },
  { value: "fitness_tracker",    label: "Fitness tracker" },
  { value: "road_bike",          label: "Road / racing bike" },
  { value: "mountain_bike",      label: "Mountain bike" },
  { value: "indoor_bike",        label: "Indoor bike trainer" },
  { value: "exercise_bike",      label: "Stationary bike" },
  { value: "rowing_machine",     label: "Rowing machine" },
  { value: "treadmill",          label: "Treadmill" },
  { value: "suspension_trainer", label: "Suspension trainer" },
  { value: "step_platform",      label: "Step platform" },
  { value: "power_tower",        label: "Power tower" },
  { value: "punching_bag",       label: "Punching bag" },
  { value: "smith_machine",      label: "Smith machine" },
  { value: "elliptical",         label: "Elliptical trainer" },
  { value: "squat_rack",         label: "Home squat rack" },
  { value: "bench_press_rack",   label: "Bench press rack" },
  { value: "multi_gym",          label: "Multi-gym machine" },
];

export const ALL_SPORTS = [
  { id: "running",     label: "Running" },
  { id: "cycling",     label: "Cycling" },
  { id: "swimming",    label: "Swimming" },
  { id: "walking",     label: "Walking & Hiking" },
  { id: "rowing",      label: "Rowing" },
  { id: "triathlon",   label: "Triathlon" },
  { id: "skating",     label: "Inline Skating" },
  { id: "mtb",         label: "Mountain Biking" },
  { id: "ice_skating", label: "Ice Skating" },
  { id: "trail_run",   label: "Trail Running" },
  { id: "kayaking",    label: "Kayaking & Canoeing" },
  { id: "spinning",    label: "Indoor Cycling" },
  { id: "nordic_walk", label: "Nordic Walking" },
  { id: "sup",         label: "Paddleboarding (SUP)" },
  { id: "open_water",  label: "Open Water Swimming" },
  { id: "climbing",    label: "Climbing & Bouldering" },
  { id: "kitesurfing", label: "Kitesurfing" },
  { id: "duathlon",    label: "Duathlon" },
  { id: "obstacle",    label: "Obstacle Racing" },
  { id: "cardio",      label: "Mixed Cardio" },
  { id: "golf",        label: "Golf" },
  { id: "tennis",      label: "Tennis" },
];

export const SEX_OPTIONS = [
  { label: "Male",              value: "male" },
  { label: "Female",            value: "female" },
  { label: "Non-binary",        value: "non_binary" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

export const CYCLE_LENGTHS = [21, 24, 26, 28, 30, 32, 35];

// Running Coach goal distances.
// label  — short button label shown in the distance picker
// prevKm — prerequisite distance that must be completed first (null = no prerequisite)
// weeks  — estimated programme length
export const RUN_TARGETS = [
  { km:  5,    label: "5km",   prevKm: null,  weeks: "8 weeks"  },
  { km: 10,    label: "10km",  prevKm:  5,    weeks: "12 weeks" },
  { km: 10.5,  label: "¼ Mar", prevKm:  5,    weeks: "13 weeks" },
  { km: 15,    label: "15km",  prevKm: 10,    weeks: "14 weeks" },
  { km: 20,    label: "20km",  prevKm: 15,    weeks: "16 weeks" },
  { km: 21.1,  label: "½ Mar", prevKm: 15,    weeks: "18 weeks" },
  { km: 25,    label: "25km",  prevKm: 20,    weeks: "18 weeks" },
  { km: 30,    label: "30km",  prevKm: 21.1,  weeks: "20 weeks" },
  { km: 35,    label: "35km",  prevKm: 30,    weeks: "22 weeks" },
  { km: 40,    label: "40km",  prevKm: 35,    weeks: "24 weeks" },
  { km: 42.2,  label: "Mar",   prevKm: 35,    weeks: "24 weeks" },
  { km: 45,    label: "45km",  prevKm: 42.2,  weeks: "26 weeks" },
  { km: 50,    label: "50km",  prevKm: 45,    weeks: "28 weeks" },
];

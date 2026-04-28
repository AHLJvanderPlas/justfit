/* eslint-disable react-refresh/only-export-components */
// src/icons.jsx — UI icons + exercise movement line-art
// All inline SVG, no external dependencies.

// ─── UI ICONS ─────────────────────────────────────────────────────────────────
// Each icon: ({ size, c, filled }) → <svg>

export const Icons = {
  flame: ({ size = 16, c = "currentColor", filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? c : "none"} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-1.5 2.5-3 5-3 8a3 3 0 0 0 6 0c0-1.2-.4-2.2-1-3-.5 1-1.2 1.8-2 2 .6-1.5.4-3.5 0-5C11 5 9.5 7 9 9.5 8.5 8.5 8 7 8 5.5 8 4 9 2.5 12 2Z" />
      <path d="M10.5 15.5c0-1 1.5-2.5 1.5-2.5s1.5 1.5 1.5 2.5a1.5 1.5 0 0 1-3 0Z" />
    </svg>
  ),
  check: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  bolt: ({ size = 16, c = "currentColor", filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? c : "none"} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  arrowRight: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  chart: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  target: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  calendar: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  user: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  bell: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  x: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  chevronRight: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

// ─── EXERCISE ICONS ───────────────────────────────────────────────────────────
// Side-view stick-figure line art, 24×24 viewBox, rendered at 48 px by default.
// Props: type (string key), size (px), c (stroke color)

const EXERCISE_PATHS = {
  // Push-up: person horizontal, arms straight, plank-top position
  pushup: (
    <>
      <circle cx="4" cy="8" r="1.8" />
      <line x1="5.5" y1="9" x2="18" y2="11.5" />
      <line x1="18" y1="11.5" x2="21" y2="10.5" />
      <line x1="9" y1="9.7" x2="9" y2="14.5" />
      <line x1="9" y1="14.5" x2="13" y2="14.5" />
      <line x1="14" y1="10.5" x2="14" y2="15" />
      <line x1="14" y1="15" x2="18" y2="15" />
    </>
  ),
  // Squat: front view, knees bent, thighs parallel
  squat: (
    <>
      <circle cx="12" cy="3.5" r="1.8" />
      <line x1="12" y1="5.3" x2="12" y2="12" />
      <line x1="12" y1="8" x2="7.5" y2="11" />
      <line x1="12" y1="8" x2="16.5" y2="11" />
      <line x1="12" y1="12" x2="8" y2="17" />
      <line x1="8" y1="17" x2="6.5" y2="21" />
      <line x1="12" y1="12" x2="16" y2="17" />
      <line x1="16" y1="17" x2="17.5" y2="21" />
    </>
  ),
  // Deadlift: side view, hinging forward, bar at mid-shin
  deadlift: (
    <>
      <circle cx="7" cy="5" r="1.8" />
      <line x1="7" y1="6.8" x2="13" y2="13" />
      <line x1="9" y1="9" x2="16" y2="14" />
      <line x1="13" y1="13" x2="11" y2="20" />
      <line x1="13" y1="13" x2="16" y2="20" />
      <line x1="14.5" y1="17" x2="21" y2="17" />
      <circle cx="21" cy="17" r="1.5" />
    </>
  ),
  // Bench press: side view, person supine, arms pressing up
  bench: (
    <>
      <circle cx="4.5" cy="13" r="1.8" />
      <line x1="6.3" y1="13" x2="19" y2="13" />
      <line x1="19" y1="13" x2="20.5" y2="11" />
      <line x1="10" y1="13" x2="10" y2="7" />
      <line x1="10" y1="7" x2="15" y2="7" />
      <line x1="15" y1="7" x2="15" y2="13" />
      <line x1="8" y1="7.5" x2="17" y2="7.5" />
    </>
  ),
  // Row: side view, bent-over, arms pulling weight up
  row: (
    <>
      <circle cx="5" cy="8" r="1.8" />
      <line x1="6.5" y1="9" x2="15" y2="13" />
      <line x1="15" y1="13" x2="13" y2="20" />
      <line x1="15" y1="13" x2="18" y2="20" />
      <line x1="9" y1="10.5" x2="10" y2="15" />
      <line x1="10" y1="15" x2="14" y2="13" />
      <circle cx="15" cy="12.5" r="1.5" />
    </>
  ),
  // Pull-up: front view, hanging from bar, arms extended
  pull: (
    <>
      <line x1="3" y1="3" x2="21" y2="3" />
      <circle cx="12" cy="6.5" r="1.8" />
      <line x1="12" y1="8.3" x2="12" y2="15" />
      <line x1="12" y1="8.3" x2="7" y2="3" />
      <line x1="12" y1="8.3" x2="17" y2="3" />
      <line x1="12" y1="11" x2="8.5" y2="13.5" />
      <line x1="12" y1="11" x2="15.5" y2="13.5" />
      <line x1="12" y1="15" x2="10" y2="21" />
      <line x1="12" y1="15" x2="14" y2="21" />
    </>
  ),
  // Plank: side view, forearms on ground, rigid body
  plank: (
    <>
      <circle cx="4" cy="8" r="1.8" />
      <line x1="5.5" y1="9" x2="19" y2="11.5" />
      <line x1="19" y1="11.5" x2="22" y2="10.5" />
      <line x1="9" y1="9.8" x2="8" y2="14.5" />
      <line x1="8" y1="14.5" x2="13" y2="14.5" />
      <line x1="14" y1="10.5" x2="13" y2="15" />
      <line x1="13" y1="15" x2="18" y2="15" />
    </>
  ),
  // Lunge: side view, front knee at 90°, back knee low
  lunge: (
    <>
      <circle cx="10" cy="4" r="1.8" />
      <line x1="10" y1="5.8" x2="10" y2="12" />
      <line x1="10" y1="9" x2="13" y2="11" />
      <line x1="10" y1="12" x2="7" y2="18" />
      <line x1="7" y1="18" x2="5" y2="22" />
      <line x1="10" y1="12" x2="15" y2="16" />
      <line x1="15" y1="16" x2="15" y2="22" />
    </>
  ),
  // Curl: front view, arm bent, dumbbell in hand
  curl: (
    <>
      <circle cx="12" cy="3.5" r="1.8" />
      <line x1="12" y1="5.3" x2="12" y2="14" />
      <line x1="12" y1="9" x2="17" y2="12" />
      <line x1="17" y1="12" x2="16" y2="8" />
      <circle cx="15.5" cy="7" r="1.5" />
      <line x1="12" y1="9" x2="7" y2="12" />
      <line x1="12" y1="14" x2="9" y2="21" />
      <line x1="12" y1="14" x2="15" y2="21" />
    </>
  ),
  // Sit-up: side view, torso raising off floor, knees bent
  sit: (
    <>
      <circle cx="16" cy="7" r="1.8" />
      <line x1="15" y1="8.5" x2="9" y2="14" />
      <line x1="9" y1="14" x2="7" y2="19" />
      <line x1="7" y1="19" x2="14" y2="19" />
      <line x1="14" y1="19" x2="16" y2="15" />
      <line x1="9" y1="14" x2="14" y2="11" />
    </>
  ),
  // Kettlebell swing: side view, hip hinge, bell forward
  kettle: (
    <>
      <circle cx="8" cy="5" r="1.8" />
      <line x1="8" y1="6.8" x2="12" y2="13" />
      <line x1="10" y1="9" x2="17" y2="6" />
      <line x1="12" y1="13" x2="10" y2="20" />
      <line x1="12" y1="13" x2="15" y2="20" />
      <circle cx="19" cy="6" r="2.5" />
      <path d="M17 3.5 Q19 2 21 3.5" fill="none" />
    </>
  ),
  // Run: side view, mid-stride
  run: (
    <>
      <circle cx="14" cy="4" r="1.8" />
      <line x1="14" y1="5.8" x2="12" y2="13" />
      <line x1="12" y1="9" x2="17" y2="7" />
      <line x1="12" y1="9" x2="8" y2="12" />
      <line x1="12" y1="13" x2="17" y2="18" />
      <line x1="17" y1="18" x2="20" y2="16" />
      <line x1="12" y1="13" x2="9" y2="19" />
      <line x1="9" y1="19" x2="7" y2="22" />
    </>
  ),
  // Press: standing, arms pressing dumbbell overhead
  press: (
    <>
      <circle cx="11" cy="7" r="1.8" />
      <line x1="11" y1="8.8" x2="11" y2="16" />
      <line x1="11" y1="9.5" x2="11" y2="3" />
      <line x1="11" y1="3" x2="9" y2="3" />
      <line x1="11" y1="3" x2="13" y2="3" />
      <circle cx="9" cy="3" r="1.5" />
      <circle cx="13" cy="3" r="1.5" />
      <line x1="11" y1="16" x2="9" y2="22" />
      <line x1="11" y1="16" x2="13" y2="22" />
    </>
  ),
  // Dip: arms on parallel bars, body lowered
  dip: (
    <>
      <line x1="3" y1="9" x2="11" y2="9" />
      <line x1="13" y1="9" x2="21" y2="9" />
      <circle cx="12" cy="6" r="1.8" />
      <line x1="12" y1="7.8" x2="12" y2="14" />
      <line x1="12" y1="9" x2="9" y2="11" />
      <line x1="9" y1="11" x2="9" y2="9" />
      <line x1="12" y1="9" x2="15" y2="11" />
      <line x1="15" y1="11" x2="15" y2="9" />
      <line x1="12" y1="14" x2="10" y2="18" />
      <line x1="10" y1="18" x2="13" y2="20" />
      <line x1="12" y1="14" x2="14" y2="18" />
      <line x1="14" y1="18" x2="17" y2="20" />
    </>
  ),
  // Hip thrust: lying on back, hips driven up
  hip: (
    <>
      <circle cx="4" cy="17" r="1.8" />
      <line x1="5.5" y1="16.5" x2="13" y2="11" />
      <line x1="5.5" y1="17.5" x2="9" y2="19" />
      <line x1="13" y1="11" x2="17" y2="14" />
      <line x1="17" y1="14" x2="17" y2="20" />
      <line x1="3" y1="20.5" x2="20" y2="20.5" />
    </>
  ),
  // Stretch: seated forward fold
  stretch: (
    <>
      <circle cx="6" cy="11" r="1.8" />
      <line x1="7.5" y1="11.5" x2="14" y2="15" />
      <line x1="11" y1="13" x2="18" y2="17" />
      <line x1="14" y1="15" x2="20" y2="17" />
      <line x1="20" y1="17" x2="21" y2="15.5" />
      <line x1="4" y1="18.5" x2="22" y2="18.5" />
    </>
  ),
  // Band: standing, resistance band stretched wide at chest
  band: (
    <>
      <circle cx="12" cy="3.5" r="1.8" />
      <line x1="12" y1="5.3" x2="12" y2="14" />
      <line x1="12" y1="9" x2="4" y2="9" />
      <line x1="12" y1="9" x2="20" y2="9" />
      <path d="M4 9 Q12 11 20 9" fill="none" />
      <circle cx="4" cy="9" r="1.5" />
      <circle cx="20" cy="9" r="1.5" />
      <line x1="12" y1="14" x2="9" y2="21" />
      <line x1="12" y1="14" x2="15" y2="21" />
    </>
  ),
  // Step-up: one foot on raised box
  step: (
    <>
      <circle cx="8" cy="4" r="1.8" />
      <line x1="8" y1="5.8" x2="8" y2="13" />
      <line x1="8" y1="9" x2="5" y2="11" />
      <line x1="8" y1="9" x2="11" y2="7" />
      <line x1="8" y1="13" x2="14" y2="14" />
      <line x1="14" y1="14" x2="14" y2="18" />
      <line x1="8" y1="13" x2="7" y2="22" />
      <line x1="13" y1="18" x2="22" y2="18" />
      <line x1="13" y1="18" x2="13" y2="22" />
      <line x1="22" y1="18" x2="22" y2="22" />
      <line x1="13" y1="22" x2="22" y2="22" />
    </>
  ),
  // Walk: mid-stride, relaxed upright
  walk: (
    <>
      <circle cx="11" cy="4" r="1.8" />
      <line x1="11" y1="5.8" x2="11" y2="13" />
      <line x1="11" y1="9" x2="14" y2="11.5" />
      <line x1="11" y1="9" x2="8" y2="11.5" />
      <line x1="11" y1="13" x2="15" y2="18" />
      <line x1="15" y1="18" x2="16" y2="22" />
      <line x1="11" y1="13" x2="8" y2="19" />
      <line x1="8" y1="19" x2="6" y2="22" />
    </>
  ),
  // Sprint: explosive forward lean
  sprint: (
    <>
      <circle cx="15" cy="4" r="1.8" />
      <line x1="14.5" y1="5.7" x2="11" y2="13" />
      <line x1="13" y1="9" x2="19" y2="6" />
      <line x1="13" y1="9" x2="6" y2="11" />
      <line x1="11" y1="13" x2="17" y2="15" />
      <line x1="17" y1="15" x2="20" y2="11" />
      <line x1="11" y1="13" x2="7" y2="18" />
      <line x1="7" y1="18" x2="3" y2="20" />
    </>
  ),
  // Rotation: torso twist with weight
  rotation: (
    <>
      <circle cx="12" cy="3.5" r="1.8" />
      <line x1="12" y1="5.3" x2="12" y2="14" />
      <line x1="12" y1="9" x2="18" y2="11" />
      <circle cx="19" cy="11.5" r="2" />
      <path d="M5 9 Q3 12 5 14" fill="none" />
      <line x1="5" y1="14" x2="6.5" y2="13.5" />
      <line x1="5" y1="14" x2="4.5" y2="12.5" />
      <line x1="12" y1="14" x2="9" y2="21" />
      <line x1="12" y1="14" x2="15" y2="21" />
    </>
  ),
  // Breathe: arms open, inhale arcs
  breathe: (
    <>
      <circle cx="12" cy="3.5" r="1.8" />
      <line x1="12" y1="5.3" x2="12" y2="14" />
      <line x1="12" y1="8" x2="6" y2="11" />
      <line x1="12" y1="8" x2="18" y2="11" />
      <path d="M8 3 Q9 1.5 11 1.5" fill="none" />
      <path d="M16 3 Q15 1.5 13 1.5" fill="none" />
      <line x1="12" y1="14" x2="10" y2="21" />
      <line x1="12" y1="14" x2="14" y2="21" />
    </>
  ),
  // Foam roll: person on side over cylinder
  foam: (
    <>
      <circle cx="4" cy="11" r="1.8" />
      <line x1="5.5" y1="11.5" x2="13" y2="14" />
      <line x1="5.5" y1="11.5" x2="7" y2="16" />
      <line x1="7" y1="16" x2="6" y2="20" />
      <line x1="13" y1="14" x2="18" y2="13" />
      <line x1="18" y1="13" x2="20" y2="17" />
      <ellipse cx="13" cy="17" rx="3" ry="1.5" fill="none" />
      <line x1="2" y1="20.5" x2="22" y2="20.5" />
    </>
  ),
  // Military march: upright with weighted pack
  military: (
    <>
      <circle cx="10" cy="4" r="1.8" />
      <line x1="10" y1="5.8" x2="10" y2="13" />
      <line x1="6" y1="7" x2="6" y2="12" />
      <line x1="6" y1="7" x2="9" y2="7" />
      <line x1="6" y1="12" x2="9" y2="12" />
      <line x1="10" y1="9" x2="13" y2="7" />
      <line x1="10" y1="9" x2="8" y2="12" />
      <line x1="10" y1="13" x2="14" y2="16" />
      <line x1="14" y1="16" x2="14" y2="20" />
      <line x1="10" y1="13" x2="9" y2="22" />
    </>
  ),
  // Bike: seated cycling
  bike: (
    <>
      <circle cx="5" cy="18" r="2.5" />
      <circle cx="19" cy="18" r="2.5" />
      <line x1="5" y1="18" x2="12" y2="18" />
      <line x1="12" y1="18" x2="19" y2="18" />
      <line x1="12" y1="18" x2="14" y2="11" />
      <line x1="19" y1="18" x2="14" y2="11" />
      <line x1="13" y1="11" x2="15" y2="11" />
      <circle cx="13" cy="6" r="1.8" />
      <line x1="13" y1="7.8" x2="14" y2="11" />
      <line x1="13.5" y1="9" x2="18" y2="11" />
      <line x1="14" y1="11" x2="12" y2="18" />
      <line x1="14" y1="11" x2="16" y2="14" />
      <line x1="16" y1="14" x2="13" y2="17" />
    </>
  ),
  // Climb: ascending stairs
  climb: (
    <>
      <line x1="3" y1="22" x2="11" y2="22" />
      <line x1="11" y1="22" x2="11" y2="18" />
      <line x1="11" y1="18" x2="17" y2="18" />
      <line x1="17" y1="18" x2="17" y2="14" />
      <line x1="17" y1="14" x2="22" y2="14" />
      <circle cx="9" cy="5" r="1.8" />
      <line x1="9" y1="6.8" x2="10" y2="13" />
      <line x1="9.5" y1="9" x2="14" y2="6" />
      <line x1="9.5" y1="9" x2="6" y2="11" />
      <line x1="10" y1="13" x2="14" y2="14" />
      <line x1="14" y1="14" x2="14" y2="18" />
      <line x1="10" y1="13" x2="9" y2="22" />
    </>
  ),
  // Shoulder lateral raise: arms out at shoulder height with dumbbells
  shoulder: (
    <>
      <circle cx="12" cy="3.5" r="1.8" />
      <line x1="12" y1="5.3" x2="12" y2="14" />
      <line x1="12" y1="8" x2="5" y2="8" />
      <line x1="12" y1="8" x2="19" y2="8" />
      <circle cx="4" cy="8" r="1.5" />
      <circle cx="20" cy="8" r="1.5" />
      <line x1="12" y1="14" x2="10" y2="21" />
      <line x1="12" y1="14" x2="14" y2="21" />
    </>
  ),
  // Default: dumbbell icon
  default: (
    <>
      <circle cx="4" cy="12" r="3" />
      <circle cx="20" cy="12" r="3" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="9" y1="9" x2="9" y2="15" />
      <line x1="15" y1="9" x2="15" y2="15" />
    </>
  ),
};

export function ExerciseIcon({ type = "default", size = 48, c = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {EXERCISE_PATHS[type] ?? EXERCISE_PATHS.default}
    </svg>
  );
}

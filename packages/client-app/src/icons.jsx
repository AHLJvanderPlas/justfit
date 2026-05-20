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
  run: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="5" r="2" />
      <path d="M9 21l4-7-4-3 4-4 4 4M11 16l-4 3" />
    </svg>
  ),
  cycle: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="M6 17l6-9 6 9M9 8h6" />
    </svg>
  ),
  trophy: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
      <path d="M5 6H7v3a2 2 0 0 1-2 0Z" />
      <path d="M19 6H17v3a2 2 0 0 0 2 0Z" />
      <path d="M10 14h4v4h-4Z" />
      <path d="M8 21h8" />
    </svg>
  ),
  crown: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8l3 6 5-8 5 8 3-6-2 10H6Z" />
    </svg>
  ),
  spark: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4l1.5 6.5L20 12l-6.5 1.5L12 20l-1.5-6.5L4 12l6.5-1.5Z" />
    </svg>
  ),
  plus: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  mountain: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 19l6-11 4 6 3-4 5 9Z" />
    </svg>
  ),
  moon: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  compass: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-4 2-2 4 4-2 2-4Z" />
    </svg>
  ),
  shield: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 5-4 9-8 10-4-1-8-5-8-10V6Z" />
    </svg>
  ),
  refresh: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12a7 7 0 0 1 14-2M19 12a7 7 0 0 1-14 2" />
      <path d="M19 5v4h-4M5 19v-4h4" />
    </svg>
  ),
  lift: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h3M18 12h3M6 8v8M18 8v8M9 11h6M9 13h6" />
    </svg>
  ),
  clock: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  ),
  lock: ({ size = 16, c = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
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
  // Burpee: squat-thrust to jump — explosive full-body
  burpee: (
    <>
      <circle cx="6" cy="3.5" r="1.5" />
      <line x1="6" y1="5" x2="6" y2="9" />
      <line x1="6" y1="9" x2="3" y2="13" />
      <line x1="6" y1="9" x2="9" y2="13" />
      <path d="M3 18 Q6 15 12 17 T22 18" fill="none" />
      <circle cx="20" cy="17.5" r="1.3" />
    </>
  ),
  // Mountain climber: plank position, alternating knee drive
  mtnclimber: (
    <>
      <circle cx="4" cy="9" r="1.6" />
      <line x1="5.4" y1="10" x2="20" y2="13" />
      <line x1="20" y1="13" x2="22" y2="12.5" />
      <line x1="18" y1="12.5" x2="14" y2="20" />
      <line x1="14" y1="20" x2="11" y2="20" />
      <line x1="13" y1="13" x2="11" y2="17" />
      <line x1="11" y1="17" x2="8" y2="17" />
    </>
  ),
  // Jumping jack: front view, arms and legs spread — star pose
  jack: (
    <>
      <circle cx="12" cy="4" r="1.8" />
      <line x1="12" y1="5.8" x2="12" y2="14" />
      <line x1="12" y1="8" x2="4" y2="4" />
      <line x1="12" y1="8" x2="20" y2="4" />
      <line x1="12" y1="14" x2="6" y2="22" />
      <line x1="12" y1="14" x2="18" y2="22" />
    </>
  ),
  // Jump rope: figure with rope arc overhead
  jumprope: (
    <>
      <circle cx="12" cy="6" r="1.8" />
      <line x1="12" y1="7.8" x2="12" y2="14" />
      <line x1="12" y1="10" x2="9" y2="12" />
      <line x1="9" y1="12" x2="6" y2="9" />
      <line x1="12" y1="10" x2="15" y2="12" />
      <line x1="15" y1="12" x2="18" y2="9" />
      <path d="M5 8 Q12 -1 19 8" fill="none" />
      <line x1="12" y1="14" x2="10" y2="20" />
      <line x1="12" y1="14" x2="14" y2="20" />
      <line x1="6" y1="21" x2="18" y2="21" />
    </>
  ),
  // Hip hinge: side view, torso horizontal, bar on back
  hinge: (
    <>
      <circle cx="6" cy="4" r="1.8" />
      <line x1="6.5" y1="5.5" x2="13" y2="11" />
      <line x1="13" y1="11" x2="20" y2="9" />
      <line x1="13" y1="11" x2="13" y2="17" />
      <line x1="13" y1="17" x2="11" y2="22" />
      <line x1="13" y1="17" x2="15" y2="22" />
      <line x1="3" y1="11" x2="21" y2="11" />
    </>
  ),
  // Leg press: seated, legs pushing angled platform
  legpress: (
    <>
      <line x1="2" y1="20" x2="22" y2="20" />
      <line x1="3" y1="20" x2="9" y2="14" />
      <circle cx="6" cy="13" r="1.6" />
      <line x1="6" y1="14.5" x2="9" y2="14" />
      <line x1="9" y1="14" x2="14" y2="11" />
      <line x1="14" y1="11" x2="20" y2="14" />
      <line x1="20" y1="14" x2="20" y2="20" />
      <line x1="9" y1="14" x2="9" y2="11" />
    </>
  ),
  // Hollow hold: supine, lower back flat, arms and legs raised
  hollow: (
    <>
      <line x1="2" y1="18" x2="22" y2="18" />
      <circle cx="6" cy="14" r="1.5" />
      <path d="M7 14 Q12 11 17 13" fill="none" />
      <line x1="7" y1="13" x2="9" y2="9" />
      <line x1="9" y1="9" x2="11" y2="6" />
      <line x1="14" y1="13" x2="17" y2="9" />
      <line x1="17" y1="9" x2="20" y2="6" />
    </>
  ),
  // Hanging leg raise: hanging from bar, legs/knees up
  legraise: (
    <>
      <line x1="3" y1="3" x2="21" y2="3" />
      <circle cx="12" cy="6.5" r="1.6" />
      <line x1="12" y1="8" x2="9" y2="3" />
      <line x1="12" y1="8" x2="15" y2="3" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <line x1="12" y1="13" x2="20" y2="11" />
      <line x1="20" y1="11" x2="21" y2="8" />
      <line x1="12" y1="13" x2="20" y2="14" />
    </>
  ),
  // Swim: figure horizontal, water wave lines beneath
  swim: (
    <>
      <path d="M2 16 Q6 14 10 16 T18 16 T22 16" fill="none" />
      <path d="M2 20 Q6 18 10 20 T18 20 T22 20" fill="none" />
      <circle cx="7" cy="10" r="1.6" />
      <line x1="8" y1="11" x2="14" y2="13" />
      <line x1="14" y1="13" x2="20" y2="10" />
      <line x1="8" y1="11" x2="3" y2="9" />
    </>
  ),
  // Sled push: figure leaning into sled frame
  sled: (
    <>
      <circle cx="9" cy="5" r="1.6" />
      <line x1="9" y1="6.5" x2="11" y2="13" />
      <line x1="11" y1="13" x2="14" y2="11" />
      <line x1="14" y1="11" x2="14" y2="6" />
      <line x1="11" y1="13" x2="9" y2="20" />
      <line x1="11" y1="13" x2="14" y2="20" />
      <rect x="15" y="6" width="6" height="3" />
      <line x1="15" y1="9" x2="15" y2="20" />
      <line x1="21" y1="9" x2="21" y2="20" />
      <line x1="14" y1="20" x2="22" y2="20" />
    </>
  ),
  // Battle ropes: figure holding two wave arcs
  ropes: (
    <>
      <circle cx="12" cy="4" r="1.8" />
      <line x1="12" y1="5.8" x2="12" y2="14" />
      <line x1="12" y1="9" x2="8" y2="11" />
      <line x1="12" y1="9" x2="16" y2="11" />
      <path d="M8 11 Q5 8 3 13 Q5 18 3 22" fill="none" />
      <path d="M16 11 Q19 8 21 13 Q19 18 21 22" fill="none" />
      <line x1="12" y1="14" x2="10" y2="21" />
      <line x1="12" y1="14" x2="14" y2="21" />
    </>
  ),
  // Sandbag: figure carrying rounded bag to shoulder
  sandbag: (
    <>
      <circle cx="8" cy="4" r="1.6" />
      <line x1="8" y1="5.5" x2="9" y2="11" />
      <line x1="9" y1="11" x2="13" y2="9" />
      <rect x="11" y="5" width="6" height="4" rx="1" />
      <line x1="11" y1="6" x2="17" y2="6" />
      <line x1="9" y1="11" x2="7" y2="20" />
      <line x1="9" y1="11" x2="11" y2="20" />
    </>
  ),
  // Turkish get-up: half-kneeling, weight pressed overhead
  getup: (
    <>
      <circle cx="7" cy="13" r="1.6" />
      <line x1="7" y1="14.5" x2="9" y2="20" />
      <line x1="7" y1="14.5" x2="13" y2="14" />
      <line x1="13" y1="14" x2="14" y2="20" />
      <line x1="13" y1="14" x2="13" y2="6" />
      <line x1="13" y1="6" x2="11" y2="3" />
      <line x1="13" y1="6" x2="15" y2="3" />
      <circle cx="13" cy="3" r="1.5" />
    </>
  ),
  // Yoga / warrior pose: wide stance, arms extended
  yoga: (
    <>
      <circle cx="12" cy="5" r="1.8" />
      <line x1="12" y1="6.8" x2="12" y2="13" />
      <line x1="12" y1="9" x2="6" y2="13" />
      <line x1="6" y1="13" x2="3" y2="11" />
      <line x1="12" y1="9" x2="18" y2="13" />
      <line x1="18" y1="13" x2="21" y2="11" />
      <line x1="12" y1="13" x2="9" y2="18" />
      <line x1="9" y1="18" x2="14" y2="18" />
      <line x1="14" y1="18" x2="12" y2="13" />
    </>
  ),
  // Agility / cone drill: figure mid-cut, cones on ground
  agility: (
    <>
      <line x1="3" y1="20" x2="21" y2="20" />
      <circle cx="6" cy="20" r="0.6" />
      <circle cx="11" cy="20" r="0.6" />
      <circle cx="16" cy="20" r="0.6" />
      <circle cx="14" cy="4" r="1.6" />
      <line x1="14" y1="5.5" x2="13" y2="11" />
      <line x1="13" y1="9" x2="18" y2="7" />
      <line x1="13" y1="9" x2="9" y2="11" />
      <line x1="13" y1="11" x2="17" y2="14" />
      <line x1="13" y1="11" x2="9" y2="17" />
    </>
  ),
  // Boxing / guard stance: fist extended
  box: (
    <>
      <circle cx="11" cy="4" r="1.8" />
      <line x1="11" y1="5.8" x2="10" y2="13" />
      <line x1="11" y1="8" x2="17" y2="6" />
      <circle cx="18" cy="6" r="1.4" />
      <line x1="11" y1="9" x2="6" y2="9" />
      <circle cx="5" cy="9" r="1.4" />
      <line x1="10" y1="13" x2="13" y2="20" />
      <line x1="10" y1="13" x2="7" y2="20" />
    </>
  ),
  // Olympic clean / high-pull: bar travels from floor to shoulder
  clean: (
    <>
      <circle cx="9" cy="3.5" r="1.7" />
      <line x1="9" y1="5.3" x2="9" y2="11" />
      <line x1="9" y1="9" x2="14" y2="6" />
      <line x1="14" y1="6" x2="20" y2="4" />
      <circle cx="20" cy="4" r="1.4" />
      <line x1="9" y1="11" x2="6" y2="20" />
      <line x1="9" y1="11" x2="12" y2="20" />
    </>
  ),
  // Jerk / push-press: bar locked overhead from dip-drive
  jerk: (
    <>
      <circle cx="12" cy="9" r="1.7" />
      <line x1="12" y1="10.5" x2="12" y2="16" />
      <line x1="12" y1="11" x2="9" y2="3" />
      <line x1="12" y1="11" x2="15" y2="3" />
      <line x1="6" y1="3" x2="18" y2="3" />
      <line x1="12" y1="16" x2="9" y2="22" />
      <line x1="12" y1="16" x2="15" y2="22" />
      <line x1="9" y1="13" x2="14" y2="13" />
    </>
  ),
  // Machine isolation: seated, pad at shin/ankle
  machine: (
    <>
      <line x1="3" y1="20" x2="21" y2="20" />
      <line x1="20" y1="20" x2="20" y2="6" />
      <line x1="20" y1="6" x2="14" y2="6" />
      <line x1="14" y1="6" x2="14" y2="14" />
      <circle cx="9" cy="11" r="1.6" />
      <line x1="9" y1="12.5" x2="11" y2="20" />
      <line x1="9" y1="12.5" x2="6" y2="20" />
      <line x1="9" y1="11" x2="14" y2="14" />
      <line x1="14" y1="14" x2="11" y2="20" />
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


// ─── GOAL & COACH ICONS ─────────────────────────────────────────────────────
export const GOAL_ICONS = {
  // Person jumping (Noun Project — Ahmad Arzaha)
  health: (
    <svg width="67" height="67" viewBox="0 0 101 101" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <g transform="matrix(1,0,0,1,-215,0)"><g transform="matrix(1,0,0,1,215.18,0)"><g transform="matrix(1,0,0,1,-218.366,-3.46999)">
        <path fillRule="evenodd" clipRule="evenodd" d="M237.756,15.796C237.634,15.641 237.546,15.413 237.516,15.171C237.48,14.883 237.527,14.581 237.658,14.376C237.948,13.922 238.331,14.015 238.402,14.033C238.445,14.044 238.476,14.062 238.496,14.084C238.515,14.046 238.534,14.012 238.554,13.981C238.642,13.84 238.744,13.757 238.831,13.724C239.151,13.601 239.366,13.606 239.505,13.646C239.654,13.545 239.841,13.517 240.032,13.537C240.265,13.562 240.497,13.661 240.599,13.709C240.767,13.58 241.007,13.413 241.245,13.304C241.473,13.2 241.703,13.152 241.886,13.192C241.995,13.216 242.131,13.283 242.276,13.389C242.553,13.592 242.881,13.946 243.124,14.31C243.381,14.695 243.529,15.097 243.485,15.36C243.404,15.846 243.144,16.232 243.035,16.376C242.986,16.696 242.889,17.038 242.783,17.368C242.651,17.776 242.506,18.166 242.438,18.468C242.419,18.553 242.406,18.629 242.404,18.695C242.404,18.727 242.402,18.755 242.412,18.776C242.434,18.822 242.491,18.88 242.567,18.954C242.715,19.1 242.931,19.28 243.18,19.475C244.084,20.182 245.417,21.075 245.655,21.234C245.686,21.221 245.719,21.216 245.754,21.217C245.798,21.218 245.841,21.231 245.879,21.255C245.879,21.255 248.59,22.958 249.453,23.712C250.134,24.307 250.937,24.852 251.22,25.039C251.557,24.922 252.486,24.672 253.357,25.092C254.152,25.476 256.868,26.098 258.366,26.335C258.628,26.086 259.453,25.303 260.536,24.292C260.703,24.136 260.786,24.005 260.792,23.872C260.798,23.735 260.73,23.606 260.643,23.468C260.545,23.311 260.419,23.147 260.297,22.966C260.069,22.629 259.856,22.238 259.805,21.744C259.755,21.256 259.863,20.661 260.3,19.912C260.807,19.044 261.253,18.613 261.687,18.38C262.124,18.147 262.555,18.113 263.05,18.068C263.934,17.985 265.034,17.827 266.829,15.992C269.261,13.508 272.619,14.798 272.881,14.904C273.024,14.945 274.198,15.29 275.3,15.867C276.117,16.296 276.887,16.857 277.214,17.503C277.85,18.758 277.997,19.445 278.122,20.002C278.299,20.788 278.44,21.293 280.009,22.918C280.906,23.849 281.18,24.583 281.138,25.185C281.095,25.8 280.721,26.299 280.258,26.755C279.981,27.029 279.673,27.289 279.408,27.558C279.169,27.8 278.963,28.048 278.864,28.329C278.436,29.543 279.002,30.198 279.138,30.334C280.556,30.782 281.072,30.564 282.294,30.526C283.125,30.5 284.144,30.143 284.968,29.881C285.574,29.687 286.087,29.55 286.375,29.581C286.995,29.649 286.939,29.893 288.113,29.35C289.373,28.766 289.984,28.568 290.956,28.09C291.933,27.609 292.811,27.255 292.82,27.252C292.867,27.233 292.918,27.229 292.965,27.239C293.129,26.837 293.589,25.751 293.949,25.261C294.39,24.661 295.474,23.91 296.058,23.362C296.417,23.024 296.66,22.729 296.847,22.608C296.961,22.533 297.068,22.505 297.165,22.512C297.275,22.52 297.384,22.568 297.484,22.69C297.529,22.745 297.564,22.823 297.584,22.919C297.67,22.892 297.769,22.869 297.87,22.859C298.119,22.834 298.371,22.892 298.539,23.098C298.803,23.42 298.791,23.891 298.77,24.1C298.864,24.258 299.052,24.604 299.066,24.86C299.077,25.064 299.04,25.248 299.007,25.366C299.08,25.478 299.18,25.662 299.215,25.876C299.257,26.128 299.179,26.411 299.131,26.551C299.171,26.696 299.238,26.999 299.207,27.263C299.186,27.44 299.077,27.81 298.862,28.178C298.643,28.553 298.315,28.922 297.877,29.1C297.119,29.409 296.649,29.668 296.052,30.013C295.48,30.344 295.107,30.73 295.107,30.73C295.081,30.757 295.05,30.776 295.017,30.789C294.988,30.848 294.914,30.945 294.773,31.15C294.423,31.659 293.933,31.919 293.691,32.024C293.653,32.207 293.564,32.529 293.378,32.825C293.177,33.144 292.867,33.429 292.403,33.508C291.459,33.667 289.531,34.517 288.703,34.971C287.839,35.445 286.437,36.667 284.897,36.852C283.38,37.035 281.931,37.254 280.709,37.274C279.718,37.29 278.234,37.302 277.718,37.305C277.547,37.873 277.337,38.449 277.083,38.972C276.134,40.923 274.798,44.058 274.511,46.008C274.354,47.069 274.76,47.553 275.306,48.008C275.721,48.354 276.207,48.687 276.625,49.188C277.684,50.457 278.013,52.031 278.013,52.031C278.024,52.083 278.018,52.137 277.996,52.186C277.228,53.883 275.84,55.03 274.003,55.778C273.937,55.804 273.864,55.802 273.8,55.771C273.8,55.771 273.615,55.683 273.3,55.442C273.368,55.697 273.438,55.999 273.476,56.278C273.52,56.601 273.517,56.898 273.448,57.088C273.395,57.231 273.415,57.548 273.455,57.971C273.56,59.08 273.869,60.837 274.013,62.284C274.22,64.355 275.219,67.104 275.264,67.863C275.289,68.291 275.555,68.703 275.701,69.066C275.836,69.403 275.875,69.71 275.733,69.969C275.639,70.14 275.607,70.378 275.59,70.639C275.562,71.097 275.59,71.62 275.546,72.049C275.47,72.768 274.956,75.18 274.427,76.55C274.06,77.501 273.371,79.23 272.839,80.349C272.598,80.857 272.382,81.244 272.241,81.398C271.927,81.744 271.284,82.023 270.555,82.101C270.547,82.125 270.539,82.151 270.529,82.179C270.585,82.448 270.789,83.482 270.856,84.532C270.886,85 271.126,85.695 271.376,86.519C271.688,87.548 272.017,88.767 272.034,90.004C272.034,90.015 272.034,90.026 272.034,90.037C272.037,90.355 272.019,90.674 271.974,90.991C271.801,92.224 271.6,92.813 270.973,93.234C270.331,93.664 269.13,94.171 268.064,93.234C267.062,92.352 266.74,91.38 266.584,89.759C266.436,88.22 266.706,86.889 266.543,85.683C266.378,84.464 266.064,84.094 266.023,82.514C265.988,81.147 266.692,80.351 266.976,80.086C266.902,79.518 266.619,77.29 266.583,76.362C266.554,75.61 266.791,73.988 266.924,72.971C266.977,72.571 267.017,72.273 267.007,72.183C267.004,72.16 266.987,72.16 266.976,72.152C266.953,72.137 266.93,72.121 266.909,72.103C266.798,72.01 266.665,71.863 266.763,71.37C266.831,71.025 266.805,70.807 266.8,70.776C266.78,70.746 266.767,70.712 266.761,70.675L266.551,69.303C266.391,69.052 265.596,67.794 264.772,66.248C264.243,65.258 263.791,64.187 263.5,63.45C263.371,64.393 263.198,65.748 263.205,66.189C263.216,66.898 263.771,71.345 263.718,72.765C263.664,74.231 263.485,76.065 262.631,77.168C262.116,77.833 261.229,78.65 260.266,79.099C259.591,79.415 258.88,79.548 258.225,79.357C256.69,78.909 254.969,77.675 253.982,76.667C253.498,76.172 252.933,75.406 252.416,74.677C252.172,74.822 251.746,75.123 251.537,75.548C251.214,76.207 250.992,76.563 250.896,77.646C250.835,78.342 250.59,79.035 250.21,79.595C250.197,79.628 250.176,79.658 250.148,79.684C249.731,80.261 249.164,80.681 248.504,80.789C247.815,80.903 246.793,80.664 246.136,79.663C245.878,79.272 245.768,78.685 245.768,78.003C245.767,77.049 245.971,75.901 246.196,74.89C246.393,74.004 246.921,72.42 247.462,70.914C247.467,70.899 247.472,70.884 247.478,70.87C247.949,69.564 248.427,68.324 248.707,67.657C249.015,66.922 249.347,66.164 249.783,65.563C250.25,64.92 250.836,64.452 251.623,64.337C253.257,64.097 253.865,65.368 254.008,65.747C254.122,65.812 254.227,65.878 254.32,65.943C254.194,65.364 254.063,64.832 253.923,64.405C253.347,62.634 253.611,58.856 253.651,58.142C253.686,57.507 254.085,55.715 254.29,54.826C254.12,54.788 253.873,54.693 253.523,54.478C253.213,54.286 252.941,53.959 252.666,53.564C252.294,53.031 251.906,52.369 251.341,51.817C250.667,51.16 249.803,50.564 249.309,50.079C249.051,49.827 248.89,49.59 248.852,49.392C248.813,49.195 248.874,48.888 249.047,48.522C249.393,47.793 250.179,46.771 251.176,45.931C252.014,45.225 253.246,44.61 254.258,44.028C254.89,43.665 255.435,43.321 255.712,42.967C255.977,42.627 256.107,42.152 256.162,41.651C256.25,40.857 256.143,39.997 256.011,39.443C255.912,39.034 255.936,38.5 256.02,37.942C256.138,37.153 256.37,36.312 256.486,35.74C256.667,34.848 256.622,33.532 256.278,32.948C256.175,32.774 255.988,32.722 255.807,32.707C255.5,32.681 255.195,32.769 255.137,32.787C255.135,32.788 255.132,32.789 255.13,32.789C255.111,32.796 255.091,32.8 255.07,32.801C255.061,32.802 255.055,32.802 255.052,32.802C255.022,32.802 254.992,32.796 254.963,32.785C254.947,32.779 253.995,32.414 253.232,32.372C252.78,32.347 252.434,32.164 252.086,31.919C251.785,31.707 251.482,31.445 251.079,31.229C250.286,30.802 250.173,30.612 249.181,30.465C248.852,30.417 248.177,29.999 247.388,29.402C245.657,28.093 243.291,25.948 242.823,25.613C242.5,25.38 242.342,25.05 242.274,24.735C242.188,24.336 242.248,23.966 242.261,23.896C242.263,23.887 242.264,23.88 242.264,23.88C242.271,23.849 242.283,23.821 242.299,23.796C241.679,23.119 240.938,22.322 240.441,21.831C240.22,21.612 240.059,21.455 239.989,21.42C239.782,21.319 239.639,21.14 239.525,20.91C239.396,20.65 239.304,20.314 239.119,20.003C239.009,19.818 238.839,19.703 238.675,19.568C238.355,19.303 238.037,18.989 237.957,18.26C237.887,17.628 237.652,17.073 237.58,16.642C237.522,16.294 237.562,16.011 237.756,15.796ZM238.079,14.646C238.003,14.765 237.992,14.942 238.012,15.109C238.033,15.272 238.082,15.431 238.173,15.513C238.196,15.534 238.219,15.553 238.242,15.568C238.199,15.339 238.18,15.108 238.208,14.969C238.24,14.813 238.279,14.663 238.321,14.526C238.302,14.524 238.283,14.519 238.264,14.513C238.248,14.514 238.23,14.517 238.211,14.524C238.168,14.539 238.123,14.577 238.079,14.646ZM239.026,14.185C239.016,14.197 238.965,14.263 238.937,14.319C238.843,14.502 238.758,14.773 238.698,15.069C238.671,15.202 238.715,15.452 238.772,15.66C238.795,15.747 238.838,15.852 238.861,15.905C238.935,15.912 239.018,15.897 239.095,15.88C239.11,15.877 239.125,15.873 239.14,15.869C239.118,15.817 239.099,15.761 239.083,15.701C238.965,15.256 239.014,14.611 239.183,14.142C239.137,14.15 239.084,14.163 239.026,14.185ZM240.021,14.04C240.007,14.038 239.993,14.036 239.978,14.034C239.895,14.025 239.804,14.018 239.757,14.092C239.563,14.395 239.478,14.948 239.53,15.378C239.546,15.508 239.574,15.627 239.62,15.721C239.626,15.732 239.631,15.744 239.637,15.754C239.685,15.772 239.728,15.804 239.758,15.848C239.795,15.853 239.836,15.847 239.879,15.838C239.969,15.82 240.063,15.781 240.154,15.736C240.282,15.673 240.405,15.595 240.504,15.526C240.422,15.454 240.345,15.387 240.279,15.332C239.809,14.939 239.73,14.578 239.794,14.35C239.83,14.221 239.909,14.115 240.021,14.04ZM241.779,13.681C241.642,13.651 241.468,13.742 241.301,13.837C241.173,13.91 241.052,13.994 240.952,14.068C240.966,14.076 240.979,14.084 240.993,14.093C241.202,14.227 241.42,14.259 241.639,14.314C242.057,14.419 242.484,14.574 242.896,15.266C242.922,15.31 242.945,15.356 242.965,15.404C242.975,15.363 242.985,15.321 242.992,15.278C243.001,15.223 242.987,15.158 242.964,15.085C242.916,14.932 242.823,14.759 242.708,14.587C242.528,14.317 242.294,14.052 242.08,13.871C241.965,13.774 241.862,13.699 241.779,13.681ZM241.963,18.996C241.916,18.901 241.895,18.774 241.908,18.618C241.929,18.366 242.041,18.012 242.173,17.62C242.32,17.179 242.492,16.685 242.549,16.244C242.549,16.243 242.549,16.241 242.549,16.24C242.551,16.223 242.553,16.206 242.555,16.189C242.583,15.934 242.573,15.701 242.466,15.522C242.155,14.998 241.833,14.879 241.517,14.799C241.246,14.731 240.981,14.679 240.723,14.514C240.607,14.44 240.483,14.411 240.381,14.427C240.334,14.434 240.287,14.445 240.275,14.485C240.265,14.522 240.281,14.565 240.308,14.618C240.359,14.717 240.454,14.827 240.6,14.948C240.727,15.054 240.891,15.2 241.058,15.352C241.061,15.356 241.065,15.359 241.069,15.362C241.441,15.701 241.82,16.063 241.82,16.063C241.92,16.158 241.924,16.317 241.828,16.417C241.733,16.516 241.575,16.52 241.475,16.425C241.475,16.425 241.194,16.157 240.882,15.869C240.714,15.993 240.447,16.17 240.185,16.268C239.952,16.355 239.72,16.376 239.538,16.304C239.522,16.298 239.506,16.291 239.49,16.283C239.412,16.312 239.311,16.344 239.205,16.368C239.017,16.41 238.811,16.421 238.648,16.369C238.625,16.362 238.6,16.35 238.577,16.333C238.527,16.299 238.472,16.244 238.426,16.161C238.382,16.161 238.287,16.154 238.16,16.099C238.074,16.172 238.053,16.272 238.056,16.388C238.058,16.502 238.083,16.629 238.118,16.768C238.218,17.174 238.394,17.662 238.454,18.205C238.513,18.75 238.754,18.984 238.993,19.182C239.203,19.355 239.408,19.511 239.549,19.747C239.712,20.021 239.809,20.313 239.916,20.562C239.992,20.741 240.061,20.899 240.209,20.972C240.215,20.974 240.22,20.977 240.225,20.98C240.322,21.036 240.529,21.215 240.793,21.476C241.798,22.47 243.8,24.706 243.8,24.706C243.963,24.641 244.175,24.523 244.453,24.324C244.84,24.048 245.074,23.544 245.226,23.047C245.386,22.524 245.452,22.001 245.479,21.705C245.457,21.698 245.436,21.688 245.415,21.675C245.415,21.675 243.88,20.657 242.872,19.868C242.401,19.5 242.046,19.166 241.963,18.996ZM249.124,24.089C248.466,23.514 246.712,22.378 245.962,21.899C245.926,22.23 245.852,22.712 245.704,23.193C245.519,23.798 245.214,24.396 244.743,24.731C244.207,25.114 243.864,25.235 243.654,25.263C243.307,25.309 243.181,25.152 243.143,25.106C243.124,25.082 243.113,25.063 243.113,25.063C243.092,25.026 243.08,24.984 243.08,24.938C243.08,24.8 243.192,24.688 243.33,25.188L243.421,25.033C243.376,24.982 243.105,24.68 242.731,24.269C242.73,24.378 242.736,24.506 242.763,24.629C242.807,24.835 242.904,25.055 243.115,25.207C243.583,25.543 245.955,27.692 247.69,29.003C248.125,29.333 248.519,29.608 248.831,29.785C249.008,29.886 249.151,29.955 249.254,29.971C250.329,30.129 250.456,30.326 251.315,30.788C251.739,31.015 252.058,31.288 252.374,31.511C252.644,31.701 252.909,31.853 253.26,31.872C253.958,31.911 254.802,32.196 255.062,32.289C255.209,32.25 255.529,32.182 255.849,32.209C256.186,32.237 256.518,32.37 256.708,32.694C257.096,33.352 257.18,34.834 256.976,35.839C256.861,36.405 256.631,37.236 256.514,38.016C256.442,38.503 256.411,38.969 256.497,39.327C256.64,39.923 256.754,40.851 256.659,41.706C256.593,42.305 256.423,42.868 256.106,43.274C255.8,43.666 255.207,44.06 254.507,44.462C253.52,45.029 252.315,45.624 251.498,46.313C250.564,47.1 249.823,48.054 249.499,48.736C249.386,48.975 249.317,49.168 249.342,49.296C249.357,49.371 249.414,49.45 249.489,49.54C249.589,49.66 249.725,49.789 249.882,49.927C250.388,50.371 251.109,50.893 251.69,51.459C252.28,52.035 252.688,52.722 253.076,53.278C253.307,53.609 253.526,53.892 253.786,54.052C254.099,54.245 254.32,54.317 254.407,54.34C254.583,53.684 254.856,53.002 254.866,52.977C254.866,52.977 254.87,52.967 254.872,52.964L255.377,51.883C254.689,51.488 253.631,50.893 252.782,50.464C251.416,49.774 249.786,49.319 249.786,49.319C249.653,49.282 249.576,49.144 249.613,49.011C249.65,48.878 249.788,48.8 249.921,48.838C249.921,48.838 251.6,49.307 253.007,50.018C253.943,50.491 255.129,51.163 255.807,51.554C255.82,51.56 255.832,51.568 255.844,51.575C256.041,51.689 256.192,51.776 256.275,51.825C256.587,51.781 257.935,51.529 260.534,50.196C261.698,49.599 262.355,48.497 262.759,47.246C263.393,45.285 263.411,42.959 263.661,41.478C264.089,38.947 266.223,37.115 267.206,35.885C267.57,35.43 267.79,34.792 267.929,34.142C268.146,33.127 268.162,32.078 268.167,31.582C268.171,31.215 268.011,30.916 267.801,30.616C267.558,30.268 267.248,29.921 266.986,29.499C266.828,29.247 266.695,28.954 266.586,28.666C266.578,28.649 266.571,28.63 266.565,28.612C266.311,27.926 266.189,27.28 266.189,27.28C266.163,27.144 266.253,27.014 266.388,26.988C266.474,26.972 266.557,27.002 266.614,27.06C266.631,26.895 266.649,26.734 266.666,26.588C266.555,26.599 266.325,26.632 266.092,26.722C265.893,26.799 265.687,26.917 265.567,27.115C265.428,27.343 265.355,27.806 265.292,28.349C265.19,29.235 265.142,30.321 265.029,31.047C264.943,31.6 264.908,32.024 264.894,32.316C265.378,31.962 266.197,31.408 266.824,31.21C267.896,30.872 268.097,31.267 268.127,31.324C268.258,31.573 267.909,31.699 267.909,31.699C267.824,31.699 267.748,31.655 267.703,31.589C267.681,31.584 267.615,31.569 267.549,31.57C267.417,31.573 267.232,31.606 266.974,31.687C266.099,31.963 264.826,32.993 264.799,33.015C264.76,33.047 264.712,33.066 264.661,33.07C264.579,33.076 264.499,33.042 264.448,32.978C264.416,32.939 264.397,32.891 264.393,32.84C264.393,32.84 264.342,32.214 264.535,30.97C264.666,30.126 264.709,28.795 264.853,27.861C264.871,27.742 264.891,27.629 264.913,27.523C264.625,27.613 264.018,27.775 263.566,27.723C263.429,27.707 263.258,27.641 263.065,27.54C262.823,27.412 262.535,27.227 262.226,27.05C261.764,26.785 261.252,26.526 260.781,26.581C260.316,26.635 260.178,26.722 260.045,26.791C259.871,26.881 259.705,26.957 259.124,26.93C258.961,26.922 258.724,26.894 258.436,26.85C258.42,26.848 258.405,26.846 258.389,26.843C256.858,26.605 253.975,25.946 253.139,25.543C252.264,25.12 251.315,25.535 251.291,25.546C251.214,25.58 251.125,25.573 251.054,25.528C251.054,25.528 251.054,25.528 251.053,25.527C251.02,25.506 249.978,24.835 249.124,24.089ZM260.877,24.658C260.063,25.417 259.395,26.048 259.003,26.42C259.056,26.425 259.104,26.428 259.147,26.43C259.663,26.454 259.739,26.384 259.91,26.298C260.058,26.223 260.26,26.139 260.723,26.084C261.291,26.018 261.918,26.297 262.475,26.616C262.778,26.79 263.06,26.972 263.298,27.097C263.425,27.164 263.534,27.215 263.624,27.226C264.144,27.287 264.906,27 264.906,27C264.96,26.979 265.017,26.98 265.068,26.996C265.091,26.943 265.114,26.896 265.139,26.855C265.319,26.56 265.615,26.37 265.912,26.256C266.282,26.113 266.644,26.087 266.713,26.084C266.721,26.083 266.73,26.083 266.732,26.083C266.741,26.019 266.748,25.968 266.753,25.933C266.718,25.807 266.691,25.698 266.671,25.61C266.608,25.631 266.537,25.647 266.454,25.656C266.274,25.676 266.133,25.611 266.005,25.454C265.851,25.265 265.715,24.856 265.332,24.364C265.015,23.955 264.931,23.559 264.983,23.222C265.094,22.488 265.866,22.011 266.533,22.162C266.588,21.853 266.663,21.529 266.765,21.193C267.433,18.979 269.336,17.594 270.338,17.406C271.349,17.215 273.373,17.754 274.28,18.738C274.647,19.136 274.888,19.823 275.033,20.509C275.235,21.461 275.263,22.403 275.264,22.458L275.264,22.461C275.266,22.496 275.276,22.89 275.223,23.46C275.352,23.463 275.517,23.481 275.678,23.537C275.932,23.625 276.172,23.801 276.278,24.13C276.373,24.427 276.288,24.824 276.098,25.219C275.848,25.739 275.432,26.262 275.196,26.507C274.866,26.848 274.481,26.813 274.252,26.747C274.001,27.217 273.726,27.665 273.437,28.059C273.665,28.272 274.092,28.68 274.511,29.13C274.918,29.183 276.665,29.438 278.368,30.061C278.189,29.634 278.096,29.004 278.393,28.162C278.625,27.505 279.323,26.976 279.907,26.399C280.279,26.032 280.604,25.645 280.639,25.15C280.674,24.644 280.404,24.048 279.649,23.266C277.958,21.514 277.825,20.959 277.634,20.112C277.515,19.581 277.374,18.926 276.768,17.728C276.48,17.16 275.786,16.687 275.068,16.31C273.948,15.724 272.75,15.386 272.732,15.381C272.721,15.378 272.711,15.374 272.701,15.37C272.663,15.354 269.473,14.006 267.187,16.342C265.249,18.323 264.051,18.477 263.096,18.565C262.671,18.605 262.298,18.621 261.923,18.821C261.545,19.023 261.172,19.41 260.732,20.164C260.38,20.767 260.269,21.246 260.299,21.646C260.343,22.252 260.7,22.666 260.953,23.031C261.177,23.353 261.325,23.652 261.285,23.962C261.258,24.177 261.145,24.408 260.877,24.658ZM282.309,31.026C280.854,31.071 280.352,31.348 278.342,30.585C277.087,30.109 275.784,29.842 275.025,29.713C275.239,29.974 275.423,30.228 275.538,30.446C276.016,31.354 276.526,32.139 276.526,32.139C276.588,32.234 276.577,32.361 276.5,32.445C276.486,32.46 276.47,32.473 276.452,32.485C276.357,32.547 276.23,32.536 276.146,32.459L274.946,31.349C274.925,31.605 274.851,31.913 274.669,32.243C274.473,32.599 274.287,32.759 274.081,32.898C273.83,33.069 273.539,33.198 273.123,33.765C272.854,34.131 272.737,34.597 272.714,35.101C272.677,35.905 272.881,36.803 273.157,37.58C273.447,38.399 273.794,39.538 273.938,40.601C274.037,41.338 274.037,42.041 273.868,42.588C273.664,43.248 272.874,44.221 272.141,45.365C271.451,46.443 270.81,47.684 270.859,48.969C270.959,51.559 271.695,53.08 272.57,54.064C273.229,54.804 273.728,55.148 273.926,55.269C275.553,54.584 276.799,53.56 277.505,52.056C277.427,51.739 277.085,50.519 276.241,49.508C275.844,49.033 275.38,48.721 274.985,48.392C274.316,47.834 273.824,47.238 274.016,45.935C274.309,43.945 275.665,40.745 276.633,38.753C276.899,38.206 277.114,37.599 277.287,37.007C277.29,36.994 277.294,36.981 277.298,36.968C277.747,35.408 277.9,33.959 277.9,33.959C277.915,33.821 278.038,33.722 278.175,33.736C278.312,33.751 278.412,33.874 278.397,34.011C278.397,34.011 278.258,35.318 277.86,36.804C278.47,36.8 279.793,36.789 280.7,36.774C281.908,36.755 283.339,36.536 284.837,36.356C285.555,36.269 286.238,35.934 286.844,35.57C287.482,35.185 288.038,34.766 288.463,34.533C289.325,34.06 291.337,33.181 292.319,33.015C292.625,32.963 292.823,32.768 292.955,32.558C293.154,32.243 293.21,31.888 293.22,31.82L293.221,31.813C293.232,31.715 293.301,31.632 293.395,31.603C293.395,31.603 293.981,31.419 294.361,30.867C294.425,30.774 294.481,30.693 294.518,30.639C294.455,30.546 294.349,30.363 294.255,30.058C294.039,29.36 293.154,28.194 292.835,27.786C292.535,27.911 291.882,28.191 291.176,28.538C290.201,29.018 289.588,29.218 288.323,29.804C286.97,30.43 287.036,30.157 286.321,30.079C286.074,30.052 285.64,30.191 285.12,30.357C284.255,30.633 283.182,30.999 282.309,31.026ZM294.352,25.557C293.93,26.131 293.369,27.575 293.369,27.575C293.361,27.593 293.352,27.611 293.341,27.627C293.738,28.15 294.524,29.237 294.733,29.91C294.782,30.071 294.831,30.182 294.874,30.261C295.042,30.107 295.371,29.83 295.802,29.58C296.418,29.223 296.905,28.956 297.689,28.637C298.022,28.501 298.263,28.211 298.43,27.926C298.6,27.634 298.694,27.344 298.71,27.205C298.732,27.02 298.685,26.81 298.654,26.698C298.494,26.708 298.215,26.731 297.934,26.784C297.674,26.833 297.41,26.901 297.259,27.024C297.204,27.068 297.161,27.112 297.131,27.156C297.113,27.183 297.096,27.206 297.101,27.23C297.108,27.262 297.144,27.281 297.186,27.305C297.359,27.401 297.654,27.448 298.069,27.438C298.207,27.435 298.322,27.544 298.325,27.682C298.328,27.82 298.219,27.935 298.081,27.938C297.603,27.949 297.252,27.885 297.025,27.783C296.817,27.689 296.695,27.558 296.639,27.421C296.586,27.291 296.586,27.14 296.657,26.985C296.498,26.929 296.342,26.833 296.238,26.685C296.213,26.649 296.193,26.613 296.177,26.576C296.112,26.591 296.04,26.581 295.98,26.542C295.865,26.466 295.833,26.311 295.909,26.195C296.04,25.996 296.055,25.714 296.095,25.441C296.15,25.071 296.241,24.717 296.5,24.48C296.732,24.266 296.953,23.811 297.054,23.43C297.085,23.31 297.105,23.198 297.105,23.104C297.105,23.086 297.103,23.064 297.1,23.045C297.069,23.067 297.03,23.097 296.999,23.127C296.952,23.17 296.902,23.221 296.848,23.277C296.722,23.406 296.575,23.561 296.4,23.726C295.834,24.257 294.779,24.976 294.352,25.557ZM298.152,23.414C298.096,23.345 298.003,23.348 297.919,23.356C297.77,23.371 297.627,23.43 297.56,23.46C297.502,23.719 297.389,24.014 297.25,24.276C297.575,24.116 297.92,24.003 298.288,23.946C298.297,23.797 298.284,23.575 298.152,23.414ZM298.567,24.887C298.559,24.741 298.467,24.559 298.394,24.435C297.794,24.523 297.266,24.784 296.786,25.16C296.744,25.193 296.694,25.21 296.644,25.212C296.62,25.309 296.605,25.411 296.59,25.513C296.822,25.44 297.186,25.336 297.626,25.247C298.064,25.158 298.362,25.141 298.545,25.144C298.56,25.069 298.571,24.978 298.567,24.887ZM298.722,25.958C298.702,25.835 298.638,25.717 298.592,25.645C298.442,25.639 298.164,25.648 297.725,25.737C297.272,25.828 296.906,25.936 296.692,26.005C296.663,26.033 296.627,26.062 296.585,26.092L296.777,26.002C296.777,26.002 296.682,26.123 296.645,26.245C296.629,26.294 296.614,26.35 296.647,26.397C296.688,26.456 296.754,26.488 296.818,26.511C296.907,26.543 296.996,26.554 297.056,26.558C297.204,26.468 297.395,26.397 297.6,26.345C298.033,26.235 298.527,26.203 298.712,26.195C298.727,26.117 298.735,26.033 298.722,25.958ZM272.436,54.657C272.359,54.575 272.279,54.489 272.196,54.396C271.266,53.351 270.465,51.741 270.36,48.988C270.307,47.603 270.976,46.258 271.72,45.095C272.423,43.998 273.194,43.074 273.39,42.44C273.541,41.952 273.531,41.325 273.442,40.668C273.304,39.64 272.967,38.539 272.685,37.747C272.389,36.911 272.175,35.944 272.214,35.078C272.242,34.47 272.396,33.91 272.719,33.47C272.791,33.372 272.859,33.286 272.925,33.209C272.899,33.127 272.868,33.009 272.836,32.844C272.813,32.728 272.753,32.597 272.682,32.472C272.656,32.525 272.626,32.578 272.591,32.63C272.051,33.433 270.846,33.829 269.932,33.713C269.402,33.645 268.913,33.32 268.596,33.06C268.56,33.438 268.504,33.845 268.418,34.247C268.262,34.976 268.005,35.687 267.597,36.198C266.65,37.381 264.566,39.125 264.154,41.561C263.9,43.06 263.876,45.415 263.235,47.4C262.789,48.78 262.047,49.982 260.762,50.641C257.636,52.244 256.238,52.332 256.238,52.332C256.188,52.335 256.138,52.324 256.094,52.298C256.094,52.298 255.99,52.237 255.812,52.133L255.436,52.936C256.158,53.22 258.337,54.027 259.803,54.027C261.636,54.027 262.845,54.021 264.681,54.354C265.619,54.524 266.068,54.717 266.479,54.892C266.861,55.055 267.209,55.202 267.942,55.298C269.122,55.453 271.479,54.901 272.436,54.657ZM272.978,56.916C273.027,56.782 273.012,56.573 272.981,56.347C272.916,55.876 272.756,55.34 272.682,55.108C271.788,55.336 269.161,55.962 267.877,55.794C267.078,55.689 266.699,55.529 266.283,55.352C265.896,55.187 265.474,55.006 264.592,54.846C262.79,54.519 261.603,54.527 259.803,54.527C258.267,54.527 255.978,53.684 255.24,53.396C255.132,53.685 254.951,54.197 254.843,54.658C254.679,55.355 254.189,57.474 254.15,58.17C254.112,58.863 253.839,62.531 254.399,64.25C254.965,65.988 255.391,69.479 255.949,70.76C256.479,71.975 257.253,72.555 257.253,72.555C257.364,72.637 257.387,72.793 257.305,72.904C257.223,73.015 257.067,73.039 256.956,72.957C256.956,72.957 256.082,72.316 255.491,70.96C255.125,70.12 254.813,68.338 254.482,66.713C254.376,66.611 254.095,66.361 253.684,66.139C253.546,66.065 253.418,65.981 253.289,65.907C253.134,65.819 252.977,65.745 252.779,65.746C252.541,65.748 252.256,65.855 251.864,66.125C250.813,66.847 250.44,67.933 250.493,69.185C250.547,70.47 250.972,71.932 251.527,72.595C251.794,72.914 252.211,73.524 252.676,74.185C252.688,74.2 252.699,74.216 252.71,74.233C253.243,74.989 253.836,75.802 254.34,76.317C255.276,77.275 256.908,78.452 258.365,78.877C258.908,79.036 259.495,78.908 260.055,78.646C260.943,78.231 261.76,77.476 262.236,76.862C263.033,75.833 263.168,74.114 263.219,72.746C263.271,71.332 262.716,66.904 262.705,66.197C262.694,65.522 263.092,62.755 263.137,62.441C263.119,62.303 262.926,61.268 261.027,59.838C258.945,58.271 258.106,58.198 258.106,58.198C257.968,58.189 257.863,58.071 257.872,57.933C257.881,57.795 258,57.69 258.137,57.699C258.137,57.699 259.069,57.738 261.328,59.439C262.333,60.195 262.9,60.863 263.221,61.376C263.125,60.847 262.869,60.179 262.236,59.584C260.831,58.263 260.394,57.863 260.394,57.863C260.292,57.77 260.285,57.612 260.378,57.51C260.472,57.408 260.63,57.401 260.732,57.494C260.732,57.494 261.17,57.895 262.579,59.22C263.578,60.16 263.763,61.259 263.773,61.898C264.161,61.628 264.816,61.154 265.873,60.338C267.168,59.339 268.149,58.814 268.801,58.562C269.287,58.375 269.613,58.335 269.771,58.355C269.907,58.372 270.005,58.497 269.988,58.634C269.97,58.771 269.845,58.868 269.709,58.851C269.589,58.836 269.348,58.887 268.981,59.028C268.356,59.27 267.419,59.777 266.179,60.734C264.702,61.873 263.992,62.361 263.693,62.554C263.886,63.082 264.474,64.627 265.213,66.013C266.125,67.723 267,69.077 267,69.077C267.019,69.107 267.032,69.14 267.037,69.175L267.248,70.55C267.298,70.654 267.365,70.906 267.253,71.467C267.238,71.544 267.23,71.606 267.229,71.656C267.228,71.681 267.232,71.711 267.234,71.722C267.257,71.738 267.354,71.806 267.397,71.859C267.447,71.92 267.49,72.001 267.504,72.127C267.504,72.13 267.504,72.133 267.505,72.136C267.514,72.25 267.479,72.588 267.42,73.036C267.29,74.028 267.054,75.609 267.083,76.343C267.12,77.298 267.422,79.644 267.48,80.083C267.484,80.089 267.489,80.095 267.494,80.101C267.504,80.111 267.513,80.122 267.523,80.133C267.795,80.445 268.648,81.357 269.469,81.547C269.749,81.611 270.037,81.634 270.314,81.623C270.338,81.62 270.363,81.619 270.388,81.62C271.027,81.58 271.599,81.361 271.871,81.062C271.995,80.926 272.175,80.581 272.388,80.135C272.915,79.026 273.597,77.312 273.96,76.37C274.474,75.039 274.975,72.696 275.048,71.997C275.067,71.817 275.072,71.621 275.075,71.419C274.714,71.625 273.878,72.073 273.259,72.19C273.124,72.215 272.993,72.126 272.967,71.99C272.942,71.855 273.031,71.724 273.167,71.698C273.909,71.559 274.991,70.89 274.991,70.89C275.019,70.872 275.05,70.861 275.081,70.856C275.083,70.772 275.086,70.689 275.091,70.608C275.113,70.263 275.171,69.953 275.295,69.728C275.334,69.656 275.33,69.575 275.312,69.488C275.285,69.356 275.224,69.215 275.156,69.066C274.99,68.703 274.789,68.302 274.765,67.893C274.721,67.136 273.722,64.397 273.516,62.333C273.371,60.886 273.062,59.127 272.957,58.018C272.907,57.49 272.913,57.095 272.978,56.916ZM270.357,84.564C270.321,83.991 270.242,83.423 270.17,82.99C270.029,83.241 269.85,83.495 269.631,83.699C269.411,83.903 269.045,84.012 268.654,83.983C268.094,83.94 267.496,83.618 267.272,82.971C267.055,82.342 267.038,81.346 267.051,80.753C266.799,81.093 266.501,81.673 266.523,82.501C266.564,84.055 266.876,84.418 267.038,85.616C267.202,86.828 266.933,88.165 267.082,89.711C267.091,89.809 267.101,89.904 267.112,89.996C268.535,89.395 269.911,89.119 271.522,89.66C271.457,88.594 271.167,87.554 270.898,86.664C270.634,85.794 270.389,85.059 270.357,84.564ZM271.479,90.921C271.513,90.68 271.53,90.437 271.534,90.194C269.931,89.601 268.586,89.9 267.183,90.51C267.352,91.519 267.667,92.219 268.395,92.859C269.237,93.599 270.187,93.159 270.695,92.818C271.218,92.467 271.335,91.952 271.479,90.921ZM266.827,70.809C266.917,70.905 267.008,70.887 267.008,70.887C266.937,70.887 266.873,70.857 266.827,70.809ZM251.088,75.328C251.335,74.824 251.827,74.458 252.129,74.27C251.73,73.703 251.379,73.197 251.144,72.916C250.538,72.193 250.053,70.606 249.993,69.206C249.933,67.773 250.378,66.539 251.581,65.713C252.089,65.364 252.467,65.249 252.775,65.247C252.916,65.245 253.043,65.269 253.162,65.308C252.878,65 252.416,64.726 251.695,64.831C251.047,64.926 250.573,65.326 250.188,65.856C249.773,66.429 249.461,67.151 249.168,67.85C248.891,68.512 248.414,69.744 247.947,71.039C247.467,72.905 246.99,74.793 246.881,76.378C246.878,76.425 246.875,76.471 246.873,76.518C248.176,76.406 249.388,76.585 250.432,77.28C250.549,76.35 250.773,75.972 251.088,75.328ZM249.807,79.318C250.094,78.891 250.288,78.369 250.37,77.838C250.35,77.831 250.331,77.82 250.314,77.807C249.314,77.071 248.132,76.903 246.858,77.021C246.858,77.766 246.964,78.419 247.234,78.936C247.474,79.397 247.946,79.641 248.439,79.699C248.937,79.757 249.463,79.629 249.807,79.318ZM248.422,80.296C248.533,80.278 248.639,80.249 248.742,80.211C248.621,80.214 248.5,80.209 248.38,80.195C247.726,80.118 247.109,79.779 246.79,79.167C246.462,78.538 246.34,77.727 246.361,76.8C246.361,76.793 246.362,76.786 246.362,76.779C246.362,76.765 246.363,76.752 246.363,76.739C246.304,77.178 246.267,77.607 246.268,78.002C246.268,78.57 246.339,79.063 246.554,79.389C247.075,80.182 247.877,80.386 248.422,80.296ZM254.399,54.371C254.39,54.375 254.383,54.378 254.382,54.379C254.331,54.413 254.305,54.451 254.296,54.489C254.313,54.465 254.339,54.459 254.37,54.487C254.379,54.449 254.389,54.41 254.399,54.371ZM242.574,24.096C242.555,24.123 242.534,24.151 242.509,24.181L242.591,24.115C242.586,24.109 242.58,24.103 242.574,24.096ZM238.291,15.784C238.29,15.79 238.29,15.797 238.291,15.803C238.293,15.804 238.295,15.806 238.297,15.808C238.295,15.8 238.293,15.792 238.291,15.784ZM268.667,31.587C268.665,31.791 268.661,32.084 268.643,32.429C268.792,32.586 269.355,33.135 269.996,33.217C270.742,33.312 271.735,33.008 272.176,32.352C272.351,32.091 272.318,31.826 272.238,31.618C272.127,32.017 272.097,32.143 272.091,32.171C272.04,32.391 271.846,32.372 271.846,32.372C271.708,32.372 271.596,32.26 271.596,32.122C271.596,32.104 271.597,32.086 271.601,32.07C271.601,32.069 271.602,32.065 271.604,32.059C271.613,32.02 271.666,31.799 271.908,30.943C271.908,30.941 271.909,30.939 271.909,30.937C271.947,30.805 271.989,30.658 272.035,30.494C272.185,29.972 272.315,29.518 272.418,29.158C272.097,29.407 271.775,29.564 271.467,29.604C270.945,29.673 270.03,29.429 269.173,28.983C268.317,28.538 267.524,27.896 267.218,27.216C267.184,27.139 267.151,27.064 267.12,26.99C267.062,27.524 267.015,28.137 267.053,28.495C267.151,28.751 267.27,29.01 267.41,29.234C267.668,29.648 267.972,29.988 268.211,30.33C268.483,30.718 268.672,31.111 268.667,31.587ZM267.113,25.278C267.113,25.278 267.148,25.494 267.248,25.845C267.248,25.847 267.249,25.85 267.249,25.852C267.336,26.155 267.471,26.559 267.674,27.011C267.942,27.606 268.654,28.15 269.404,28.539C270.153,28.929 270.946,29.168 271.402,29.109C271.749,29.063 272.107,28.81 272.465,28.445C272.551,28.357 272.637,28.263 272.722,28.162C272.727,28.156 272.733,28.15 272.738,28.144C272.79,28.082 272.842,28.018 272.893,27.952C272.9,27.942 272.908,27.932 272.916,27.923C273.34,27.372 273.74,26.69 274.076,25.987C274.829,24.409 274.765,22.493 274.765,22.476L274.765,22.473C274.765,22.473 274.742,21.548 274.544,20.612C274.419,20.021 274.229,19.42 273.913,19.077C273.111,18.208 271.324,17.728 270.431,17.897C269.529,18.067 267.845,19.343 267.243,21.338C266.57,23.569 267.104,25.241 267.104,25.241C267.108,25.253 267.111,25.266 267.113,25.278ZM265.727,24.057C266.01,24.421 266.163,24.74 266.286,24.965C266.316,25.021 266.344,25.07 266.372,25.11C266.384,25.127 266.403,25.148 266.412,25.158C266.471,25.15 266.52,25.13 266.555,25.111C266.461,24.683 266.325,23.8 266.459,22.659C266.046,22.53 265.547,22.834 265.477,23.297C265.443,23.523 265.514,23.783 265.727,24.057ZM275.165,23.958C275.069,24.638 274.884,25.456 274.527,26.202C274.513,26.231 274.499,26.26 274.485,26.289C274.589,26.3 274.72,26.28 274.836,26.159C275.049,25.939 275.423,25.469 275.647,25.002C275.774,24.739 275.865,24.48 275.802,24.282C275.737,24.082 275.559,24.011 275.406,23.98C275.317,23.962 275.233,23.957 275.165,23.958ZM274.187,29.506C273.791,29.08 273.377,28.685 273.138,28.463C273.067,28.709 272.836,29.512 272.516,30.631C272.484,30.745 272.453,30.851 272.426,30.949C272.499,31.044 272.601,31.194 272.68,31.378C272.728,31.489 272.767,31.613 272.788,31.744C272.913,31.91 273.257,32.391 273.327,32.747C273.33,32.767 273.334,32.785 273.338,32.803C273.457,32.707 273.566,32.636 273.669,32.571C273.874,32.439 274.047,32.336 274.231,32.001C274.593,31.344 274.401,30.809 274.401,30.809C274.367,30.72 274.386,30.62 274.45,30.55C274.477,30.522 274.509,30.5 274.545,30.486C274.634,30.452 274.734,30.472 274.804,30.536L275.23,30.93C275.185,30.848 275.14,30.764 275.095,30.679C274.924,30.354 274.592,29.948 274.238,29.562C274.22,29.545 274.202,29.526 274.187,29.506ZM269.356,82.034C268.688,81.88 267.996,81.309 267.546,80.873C267.536,81.429 267.558,82.266 267.745,82.808C267.897,83.248 268.311,83.455 268.692,83.484C268.929,83.502 269.158,83.456 269.291,83.332C269.669,82.981 269.904,82.453 270.023,82.12C269.801,82.112 269.577,82.085 269.356,82.034ZM269.837,51.752C269.951,51.675 270.107,51.706 270.183,51.821C270.26,51.935 270.229,52.091 270.114,52.167C270.114,52.167 269.544,52.549 268.874,52.796C268.396,52.972 267.868,53.072 267.443,52.958C267.31,52.922 267.231,52.784 267.267,52.651C267.303,52.518 267.441,52.439 267.574,52.475C267.909,52.566 268.323,52.465 268.701,52.326C269.315,52.1 269.837,51.752 269.837,51.752ZM264.191,52.922C262.111,51.483 260.857,52.009 260.857,52.009C260.731,52.065 260.583,52.009 260.527,51.883C260.471,51.757 260.527,51.609 260.653,51.552C260.653,51.552 262.104,50.87 264.475,52.511C266.635,54.006 269.341,53.967 269.341,53.967C269.479,53.965 269.592,54.076 269.594,54.214C269.596,54.351 269.486,54.465 269.348,54.467C269.348,54.467 266.481,54.506 264.191,52.922Z"/>
      </g></g></g>
    </svg>
  ),
  // Fortitude figure (Noun Project — Jagat Kreasi)
  strength: (
    <svg width="56" height="56" viewBox="-5 -10 110 110" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="m72.941 72.195c-9.4844 12.375-22.414 25.047-31.258 27.652-0.082032 0.023438-0.16797 0.035156-0.25391 0.03125-2.3477-0.10547-5.4023-1.4414-8.8281-3.6992-7.6992-5.0781-17.426-14.816-25.395-24.656-8.332-10.285-7.0586-19.773-2.293-24.586 14.195-14.34 35.887-3.4453 38.266 14.895 3.0625-1.5195 6.9102-2.7461 11.613-3.4688 5.5586-0.85547 10.742-5.3906 13.383-8.1641l-1.918-2.2383c-2.0391 0.98828-3.6875-0.67578-4.1133-1.168-0.42578-0.28516-0.78516-0.76172-1.043-1.3438-0.25781-0.57812-0.41797-1.2578-0.48437-1.8672-1.6602-0.30859-2.4609-0.97656-2.832-1.707-0.13672-0.27344-0.21875-0.56641-0.25781-0.87109-0.27344 0.27734-0.56641 0.48828-0.875 0.64453-1.6211 0.81641-3.6523 0.097656-4.5352-1.6953-0.4375-0.88281-1.9805-7.8086-1.9805-7.8086-0.003907-0.019531-0.007813-0.039062-0.011719-0.058593-0.097656-0.69922 0.11328-1.5273 0.58594-2.2734l-2.5742-3.0039c-3.3086 2.4766-6.2266 4.1289-8.0312 4.582-1.1719 0.29688-1.9961 0.074219-2.4219-0.40234l-5.7656-6.4648c-0.25391-0.28516-0.39844-0.6875-0.35938-1.2109 0.039062-0.48047 0.25391-1.125 0.66406-1.8867 0.4375-0.80469 1.1016-1.7773 1.9531-2.8633-0.97656-1.0977-2.5547-2.8789-3.0312-3.4141-0.21094-0.23438-0.33594-0.55859-0.30078-0.98438 0.027344-0.33984 0.17188-0.79297 0.45703-1.3242 0.88672-1.6445 3.2227-4.332 6.2617-7.043 3.0352-2.7109 5.9727-4.7227 7.707-5.418 0.5625-0.22266 1.0273-0.31641 1.3672-0.30469 0.42969 0.015625 0.73828 0.17578 0.94531 0.41016l3.043 3.4102c1.1758-0.73047 2.2188-1.2812 3.0742-1.6211 0.80078-0.32031 1.4648-0.46094 1.9492-0.44531 0.52344 0.019531 0.90625 0.20703 1.1602 0.49609l5.7656 6.4609c0.42969 0.48438 0.55078 1.3438 0.10938 2.4961-0.6875 1.7852-2.7422 4.5781-5.6758 7.6523l3.8672 4.5117c1.2461-0.46094 2.1328-0.53125 5.0742-1.4414 0.81641-0.25 1.75-0.19531 2.7617 0.15625 1.3281 0.46094 2.8242 1.4492 4.3516 2.8164 5.3672 4.8008 11.258 14.316 12.441 20.535 1.918-1.1016 3.5586-1.8203 4.7266-2.0742 1.207-0.26172 2.043-0.011719 2.4531 0.48828l5.5 6.6875c0.24609 0.29688 0.37109 0.70312 0.3125 1.2266-0.058594 0.48047-0.30078 1.1133-0.73828 1.8555-0.46875 0.79297-1.1758 1.7383-2.0742 2.793l2.9023 3.5234c0.19922 0.24219 0.3125 0.57422 0.26172 1-0.042968 0.33594-0.20703 0.78125-0.51172 1.3047-0.95313 1.6055-3.3945 4.1992-6.5352 6.7852-3.1445 2.5859-6.1602 4.4844-7.918 5.1055-0.57031 0.20312-1.043 0.27734-1.3828 0.25-0.42578-0.03125-0.72656-0.20312-0.92578-0.44531-0.45703-0.55469-1.9727-2.3906-2.9102-3.5234-1.2031 0.67969-2.2656 1.1836-3.1289 1.4922-0.8125 0.28516-1.4844 0.40234-1.9648 0.36719-0.24219-0.019531-0.44922-0.074218-0.62891-0.15234zm-31.238-9.5703c-1.8281-17.445-22.301-28.105-35.684-14.59-4.3672 4.4102-5.2383 13.078 2.3984 22.508 6.7461 8.3281 14.758 16.59 21.699 21.934 4.4258 3.4102 8.375 5.6484 11.254 5.8359 8.6758-2.6406 21.227-15.145 30.461-27.23l-4.9062-5.9648c-0.40625-0.49219-0.5-1.3438-0.027343-2.457 0.72656-1.7109 2.8047-4.3438 5.7578-7.2305l-3.4609-4.0391c-2.8438 2.9492-8.3242 7.6172-14.164 8.5117-5.0352 0.77344-9.043 2.1406-12.129 3.8359-7.7852 4.2852-9.6172 10.645-6.9023 14.453-3.1953-3.2266-2.8828-10.234 4.9531-15.117 0.24609-0.15234 0.49609-0.30078 0.75-0.44922zm25.828-15.574 2.2773 2.6562c0.003906 0.007813 0.007812 0.011719 0.011718 0.015625 0 0 4.5 5.2539 4.5039 5.2539l0.56641 0.66406c0.10938-0.019531 0.37109-0.070313 0.57031-0.15625 0.90234-0.375 2.1016-1.2109 3.2031-2.1562 1.1055-0.94531 2.1172-2 2.625-2.8359 0.11328-0.18359 0.20703-0.43359 0.24219-0.53906 0 0-0.45312-0.53125-0.45703-0.53516l-5.2734-6.1523c-0.32031 0.11719-0.71094 0.21875-1.1719 0.32812-1.543 0.35938-4.0039 0.9375-7.0977 3.457zm-8.0039-8.5352c-0.13281 0.46484-0.30078 0.97266-0.39844 1.4727-0.082031 0.41797-0.12891 0.83203 0.050782 1.1836 0.23828 0.47266 0.83594 0.75781 1.9609 0.91797 0.57812-0.44531 2.0508-1.5547 3.875-2.75 2.3594-1.5391 6.3398-2.7695 8.043-2.2656-2.1719 0.51562-4.8477 2.0234-7.0391 3.4492-1.7891 1.168-3.2578 2.2812-3.8672 2.75 0.035156 0.48828 0.16016 1.0625 0.37109 1.543 0.13672 0.30078 0.28516 0.57422 0.51172 0.69531 0.097656 0.054687 0.18359 0.12891 0.25 0.21875 0 0 1.293 1.7852 2.8633 0.44922 3.5508-3.0312 6.3789-3.6953 8.125-4.1055 0.57422-0.13672 1.0078-0.19922 1.2539-0.38672 0.32812-0.25391 0.80078-0.20703 1.0703 0.10938l5.2031 6.0742c0.78125-0.54297 1.5391-1.043 2.2656-1.5-0.8125-5.8984-6.7266-15.473-12.043-20.23-1.3477-1.207-2.6523-2.0977-3.8242-2.5078-0.65625-0.22656-1.2617-0.30078-1.7891-0.13672-3.2539 1.0039-3.9258 0.94922-5.4648 1.5977-0.78516 0.32812-1.7969 0.84375-3.5 1.7734-0.58594 0.32031-1.3555 1.1602-1.7695 2.0547-0.22656 0.48438-0.36719 0.98828-0.18359 1.4141 0.17187 0.39453 0.61328 0.65625 1.3672 0.80859 0.52344-0.40625 1.7109-1.3008 3.2188-2.1992 1.3711-0.82031 3.3789-1.5859 5.0742-0.59766-3.4531 0.96484-6.8828 3.6602-7.4883 4.1484-0.41406 0.67969-0.75781 1.5195-0.85156 2.332-0.070312 0.62109-0.007812 1.2266 0.35547 1.6875 0.23438 0.30078 0.59766 0.52734 1.0977 0.66797 0.10156 0.03125 0.21094 0.058594 0.32812 0.078125 0.82031-0.71094 3.3242-2.8203 6.1602-4.5039 1.6523-0.98437 4.0508-1.3516 5.3438-0.63281-4.2109 0.87891-9.5625 5.4922-10.57 6.3906zm-7.2422-8.2227c-0.03125 0.039062-0.0625 0.078125-0.09375 0.11719-0.35156 0.45703-0.57812 0.98047-0.52734 1.4297 0.11328 0.51172 1.4531 6.6172 1.8516 7.4258 0.47656 0.97266 1.5547 1.4336 2.4336 0.98828 0.55078-0.27734 0.98828-0.875 1.2148-1.8164-2.3672-1.1016-2.2344-3.8281-1.2617-5.9414-1.0156-0.34766-1.5742-0.92188-1.8398-1.543-0.21875-0.5-0.25-1.0664-0.14453-1.6445-0.63672 0.10156-1.2031 0.48828-1.6094 0.96094l-0.023438 0.023438zm-3.4414-5.0508 2.918 3.4023c0.76562-0.61328 1.7383-0.99219 2.7812-0.91016 0.59375-0.99609 1.4766-1.8633 2.1562-2.2344 1.1523-0.62891 2-1.0781 2.6797-1.4062 0 0-4.0195-4.6875-4.0234-4.6914l-0.58594-0.68359c-0.10156 0.015625-0.37891 0.066406-0.58594 0.14844-0.90625 0.36328-2.1055 1.1992-3.207 2.1406-1.1016 0.94531-2.1094 2-2.6094 2.8438-0.11328 0.19141-0.20313 0.45313-0.23438 0.55469 0 0 0.71094 0.83203 0.71094 0.83594zm-9.9961 4.707c0.019532 0.023437 0.058594 0.011719 0.097656 0.019531 0.066407 0.007812 0.13672 0.007812 0.21484 0.003906 0.35938-0.019531 0.8125-0.14453 1.3398-0.34766 1.6797-0.64062 4.0117-2.0547 6.6172-4.0039l-0.24219-0.28516c-0.33984-0.39453-0.43359-1.0078-0.11328-1.7617 0.42969-1.0156 1.7266-2.4844 3.1992-3.75 1.4766-1.2656 3.125-2.3164 4.1992-2.5898 0.79297-0.19922 1.3828-0.011719 1.7227 0.38281l0.10547 0.125c2.2969-2.418 4.0234-4.6289 4.8867-6.2578 0.27344-0.51953 0.45703-0.96484 0.51953-1.332 0.015625-0.082032 0.023438-0.15234 0.023438-0.22266 0-0.042969 0.015625-0.082032-0.007813-0.10547-0.015625-0.019531-0.050781-0.011719-0.082031-0.015625-0.058594-0.007813-0.12109-0.011719-0.1875-0.011719-0.33203 0.011719-0.74219 0.11328-1.2227 0.28906-2.625 0.94922-6.9844 3.9102-11.473 7.9141-4.4883 4-7.9258 7.9961-9.168 10.5-0.22656 0.45703-0.37891 0.85156-0.42578 1.1758-0.007812 0.070313-0.011718 0.13281-0.011718 0.1875 0 0.035157-0.011719 0.066407 0.007812 0.085938zm-3.0977-10.863c-0.95703 1.1719-1.6914 2.2227-2.1523 3.082-0.24219 0.44531-0.40625 0.82812-0.46484 1.1406-0.015624 0.074218-0.015624 0.17578-0.015624 0.21484l4.4492 4.9922c0.085938-0.22656 0.1875-0.46094 0.3125-0.71094 1.293-2.6094 4.8477-6.7969 9.5273-10.969 4.6797-4.1758 9.2461-7.2305 11.984-8.2188 0.26172-0.09375 0.50781-0.16797 0.74219-0.22656l-4.4531-4.9922c-0.039063-0.003907-0.14453-0.011719-0.21484-0.007813-0.32031 0.023437-0.71875 0.14453-1.1875 0.33203-0.91016 0.36328-2.0391 0.97266-3.3164 1.793-0.039063 0.03125-0.082032 0.058594-0.12891 0.082031-2.3086 1.4883-5.0898 3.6289-7.9414 6.1719-2.8555 2.5469-5.3047 5.0703-7.0469 7.1953-0.027344 0.042968-0.058594 0.082031-0.09375 0.12109zm13.547-14.336-2.7695-3.1055c-0.12891 0.023438-0.43359 0.085938-0.67969 0.18359-1.6328 0.65234-4.3828 2.5781-7.25 5.1328-2.8633 2.5547-5.0898 5.0664-5.9219 6.6172-0.125 0.23438-0.22266 0.52734-0.26172 0.65625 0.54297 0.60547 1.8516 2.082 2.7656 3.1094 1.7422-2.0469 4.0352-4.3867 6.6719-6.7383 2.6328-2.3477 5.2148-4.3594 7.4453-5.8555zm42.18 40.168c-0.019531-0.027344-0.0625-0.015625-0.10547-0.023438-0.066406-0.011719-0.14062-0.015625-0.21875-0.011719-0.375 0.007813-0.84375 0.12109-1.3984 0.30859-1.1875 0.41016-2.6992 1.1758-4.4102 2.2227-0.023438 0.015626-0.050781 0.03125-0.074219 0.042969-0.78125 0.48047-1.6016 1.0156-2.4492 1.6055 0.31641 0.38672 0.40234 0.98828 0.074219 1.7266-0.44531 1.0039-1.7422 2.4609-3.2148 3.7227-1.4727 1.2617-3.1133 2.3203-4.168 2.6055-0.79688 0.21484-1.3867 0.027343-1.7188-0.35938l-0.12109-0.14062c-2.3203 2.2773-4.0781 4.3672-4.9688 5.9258-0.28125 0.49219-0.47266 0.91797-0.54688 1.2734-0.019531 0.074219-0.027344 0.14453-0.03125 0.21094 0 0.039062-0.015625 0.074218 0.003906 0.10156 0.019532 0.019532 0.050782 0.011719 0.082032 0.019532 0.058593 0.007812 0.12109 0.015624 0.1875 0.015624 0.33203 0.003907 0.74609-0.082031 1.2305-0.23828 2.6641-0.84375 7.1367-3.6289 11.781-7.4492 4.6445-3.8203 8.2422-7.6758 9.582-10.125 0.24219-0.44922 0.41016-0.83984 0.46875-1.1641 0.011718-0.066406 0.019531-0.12891 0.019531-0.1875 0-0.03125 0.015625-0.0625-0.003907-0.082031zm2.6562 10.984c1.0039-1.1367 1.7812-2.1562 2.2812-3 0.25781-0.4375 0.4375-0.8125 0.50781-1.1211 0.015625-0.074219 0.023437-0.17578 0.023437-0.21484l-4.2461-5.1641c-0.09375 0.21875-0.20703 0.45312-0.33984 0.69531-1.3984 2.5547-5.1172 6.6016-9.957 10.582-4.8398 3.9844-9.5273 6.8555-12.301 7.7344-0.26562 0.082032-0.51562 0.14844-0.75 0.19922l4.0664 4.9414c0.007812 0.007812 0.011719 0.015624 0.019531 0.023437l0.16016 0.19531c0.042969 0.007812 0.14453 0.023437 0.21875 0.019531 0.31641-0.011719 0.71875-0.11328 1.1992-0.28516 0.91797-0.32422 2.0664-0.89062 3.375-1.6523 0.042969-0.03125 0.085937-0.054688 0.13281-0.078125 2.3672-1.3945 5.2344-3.4258 8.1875-5.8594 2.9531-2.4258 5.4961-4.8477 7.3203-6.8984 0.03125-0.042969 0.066406-0.082031 0.10156-0.11719zm-14.109 13.781c0.875 1.0625 2.1328 2.582 2.6523 3.2109 0.12891-0.019531 0.43359-0.070312 0.68359-0.15625 1.6602-0.58984 4.4844-2.4023 7.4492-4.8398s5.2891-4.8633 6.1836-6.375c0.13672-0.23047 0.24219-0.51953 0.28516-0.64453l-2.6445-3.2148c-1.8203 1.9766-4.2031 4.2188-6.9297 6.4609s-5.3906 4.1523-7.6797 5.5586z"/>
    </svg>
  ),
  // Weight loss figure (Noun Project — Olena Panasovska)
  fat_loss: (
    <svg width="56" height="56" viewBox="0 0 60000 60000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="nonzero" d="M11417.39 1717.55c-49.18,-214.87 85.13,-428.94 300,-478.12 214.87,-49.18 428.94,85.13 478.12,300 492.14,2141.18 1389.71,6682.78 1697.2,10604.84 200.5,2557.51 148.23,4870.99 -428.78,6145.8 -756.03,1670.33 -1946.89,3110.78 -3146.33,4561.58 -135.67,164.11 -271.44,328.38 -406.66,493.07 3430.39,2204.64 7470.04,3808.49 11915.8,4485.94 4081.31,621.9 8504.71,462.91 13112.99,-728.24 -81.78,-1022.31 -226.42,-2036.43 -460.74,-3037.83 -314.23,-1342.94 -667.7,-2610.05 -1021.14,-3877.12 -1231.91,-4416.29 -2463.58,-8832.93 -1905.18,-15593.21 -605.23,185.41 -1301.68,337.81 -2104.9,454.16 -218.32,31.06 -420.5,-120.74 -451.56,-339.06 -31.06,-218.32 120.74,-420.5 339.06,-451.56 1817.22,-263.24 3024.72,-709.46 3835.36,-1302.41 780.71,-571.06 1197.45,-1290.58 1447.24,-2120.51 62.99,-211.42 285.45,-331.74 496.87,-268.75 211.42,62.99 331.74,285.45 268.75,496.87 -297.02,986.85 -797.53,1846.05 -1740.98,2536.15 -355.06,259.71 -772.13,493.62 -1264.24,699.21 -621.3,6822.52 613.46,11249.66 1848.34,15676.61 359.8,1289.87 719.63,2579.78 1030.5,3908.36 813.22,3475.38 585.36,7041.17 359.33,10578.42l-24.09 377.71c-355.81,5602.04 -1448.8,11756.04 -2498.18,17664.62 -406.16,2286.93 -805.89,4537.56 -1139.49,6609.95 -34.51,217.46 -238.79,365.76 -456.25,331.25 -217.46,-34.51 -365.76,-238.79 -331.25,-456.25 355.09,-2205.91 744.16,-4396.51 1139.49,-6622.45 655.03,-3688.2 1327.09,-7472.27 1824.64,-11147.8 -56.38,-28.37 -106.83,-70.57 -145.8,-125.71 -1177.05,-1662.19 -2689.82,-2940.64 -4380.74,-3810.09 -1968.17,-1011.99 -4177.57,-1467.88 -6379.43,-1328.01 -2202.64,139.92 -4396.53,875.61 -6332.65,2246.64 -1651.99,1169.82 -3119.41,2804.87 -4248.96,4930.33 1132.83,2003.93 2239.05,8780.51 2939.8,13073.91 188.25,1153.34 346.91,2125.38 467.9,2772.24 40.55,216.6 -102.15,425.08 -318.75,465.63 -216.6,40.55 -425.08,-102.15 -465.63,-318.75 -121.44,-649.29 -281.32,-1628.81 -471.02,-2791 -714.78,-4379.39 -1857.98,-11382.9 -2928.27,-12944.21 -8,-10.52 -15.46,-21.39 -22.34,-32.58 -606.4,-863.35 -1309.34,-1594.95 -2012.28,-2326.49 -2076.6,-2161.12 -4153.21,-4322.32 -4203.08,-10015.6l-0.09 -3.15c-62.71,-3668.37 2017.16,-6184.16 4072.01,-8669.67 1165.66,-1409.95 2322.99,-2809.84 3033.83,-4380.32 514.04,-1135.68 551.31,-3315.11 360.02,-5755.18 -304.24,-3880.65 -1191.81,-8372.01 -1678.44,-10489.22zm42554.03 27359.74l-5103.34 0 0 1769.58c0,220.91 -179.09,400 -400,400 -100.78,0 -192.85,-37.28 -263.19,-98.8l-5487.02 -4326.3c-173.45,-136.34 -203.52,-387.49 -67.18,-560.94 21.73,-27.64 46.38,-51.63 73.16,-71.9l5497.35 -4334.45c173.45,-136.34 424.6,-106.27 560.94,67.18 57.59,73.27 85.49,160.4 85.43,246.88l0.51 0 0 1769.58 5103.34 0c220.91,0 400,179.09 400,400l0 4339.17c0,220.91 -179.09,400 -400,400zm-5503.34 -800l5103.34 0 0 -3539.17 -5103.34 0c-220.91,0 -400,-179.09 -400,-400l0 -1345.48 -4458.13 3515.07 4458.13 3515.06 0 -1345.48c0,-220.91 179.09,-400 400,-400zm-14814.42 -22432.87l-26.37 -142.33c-28.82,-158.68 -56.66,-317.35 -83.63,-476.35l-26.68 -160.87 -789.52 129.02c18.02,109.47 36.42,218.81 55.21,328.15l28.54 162.53 29.14 161.46 26.71 144.23 786.6 -145.84zm3455.66 29829.33c164.65,-209.91 329.53,-419.63 494.07,-629.62l-629.78 -493.32c-164.4,209.81 -329.16,419.35 -493.67,629.08l629.38 493.86zm1955.64 -2556.99c137.67,-193.66 272.33,-388.47 404.03,-586.25l56.67 -85.99 -669.48 -437.94c-143.76,218.96 -292.04,433.96 -443.8,647.44l652.58 462.74zm1607.4 -2880.9l12.98 -35.9 17.65 -49.86 17.34 -49.99 16.98 -50.11 16.65 -50.22 16.31 -50.36 15.96 -50.47 15.61 -50.59 15.25 -50.7 14.91 -50.84 14.56 -51 14.19 -51.11 13.84 -51.21 13.5 -51.41 13.12 -51.52 15.51 -63.06 -778.68 -183.46 -12.77 51.8 -11.7 45.94 -12.02 45.79 -12.36 45.75 -12.67 45.61 -13 45.5 -13.31 45.42 -13.65 45.34 -13.95 45.25 -14.28 45.15 -14.59 45.08 -14.93 45.02 -15.24 44.95 -15.56 44.89 -15.89 44.86 -12.98 35.9 753.22 269.56zm424.72 -3317.21l-4.71 -58.36 -5.33 -61.45 -5.74 -61.77 -6.14 -62.02 -6.54 -62.3 -6.95 -62.61 -7.35 -62.86 -7.75 -63.18 -8.16 -63.51 -8.57 -63.78 -8.97 -64.06 -9.38 -64.44 -11.2 -73.66 -790.02 126.02 9.9 65.16 8.74 60 8.35 59.7 7.97 59.32 7.58 58.95 7.19 58.62 6.81 58.3 6.43 57.91 6.04 57.6 5.68 57.28 5.28 56.89 4.91 56.63 4.71 58.36 797.22 -66.74zm-670.63 -3211.53l-29.2 -93.19 -24.92 -78.38 -25.34 -78.83 -25.78 -79.29 -26.22 -79.77 -26.66 -80.21 -27.08 -80.66 -27.54 -81.15 -41.44 -120.56 -755.62 262.76 39.88 116 26.72 78.79 26.3 78.32 25.86 77.79 25.4 77.29 24.98 76.79 24.52 76.31 24.1 75.82 28.38 90.55 763.66 -238.38zm-1124.89 -3034.52c-103.46,-247.72 -208.49,-494.61 -315.18,-740.96l-733.92 318.36c105.31,243.15 208.97,486.86 311.08,731.36l738.02 -308.76zm-1307.75 -2937.55c-109.17,-242.61 -226.26,-484.67 -339.27,-725.8l-724.32 339.66c112.66,240.44 229.41,481.76 338.27,723.66l725.32 -337.52zm-1349.29 -2897.69c-109.86,-241.49 -218.82,-483.37 -326.27,-725.95l-731.64 323.6c108.57,245.07 218.63,489.45 329.63,733.43l728.28 -331.08zm-1243.39 -2923.09c-95.38,-246.1 -188.46,-493.03 -278.97,-740.96l-751.9 273.2c92.27,253.12 187.41,505.22 284.77,756.42l746.1 -288.66zm-1017.2 -2995.29c-73.07,-253.05 -143.48,-506.92 -210.39,-761.67l-774.02 202.2c68.54,261.07 140.69,521.23 215.57,780.55l768.84 -221.08zm-111.91 31225.44c230.74,-1825.61 413.2,-3619.11 523.45,-5354.96l24.09 -377.71c90.94,-1423.07 182.15,-2850.84 204.31,-4271.57 -4657.46,1178.87 -9381.06,1259.42 -13781.65,558.99 -4987.41,-793.82 -9561.14,-2591.91 -13154.23,-4931.55 -992.51,1529.99 -1695.77,3205.89 -1661.14,5231.82l0.01 3.93c45.87,5378.62 2013.6,7426.43 3981.28,9474.2 588.22,612.15 1176.44,1224.34 1723.48,1927.55 1162.3,-2067.79 2642.46,-3678.55 4301.69,-4853.51 2063.01,-1460.89 4398.61,-2244.65 6742.03,-2393.52 2344.2,-148.92 4697.54,337.02 6795.05,1415.51 1629.63,837.93 3105.01,2034.81 4301.63,3570.82zm756.42 -10830.29c-2.4,-467.88 -13.75,-934.74 -36.61,-1400.16 -4665.66,1185.32 -9145.74,1337.88 -13283.85,707.31 -4593.15,-699.91 -8765.21,-2364.7 -12302.83,-4652.86 -298.81,374.48 -590.33,753.25 -866.86,1139.8 3503.43,2278 7963.26,4029.01 12828.93,4803.45 4361.17,694.15 9047.25,602.91 13661.22,-597.54z"/>
    </svg>
  ),
  // Abs / muscle figure (Noun Project — shashank singh)
  muscle_gain: (
    <svg width="56" height="56" viewBox="-5 -10 110 110" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="m68.949 44.32-0.62891 1.8984c-0.96094 2.8594-3.6289 4.7812-6.6406 4.7812h-7.6914c-1.6406 0-3.0781-0.80078-3.9883-2.0195-0.91016 1.2188-2.3516 2.0195-3.9883 2.0195h-7.6914c-3.0195 0-5.6914-1.9219-6.6406-4.7891l-0.62891-1.8984c-0.17188-0.51953 0.10938-1.0898 0.62891-1.2695 0.53125-0.17188 1.0898 0.10938 1.2617 0.62891l0.62891 1.8984c0.67969 2.0391 2.5898 3.4219 4.7383 3.4219h7.6914c1.6484 0 2.9883-1.3398 2.9883-2.9883v-2.0039c0-0.55078 0.44922-1 1-1s1 0.44922 1 1v2.0117c0 1.6484 1.3398 2.9883 2.9883 2.9883h7.6914c2.1602 0 4.0586-1.3711 4.7383-3.4219l0.62891-1.8984c0.17188-0.51953 0.73828-0.80859 1.2617-0.62891 0.54297 0.17969 0.82422 0.73828 0.65234 1.2695zm-2.6289 14.73c-0.53125-0.17188-1.0898 0.10938-1.2617 0.62891l-0.62891 1.8984c-0.69141 2.0508-2.6016 3.4219-4.75 3.4219h-5.6914c-1.6484 0-2.9883-1.3398-2.9883-2.9883v-2.0117c0-0.55078-0.44922-1-1-1s-1 0.44922-1 1v2.0117c0 1.6484-1.3398 2.9883-2.9883 2.9883h-5.6914c-2.1602 0-4.0586-1.3711-4.7383-3.4219l-0.62891-1.8984c-0.17188-0.51953-0.73828-0.80859-1.2617-0.62891-0.51953 0.17188-0.80859 0.73828-0.62891 1.2695l0.62891 1.8984c0.94922 2.8594 3.6211 4.7891 6.6406 4.7891h5.6914c1.6406 0 3.0781-0.80078 3.9883-2.0195 0.89844 1.2109 2.3398 2.0117 3.9766 2.0117h5.6914c3.0195 0 5.6914-1.9219 6.6406-4.7891l0.62891-1.8984c0.17188-0.52344-0.10938-1.082-0.62891-1.2617zm-2 16c-0.53125-0.17188-1.0898 0.10938-1.2617 0.62891l-0.62891 1.8984c-0.69141 2.0508-2.6016 3.4219-4.75 3.4219h-3.6914c-1.6484 0-2.9883-1.3398-2.9883-2.9883v-2.0117c0-0.55078-0.44922-1-1-1s-1 0.44922-1 1v2.0117c0 1.6484-1.3398 2.9883-2.9883 2.9883h-3.6914c-2.1602 0-4.0586-1.3711-4.7383-3.4219l-0.62891-1.8984c-0.17188-0.51953-0.73828-0.80859-1.2617-0.62891-0.51953 0.17188-0.80859 0.73828-0.62891 1.2695l0.62891 1.8984c0.94922 2.8594 3.6211 4.7891 6.6406 4.7891h3.6914c1.6406 0 3.0781-0.80078 3.9883-2.0195 0.89844 1.2109 2.3398 2.0117 3.9766 2.0117h3.6914c3.0195 0 5.6914-1.9219 6.6406-4.7891l0.62891-1.8984c0.17188-0.52344-0.10938-1.082-0.62891-1.2617zm-31.531-42.051c4.8516 0 9.3516-2.4102 12.039-6.4492 0.30859-0.46094 0.17969-1.0781-0.28125-1.3906-0.46094-0.30859-1.0781-0.17969-1.3906 0.28125-2.3047 3.4805-6.1875 5.5586-10.367 5.5586h-4.4609c-4.75 0-9.0312-2.6406-11.16-6.8984l-0.85156-1.7109c-0.85547-1.7188-1.3164-3.6406-1.3164-5.5703v-6.8203c0-0.55078-0.44922-1-1-1s-1 0.44922-1 1v6.8203c0 2.2305 0.53125 4.4688 1.5312 6.4688l0.84766 1.7109c0.82031 1.6406 1.9219 3.0703 3.2188 4.25 1.1094 2.0703 2.1016 3.9492 2.9219 6 2.8789 7.25 3.1406 15.84 3.3711 23.422 0.28906 9.5508 0.19922 20.711-2.7188 31.059-0.14844 0.53125 0.16016 1.0781 0.69141 1.2305 0.089844 0.03125 0.17969 0.039062 0.26953 0.039062 0.44141 0 0.83984-0.28906 0.96094-0.73047 3-10.609 3.1016-21.961 2.8008-31.66-0.23828-7.7383-0.51172-16.52-3.5117-24.09-0.39844-1-0.83984-1.9805-1.3203-2.9414 1.918 0.91016 4.0391 1.4219 6.2656 1.4219zm53.211-24c-0.55078 0-1 0.44922-1 1v6.8203c0 1.9297-0.46094 3.8516-1.3203 5.5781l-0.85156 1.7109c-2.1289 4.25-6.3984 6.8984-11.16 6.8984h-4.4609c-4.1797 0-8.0586-2.0781-10.379-5.5508-0.30859-0.46094-0.92969-0.58984-1.3906-0.28125-0.46094 0.30859-0.57812 0.92969-0.28125 1.3906 2.7031 4.0234 7.2031 6.4336 12.055 6.4336h4.4609c2.25 0 4.4102-0.51953 6.3398-1.4609-0.53906 1.0898-1.0508 2.2188-1.5117 3.3984-2.9102 7.5117-3.1719 16.219-3.4102 23.91-0.28906 9.6289-0.19141 20.891 2.7109 31.422 0.12109 0.44141 0.51953 0.73047 0.96094 0.73047 0.089843 0 0.17969-0.011719 0.26953-0.039062 0.53125-0.14844 0.83984-0.69922 0.69922-1.2305-2.8398-10.27-2.9297-21.34-2.6406-30.82 0.23047-7.5195 0.48047-16.051 3.2695-23.238 0.87109-2.2383 1.9688-4.3281 3.0312-6.3516 0.019531-0.03125 0.019531-0.070312 0.03125-0.10156 1.2812-1.1797 2.3711-2.5898 3.1797-4.2188l0.85156-1.7109c1-2 1.5312-4.2383 1.5312-6.4688l-0.003906-6.8203c0.019531-0.55078-0.42969-1-0.98047-1zm-58 14h2c0.55078 0 1-0.44922 1-1s-0.44922-1-1-1h-2c-0.55078 0-1 0.44922-1 1s0.44922 1 1 1zm42 0h2c0.55078 0 1-0.44922 1-1s-0.44922-1-1-1h-2c-0.55078 0-1 0.44922-1 1s0.44922 1 1 1z"/>
    </svg>
  ),
  // Fitness runner (Noun Project — Md Moniruzzaman)
  endurance: (
    <svg width="67" height="67" viewBox="0 0 200 200" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M147.80375,63.39489c-.57324-1.83789-2.249-2.95068-4.59668-3.05371a2.9783,2.9783,0,0,0-2.34668,1.40039c-.042.05029-.082.1001-.123.14844-2.623,1.02539-2.26758,4.70117-2.03809,6.3291-.95508,1.688-3.24414,3.61963-5.542,5.39648-2.042-4.62451-3.97266-8.81543-5.44922-10.83154a.86339.86339,0,0,0-.07715-.09277c-.09082-.09766-.18164-.18652-.27246-.2749l-.11426-.1123a1.00043,1.00043,0,0,0-1.28418-.10986c-4.94434,3.49268-13.54,3.09521-16.72168-.771a1.00019,1.00019,0,0,0-1.123-.30078c-.64551.2417-15.86328,5.95117-21.0498,8.64746a7.34984,7.34984,0,0,0-2.82031,2.5957c-2.12451,3.39893-5.78027,9.50342-6.58984,11.04492a8.37654,8.37654,0,0,0-2.41357,6.53027,1.54132,1.54132,0,0,0,.41309.81543,8.59918,8.59918,0,0,0,4.47461,2.48291,3.20583,3.20583,0,0,0,3.20361-1.17139l1.07861-1.37988c1.91846-1.45166,1.1167-4.37939.59668-5.90576.94824-1.50586,3.854-5.81592,5.15771-7.64209a147.31006,147.31006,0,0,1,14.18262-4.02148,18.81887,18.81887,0,0,1-.208,1.876c-.043.28223-.07324.49951-.08105.62354a27.991,27.991,0,0,0,.44531,5.62549c.14941,1.00537.30469,2.04492.3877,3.07959a12.31385,12.31385,0,0,1-1.08105,6.68945c-7.1875,2.62939-10.502,7.66748-9.85645,14.98389-2.97949,4.1748-5.5166,9.43164-7.95605,16.46875a2.56663,2.56663,0,0,1-2.07812,1.44336c-5.55566,1.42188-8.97852,2.88184-11.16406,4.79883a79.57889,79.57889,0,0,1-10.10937,9.249,2.99618,2.99618,0,0,0-.48584.002,2.40994,2.40994,0,0,1-.45264.01465,10.98414,10.98414,0,0,0-5.12061-1.05859,3.43558,3.43558,0,0,0-2.84717,2.21582,7.36518,7.36518,0,0,0-.42578,5.31445,24.16088,24.16088,0,0,0-.606,13.72852,4.14657,4.14657,0,0,0,.3252.91016,3.70538,3.70538,0,0,0,1.8584,1.7627,3.27653,3.27653,0,0,0,1.30225.2793,3.11253,3.11253,0,0,0,1.80078-.58789,3.52761,3.52761,0,0,0,1.4292-2.93945l-.03418-2.2998a23.30711,23.30711,0,0,1,5.75781-7.5127,1.6,1.6,0,0,0,.41162-.6377,218.32643,218.32643,0,0,1,24.76172-12.88477.947.947,0,0,0,.1582-.085l.24316-.16113c.4082-.27051.80273-.53125,1.21-.80566a1.07221,1.07221,0,0,0,.13672-.11035l1.76953-1.7041c5.88379-5.63086,11.45508-10.96191,14.44434-16.45117.89063.21094,1.77832.43945,2.666.667a46.57876,46.57876,0,0,0,8.668,1.64746l.498.0332c1.66406.10938,3.23633.21387,4.82813.46094.1582.02441.86621.2041,1.49121.3623,1.07422.27246,1.90332.47949,2.55176.627a25.532,25.532,0,0,0-4.39746,11.28223A28.4096,28.4096,0,0,1,120.5,139.89587a1.45223,1.45223,0,0,0-.541.39453,2.43268,2.43268,0,0,1-.22852.22266,10.92471,10.92471,0,0,0-3.2334,4.06445,3.1016,3.1016,0,0,0,.19043,2.63281,8.63233,8.63233,0,0,0,4.81348,3.61035c3.877,4.10547,7.9082,6.69531,12.00391,7.70215a3.83811,3.83811,0,0,0,3.36719-.751,3.077,3.077,0,0,0,1.10938-2.89551,3.51232,3.51232,0,0,0-1.96973-2.61426l-2.07129-1.01367a23.246,23.246,0,0,1-4.09375-8.501,1.61425,1.61425,0,0,0-.46191-.7666,5.91544,5.91544,0,0,1,.50293-1.46777c4.93359-8.24121,9.958-16.80469,12.44531-23.03711.01563-.0459.03223-.10254.05176-.18164a.96345.96345,0,0,0,.02734-.15723c.32324-3.55664-.52539-6.08887-2.59375-7.74219a.85932.85932,0,0,0-.09668-.06836l-1.96875-1.22168c-6.4248-4.001-12.51367-7.793-19.53516-9.3877A62.07852,62.07852,0,0,0,123.74321,82.786a3.46259,3.46259,0,0,0,2.5625-.916,3.64211,3.64211,0,0,0,.85938-1.12891,15.88174,15.88174,0,0,0,2.79395,2.24268c2.63477,1.58838,4.28418.60449,6.02637-.74268a26.30679,26.30679,0,0,0,4.76855-5.00391,38.27707,38.27707,0,0,0,2.334-3.43359c.31445-.50879.61133-1.02344.9082-1.53906l.24609-.42627c.08984-.16406.19434-.40137.30566-.6626a7.26024,7.26024,0,0,1,.42285-.89551C147.30766,68.58776,148.5,65.69518,147.80375,63.39489ZM57.47221,154.69177a1.00346,1.00346,0,0,0-.084.416l.03711,2.51563a1.52649,1.52649,0,0,1-.58154,1.2793,1.09556,1.09556,0,0,1-1.17236.10156,1.7143,1.7143,0,0,1-.85059-.82129,2.1054,2.1054,0,0,1-.16357-.46191,22.15827,22.15827,0,0,1,.63721-12.87012,1.00083,1.00083,0,0,0,.03516-.57031,5.61974,5.61974,0,0,1,.29346-4.47266,1.41277,1.41277,0,0,1,1.165-.90332c.13428-.01172.272-.01855.41406-.01855a10.17607,10.17607,0,0,1,3.75.93848c.03528.01428.07092.01923.10638.03113a23.56187,23.56187,0,0,0,2.14313,7.02057A24.393,24.393,0,0,0,57.47221,154.69177Zm75.062-2.00391a1.00132,1.00132,0,0,0,.33105.26074l2.26465,1.1084a1.51808,1.51808,0,0,1,.873,1.11328,1.10008,1.10008,0,0,1-.42383,1.0752,1.8943,1.8943,0,0,1-1.61523.33105c-3.76074-.92578-7.52734-3.39062-11.19434-7.32715a.99337.99337,0,0,0-.49512-.29,6.8728,6.8728,0,0,1-3.81055-2.668,1.10128,1.10128,0,0,1-.10645-.98047,9.0949,9.0949,0,0,1,2.67969-3.2832c.07227-.0625.13379-.11914.18945-.17285.02155-.00348.03931-.01837.06055-.02325a14.66,14.66,0,0,0,6.71,1.72137A24.75116,24.75116,0,0,0,132.53422,152.68786ZM143.795,68.662A3.96571,3.96571,0,0,0,142.709,70.3905c-.08105.18945-.15332.36377-.208.46436l-.2373.41113c-.28711.49854-.57422.99609-.88184,1.49512a36.48008,36.48008,0,0,1-2.22266,3.269,24.37282,24.37282,0,0,1-4.40332,4.63379c-1.62109,1.25293-2.31152,1.48145-3.75684.61133a19.68119,19.68119,0,0,1-4.06738-3.68457A.99986.99986,0,0,0,125.3145,78.743a1.3098,1.3098,0,0,1-.34375,1.6377,1.23153,1.23153,0,0,1-1.43555.28271,1.00051,1.00051,0,0,0-1.55957.65332,60.26858,60.26858,0,0,1-6.12891,17.6582,1.00125,1.00125,0,0,0,.708,1.44141c7.20508,1.33008,13.48828,5.24316,20.14258,9.38672l1.917,1.18945c1.47266,1.20508,2.05078,3.07129,1.81445,5.86133-2.42676,6.04492-7.38477,14.49316-12.28418,22.67969a8.03722,8.03722,0,0,0-.70667,1.99878,12.64019,12.64019,0,0,1-4.81891-1.27563,29.78188,29.78188,0,0,0,3.94452-9.90381,22.62352,22.62352,0,0,1,5.02051-11.6543c.01465-.0166.03027-.0332.04492-.05176a.99927.99927,0,0,0-.9873-1.62207c-.59375-.05566-2.68359-.585-3.71387-.84668-.93555-.2373-1.43457-.3623-1.6748-.40039-1.68066-.26074-3.37012-.37207-5.00488-.48047l-.501-.0332a45.0847,45.0847,0,0,1-8.2998-1.58789c-1.15527-.29687-2.31055-.59375-3.47266-.85352a.99762.99762,0,0,0-1.11133.52637c-2.72852,5.42871-8.40039,10.85645-14.41113,16.60742l-1.708,1.64453c-.377.25391-.74414.49707-1.124.748l-.168.11133A220.23843,220.23843,0,0,0,64.7,145.33679a21.41319,21.41319,0,0,1-1.59973-5.3175.99158.99158,0,0,0,.30408-.141,78.341,78.341,0,0,0,10.73535-9.72949c1.8457-1.61328,5.11133-2.98047,10.24414-4.29492A4.43891,4.43891,0,0,0,87.877,123.1527c2.44531-7.05273,4.96191-12.22852,7.91895-16.28906a1.0012,1.0012,0,0,0,.18555-.69434c-.71875-6.78809,2.09473-11.0459,8.85645-13.39941a.9961.9961,0,0,0,.541-.45215,13.9557,13.9557,0,0,0,1.50781-8.15137c-.08887-1.106-.249-2.17969-.4043-3.21777a26.15669,26.15669,0,0,1-.42578-5.2168c.00586-.083.03125-.23877.06152-.43945a7.80688,7.80688,0,0,0-.00977-3.8208.99909.99909,0,0,0-1.13965-.55713A152.43231,152.43231,0,0,0,89.19926,75.3612a1.00054,1.00054,0,0,0-.47266.35449c-1.26367,1.74463-5.04687,7.34473-5.68506,8.4502a1.00055,1.00055,0,0,0-.07568.83594c.812,2.27588.875,3.66455.1875,4.12744a1.01589,1.01589,0,0,0-.22949.21387l-1.16455,1.49023a1.18564,1.18564,0,0,1-1.18408.45605,6.67415,6.67415,0,0,1-3.36768-1.80322,6.4997,6.4997,0,0,1,2.01514-4.82715.9999.9999,0,0,0,.15479-.22461c.62354-1.23828,4.44482-7.61865,6.563-11.00732a5.34226,5.34226,0,0,1,2.0498-1.88428c4.48926-2.3335,17.20313-7.17822,20.19238-8.30859,3.93555,3.96338,12.55664,4.47852,18.165,1.09424a92.73828,92.73828,0,0,1,5.49023,11.25586,1.001,1.001,0,0,0,1.52051.395c3.041-2.30566,6.1084-4.75684,7.27539-7.14307a1.00438,1.00438,0,0,0,.09082-.58643c-.41113-2.76562-.127-4.25049.86816-4.54053a1.00135,1.00135,0,0,0,.45215-.27832c.11816-.12646.2373-.27.35938-.41846a2.944,2.944,0,0,1,.71289-.67334,2.75754,2.75754,0,0,1,2.77441,1.64258C146.33207,65.43591,145.41215,67.49108,143.795,68.662Zm-13.67871,48.67725.00684-.00781-.00488.00586Z"/>
      <path fillRule="evenodd" d="M115.12211,52.53356a1,1,0,1,0-.46875-1.94434c-2.61328.63232-5.041.08447-5.5293-1.24219a2.67849,2.67849,0,0,1,.75-2.48486,8.87832,8.87832,0,0,1,3.80273-2.5459,10.49894,10.49894,0,0,1,1.83691-.49609,1.00052,1.00052,0,0,0,.8291-.93408l.01758-.34033c.84766-1.3584,3.38867-1.80713,5.60254-1.63672a8.12363,8.12363,0,0,1,5.48047,2.77734c.01074.01367.02539.03125.041.04932,1.11035,1.89063,2.19824,4.30371.97461,6.36279a.99838.99838,0,0,0-.0625.89795l.7666,1.82471-.19727-.02295a1.03412,1.03412,0,0,0-1.1084.87842l-.01367.08984a.40038.40038,0,0,1-.07422.14111.99842.99842,0,0,0-.06543,1.15088,1.35558,1.35558,0,0,0-.39648.72314,1.49309,1.49309,0,0,0,.03906.7832,2.37224,2.37224,0,0,1-1.6084-.30078,1,1,0,1,0-1.10937,1.66406,4.09478,4.09478,0,0,0,2.31445.66406,6.0912,6.0912,0,0,0,1.44531-.18457,1.45081,1.45081,0,0,0,1.09863-.90283,1.48987,1.48987,0,0,0-.05371-1.23486,1.44723,1.44723,0,0,0,.5957-1.2085,1.3868,1.3868,0,0,0-.00684-.14258,1.386,1.386,0,0,0,1.1123-.57617,1.487,1.487,0,0,0,.207-1.498l-.917-2.18311c1.39746-2.8916-.0332-5.94141-1.292-8.06543-.02344-.03564-.07812-.10156-.125-.15625a10.1299,10.1299,0,0,0-6.89355-3.5249c-2.87891-.2207-6.40332.42725-7.63672,2.90332a1.02411,1.02411,0,0,0-.07129.18994,12.6916,12.6916,0,0,0-1.4209.43164,10.88975,10.88975,0,0,0-4.66211,3.15918,4.51483,4.51483,0,0,0-1.07617,4.439C108.12114,52.41393,111.35844,53.44128,115.12211,52.53356Z"/>
    </svg>
  ),
  // Yoga figure (Noun Project — Saeful Muslim)
  mobility: (
    <svg width="56" height="56" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M48.806,5.604c1.172,5.699,2.362,10.341,3.569,13.928  c4.356,2.949,8.881,6.67,13.573,11.162c1.441,1.374,2.028,3.117,1.76,5.229c-0.569,3.553-1.425,6.805-2.563,9.754l-1.157,2.916  c-0.603,1.442-1.574,3.67-2.915,6.687l-1.106,4.928l-0.15,0.251l0.051,0.151l-0.202,0.653v0.05l-0.704,2.966  c-1.406,6.101-2.11,9.821-2.11,11.162l0.05,2.263l1.608-0.604c3.051-1.106,5.245-1.844,6.587-2.212  c1.675-0.469,3.435-0.704,5.278-0.704c2.246,0,3.888,0.335,4.927,1.006c1.475,0.872,2.212,2.329,2.212,4.374  c0,1.743-1.727,3.938-5.179,6.586c-1.374,1.073-2.463,1.86-3.268,2.363l0.101,0.503c0,2.38-3.502,4.357-10.507,5.933L58.508,95  c-1.575,0-3.687-0.469-6.334-1.408v-0.05h-0.101c-2.246-0.872-4.14-1.391-5.682-1.559l-4.223-0.402h-1.608  c-5.296-0.101-9.436-0.921-12.417-2.463c-3.453-1.811-5.313-4.056-5.582-6.738c-0.301-2.648,0.319-4.542,1.861-5.681  c1.24-0.838,2.296-1.324,3.166-1.458h0.102c1.072,0.067,2.095,0.251,3.066,0.553c0.402-0.537,0.989-0.805,1.76-0.805  c0.469,0,1.14,0.168,2.011,0.503c0.503,0.168,1.19,0.469,2.062,0.905c0.101,0.034,0.82,0.302,2.162,0.805l0.352,0.101v-1.861  c0-1.408-0.704-5.128-2.111-11.162l-0.553-2.413c-0.135-0.235-0.201-0.486-0.201-0.754l-0.151-0.705l-0.101-0.201l-1.156-5.028  l-3.368-7.844v-0.05l-0.654-1.609c-1.139-2.95-1.994-6.184-2.563-9.704c-0.234-2.146,0.352-3.905,1.76-5.279  c4.592-4.391,9.116-8.112,13.574-11.162c1.407-4.257,2.664-8.917,3.771-13.978C47.414,5.185,47.648,5,48.052,5  C48.487,5,48.738,5.202,48.806,5.604z M48.806,29.134h0.15c2.883,0,5.245,1.408,7.089,4.224c1.608,2.48,2.413,5.212,2.413,8.195  c0,1.207-0.117,2.279-0.352,3.218c-0.269,0.905-0.621,1.726-1.056,2.463c-1.073,1.777-2.548,2.715-4.425,2.816  c0,0.737,0.05,1.458,0.151,2.162c1.575-1.073,2.664-2.028,3.268-2.866c1.006-1.475,1.625-2.463,1.86-2.966l0.754-1.911l0.704-2.614  c0.569-2.246,1.307-4.408,2.212-6.486L48.001,21.19L34.376,35.369c0.905,2.078,1.643,4.24,2.213,6.486l0.704,2.414v0.05l0.301,0.855  c0.168,0.57,0.318,0.972,0.453,1.207c0.234,0.503,0.854,1.491,1.859,2.966c0.671,0.905,1.86,1.944,3.57,3.117  c0.101-0.804,0.15-1.609,0.15-2.413c-1.843-0.101-3.318-1.039-4.424-2.816c-0.938-1.676-1.408-3.57-1.408-5.682  c0-3.017,0.821-5.749,2.464-8.195c1.877-2.815,4.224-4.224,7.038-4.224h0.15l0.704,0.151L48.806,29.134z M44.632,20.637  c-4.457,3.05-8.982,6.771-13.573,11.162c-1.072,1.006-1.509,2.33-1.308,3.972c0.503,3.218,1.324,6.352,2.464,9.402l0.352,0.804  l3.118-1.81l-0.555-1.911c-0.569-2.145-1.34-4.391-2.312-6.738c-0.167-0.301-0.134-0.569,0.101-0.804l14.528-15.134  c0.135-0.134,0.319-0.201,0.554-0.201c0.2,0,0.368,0.067,0.503,0.201l14.528,15.134c0.234,0.235,0.286,0.503,0.151,0.804  c-0.972,2.246-1.76,4.492-2.362,6.738l-0.604,2.162l3.017,1.961l0.503-1.207c1.174-3.05,1.994-6.201,2.464-9.452  c0.201-1.609-0.234-2.916-1.307-3.922c-4.592-4.391-9.116-8.112-13.574-11.162c-0.135-0.101-0.234-0.235-0.302-0.402  c-1.073-3.218-2.062-6.889-2.966-11.012c-0.906,3.821-1.944,7.492-3.118,11.012C44.867,20.402,44.767,20.537,44.632,20.637z   M46.944,40.397c0.738-0.57,1.644-1.508,2.716-2.815c0.201-0.201,0.419-0.285,0.653-0.251c0.269,0.067,0.47,0.201,0.604,0.402  c0.436,0.771,0.988,1.441,1.659,2.011c0.704,0.537,1.307,0.905,1.81,1.106c0.302,0.1,0.452,0.335,0.452,0.704  c-0.101,3.218-0.82,5.547-2.162,6.989c1.308-0.168,2.329-0.872,3.067-2.112c0.436-0.637,0.721-1.325,0.854-2.062  c0.235-0.805,0.352-1.743,0.352-2.816c0-2.749-0.721-5.195-2.161-7.34c-1.576-2.38-3.485-3.57-5.731-3.57l-0.754,0.151  c-0.102,0.066-0.201,0.066-0.302,0l-0.805-0.151c-2.212,0-4.105,1.19-5.681,3.57c-1.475,2.178-2.212,4.625-2.212,7.34  c0,1.911,0.402,3.536,1.207,4.877c0.771,1.273,1.81,1.978,3.116,2.112c-1.105-1.174-1.793-2.983-2.062-5.43  c-0.066-0.47,0.135-0.738,0.604-0.805C44.314,41.771,45.906,41.134,46.944,40.397z M47.85,41.604  c-1.105,0.804-2.681,1.474-4.726,2.011c0.302,1.877,0.905,3.251,1.81,4.123l0.704,0.453c0.569,0.335,1.342,0.536,2.313,0.603h0.402  c0.939-0.033,1.727-0.234,2.362-0.603v-0.05c0.168-0.067,0.353-0.201,0.554-0.403c1.206-1.039,1.894-2.949,2.062-5.731  c-0.604-0.302-1.174-0.67-1.71-1.106c-0.637-0.57-1.122-1.09-1.458-1.559C49.157,40.447,48.386,41.201,47.85,41.604z M62.681,47.788  l-2.966-1.911l-0.453,1.156c-0.335,0.704-0.988,1.76-1.96,3.167c-0.938,1.274-2.497,2.582-4.676,3.922  c-0.201,0.134-0.436,0.151-0.704,0.051c-0.201-0.101-0.335-0.269-0.401-0.503c-0.269-1.174-0.402-2.48-0.402-3.922l-0.051-0.05  c-0.737,0.369-1.643,0.57-2.715,0.604H47.95c-1.006-0.034-1.91-0.235-2.714-0.604l-0.102,0.05c0.034,1.24-0.083,2.615-0.352,4.123  c-0.066,0.268-0.218,0.453-0.452,0.553s-0.47,0.083-0.704-0.05c-2.379-1.542-4.039-2.933-4.978-4.173  c-0.737-1.073-1.391-2.112-1.96-3.117l-0.554-1.458l-3.017,1.76l3.118,7.291l1.206,5.128c0.034,0.034,0.084,0.201,0.15,0.502  l0.252,0.956c0.101,0.268,0.284,0.503,0.553,0.704c0.704,0.704,1.524,1.056,2.463,1.056c0.704,0,1.324-0.167,1.861-0.503  c0.401-0.301,0.754-0.234,1.056,0.202c0.1,0.167,0.133,0.369,0.1,0.603c-0.066,0.201-0.185,0.352-0.352,0.453  c-0.737,0.469-1.574,0.721-2.514,0.754c-0.905,0.034-1.742-0.167-2.514-0.603c1.407,6.301,2.111,10.14,2.111,11.514l-0.05,2.414  l0.754,0.352c1.072,0.469,2.563,1.022,4.475,1.659c1.006,0.402,1.71,0.905,2.111,1.508l7.541-3.067v-0.051  c-0.067-0.301-0.101-1.24-0.101-2.815c0-1.475,0.721-5.313,2.161-11.514v-0.201c-0.737,0.536-1.625,0.804-2.664,0.804  c-1.005,0-1.91-0.251-2.715-0.754c-0.168-0.101-0.268-0.251-0.301-0.453c-0.067-0.234-0.034-0.436,0.1-0.603  c0.102-0.168,0.252-0.269,0.453-0.302c0.234-0.066,0.436-0.033,0.603,0.101c0.47,0.335,1.09,0.503,1.86,0.503  c0.973,0,1.776-0.352,2.413-1.056c0.268-0.234,0.604-0.62,1.006-1.157l0.101-0.503c0-0.167,0.05-0.334,0.15-0.502l1.156-5.078  c1.006-2.179,1.978-4.424,2.917-6.738L62.681,47.788z M32.969,76.548c2.078,0.905,4.189,2.078,6.335,3.52  c3.251,1.776,5.765,3.117,7.541,4.022l-0.05-1.609c-0.168-0.47-0.671-0.872-1.509-1.207c-2.044-0.67-3.586-1.24-4.626-1.709  l-1.155-0.502h-0.102l-1.105-0.453c-1.373-0.436-2.179-0.738-2.413-0.905c-0.904-0.402-1.542-0.67-1.91-0.805L32.969,76.548z   M46.543,90.475c1.475,0.168,3.268,0.637,5.379,1.408l1.358-3.268l-1.66-0.502l-0.653-0.302c-0.972-0.369-2.212-0.972-3.72-1.81  l-8.748-4.676c-3.017-1.978-5.547-3.285-7.591-3.922c-1.14-0.369-2.195-0.586-3.168-0.654c-0.804,0.168-1.608,0.57-2.413,1.207  c-1.072,0.737-1.509,2.162-1.307,4.274c0.268,2.145,1.877,3.989,4.825,5.531c2.782,1.441,6.688,2.212,11.715,2.313h1.608  L46.543,90.475z M48.353,84.894l3.821,1.86c0.737,0.235,1.508,0.419,2.312,0.553c1.408,0.235,3.218,0.268,5.431,0.101  c3.586-0.369,5.831-0.47,6.736-0.302l1.257,0.352c1.207-0.771,2.38-1.592,3.52-2.463c3.05-2.413,4.574-4.224,4.574-5.43  c0-1.475-0.485-2.497-1.458-3.067c-0.87-0.536-2.262-0.804-4.172-0.804c-1.643,0-3.284,0.218-4.927,0.654  c-1.542,0.436-3.704,1.156-6.486,2.162l-6.485,2.615c-2.313,0.972-3.702,1.542-4.172,1.71L48.353,84.894z M53.33,92.386  c1.944,0.67,3.636,1.039,5.077,1.106c6.066-1.375,9.149-2.866,9.251-4.475l-0.102-0.051h-0.05c-0.134-0.134-0.52-0.268-1.155-0.402  c-0.671-0.134-2.766-0.017-6.284,0.352c-2.012,0.167-3.754,0.15-5.229-0.05L53.33,92.386z"/>
    </svg>
  ),
};


export function MilitaryIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="-22.909 -40.58 328.861 417.138" style={{ display: "block", flexShrink: 0 }}>
      <defs><clipPath id="mi-cp"><path d="M-22.909 229.429L17.227 9.508 305.952-40.58l-70.166 417.138z"/></clipPath></defs>
      <path fill="currentColor" d="M76.891 173.85l17.14 4.77.428-2.42-17.156-4.666z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M117.823 25.411l-.42 2.366a88.4 88.4 0 0 1 18.397 1.547 87.848 87.848 0 0 1 17.985 5.485 90.946 90.946 0 0 1 17.016 9.551c5.51 3.918 10.655 8.479 15.354 13.632a100.618 100.618 0 0 1 6.492 7.875 102.264 102.264 0 0 1 3.004 4.261c.979 1.459 1.92 2.949 2.828 4.469a109.13 109.13 0 0 1 7.733 15.657 114.96 114.96 0 0 1 5.392 17.466 121.133 121.133 0 0 1 2.681 18.906c.401 6.515.295 13.16-.356 19.882l3.479.533c1.375-14.005.431-27.629-2.52-40.419-2.887-12.531-7.658-24.091-13.949-34.337-6.094-9.924-13.553-18.514-22.026-25.536-8.146-6.75-17.175-12.008-26.785-15.621a92.975 92.975 0 0 0-2.491-.897c-.414-.142-.83-.28-1.246-.417a62.373 62.373 0 0 0-1.25-.395 95.523 95.523 0 0 0-2.517-.745c-.419-.116-.841-.231-1.266-.344-.421-.109-.842-.218-1.265-.32a89.188 89.188 0 0 0-12.089-2.129 93.25 93.25 0 0 0-6.087-.438 94.444 94.444 0 0 0-6.094-.032"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M120.81 8.568l-1.047 5.915a102.014 102.014 0 0 1 21.155.939 100.485 100.485 0 0 1 20.939 5.498 103.473 103.473 0 0 1 20.065 10.299c6.554 4.317 12.699 9.411 18.337 15.225 5.791 5.974 11.016 12.684 15.555 20.051 4.646 7.539 8.551 15.729 11.59 24.47 3.098 8.896 5.275 18.308 6.43 28.103a139.85 139.85 0 0 1 .205 30.524l9.467 1.451c2.295-22.22-.464-43.551-7.291-62.725-6.576-18.458-16.757-34.442-29.461-47.191-11.988-12.031-26.035-20.989-41.236-26.492-14.207-5.145-29.321-7.231-44.708-6.067"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M114.615 59.034l-17.885.303-.407 2.29 17.869-.203z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M89.61 200.237l-16.949-5.686-.414 2.326 16.932 5.79z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M108.008 10.282c-13.814 2.66-26.628 7.812-38.104 14.73-10.886 6.563-20.713 14.798-29.198 24.186-8.178 9.044-15.23 19.292-20.896 30.37-5.548 10.853-9.855 22.688-12.635 35.257l3.189.487a141.55 141.55 0 0 1 5.088-17.465 138.516 138.516 0 0 1 7.123-16.31 135.827 135.827 0 0 1 9.093-15.134 131.803 131.803 0 0 1 11.039-13.848A126.473 126.473 0 0 1 55.71 40.206a119.524 119.524 0 0 1 15.001-10.532 112.798 112.798 0 0 1 17.063-8.267 107.847 107.847 0 0 1 19.211-5.396l1.023-5.729"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M91.752 188.133l-17.028-5.168-.412 2.319 17.011 5.273z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M8.324 126.538l-3.172-.604c-1.834 12.761-1.968 25.376-.583 37.503 1.415 12.408 4.444 24.523 8.972 35.894 4.707 11.826 11.104 23.026 19.112 32.996 8.458 10.526 18.829 19.826 31.042 27.073l1.049-5.883a106.617 106.617 0 0 1-16.376-11.69 111.642 111.642 0 0 1-13.295-13.705 118.858 118.858 0 0 1-10.505-15.147A125.356 125.356 0 0 1 16.63 196.8a131.279 131.279 0 0 1-5.529-16.895 135.597 135.597 0 0 1-3.22-17.41 137.805 137.805 0 0 1-.94-17.808c.066-5.971.521-12.035 1.383-18.149"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M120.085-8.337l-5.365.932-8.313 46.781 5.273-.342z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M23.542 120.845l-25.861-4.236-.82 4.496 25.796 4.615z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M271.956 161.532l-74.447-12.196-1.279 7.434 74.291 13.289z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M15.696 127.934l-1.334-.254a127.608 127.608 0 0 0-.792 27.259 122.231 122.231 0 0 0 4.969 26.201c2.64 8.611 6.246 16.885 10.765 24.562 4.673 7.938 10.357 15.305 17.006 21.785.421.41.847.816 1.276 1.221a93.036 93.036 0 0 0 2.628 2.385c.448.394.897.779 1.354 1.164.306.258.609.514.918.768s.617.507.931.757c.312.252.628.5.941.745.317.246.638.49.957.735a100.58 100.58 0 0 0 2.692 1.974 101.08 101.08 0 0 0 2.789 1.896 97.504 97.504 0 0 0 5.879 3.541l.419-2.354a92.65 92.65 0 0 1-14.557-9.93 96.435 96.435 0 0 1-11.954-11.85 102.746 102.746 0 0 1-9.545-13.266 109.578 109.578 0 0 1-7.292-14.303c-.14-.334-.276-.666-.413-1.005-.14-.334-.271-.668-.406-1.004-.134-.336-.269-.674-.397-1.01a95.509 95.509 0 0 1-1.131-3.047c-.12-.342-.237-.682-.355-1.021l-.352-1.025c-.113-.344-.228-.687-.337-1.027l-.329-1.029c-.105-.344-.213-.688-.317-1.031l-.311-1.032a118.432 118.432 0 0 1-2.91-12.312 121.335 121.335 0 0 1-1.597-12.603c-.311-4.229-.405-8.52-.275-12.845.13-4.296.487-8.656 1.08-13.045"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M240.206 170.479l-9.42-1.785a140.638 140.638 0 0 1-10.337 28.869c-4.358 8.938-9.572 17.179-15.493 24.638-5.825 7.336-12.296 13.868-19.261 19.537-6.813 5.547-14.064 10.233-21.612 14.028-7.354 3.693-14.954 6.523-22.681 8.469a104.083 104.083 0 0 1-22.68 3.146 100.84 100.84 0 0 1-21.87-1.789 101.632 101.632 0 0 1-20.483-6.264l-1.076 6.068c14.258 6.346 29.399 9.455 44.736 9.301 16.404-.162 32.882-4.06 48.421-11.611 16.434-7.984 31.524-19.914 43.979-35.393 12.887-16.014 22.591-35.389 27.777-57.214"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M77.272 232.969l-4.888-2.108-8.515 47.923 4.792 2.724z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M214.229 165.555l-3.449-.652a125.709 125.709 0 0 1-6.646 19.75 121.582 121.582 0 0 1-9.43 17.687 116.526 116.526 0 0 1-11.7 15.229 110.372 110.372 0 0 1-14.63 13.436c-.404.308-.812.613-1.215.916-.407.301-.815.601-1.228.894-.408.297-.82.588-1.229.877-.411.289-.824.569-1.239.854a122.125 122.125 0 0 1-3.76 2.426c-.419.258-.844.514-1.268.766-.422.251-.848.498-1.271.744-.43.246-.854.484-1.28.728-.427.235-.854.474-1.282.703-6.228 3.36-12.686 6.006-19.271 7.91a91.84 91.84 0 0 1-19.486 3.438 88.007 88.007 0 0 1-19.021-.801 88.506 88.506 0 0 1-18.041-4.731l-.438 2.422c1.11.434 2.226.841 3.347 1.227 1.124.387 2.258.752 3.395 1.092 1.142.346 2.288.664 3.438.961a91.51 91.51 0 0 0 8.62 1.776 92.51 92.51 0 0 0 5.872.711c.659.057 1.318.107 1.979.15 10.938.725 21.986-.547 32.759-3.762 11.239-3.358 22.083-8.81 32.044-16.231 10.299-7.679 19.529-17.375 27.137-28.841 7.757-11.709 13.703-25.066 17.293-39.679"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M112.499 70.985l-17.806-.199-.411 2.291 17.791.302z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M87.462 212.359l-16.866-6.2-.415 2.328 16.85 6.306z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M116.727 47.103l-17.964.805-.405 2.281 17.948-.706z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M105.102 26.627a95.756 95.756 0 0 0-11.377 2.585 94.583 94.583 0 0 0-5.403 1.753 97.532 97.532 0 0 0-8.42 3.46c-.352.163-.698.33-1.051.498a90.6 90.6 0 0 0-1.043.504c-.345.169-.688.342-1.033.516a137.504 137.504 0 0 0-2.04 1.068c-7.543 4.048-14.561 9.028-20.924 14.729-6.184 5.538-11.799 11.801-16.728 18.607a123.751 123.751 0 0 0-12.521 21.629 128.308 128.308 0 0 0-8.135 24.269l1.347.207c.945-4.13 2.083-8.158 3.396-12.071a123.33 123.33 0 0 1 10.016-22.268 118.83 118.83 0 0 1 11.155-16.129 116.298 116.298 0 0 1 4.987-5.678c3.662-3.9 7.592-7.534 11.755-10.851a104.187 104.187 0 0 1 13.47-9.13 98.242 98.242 0 0 1 15.197-7.017 93.783 93.783 0 0 1 16.938-4.383l.414-2.298"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M85.313 224.497l-16.785-6.722-.413 2.329 16.768 6.828z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M155.559 144.452l2.215-12.662 6.485.909.021.002.021.002.021.002.021.002c.982.138 1.82.392 2.515.765.695.373 1.246.863 1.649 1.471.402.608.658 1.336.765 2.179.105.843.064 1.804-.129 2.877-.16 1.081-.428 2.01-.804 2.783-.376.771-.856 1.392-1.446 1.853a4.717 4.717 0 0 1-2.084.92c-.8.152-1.699.148-2.701-.006l-6.549-1.097m9.957-20.817l-6.188-.748-.255-.031-11.708-1.413-9.08 51.938 11.742 2.809 3.979-22.813 6.483 1.219c.011.003.021.003.028.005s.021.004.025.008c.012.002.021.002.028.005a.571.571 0 0 1 .028.007c.918.172 1.705.469 2.354.895a4.613 4.613 0 0 1 1.536 1.648c.378.676.612 1.479.708 2.406.098.932.053 1.981-.133 3.162l-1.942 11.459a15.929 15.929 0 0 0-.276 1.541c-.062.483-.094.94-.095 1.371a6.95 6.95 0 0 0 .086 1.194c.062.369.147.711.271 1.022l13.432 3.211a5.451 5.451 0 0 1-.266-1.002 7.678 7.678 0 0 1-.104-1.211c-.01-.438.01-.909.055-1.418.045-.51.117-1.051.219-1.629l1.837-10.401c.459-1.873.688-3.591.69-5.146.004-1.557-.219-2.954-.666-4.19a8.796 8.796 0 0 0-2.007-3.215c-.888-.906-1.993-1.65-3.313-2.234 1.344-.016 2.562-.25 3.648-.711a8.233 8.233 0 0 0 2.896-2.072c.841-.92 1.541-2.066 2.113-3.439.573-1.375 1.015-2.977 1.314-4.8.441-2.499.396-4.748-.139-6.739-.528-1.983-1.549-3.708-3.041-5.169-1.48-1.449-3.432-2.635-5.834-3.556-2.369-.923-5.187-1.573-8.425-1.963"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M56.889 110.52l-7.368-.889-10.082 29.01.081-30.218-6.675-.807.902 40.771 2.8.67 2.862.684 1.434.343z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M110.323 116.971l-9.898-1.196-8.259 46.579 9.723 2.325z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M67.016 111.742l-7.985-.963-7.509 41.858 7.837 1.873z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M92.989 83.14l-4.699-.198-1.652 9.273-4.554-.298 1.637-9.166-4.443-.188-4.084 22.856 4.402.447 1.797-10.077 4.548.344-1.818 10.194 4.657.473z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M96.464 115.298l-23.891-2.885-1.371 7.671 14.219 2.01-20.487 25.748-1.322 7.685 24.665 5.897 1.451-8.179-16.172-3.526 21.462-26.269z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M125.658 84.51l-16.396-.689-.731 4.118 5.359.278-3.673 20.765 5.292.539 3.712-21.027 5.685.293z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M142.421 120.846l-16.682-2.014v.007l-9.876-1.199-8.534 48.339 9.703 2.32.56.135 15.832 3.783 1.558-8.899-15.88-3.466 2.304-13.096 15.108 2.821 1.503-8.584-15.152-2.528 1.988-11.29 16.064 2.253z"/>
      <path clipPath="url(#mi-cp)" fill="currentColor" d="M107.714 83.758l-8.429-.355-3.686-.155-4.234 23.816 3.651.371 8.35.85.753-4.243-7.207-.657 1.132-6.369 6.847.516.727-4.102-6.858-.45.98-5.498 7.248.377z"/>
    </svg>
  );
}


export function GoalIcon({ value, size = 48 }) {
  const icon = GOAL_ICONS[value];
  if (!icon) return null;
  // Re-render the icon SVG with overridden width/height
  const svgProps = { ...icon.props, width: size, height: size };
  return <icon.type {...svgProps} />;
}
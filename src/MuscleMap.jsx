/* eslint-disable react-refresh/only-export-components */
// src/MuscleMap.jsx — Anatomical muscle map with lined silhouette +
// detailed filled muscle polygons. Active groups glow emerald under the lines.
// Inline SVG, no deps.
//
// Group keys (use in primary[] / secondary[]):
//   FRONT  : chest, delts_front, biceps, forearms_front, abs, obliques,
//            quads, adductors, tibialis
//   BACK   : traps, delts_rear, lats, triceps, forearms_back, lower_back,
//            glutes, hamstrings, calves
//
// Aliases: shoulders, back, legs, arms, core, forearms, delts

import React from "react";

const ALIASES = {
  shoulders: ["delts_front", "delts_rear"],
  back: ["lats", "traps", "lower_back"],
  legs: ["quads", "hamstrings", "glutes", "calves"],
  arms: ["biceps", "triceps", "forearms_front", "forearms_back"],
  core: ["abs", "obliques"],
  forearms: ["forearms_front", "forearms_back"],
  delts: ["delts_front", "delts_rear"],
};
function expandGroups(list = []) {
  const out = new Set();
  for (const g of list) {
    if (ALIASES[g]) ALIASES[g].forEach((k) => out.add(k));
    else out.add(g);
  }
  return out;
}

const MALE = {
  silhouette: `M100 18 C 88 18 78 28 78 44 C 78 56 82 64 88 70 L 88 82 L 80 86 L 70 88 C 56 92 50 102 46 116 L 38 158 L 30 200 L 26 244 L 24 280 C 22 290 18 300 18 312 C 18 322 22 326 28 326 L 32 322 L 36 304 L 40 286 L 44 272 L 48 250 L 52 226 L 54 198 L 56 174 L 58 152 L 60 200 C 56 240 64 268 70 282 L 76 322 L 70 380 L 76 442 L 82 472 L 96 472 L 98 396 L 100 332 L 102 396 L 104 472 L 118 472 L 124 442 L 130 380 L 124 322 L 130 282 C 136 268 144 240 140 200 L 142 152 L 144 174 L 146 198 L 148 226 L 152 250 L 156 272 L 160 286 L 164 304 L 168 322 L 172 326 C 178 326 182 322 182 312 C 182 300 178 290 176 280 L 174 244 L 170 200 L 162 158 L 154 116 C 150 102 144 92 130 88 L 120 86 L 112 82 L 112 70 C 118 64 122 56 122 44 C 122 28 112 18 100 18 Z`,
  hair: "M82 26 Q100 14 118 26 Q120 36 116 42 Q108 30 100 30 Q92 30 84 42 Q80 36 82 26 Z",
  front: [
    ["chest", "M88 96 Q72 102 70 124 Q72 146 96 154 Q100 142 99 118 Q94 100 88 96 Z"],
    ["chest", "M112 96 Q128 102 130 124 Q128 146 104 154 Q100 142 101 118 Q106 100 112 96 Z"],
    ["delts_front", "M64 96 Q54 100 48 116 Q46 134 54 144 Q66 144 72 134 Q74 116 70 96 Z"],
    ["delts_front", "M136 96 Q146 100 152 116 Q154 134 146 144 Q134 144 128 134 Q126 116 130 96 Z"],
    ["biceps", "M44 144 Q36 168 36 198 Q44 206 54 202 Q58 174 56 146 Z"],
    ["biceps", "M156 144 Q164 168 164 198 Q156 206 146 202 Q142 174 144 146 Z"],
    ["forearms_front", "M40 206 Q32 232 28 270 Q34 282 44 280 Q50 248 52 208 Z"],
    ["forearms_front", "M160 206 Q168 232 172 270 Q166 282 156 280 Q150 248 148 208 Z"],
    ["abs", "M86 156 L99 154 L99 174 L86 175 Z"],
    ["abs", "M101 154 L114 156 L114 175 L101 174 Z"],
    ["abs", "M86 178 L99 178 L99 198 L86 198 Z"],
    ["abs", "M101 178 L114 178 L114 198 L101 198 Z"],
    ["abs", "M86 202 L99 202 L99 224 L86 224 Z"],
    ["abs", "M101 202 L114 202 L114 224 L101 224 Z"],
    ["abs", "M88 228 L100 244 L112 228 L110 234 L100 248 L90 234 Z"],
    ["obliques", "M70 156 Q66 196 76 232 L84 230 L84 156 Z"],
    ["obliques", "M130 156 Q134 196 124 232 L116 230 L116 156 Z"],
    ["obliques", "M82 144 L84 152 L82 156 L80 152 Z"],
    ["obliques", "M118 144 L120 152 L120 156 L116 152 Z"],
    ["obliques", "M82 138 L80 144 L78 138 Z"],
    ["obliques", "M118 138 L120 144 L122 138 Z"],
    ["quads", "M76 256 Q66 300 76 342 L96 342 L98 300 Q97 270 90 256 Z"],
    ["quads", "M124 256 Q134 300 124 342 L104 342 L102 300 Q103 270 110 256 Z"],
    ["adductors", "M97 258 L100 256 L103 258 L101 312 L99 312 Z"],
    ["tibialis", "M82 354 Q78 396 86 442 L94 442 L96 396 Q96 372 90 354 Z"],
    ["tibialis", "M118 354 Q122 396 114 442 L106 442 L104 396 Q104 372 110 354 Z"],
  ],
  frontLines: [
    "M100 96 L100 152", "M100 154 L100 244",
    "M70 144 Q86 154 99 152", "M130 144 Q114 154 101 152",
    "M70 100 Q72 130 96 150", "M130 100 Q128 130 104 150",
    "M86 175 L114 175", "M86 198 L114 198", "M86 222 L114 222",
    "M84 150 L82 156", "M116 150 L118 156",
    "M64 116 Q70 128 78 132", "M136 116 Q130 128 122 132",
    "M48 170 L48 196", "M152 170 L152 196",
    "M44 232 L42 268", "M156 232 L158 268",
    "M82 270 L86 332", "M118 270 L114 332",
    "M97 268 L97 332", "M103 268 L103 332",
    "M88 360 L90 432", "M112 360 L110 432",
    "M92 348 Q97 352 102 348", "M108 348 Q103 352 98 348",
  ],
  back: [
    ["traps", "M86 80 L100 70 L114 80 Q120 96 124 116 L100 132 L76 116 Q80 96 86 80 Z"],
    ["traps", "M82 116 L100 140 L118 116 L114 140 L100 156 L86 140 Z"],
    ["delts_rear", "M64 96 Q54 100 48 116 Q46 134 54 144 Q66 144 72 134 Q74 116 70 96 Z"],
    ["delts_rear", "M136 96 Q146 100 152 116 Q154 134 146 144 Q134 144 128 134 Q126 116 130 96 Z"],
    ["traps", "M86 132 L100 140 L114 132 L114 152 L100 160 L86 152 Z"],
    ["lats", "M72 124 Q60 168 70 220 L94 212 L96 138 Q86 126 76 122 Z"],
    ["lats", "M128 124 Q140 168 130 220 L106 212 L104 138 Q114 126 124 122 Z"],
    ["triceps", "M44 144 Q36 168 36 198 Q44 206 54 202 Q58 174 56 146 Z"],
    ["triceps", "M156 144 Q164 168 164 198 Q156 206 146 202 Q142 174 144 146 Z"],
    ["forearms_back", "M40 206 Q32 232 28 270 Q34 282 44 280 Q50 248 52 208 Z"],
    ["forearms_back", "M160 206 Q168 232 172 270 Q166 282 156 280 Q150 248 148 208 Z"],
    ["lower_back", "M88 220 L112 220 L114 254 L100 264 L86 254 Z"],
    ["glutes", "M70 260 Q60 298 76 318 L98 318 L98 266 Q86 260 74 260 Z"],
    ["glutes", "M130 260 Q140 298 124 318 L102 318 L102 266 Q114 260 126 260 Z"],
    ["hamstrings", "M76 322 Q68 354 78 366 L96 366 L96 322 Z"],
    ["hamstrings", "M124 322 Q132 354 122 366 L104 366 L104 322 Z"],
    ["calves", "M82 370 Q74 406 82 442 L94 442 L94 406 Q94 384 92 370 Z"],
    ["calves", "M118 370 Q126 406 118 442 L106 442 L106 406 Q106 384 108 370 Z"],
  ],
  backLines: [
    "M100 70 L100 264",
    "M76 116 Q86 100 100 70", "M124 116 Q114 100 100 70",
    "M76 116 L66 110", "M124 116 L134 110",
    "M72 130 Q66 180 72 218", "M128 130 Q134 180 128 218",
    "M72 218 L88 222", "M128 218 L112 222",
    "M88 220 L86 254 L100 264 L114 254 L112 220",
    "M100 266 L100 318",
    "M76 280 Q88 286 98 280", "M124 280 Q112 286 102 280",
    "M86 326 L86 362", "M114 326 L114 362",
    "M88 380 L88 432", "M112 380 L112 432",
    "M88 396 Q92 400 96 396", "M112 396 Q108 400 104 396",
    "M48 168 L48 198", "M152 168 L152 198",
    "M86 366 Q92 368 98 366", "M114 366 Q108 368 102 366",
  ],
};

const FEMALE = {
  silhouette: `M100 18 C 88 18 80 28 80 44 C 80 56 84 64 88 70 L 88 82 L 82 86 L 74 88 C 62 92 56 102 54 116 L 50 156 L 44 200 L 38 240 L 32 274 C 28 286 24 296 24 308 C 24 318 28 322 34 322 L 38 318 L 42 300 L 46 282 L 50 268 L 54 246 L 58 222 L 60 196 L 62 174 L 64 154 L 64 196 C 60 222 64 248 70 268 Q 60 296 56 326 L 70 384 L 74 442 L 80 472 L 96 472 L 98 396 L 100 332 L 102 396 L 104 472 L 120 472 L 126 442 L 130 384 L 144 326 Q 140 296 130 268 C 136 248 140 222 136 196 L 136 154 L 138 174 L 140 196 L 142 222 L 146 246 L 150 268 L 154 282 L 158 300 L 162 318 L 166 322 C 172 322 176 318 176 308 C 176 296 172 286 168 274 L 162 240 L 156 200 L 150 156 L 146 116 C 144 102 138 92 126 88 L 118 86 L 112 82 L 112 70 C 116 64 120 56 120 44 C 120 28 112 18 100 18 Z`,
  hair: "M76 28 Q100 12 124 28 Q132 50 134 78 Q130 92 124 88 Q120 80 116 72 Q108 64 100 64 Q92 64 84 72 Q80 80 76 88 Q70 92 66 78 Q68 50 76 28 Z",
  front: [
    ["chest", "M86 100 Q74 106 74 124 Q76 138 96 144 Q100 134 99 116 Q92 104 86 100 Z"],
    ["chest", "M114 100 Q126 106 126 124 Q124 138 104 144 Q100 134 101 116 Q108 104 114 100 Z"],
    ["delts_front", "M70 102 Q62 104 58 120 Q56 134 64 142 Q72 142 76 132 Q78 116 74 102 Z"],
    ["delts_front", "M130 102 Q138 104 142 120 Q144 134 136 142 Q128 142 124 132 Q122 116 126 102 Z"],
    ["biceps", "M50 144 Q44 168 44 196 Q50 202 60 200 Q62 174 60 146 Z"],
    ["biceps", "M150 144 Q156 168 156 196 Q150 202 140 200 Q138 174 140 146 Z"],
    ["forearms_front", "M44 202 Q38 226 36 262 Q42 274 50 272 Q54 240 56 204 Z"],
    ["forearms_front", "M156 202 Q162 226 164 262 Q158 274 150 272 Q146 240 144 204 Z"],
    ["abs", "M88 162 L99 160 L99 180 L88 181 Z"],
    ["abs", "M101 160 L112 162 L112 181 L101 180 Z"],
    ["abs", "M88 184 L99 184 L99 204 L88 204 Z"],
    ["abs", "M101 184 L112 184 L112 204 L101 204 Z"],
    ["abs", "M89 208 L111 208 L110 230 L100 236 L90 230 Z"],
    ["obliques", "M76 162 Q72 200 80 234 L86 232 L86 162 Z"],
    ["obliques", "M124 162 Q128 200 120 234 L114 232 L114 162 Z"],
    ["quads", "M78 256 Q68 304 80 348 L97 348 L99 304 Q98 270 94 256 Z"],
    ["quads", "M122 256 Q132 304 120 348 L103 348 L101 304 Q102 270 106 256 Z"],
    ["adductors", "M97 258 L100 256 L103 258 L101 314 L99 314 Z"],
    ["tibialis", "M84 360 Q80 400 88 442 L94 442 L96 400 Q96 376 92 360 Z"],
    ["tibialis", "M116 360 Q120 400 112 442 L106 442 L104 400 Q104 376 108 360 Z"],
  ],
  frontLines: [
    "M100 96 L100 144", "M100 158 L100 236",
    "M76 138 Q88 146 99 144", "M124 138 Q112 146 101 144",
    "M88 181 L112 181", "M88 204 L112 204",
    "M76 124 Q86 134 100 138 Q114 134 124 124",
    "M70 116 Q74 126 80 130", "M130 116 Q126 126 120 130",
    "M52 170 L52 196", "M148 170 L148 196",
    "M84 280 L88 340", "M116 280 L112 340",
    "M97 270 L97 342", "M103 270 L103 342",
    "M92 354 Q97 358 102 354", "M108 354 Q103 358 98 354",
    "M88 366 L90 432", "M112 366 L110 432",
  ],
  back: [
    ["traps", "M88 80 L100 72 L112 80 Q116 96 120 116 L100 128 L80 116 Q84 96 88 80 Z"],
    ["traps", "M84 116 L100 138 L116 116 L114 138 L100 154 L86 138 Z"],
    ["delts_rear", "M70 102 Q62 104 58 120 Q56 134 64 142 Q72 142 76 132 Q78 116 74 102 Z"],
    ["delts_rear", "M130 102 Q138 104 142 120 Q144 134 136 142 Q128 142 124 132 Q122 116 126 102 Z"],
    ["lats", "M76 124 Q66 162 74 218 L94 210 L96 136 Q86 124 80 122 Z"],
    ["lats", "M124 124 Q134 162 126 218 L106 210 L104 136 Q114 124 120 122 Z"],
    ["triceps", "M50 144 Q44 168 44 196 Q50 202 60 200 Q62 174 60 146 Z"],
    ["triceps", "M150 144 Q156 168 156 196 Q150 202 140 200 Q138 174 140 146 Z"],
    ["forearms_back", "M44 202 Q38 226 36 262 Q42 274 50 272 Q54 240 56 204 Z"],
    ["forearms_back", "M156 202 Q162 226 164 262 Q158 274 150 272 Q146 240 144 204 Z"],
    ["lower_back", "M90 222 L110 222 L112 256 L100 266 L88 256 Z"],
    ["glutes", "M68 262 Q58 304 78 326 L98 326 L98 268 Q84 260 72 260 Z"],
    ["glutes", "M132 262 Q142 304 122 326 L102 326 L102 268 Q116 260 128 260 Z"],
    ["hamstrings", "M76 330 Q68 364 80 372 L96 372 L96 330 Z"],
    ["hamstrings", "M124 330 Q132 364 120 372 L104 372 L104 330 Z"],
    ["calves", "M82 376 Q74 410 82 442 L94 442 L94 410 Q94 388 92 376 Z"],
    ["calves", "M118 376 Q126 410 118 442 L106 442 L106 410 Q106 388 108 376 Z"],
  ],
  backLines: [
    "M100 72 L100 268",
    "M80 116 Q86 100 100 72", "M120 116 Q114 100 100 72",
    "M76 130 Q70 178 76 218", "M124 130 Q130 178 124 218",
    "M76 218 L88 224", "M124 218 L112 224",
    "M90 222 L88 256 L100 266 L112 256 L110 222",
    "M100 268 L100 326",
    "M76 290 Q88 296 98 290", "M124 290 Q112 296 102 290",
    "M86 332 L86 368", "M114 332 L114 368",
    "M88 386 L88 438", "M112 386 L112 438",
    "M88 400 Q92 404 96 400", "M112 400 Q108 404 104 400",
    "M52 168 L52 196", "M148 168 L148 196",
    "M86 372 Q92 374 98 372", "M114 372 Q108 374 102 372",
  ],
};

const FIGURES = { male: MALE, female: FEMALE };

function Figure({ data, fill, xOffset = 0, view = "front", uid, lineColor, bodyFill }) {
  const groups = view === "front" ? data.front : data.back;
  const lines = view === "front" ? data.frontLines : data.backLines;
  const clipId = `${uid}-clip-${view}`;
  return (
    <g transform={`translate(${xOffset} 0)`}>
      <defs>
        <clipPath id={clipId}>
          <path d={data.silhouette} />
        </clipPath>
      </defs>
      <path d={data.silhouette} fill={bodyFill} />
      <path d={data.hair} fill={lineColor} opacity="0.85" />
      <g clipPath={`url(#${clipId})`}>
        {groups.map(([key, d], i) => (
          <path key={`g-${i}`} d={d} fill={fill(key)} />
        ))}
        <g stroke={lineColor} strokeWidth="0.9" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
          {lines.map((d, i) => (
            <path key={`l-${i}`} d={d} />
          ))}
        </g>
      </g>
      <path d={data.silhouette} fill="none" stroke={lineColor} strokeWidth="1.4" strokeLinejoin="round" />
    </g>
  );
}

let _uidCounter = 0;
const nextUid = () => `mm${++_uidCounter}`;

export function MuscleMap({
  primary = [],
  secondary = [],
  size = 320,
  gender = "male",
  primaryColor = "#10b981",
  secondaryColor = "rgba(16,185,129,0.32)",
  baseColor = "rgba(255,255,255,0.04)",
  bodyFill = "rgba(255,255,255,0.06)",
  lineColor = "rgba(255,255,255,0.55)",
  showLabels = true,
}) {
  const data = FIGURES[gender] || FIGURES.male;
  const uid = React.useMemo(() => nextUid(), []);
  const primarySet = expandGroups(primary);
  const secondarySet = expandGroups(secondary);
  const fill = (key) => {
    if (primarySet.has(key)) return primaryColor;
    if (secondarySet.has(key)) return secondaryColor;
    return baseColor;
  };
  const w = size;
  const h = Math.round((size * 500) / 420);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 420 500"
      style={{ display: "block" }}
      aria-label={`muscle map`}
      role="img"
    >
      <Figure data={data} fill={fill} xOffset={0}   view="front" uid={uid} lineColor={lineColor} bodyFill={bodyFill} />
      <Figure data={data} fill={fill} xOffset={220} view="back"  uid={uid} lineColor={lineColor} bodyFill={bodyFill} />
      {showLabels && (
        <g fill={lineColor} fontFamily="Inter Tight, system-ui, sans-serif" fontSize="9" fontWeight="700" letterSpacing="0.18em" textAnchor="middle">
          <text x="100" y="494">FRONT</text>
          <text x="320" y="494">BACK</text>
        </g>
      )}
    </svg>
  );
}

// Derive primary/secondary muscle groups from exercise record
export function musclesFor(ex) {
  const tryParse = (s) => { try { return JSON.parse(s || "[]"); } catch { return []; } };
  const primary = tryParse(ex?.primary_muscles_json);
  const secondary = tryParse(ex?.secondary_muscles_json);
  if (primary.length || secondary.length) return { primary, secondary };

  const slug = (ex?.exercise_slug || ex?.name || "").toLowerCase();
  const has = (s) => slug.includes(s);

  if (has("bench") || has("push-up") || has("pushup") || has("dip"))
    return { primary: ["chest", "triceps"], secondary: ["delts_front", "core"] };
  if (has("squat"))
    return { primary: ["quads", "glutes"], secondary: ["hamstrings", "core", "lower_back"] };
  if (has("deadlift") || has("rdl") || has("romanian"))
    return { primary: ["hamstrings", "glutes", "lower_back"], secondary: ["traps", "forearms"] };
  if (has("row"))
    return { primary: ["lats", "traps"], secondary: ["biceps", "delts_rear"] };
  if (has("pull-up") || has("pullup") || has("chin"))
    return { primary: ["lats", "biceps"], secondary: ["traps", "delts_rear", "forearms"] };
  if (has("press") || has("overhead") || has("shoulder-press"))
    return { primary: ["delts_front", "triceps"], secondary: ["traps", "core"] };
  if (has("curl"))
    return { primary: ["biceps"], secondary: ["forearms"] };
  if (has("lunge") || has("split-squat") || has("step-up"))
    return { primary: ["quads", "glutes"], secondary: ["hamstrings", "calves", "core"] };
  if (has("plank"))
    return { primary: ["abs", "obliques"], secondary: ["delts_front", "glutes"] };
  if (has("sit-up") || has("crunch"))
    return { primary: ["abs"], secondary: ["obliques"] };
  if (has("kettlebell") || has("swing"))
    return { primary: ["glutes", "hamstrings"], secondary: ["lower_back", "core", "delts_front"] };
  if (has("hip-thrust") || has("glute-bridge"))
    return { primary: ["glutes"], secondary: ["hamstrings", "core"] };
  if (has("calf"))
    return { primary: ["calves"], secondary: [] };
  if (has("lateral-raise"))
    return { primary: ["delts_front", "delts_rear"], secondary: ["traps"] };
  if (has("face-pull") || has("rear-delt"))
    return { primary: ["delts_rear"], secondary: ["traps"] };
  if (has("run") || has("jog") || has("sprint") || has("cycling") || has("bike"))
    return { primary: ["quads", "hamstrings", "calves"], secondary: ["glutes", "core"] };

  return { primary: [], secondary: [] };
}

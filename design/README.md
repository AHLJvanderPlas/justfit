# JustFit design folder

## Folder structure

```
design/
├── system/
│   └── design-system-core.md   ← single source of truth for all design decisions
├── references/
│   └── 21-exercise-icons-and-poses.html  ← interactive icon reference (27 ExerciseIcon types)
└── README.md
```

---

## How to use

Before any implementation work, read `system/design-system-core.md`. It covers:

- Typography helpers (`display()`, `eyebrow`, `mono()`)
- Spacing, surfaces, colour tokens
- Navigation shell (4 tabs, no more)
- Modals, loading/error states, density limits
- Hierarchy rules, anti-gamification, anti-bloat
- Workout view special rules
- PR acceptance checklist

**If a feature conflicts with design-system-core.md, the system file wins.** Document the override if there's a legitimate exception.

---

## For new design work

Start from the PR acceptance checklist at the bottom of `design-system-core.md`. Implement directly — no brief file needed for contained changes.

For larger overhauls, create a short brief (≤ 2 pages: goal, acceptance criteria, out of scope) and put it in this folder as `NN-short-title.md`. Delete it once implemented.

---

## Ground rules

- Inline styles via `C.` tokens. No Tailwind, no CSS modules.
- Use `display()`, `eyebrow`, `mono()` — never hand-write `fontFamily`.
- All visible strings derived from `messagePolicy.js`. Never quote rule codes in UI.
- Mobile-first. 375 × 667 first; scale up.
- After each deploy, update Current Build Status in `CLAUDE.md` and `README.md`.

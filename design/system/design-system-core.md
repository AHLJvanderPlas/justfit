# JustFit — Design System Core

Applies to every screen. If a screen-level decision conflicts with this file, **this file wins.**

---

## Typography

Three families. Three jobs. Use helpers from `src/tokens.js` — never raw `fontFamily` strings.

| Helper | Family | Weight | Use |
|---|---|---|---|
| `display(900)` | Barlow Condensed | 900 | Session names, screen titles, CTAs, hero numbers |
| (default) | Inter Tight | 500–700 | Body copy, coach sentences, control labels |
| `mono()` | JetBrains Mono | 500–700 | Eyebrows, dates, scores, data |
| `eyebrow` | mono + 11px + 0.18em | — | Section labels, screen eyebrows |

**Size scale (mobile baseline):**

```
Hero (session name)      56–72px   display(900)   line 0.95
Section title            24px      display(900)   line 1.05
Body / coach sentence    16px      Inter Tight    line 1.45
Secondary / labels       14px      Inter Tight    line 1.5
Small data / scores      11px      mono()         letter 0.16em uppercase
```

**Hierarchy rule:** Hero must be ≥ 1.8× the next-largest visible element. If it's not, the screen is wrong, not the rule.

---

## Spacing (4px base scale)

```
4    tight inline gap (chip internals)
8    between label and value
12   between sibling controls
14   between paragraphs
18   between hero and rationale
24   between major content blocks
32   between sections
48   page top padding (mobile)
```

---

## Surfaces

| Surface | Radius | Border | Background |
|---|---|---|---|
| Page | 0 | — | `C.bg` |
| Card | 18–22 | `1px solid C.border` | `C.bgCard` |
| Hero card / sheet | 24–28 | `1px solid C.border` | `C.bgCard` |
| Button (primary) | 16 | none | `var(--accent)` |
| Pill / tag | 99 | `1px solid C.border` | `rgba(255,255,255,0.04)` |
| Input | 12 | `1px solid C.border` | `#02101f` |
| Modal / sheet | 24 (top) | `1px solid C.border` | `C.bg` |

No shadows. Depth comes from border + lifted background only.

---

## Colour

**Five accents — reserved use only:**

| Colour | Hex | Reserved for |
|---|---|---|
| Emerald | `var(--accent)` | Start CTA, active tab, streak ≥3, score ≥70, coach tag |
| Amber | `#f59e0b` | Warnings, volume-reduced notices, wake-lock fallback |
| Rose | `#f43f5e` | Destructive (delete), pain-blocking banner |
| Sky | `#38bdf8` | Informational (coach context notes) |
| Violet | `#8b5cf6` | Period / cycle indicators only |

**Don't repurpose them. Don't add a sixth.**

**Foreground levels:**

```
C.text     #f8fafc   primary (hero, body)
#cbd5e1               secondary (coach sentence, sub-copy)
C.muted    #94a3b8   tertiary (labels, dates)
C.dim      #64748b   quaternary (axis labels)
C.subtle   #334155   borders / disabled
```

---

## Cards

A card is a commitment — one thing the user can act on as a unit.

**Use a card for:** Today workout preview, Settings group, Progress widget, check-in modal.

**Do not use a card for:** The Today hero (it is the page), the coach sentence, single text links, the score.

If removing card chrome leaves the content readable, remove the chrome.

---

## Icons

Source: `src/icons.jsx` only. Do not add a library, do not add inline SVGs outside that file.

- Inside CTAs: one chevron or arrow.
- One icon per Settings row, optional.
- Status dots (●) for active state.
- No decorative icons next to copy. No emoji in UI strings.

---

## Buttons & CTAs

Three tiers:

| Tier | Form | Use |
|---|---|---|
| Primary | Filled accent, `display(900)` 18px, full-width mobile | Start, Apply, Begin. **One per screen above the fold.** |
| Secondary | Bordered, Inter Tight 600, 14px | Swap, Skip, Reset |
| Tertiary | Plain text, muted 12–14px | Why this plan?, Quick check-in, sub-actions |

**Primary CTA copy is a verb.** "Start", "Apply", "Begin block". Not "Continue", not "Next".

**No floating action button.**

---

## Navigation shell

Four tabs. No more, no less: **Today · Coach · Progress · Settings**

- Bottom-fixed on mobile (56px, tap targets ≥48px), top on ≥768px.
- Active: accent label + 2px underline. Inactive: `C.muted`.
- Tab bar is **hidden inside Workout**.

No 5th tab. No icon-only tabs. No notification dots.

---

## Header behaviour

No global app header. Per-tab treatment:

| Tab | Top chrome |
|---|---|
| Today | None — eyebrow strip (date · streak · score) is the top |
| Progress | Eyebrow `PROGRESS` + page title |
| Coach | Eyebrow `COACH` + active coach label |
| Settings | Group title + back chevron in sub-screens |
| Workout | Rest timer or rep count — no header chrome |

---

## Modals & sheets

**Bottom sheet** (default): check-in, swap, alternatives, why-this-plan. Top corners 24px, backdrop `rgba(0,0,0,0.6)`, drag handle 36×4, tap-outside dismisses, primary CTA pinned at bottom.

**Centred dialog** (rare): destructive confirms only. Max 320px, one title + one body line + cancel/destructive buttons.

No full-screen modals except Workout. No modal stacked on modal.

---

## Loading & error states

- **Skeleton:** shape outlines in `C.bgCard`, no shimmer, no full-screen spinner.
- **Inline:** `RECALCULATING…` mono label next to the affected element.
- **Blocking:** disable CTA, change label ("Saving…"), no spinner overlay.

Error copy uses coach voice — never HTTP statuses, rule codes (R510…), or stack traces.

---

## Density limits (per screen above the fold)

| Screen | Max items |
|---|---|
| Today | 5 (eyebrow strip, coach tag, hero, sentence, CTA) |
| Progress | 3 (trajectory, streak, insight) |
| Settings group | 8 controls |
| Workout (active set) | 3 (counter, timer/ring, movement) |
| Check-in step | 1 question + footer |

When a screen risks getting busy: **collapse, don't shrink.** Never reduce font sizes to fit more in. Never add horizontal scroll on mobile.

---

## Hierarchy non-negotiables

- Today session name is the largest type in the app. ≥ 1.8× anything next to it.
- One primary button above the fold per screen.
- Coach speaks in sentences, not pills. Adaptation reasoning is inline body text, never a chip.
- Score is supporting cast — top strip on Today, chart on Progress. Never next to the session name.
- Active coach is an eyebrow-sized tag, not a full-width banner.

---

## Anti-gamification

**Forbidden:** Confetti, particle effects, level-up animations, "you'll lose your streak" copy, XP bars, percentage-to-next-tier rings on Today, awards in any hero, red-dot reward notifications, "daily challenge" framing, leaderboards.

**Allowed:** Streak count (small, in top strip), one "next unlock" line at bottom of Progress, ✓ on completed days in weekly strip, Hall of Fame (kept quiet).

---

## Anti-bloat

- No new top-level screens. Today / Coach / Progress / Settings are permanent.
- No new fonts (three exist). No new colour tokens (five accents exist).
- No new icon library. No animation libraries — CSS transitions only, under 200ms.
- No new state-management dependencies.

---

## Workout view — special rules

The workout view earns trust by getting out of the way.

- No tab bar. No toasts or banners during an active set.
- Single-thumb usable: all targets ≥48px, tap zone ≥280px tall.
- Discreet × top-right; mid-set → "End workout?" dialog; summary → direct exit.
- Wake lock requested. Fallback: 2px amber line at bottom (ignorable).
- **Do not restyle:** rep counter, timer typography, `tapScale`/`tapRing` interactions.
- **Do not add:** progress bar across top, card chrome around movement, sound effects, "share workout".

---

## What stays quiet

- Check-in modal: 10-second conversation, not a diary.
- Workout view: no new colours, no badges, no celebrations between sets.
- Privacy & data screens: quiet, factual, no emoji, no marketing copy.
- "Why this plan?" panel: plain language, no rule codes, no charts.
- Awards: discoverable, never promoted.

---

## Copy guardrails

- No rule codes (R510, R558…) in UI strings.
- No exercise IDs.
- No HTTP statuses or stack traces.
- No emoji in primary copy.
- No exclamation marks in coach copy. The coach is calm.
- Plain language: not "session generated successfully" — "Today's plan is ready."

---

## Anti "generic fitness app" patterns to refuse

Circular streak ring as hero, nutrition surface, body silhouette with hit-points, "Crush it"/"Beast mode" copy, weight tracker as primary feature, hero shots of muscular bodies, photographic backgrounds, heart rate zones framed as coaching, "users like you" comparisons, a Discover tab.

---

## Responsive behaviour

Mobile-first. Floor: 375 × 667.

| Breakpoint | Behaviour |
|---|---|
| ≤ 380px | Hero 56px, coach tag wraps, CTA full-width |
| 381–767px | Default mobile, tab bar bottom-fixed |
| 768–1023px | Tab bar top, content max-width 560px centred |
| ≥ 1024px | Two-column Settings root only; all other screens single-column max 560px |

---

## PR acceptance checklist

- [ ] Typography uses `display()` / `eyebrow` / `mono()` helpers, not raw `fontFamily`
- [ ] No new colours, card patterns, fonts, icon sources
- [ ] Hero ≥ 1.8× next-largest element
- [ ] One primary button above the fold
- [ ] No gamification additions
- [ ] No rule codes / HTTP statuses in UI
- [ ] Privacy copy quiet and factual
- [ ] Tab bar absent in Workout / Onboarding
- [ ] No generic fitness app patterns
- [ ] Mobile-first: tested at 375 × 667

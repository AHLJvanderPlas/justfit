# Claude Design Request — trainer.justfit.cc

**Product:** JustFit Trainer Back-Office
**URL:** trainer.justfit.cc
**Type:** Web application (desktop-first, mobile-responsive)
**Design deliverable:** Full UI/UX design for all screens and states

---

## 1. Context & Product Purpose

JustFit is a privacy-first adaptive fitness coaching app for end users (justfit.cc). This is the **trainer back-office**: a separate web application used by human fitness trainers, personal coaches, and gym instructors to manage their client roster, build training programmes, and invoice their clients.

The trainer is a professional. They use this on a laptop or desktop in between sessions, during planning time, or while sitting at a gym reception. The design must project **authority, clarity, and trust** — it is a professional tool, not a consumer app.

This portal must feel clearly connected to the JustFit brand, but with a more serious, professional aesthetic than the consumer app. Less playful. More structured. Think: the difference between a fitness app for a weekend warrior and the software a physio clinic uses.

---

## 2. Brand & Design Language

### JustFit brand (from the consumer app)

| Token | Value |
|-------|-------|
| Background | `#020617` (near-black navy) |
| Accent | `#10b981` (emerald green) |
| Card surface | `rgba(255,255,255,0.04)` (glass cards) |
| Border radius — cards | 28px |
| Border radius — inputs | 14px |
| Border radius — buttons | 16px |
| Typography — display | Barlow Condensed (weight 900) |
| Typography — body | Inter Tight |
| Typography — data | JetBrains Mono |

### Trainer portal tone shift

The trainer portal inherits the JustFit dark palette but shifts the aesthetic:

- **Less glass, more structure.** Consumer app uses frosted glass cards throughout. Trainer portal uses slightly more opaque, structured panels — less ethereal, more functional.
- **Denser information layout.** Trainers work with tables, stats, client lists. The design must support dense-but-readable data layouts comfortably.
- **Professional confidence.** The accent green remains, but is used more sparingly — reserved for positive KPIs (adherence rings, paid invoice badges) and primary CTAs.
- **Typography: heavier data presence.** JetBrains Mono is used more prominently for counts, stats, invoice numbers. Barlow Condensed for section headers.

### Suggested colour additions for the trainer portal

| Role | Value | Usage |
|------|-------|-------|
| Success (adherence good) | `#10b981` | ≥80% adherence rings, paid badges |
| Warning (needs attention) | `#f59e0b` | 50–79% adherence, overdue invoices, pending approvals |
| Danger | `#ef4444` | <50% adherence, inactive >7 days, overdue |
| Surface 1 | `#0f172a` | Sidebar, main background |
| Surface 2 | `#1e293b` | Card backgrounds |
| Surface 3 | `#334155` | Input backgrounds, table row hover |
| Border | `rgba(255,255,255,0.08)` | Card/table borders |
| Text primary | `#f8fafc` | |
| Text secondary | `#94a3b8` | Labels, secondary info |
| Text muted | `#475569` | Disabled, placeholders |

---

## 3. Layout Architecture

### Shell layout (all authenticated screens)

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Main content area (fills remainder)  │
│                         │                                       │
│  [JustFit logo]         │  [Page header]                        │
│  [Trainer name/avatar]  │                                       │
│                         │  [Content]                            │
│  Navigation items:      │                                       │
│  • Dashboard            │                                       │
│  • Clients              │                                       │
│  • Schedule Builder     │                                       │
│  • Workout Library      │                                       │
│  • Invoicing            │                                       │
│  ─────────────          │                                       │
│  • Settings             │                                       │
│  [Subscription badge]   │                                       │
│  [Sign out]             │                                       │
└─────────────────────────────────────────────────────────────────┘
```

**Sidebar:**
- Dark background (`#0a0f1e`)
- Active nav item: left border accent (3px emerald), subtle background highlight
- Trainer name + plan badge ("Pro") below the logo
- Subscription badge at the bottom of the sidebar — if near client limit, show amber warning

**Main content area:**
- Background: `#020617` (same as JustFit app)
- Max-width for content: 1280px, centred
- Page header: page title (Barlow Condensed 32px) + optional actions (right-aligned)

**Mobile (< 768px):**
- Sidebar collapses to hamburger menu
- Bottom nav bar for the 5 main sections
- Full-width cards stacked vertically

---

## 4. Screen Designs Required

### Screen 1: Login

**Design intent:** Professional and minimal. Not identical to the consumer app login — more subdued, confidence-inspiring.

**Layout:** Centred card on dark background. JustFit logo + "Trainer" badge below it (e.g. "JustFit · Trainer Portal" as two-line lockup). Two fields (email, password). "Sign in with magic link" secondary option below. No social logins.

**Visual:** The background should have a very subtle gradient or vignette — not animated, not distracting. The card uses Surface 2 background, 28px radius, no excessive glow.

---

### Screen 2: Dashboard

**Design intent:** At a glance, I know how my clients are doing. My most urgent task (a client who hasn't trained in 8 days, or a pending invoice) is immediately visible.

**Top: KPI bar** (4 stat chips in a row)
- Total clients: 12
- Avg adherence this week: 74%
- Clients inactive > 7 days: 2 (red accent)
- Outstanding invoices: €340

**Client grid** (main content area)
- Card-based grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- Each client card:
  - Top: name (Inter Tight semibold) + goal chip (small rounded badge, e.g. "Build strength" in a muted teal)
  - Middle: adherence ring (circular, 48px) — filled percentage in emerald/amber/red based on rate; number in the center
  - Right of ring: "Last session" with relative time ("2 days ago" in secondary text; "> 7 days" in danger red)
  - Check-in dot: green = checked in today, gray = not yet, amber = checked in with low energy
  - Bottom: small "Note" icon if there's an active trainer note; "Trainer-set plan" chip if overrides are active
  - Hover state: card lifts slightly, a subtle "View details →" appears at the bottom
  - Click: opens Client Detail

**Filter bar** (above the grid): All | Needs attention | Checked in today | Overdue
**Sort dropdown**: Last active / Adherence / Name

**"Needs attention" filter** should highlight cards with a thin left border in amber/red.

---

### Screen 3: Client Detail

**Design intent:** I can see the full picture of one client and take action without leaving the page. Feels like a briefing card, not a spreadsheet.

**Layout:** Two-column layout (desktop)
- Left column (40%): client info panel (sticky)
- Right column (60%): scrollable cards

**Left panel — client info:**
- Avatar (initials-based, large circle, accent-coloured background)
- Name (Barlow Condensed, large)
- Goal badge + experience level
- Connected since: [date]
- Trainer overrides summary: compact list of active overrides with lock icon
- Quick actions: [Send note] [Edit overrides] [Disconnect client]

**Right column — cards:**

**Card A — Plan overview:**
- 7-day strip: Mon–Sun, each day showing session type (icon + name) or "Rest"
- Today highlighted with emerald border
- "AI-generated" vs "Trainer-set" sessions visually distinct (small icon/label)

**Card B — 30-day adherence heatmap:**
- GitHub contribution graph style: 5 rows × 7 columns (last ~35 days)
- Each cell: completed (emerald), partial (amber), missed (surface 3 = dark), rest (very dark, different texture)
- Legend below

**Card C — Aggregate check-in stats:**
- Two bar charts side by side: Average energy (14-day rolling) and Average mood (14-day rolling)
- Bars: emerald for values ≥7, amber for 5–6, red for <5
- Note below: "Individual check-in details are private to the client"

**Card D — Trainer overrides panel:**
- Goal override: chip (if active) or "User's own goal" in muted text
- Intensity modifier: −2 / −1 / 0 / +1 / +2 stepper
- Training days: day-of-week chip row (Mon–Sun toggles)
- Note to client: textarea (shown above today's session in the user app)
- [Save changes] primary button

**Card E — Recent sessions:**
- List: date, session name, duration (mono), perceived exertion (emoji + text), status badge
- Expandable to show more

---

### Screen 4: Schedule Builder

**Design intent:** Drag-and-drop weekly schedule template that's fast and visual. Gym trainers use this kind of interface with whiteboards — make it feel that intuitive.

**Layout:** Full-width grid
- Column headers: Mon / Tue / Wed / Thu / Fri / Sat / Sun
- Rows: depends on client count (if assigning to multiple clients: one row per client name; if single client: one row per week "slot")
- Each cell: contains a session card or "Rest day" label or is empty (AI handles it)

**Session cards in grid:**
- Compact card: session type icon + name + "Trainer" or "AI" badge
- Drag handle (6 dots) on the left
- Click on empty cell: dropdown appears with options: [Rest day] [Trainer workout] [AI session] [Goal session]
- Click on existing card: shows options to change or remove

**Sidebar (right, 280px):**
- Workout search/picker (when adding a trainer workout to a cell)
- Assignment options: This client / Selected clients / Group
- Date range: from / until

**Visual polish:**
- Trainer-assigned cells have a distinct emerald left border
- Rest days are visually lighter, almost invisible — they are the absence of activity
- The "this week" column is slightly highlighted

---

### Screen 5: Workout Library — My Workouts

**Design intent:** Feels like a personal recipe book. Trainers are proud of their programmes — the design should make each workout feel like a quality product.

**Workout cards (grid, 2 cols desktop):**
- Workout name (Barlow Condensed, 20px)
- Tags: goal chip + difficulty chip
- Exercise count + estimated duration (mono)
- Thumbnail-style exercise list (top 3 exercise names in muted text)
- [Edit] [Assign] [Duplicate] [Delete] actions on hover

**Create/Edit workout — full-page panel (slide-in from right or separate page):**

Top section:
- Workout name input (large, prominent)
- Goal chip selector (row of chips: Strength / Cardio / Mobility / Recovery / Mixed)
- Difficulty selector (Beginner / Intermediate / Advanced)

Exercise list (middle):
- Numbered list (1, 2, 3...)
- Each row: exercise name (with category icon) | sets | reps/duration | rest | drag handle | delete
- [+ Add exercise] button opens a search panel that slides in from the right:
  - Search input (autofocus)
  - Filter chips: category, equipment
  - Results list (name, category icon, equipment icons)
  - Click to add to workout
- Exercises are drag-reorderable (drag handle)

Bottom:
- [Save workout] primary button
- [Cancel] secondary

---

### Screen 6: Invoicing — Invoice List

**Design intent:** Clean, professional. Should look like a proper business tool, not a consumer app payment screen.

**Stats row (top):**
- This month revenue: €X (emerald)
- Outstanding: €X (amber if > 0)
- Overdue: €X (red if > 0)
- Total YTD: €X

**Invoice table:**
- Columns: Invoice # | Client | Date | Due | Amount | Status
- Status badge: Draft (gray) / Sent (blue) / Paid (emerald) / Overdue (red)
- Row actions on hover: [View] [Send] [Mark paid] [Void] — contextual to status
- Click row → opens invoice detail modal

**[+ New invoice] button** — top right, primary style

---

### Screen 7: Create Invoice (modal / slide-in panel)

**Design intent:** Should feel fast and professional. A trainer should be able to create and send an invoice to a client in under 60 seconds.

**Structure:**
- Client dropdown (only connected clients)
- Invoice date + due date (date pickers, default: today + 14 days)

Line items section:
- Table: Description | Qty | Unit price | VAT | Total
- [+ Add line] link below the table
- Each line is editable inline
- Auto-calculated row totals

Totals panel (right-aligned below the table):
- Subtotal: €X
- VAT: €X
- **Total: €X** (bold, larger)

Notes textarea (below totals)

Footer buttons:
- [Save as draft] — ghost button
- [Send to client] — primary emerald button

---

### Screen 8: Settings — Trainer Token

**Design intent:** The token/QR is a critical onboarding tool. It should look shareable and trustworthy — like a business card, not a technical setting.

**Layout:** Centred card within the settings page

- Section header: "Your Trainer Link"
- Description: "Share this QR code or link with your clients to connect them to your account on JustFit."

QR Code:
- Large (256×256px), white background, rounded corners
- Trainer name + studio name printed below the QR in the card
- "justfit.cc/join/[token]" URL in mono text below

Action buttons below:
- [Download QR (PNG)] — outlined button
- [Copy link] — outlined button
- [Regenerate token] — danger-styled text link with warning tooltip

---

## 5. Component Library

These components should be consistent across all trainer portal screens:

| Component | Spec |
|-----------|------|
| **Adherence ring** | 48px SVG circle, stroke-dasharray animation on load, color by rate (emerald/amber/red), percentage number in center (mono, 12px) |
| **Status badge** | Rounded pill, 12px, uppercase: Pending (gray), Active (emerald), Overdue (red), Paid (emerald outline), Sent (blue), Draft (gray) |
| **Goal chip** | Small rounded pill, 10px, muted color: strength (violet), cardio (blue), mobility (teal), recovery (orange) |
| **Day toggle** | Mon/Tue/Wed/Thu/Fri/Sat/Sun — circular 32px button, emerald fill when active |
| **Intensity stepper** | −2 / −1 / 0 / +1 / +2 — horizontal chip row, center always visible, active chip is emerald |
| **Client card** | Surface 2 bg, 28px radius, hover lift (translateY -2px + shadow increase) |
| **Data table** | Surface 2 bg header row, alternating Surface 1/Surface 2 data rows, 1px border between rows |
| **Primary button** | Emerald fill, 16px radius, Inter Tight 500, 14px, 40px height |
| **Ghost button** | Transparent, emerald border, same radius/type as primary |
| **Danger button** | `#ef4444` fill, same radius |
| **Input field** | Surface 3 bg, 14px radius, 1px border `rgba(255,255,255,0.12)`, focus: emerald border |
| **Search input** | Same as input field + magnifier icon left-inset |
| **Section header** | Barlow Condensed 700 24px, text primary |
| **Eyebrow label** | Inter Tight 600 11px uppercase, letter-spacing 0.08em, text secondary |
| **Stat card** | Surface 2 bg, 20px radius, eyebrow label + large mono value + small delta indicator |

---

## 6. Motion & Interaction

| Interaction | Animation |
|-------------|-----------|
| Page/section load | Content fades in 200ms, stagger 40ms per card |
| Card hover | `transform: translateY(-2px)` + `box-shadow` increase, 150ms ease |
| Sidebar nav active | Left border slides in 150ms |
| Modal open | Slide up from bottom 250ms + backdrop fade |
| Adherence ring | Stroke draw animation 600ms ease-out on first render |
| Status badge | Pulse animation on "Overdue" only (subtle, 2s loop) |
| "Mark as paid" | Check icon appears + badge transitions from amber to emerald 300ms |

All animations should respect `prefers-reduced-motion: reduce` — disable all transitions when true.

---

## 7. Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| ≥ 1280px | Full sidebar + 3-col client grid |
| 1024–1279px | Full sidebar + 2-col client grid |
| 768–1023px | Collapsed sidebar (icons only, expandable) + 2-col grid |
| < 768px | No sidebar, bottom nav tabs, 1-col grid |

On mobile, the Schedule Builder collapses to a day-by-day view (tab strip: Mon / Tue / Wed ...) rather than a full week grid.

---

## 8. Key Design Principles (Trainer Portal)

1. **Information density over decoration** — Trainers are professionals. They want to see data, not beautiful empty space. Design for scanability at 1440px.
2. **Action-oriented** — Every card should make the next action obvious. If a client needs attention, the action button should be right there.
3. **Professional authority** — This is the trainer's domain. The design should feel like the trainer is in control. Avoid consumer-app conventions (stories, streaks, badges).
4. **Consistent with JustFit identity** — Same dark palette, same emerald accent, same typefaces. But heavier, more structured, more information-dense.
5. **Privacy-by-design visible** — The trainer portal should have subtle but clear labelling on what data they can and cannot see. "Individual check-in details are private to the client" should appear near the check-in stats card, not hidden in terms. This builds trainer trust and protects users.

---

## 9. Page Prioritisation for Design

Design these screens in this order:

1. **Login** — entry point, must be polished
2. **Dashboard** — the daily-use screen; highest usage frequency
3. **Client Detail** — most time spent per session
4. **Create Invoice** — commercial feature; must feel trustworthy
5. **Workout Library — My Workouts + Create** — core professional tool
6. **Schedule Builder** — complex interaction, needs careful wireframe first
7. **Settings — Trainer Token** — first-time setup; critical for onboarding
8. **Invoice list** — secondary to create invoice

---

## 10. Deliverables Requested

- [ ] Component library (all components listed in section 5)
- [ ] All 8 screens above (desktop 1440px + mobile 390px)
- [ ] Key interaction states per screen (hover, active, empty state, error state)
- [ ] Empty states for: no clients yet, no workouts yet, no invoices yet
- [ ] Loading skeleton screens for the client grid and client detail
- [ ] Schedule Builder wireframe before visual design (interaction is complex)
- [ ] Color and typography tokens exported as CSS custom properties

---

## 11. What to Avoid

- Do NOT use Tailwind or CSS frameworks — all styles will be implemented inline in the portal JS
- Do NOT introduce new typefaces beyond Barlow Condensed, Inter Tight, and JetBrains Mono
- Do NOT use white backgrounds — this is a dark-mode only portal
- Do NOT use rounded corners > 28px for cards
- Do NOT make the portal feel like the consumer app (no playful icons, no motivational copy, no streak language)
- Do NOT use gradients on cards — flat Surface 2 background only, with borders
- Do NOT use more than 2 accent colors per screen (emerald + one warning/danger)

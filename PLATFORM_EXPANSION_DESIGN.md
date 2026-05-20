# JustFit Platform Expansion — Design Specification

`justfit.cc` · `trainer.justfit.cc` · `admin.justfit.cc`

---

## Overview

This document specifies three sets of changes:

1. **App rebalancing** — Demote coaches to add-on status in justfit.cc; goals become the primary UX anchor.
2. **Trainer portal** — `trainer.justfit.cc`: a back-office for human trainers to manage clients, build programmes, and invoice.
3. **Admin portal** — `admin.justfit.cc`: platform owner control over users, trainers, and B2B billing.

---

## Part 1 — App Adjustments (justfit.cc)

### 1.1 Problem Statement

Coaches (Cycling Coach, etc.) currently compete with general health goals for visual hierarchy and prominence. New users land in a "choose your coach" mental model rather than a "what is your health goal" mental model. This creates two problems:

- Users without a specific sport don't see themselves reflected.
- Coaches feel like the product, when they are a specialisation layer on top of the product.

### 1.2 Principle for the fix

**Goals are the product. Coaches are enhancements.**

A user's primary health goal (e.g. "Build strength") is always the centre of the experience. A coaching mode (e.g. "Cycling Coach") is an optional specialist layer that sits inside that goal, not beside it.

---

### 1.3 Onboarding Redesign

#### Current implied flow

Step 1: Sign up → Step 2: Profile basics → Step 3: Coach selection (too early) → Step 4: Goal setting

#### Redesigned flow

```
Step 1  Sign up / magic link
Step 2  What's your primary goal? (full-screen, 5 options, large tap targets)
Step 3  Tell us about you (age, sex, experience, available equipment, time per session)
Step 4  Your first plan is ready → land on Today's session immediately
Step 5  (Optional — surfaced 3 days after first session) "Want specialist coaching?" card
```

#### Goal options (Step 2)

| Goal label | Icon | Sub-label |
|------------|------|-----------|
| Lose weight & feel better | Flame | "Burn fat, build energy" |
| Build strength & muscle | Dumbbell | "Get stronger week by week" |
| Improve overall fitness | Heart | "More stamina, more capacity" |
| Boost energy & manage stress | Leaf | "Consistent movement, calmer mind" |
| Stay active during/after pregnancy | Baby | "Safe movement for every phase" |

Design: full-screen card list with large icon, label, sub-label. Single selection. Prominent "Continue" button.  No mention of coaches on this screen.

#### Step 3 — Profile (unchanged content, new order)

- Biological sex (for exercise safety filtering)
- Age range (for intensity scaling)
- Experience level (Beginner / Some experience / Active)
- Available equipment (chips: Bodyweight only / Dumbbells / Gym / Bike)
- Time per session (15 / 30 / 45 / 60 min)

Equipment chip "Bike" does NOT trigger the Cycling Coach. It only affects equipment filtering. The coach is surfaced later as a separate opt-in.

#### Step 5 — Coach discovery (deferred, contextual)

Surfaced after 3 completed sessions via a dismissable card in the home feed:

```
┌────────────────────────────────────────────┐
│ 🚴  Want structured cycling training?      │
│  Add the Cycling Coach to get FTP-based    │
│  interval sessions alongside your goal.   │
│                                            │
│  [Learn more]          [Not for me]        │
└────────────────────────────────────────────┘
```

Tapping "Learn more" opens a modal with the coach description and an "Activate" button. This is the only place coach enrolment happens in v1.

---

### 1.4 Home Screen (Dashboard) Redesign

#### Current hierarchy (problematic)

1. Check-in / Today's session
2. Coach card (Cycling Coach) — visually prominent, own section

#### New hierarchy

1. **Goal header** — small eyebrow text: "Building strength · Week 4" or "Improving fitness · Week 2"
2. **Check-in + Today's session** — primary card, unchanged
3. **Weekly progress ring** — visual of this week's sessions vs target
4. **Coach card** (if enrolled) — smaller, collapsible, labelled "Cycling Coach · Add-on"
   - Background: slightly different shade to signal it is a layer, not the main content
   - Label badge: "Add-on" pill in top-right corner

The Coach card should feel like a plugin, not a peer.

---

### 1.5 Settings Redesign

#### Current: "Your Coach" sub-view (implied prominent)

#### New: Settings hierarchy

```
Settings
├── You              (profile, equipment, time)
├── Your Goal        (primary goal + goal-specific settings)  ← NEW top-level
├── Coaches          (add-on coaches, each with their own card)
│   ├── Cycling Coach (if enrolled — settings, FTP, sub-goal)
│   └── [+ Add a coach] (surfaces other available coaches)
├── Privacy          (unchanged)
└── Account          (unchanged)
```

"Coaches" is a section, not the entry point. "Your Goal" is the section that comes first.

#### Your Goal settings card

- Change primary goal (with confirmation dialog)
- Training days per week
- Session length target
- Trainer-set overrides show here as a locked chip: "Set by your trainer [Name]" with a lock icon — read-only

---

### 1.6 Navigation Redesign

Bottom navigation tabs (unchanged structure, label/order tweak):

| Tab | Icon | Label |
|-----|------|-------|
| Home | House | Today |
| Progress | Chart | Progress |
| Plan | Calendar | This Week |
| Settings | Gear | Settings |

Coaches do not get their own tab. Coach-specific views (PMC chart, FTP history) remain inside the Progress tab behind a "Cycling" filter chip.

---

### 1.7 Trainer-connected UX adjustments

When a user is connected to a trainer, these UI changes apply:

- Home screen header gains: "Training with [Trainer Name]" small chip (tappable → shows trainer profile + disconnect option)
- Trainer-overridden settings show a lock icon and "Set by your trainer"
- Trainer messages/notes appear in a "From your trainer" card above today's session
- User can still check in freely; trainer cannot override check-in responses

Privacy note: the trainer sees the user's adherence, plan completion, and trainer-set parameters — NOT the user's detailed check-in text (mood, energy scores), medical signals (pregnancy, injury), or personal notes.

---

## Part 2 — Trainer Back-Office (trainer.justfit.cc)

### 2.1 Overview

`trainer.justfit.cc` is a web application for human fitness trainers (personal trainers, gym coaches, physios) to:

- Manage their client roster
- Set and adjust training plans per client
- Build custom workouts from the JustFit exercise library
- Invoice their clients at prices they set
- Track adherence and progress

Trainers access this via desktop primarily (web app, not a PWA). Mobile-responsive but desktop-first.

---

### 2.2 Commercial Model

```
JustFit (owner) ──bills──► Trainer/Gym (monthly licence fee)
                                │
                                │ manages + bills
                                ▼
                           Client Users
                       (use justfit.cc app)
```

- **Trainer licence tiers** (billed monthly by admin.justfit.cc):
  - Starter: up to 5 active clients
  - Pro: up to 25 active clients
  - Studio: unlimited clients

- Trainers set their own prices for their services and invoice clients via the platform.
- JustFit takes no cut of trainer-to-client invoicing (it is a convenience feature, not a marketplace).

---

### 2.3 Trainer Onboarding

1. Trainer applies at `trainer.justfit.cc/apply`
   - Name, email, gym/studio name (optional), specialisation, country
   - Agrees to trainer terms
2. Application submitted → JustFit admin approves in admin.justfit.cc
3. Trainer receives activation email → sets password
4. Trainer lands on their dashboard
5. First-time walkthrough: "Generate your trainer token" → share QR or link with clients

---

### 2.4 Client Connection Flow

```
Trainer generates token → Trainer shares QR / link (justfit.cc/join/[token])
  → Client (logged into justfit.cc app) scans QR or opens link
  → Client sees: "Connect to [Trainer Name] at [Studio]?"
    → [Connect]  [Cancel]
  → On connect:
    - trainer_connections row created
    - Client sees trainer chip on home screen
    - Trainer sees client appear in their dashboard
```

Token is permanent per trainer (one trainer = one token). Can be revoked and regenerated from trainer settings.

---

### 2.5 Screen / Tab Inventory

#### 2.5.1 Dashboard (default landing)

**Purpose:** Quick overview of all connected clients.

**Client grid cards** (one per client):
- Avatar initials + name
- Goal badge (e.g. "Build strength")
- Last session: "2 days ago" or "Never"
- Adherence ring: 7-day completion % (color: green ≥80 / amber 50–79 / red <50)
- Check-in dot: checked in today (green) / not yet (gray) / concern (amber if energy <4)
- Trainer note indicator (if trainer has set a note visible to client)
- Click → opens Client Detail

**Dashboard header:**
- Total clients: X / plan limit
- Average adherence this week: X%
- Clients with no activity > 7 days: X (red badge, clickable to filter)

**Filters/sort:**
- Filter: All / Needs attention / Checked in today / Overdue (>7 days inactive)
- Sort: Name / Last active / Adherence

---

#### 2.5.2 Client Detail

**Purpose:** Deep view of one client. Accessed by clicking a client card.

**Header:**
- Client name, goal, connected since date
- Quick actions: Send note | Adjust plan | View history

**Cards on this screen:**

**A — Plan overview**
- Current week: which sessions are planned (Mon–Sun strip)
- Today's planned session (name, intensity)
- Trainer schedule indicator (if trainer has overridden the AI plan)

**B — Adherence timeline**
- 30-day calendar heatmap: green = completed, amber = partial, red = missed, gray = rest day
- Session count this month

**C — Check-in summary (aggregate only — no personal details)**
- Average energy level (bar, last 14 days)
- Average mood (bar, last 14 days)
- Recovery mode activations this month (count)
- Note: detailed check-in text and medical/personal signals are NEVER shown to the trainer

**D — Trainer overrides**
Active trainer settings for this client:
- Training schedule (days override)
- Intensity modifier (e.g. "−1 level: recovering from illness")
- Primary goal override (if trainer has set a different goal)
- Note to client (what client sees above today's session)
[Edit overrides button]

**E — Session history list**
- Last 10 sessions: date, session name, duration, perceived exertion (emoji), completion status
- "View all" → expands to paginated history

---

#### 2.5.3 Schedule Builder

**Purpose:** Set a weekly training template for one or more clients.

**Interface:**
- 7-day column grid (Mon–Sun)
- Each day: drag a session type into the slot, or click to add
- Session types: AI-generated (default) / Rest / Trainer workout / Goal-specific session

**Trainer workout**: opens the workout library (2.5.4) to pick a workout to assign

**Assignment:**
- Assign to: [This client] or [Client group — see 2.5.6]
- Start date picker
- Repeat: One-off / Every week / Until [date]

**Save → writes trainer_schedule rows** (overrides the AI planner for those days).

---

#### 2.5.4 Workout Library

**Purpose:** Browse, save, and build workouts.

**Tabs within this section:**
1. **JustFit Library** — read-only browse of the full JustFit exercise database
   - Filter by: category (strength / cardio / mobility / recovery), equipment, tags
   - Each exercise: name, category, equipment, tags, instruction preview
   - Cannot edit JustFit library exercises (read-only)
   - [+ Add to my workout] button per exercise

2. **My Workouts** — trainer's saved custom workouts
   - List: name, goal tag, exercise count, estimated duration
   - [Create new workout] button
   - [Edit] / [Duplicate] / [Delete] per workout

3. **Create / Edit Workout**
   - Workout name (required)
   - Goal tag (chip selector: Strength / Cardio / Mobility / Recovery / Mixed)
   - Difficulty (Beginner / Intermediate / Advanced)
   - Exercise list (drag-reorderable):
     - Search exercises (queries JustFit library)
     - Per exercise: sets, reps or duration, rest, notes
     - Remove exercise
   - [Save workout]

**Trainer workouts** live in `trainer_workouts` table and can be assigned in the Schedule Builder.

---

#### 2.5.5 Invoicing

**Purpose:** Create and send invoices to clients for personal training services.

**Invoice list:**
- Table: client name, invoice number, date, amount, status (Draft/Sent/Paid/Overdue)
- Filters: client, status, date range
- [+ New invoice] button

**Create invoice:**
- Client: dropdown (connected clients)
- Invoice date: date picker
- Due date: date picker (default: +14 days)
- Line items:
  - Description (free text)
  - Quantity
  - Unit price (trainer sets their own price, their own currency)
  - VAT rate (dropdown: 0% / 9% / 21% / Exempt)
- Auto-calculated: subtotal, VAT, total
- Notes field (appears on invoice PDF)
- [Save as draft] / [Send to client]

**Send to client:**
- Email sent to client's JustFit account email
- PDF invoice attached
- Invoice also visible in client's JustFit app (future: client portal)

**Invoice PDF:**
- Trainer's name/studio as issuer
- Client name/address (if set)
- Line items table
- Subtotal, VAT, total
- Bank details (IBAN from trainer settings)
- "Powered by JustFit" attribution footer (small)

**Payment tracking:**
- [Mark as paid] button on sent invoices
- Overdue detection: > due_date and not paid → status = Overdue, amber badge
- Revenue summary card: this month / last month / outstanding

---

#### 2.5.6 Groups (optional, Pro+ tier)

**Purpose:** Manage clients in named groups (e.g. "Monday morning class", "Online clients").

- Create group (name, optional description)
- Assign clients to groups
- Apply schedule / workout to entire group at once
- Dashboard filter by group

---

#### 2.5.7 Settings

Sub-sections:

**Profile**
- Name, bio, certifications (free text)
- Profile photo upload
- Studio/gym name
- Country, website

**Trainer Token**
- Current token display (masked)
- QR code (shows full-size, downloadable as PNG)
- Shareable link: `justfit.cc/join/[token]`
- [Regenerate token] (with confirmation: existing connections remain, old link stops working)

**Invoicing**
- Business name (appears on invoices)
- Business address
- VAT number
- IBAN / payment details
- Default currency
- Default VAT rate
- Invoice numbering prefix (e.g. "PT-" → PT-2026-001)

**Subscription**
- Current plan (Starter / Pro / Studio)
- Clients used / limit
- Next billing date
- [Upgrade] button (links to plan comparison page)
- Payment history (invoices from JustFit for their licence)

**Notifications**
- Email when new client connects: on/off
- Email when client is inactive > 7 days: on/off
- Weekly adherence summary email: on/off

---

### 2.6 Database Schema Additions

```sql
-- Trainers
CREATE TABLE trainers (
  id TEXT PRIMARY KEY,
  user_id TEXT,               -- NULL until trainer creates a JustFit user account (optional)
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  studio_name TEXT,
  bio TEXT,
  certifications TEXT,
  country TEXT DEFAULT 'NL',
  website TEXT,
  profile_photo_key TEXT,     -- R2/storage key
  trainer_token TEXT UNIQUE,  -- permanent connection token
  status TEXT DEFAULT 'pending', -- pending | active | suspended
  plan TEXT DEFAULT 'starter',   -- starter | pro | studio
  invoice_prefix TEXT DEFAULT 'PT',
  invoice_currency TEXT DEFAULT 'EUR',
  invoice_vat_rate REAL DEFAULT 0.21,
  invoice_iban TEXT,
  invoice_business_name TEXT,
  invoice_address TEXT,
  invoice_vat_number TEXT,
  approved_at_ms INTEGER,
  approved_by TEXT,           -- admin user id
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

-- Trainer auth (separate from user auth)
CREATE TABLE trainer_auth (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES trainers(id),
  password_hash TEXT,
  last_login_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL
);

-- Trainer sessions (separate cookie namespace from user sessions)
CREATE TABLE trainer_sessions (
  id TEXT PRIMARY KEY,        -- SHA-256 of raw cookie
  trainer_id TEXT NOT NULL REFERENCES trainers(id),
  created_at_ms INTEGER NOT NULL,
  last_accessed_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  ip TEXT,
  user_agent TEXT
);

-- Trainer ↔ User connections
CREATE TABLE trainer_connections (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES trainers(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  connected_at_ms INTEGER NOT NULL,
  disconnected_at_ms INTEGER,     -- NULL = active
  status TEXT DEFAULT 'active',   -- active | disconnected
  UNIQUE(trainer_id, user_id)
);
CREATE INDEX idx_tc_trainer ON trainer_connections(trainer_id) WHERE status = 'active';
CREATE INDEX idx_tc_user ON trainer_connections(user_id) WHERE status = 'active';

-- Trainer overrides per user
CREATE TABLE trainer_user_settings (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES trainers(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  goal_override TEXT,              -- NULL = no override; one of the 5 goal keys
  intensity_modifier INTEGER DEFAULT 0, -- -2 to +2 (applied on top of user's level)
  training_days_json TEXT,         -- JSON array e.g. ["mon","wed","fri"] or NULL
  note_to_client TEXT,             -- shown above today's session in user app
  note_updated_at_ms INTEGER,
  updated_at_ms INTEGER NOT NULL,
  UNIQUE(trainer_id, user_id)
);

-- Trainer-built workouts
CREATE TABLE trainer_workouts (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES trainers(id),
  name TEXT NOT NULL,
  goal_tag TEXT,      -- strength | cardio | mobility | recovery | mixed
  difficulty TEXT,    -- beginner | intermediate | advanced
  exercises_json TEXT NOT NULL,  -- [{exercise_id, sets, reps, duration_sec, rest_sec, note}]
  estimated_duration_min INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

-- Trainer schedule assignments
CREATE TABLE trainer_schedules (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES trainers(id),
  user_id TEXT,       -- NULL = group assignment
  group_id TEXT,      -- NULL = individual assignment
  day_of_week TEXT,   -- mon | tue | wed | thu | fri | sat | sun
  session_type TEXT,  -- rest | trainer_workout | ai_generated | goal_session
  workout_id TEXT REFERENCES trainer_workouts(id),  -- when session_type = trainer_workout
  start_date TEXT,    -- YYYY-MM-DD
  end_date TEXT,      -- NULL = indefinite
  is_active INTEGER DEFAULT 1,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

-- Trainer groups (Pro+)
CREATE TABLE trainer_groups (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES trainers(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at_ms INTEGER NOT NULL
);

CREATE TABLE trainer_group_members (
  group_id TEXT NOT NULL REFERENCES trainer_groups(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  added_at_ms INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

-- Trainer invoices (trainer → client)
CREATE TABLE trainer_invoices (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES trainers(id),
  user_id TEXT NOT NULL REFERENCES users(id),  -- client
  invoice_number TEXT NOT NULL,               -- e.g. PT-2026-001
  status TEXT DEFAULT 'draft',                -- draft | sent | paid | overdue | void
  invoice_date TEXT NOT NULL,                 -- YYYY-MM-DD
  due_date TEXT,                              -- YYYY-MM-DD
  currency TEXT DEFAULT 'EUR',
  lines_json TEXT NOT NULL,                   -- [{description, quantity, unit_price, vat_rate, line_total}]
  subtotal REAL NOT NULL,
  vat_amount REAL NOT NULL,
  total REAL NOT NULL,
  notes TEXT,
  pdf_key TEXT,                               -- storage key for generated PDF
  sent_at_ms INTEGER,
  paid_at_ms INTEGER,
  voided_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);
CREATE INDEX idx_ti_trainer ON trainer_invoices(trainer_id, status);
CREATE INDEX idx_ti_user ON trainer_invoices(user_id);

-- Magic link tokens for trainer auth
CREATE TABLE trainer_magic_tokens (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES trainers(id),
  token_hash TEXT UNIQUE NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  consumed_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL
);
```

---

### 2.7 API Routes (trainer.justfit.cc)

All routes under `/api/trainer/*` are authenticated via `trainer_sessions` cookie.

```
POST   /auth/login                        Password login → session cookie
POST   /auth/magic-link                   Request magic link email
GET    /auth/magic-link/:token            Consume token → session cookie
GET    /auth/logout                       Clear session
GET    /api/trainer/me                    Current trainer profile

GET    /api/trainer/clients               List connected clients (with adherence snapshot)
GET    /api/trainer/clients/:user_id      Client detail (profile, adherence, history)
GET    /api/trainer/clients/:user_id/sessions   Session history (paginated)
GET    /api/trainer/clients/:user_id/checkins   Aggregated check-in stats (no personal details)

GET/PUT   /api/trainer/clients/:user_id/settings   Trainer overrides for this client
DELETE    /api/trainer/clients/:user_id/disconnect  Disconnect client

GET/POST  /api/trainer/workouts           List / create trainer workouts
GET/PUT/DELETE  /api/trainer/workouts/:id  Workout CRUD

GET/POST  /api/trainer/schedules          List / create schedule assignments
DELETE    /api/trainer/schedules/:id      Remove schedule assignment

GET/POST  /api/trainer/groups             List / create groups (Pro+)
POST      /api/trainer/groups/:id/members Add member to group
DELETE    /api/trainer/groups/:id/members/:user_id Remove member

GET/POST  /api/trainer/invoices           List / create invoices
GET       /api/trainer/invoices/:id       Invoice detail
PATCH     /api/trainer/invoices/:id       Actions: send | paid | void
GET       /api/trainer/invoices/:id/pdf   Stream PDF

GET/PUT   /api/trainer/settings/profile   Trainer profile settings
GET/PUT   /api/trainer/settings/invoice   Invoice/billing settings
POST      /api/trainer/settings/token/regenerate  Regenerate trainer token

-- Public (no auth)
POST   /api/public/trainer/apply          Submit trainer application
GET    /api/public/trainer/token/:token   Validate token → return trainer name/studio for consent screen
```

**Justfit.cc user app additions:**

```
POST   /api/connect/trainer               User connects to trainer (body: {token})
DELETE /api/connect/trainer               User disconnects from trainer
GET    /api/connect/trainer               Get current trainer connection info
```

---

## Part 3 — Admin Portal (admin.justfit.cc)

### 3.1 Overview

`admin.justfit.cc` is the JustFit owner's back-office. It mirrors the Podfy admin pattern: authenticated, desktop-first, full platform visibility and control.

Key capabilities:
- Manage all users and trainers
- Approve/reject trainer applications
- Set trainer subscription plans and billing
- Platform analytics dashboard
- Exercise library management

---

### 3.2 Authentication

- Email/password login (PBKDF2-SHA256)
- Magic link option
- Session: JWT cookie, 2h TTL, rolling via ping
- Separate `admin_justfit_users` table — no overlap with end-user accounts

---

### 3.3 Tab Inventory

#### 3.3.1 Dashboard

**Platform KPIs (top row):**
- Total registered users (all time)
- Active users (logged in last 30 days)
- Total active trainers
- MRR (monthly recurring revenue from trainer licences)
- New sign-ups this month (sparkline)
- New trainers this month

**Trainers needing action (highlighted):**
- Pending applications (approval required) — count badge
- Suspended trainers
- Trainers near their client limit

**Recent events feed:**
- New trainer application: [Name, Studio, date]
- Trainer approved: [Name]
- Trainer suspension: [Name]
- Billing events (invoice generated, paid, overdue)
- Platform errors (surfaced from `app_events` table)

---

#### 3.3.2 Users

**User list:**
- Columns: email, name, goal, created, last active, session count, subscription status, trainer connection (name if connected)
- Search: email / name
- Filters: subscription status (active / trial / expired) / trainer (connected / standalone) / goal

**User detail modal:**
- Profile summary (goal, experience, equipment)
- Subscription status + dates
- Session history (count by month)
- Trainer connection (name + connected date, if any)
- Actions:
  - [Reset password] (sends magic link)
  - [Deactivate account]
  - [Delete account] (GDPR — soft delete)
  - [View sessions] (modal with session list)

---

#### 3.3.3 Trainers

**Trainer list:**
- Columns: name, studio, email, plan, clients (used/limit), status, applied, approved, MRR contribution
- Filters: status (pending / active / suspended)
- Sort: name / clients / applied date

**Pending applications sub-view:**
- Application details: name, studio, specialisation, country, email, applied date
- Actions: [Approve] / [Reject with email]
- On approve: status → active, activation email sent

**Trainer detail modal:**
- Full profile view
- Connected clients (count + list)
- Subscription info (plan, billing cycle, next invoice date)
- Invoice history (JustFit → trainer invoices)
- Actions:
  - [Change plan] (Starter / Pro / Studio)
  - [Suspend trainer] (clients remain connected, trainer loses login access)
  - [Reactivate trainer]
  - [Delete trainer] (must manually reassign/notify clients)

---

#### 3.3.4 Billing (JustFit → Trainers)

**Overview card:**
- Total MRR
- Active subscriptions by plan
- Outstanding invoices (count + total amount)

**Invoices table:**
- Trainer name, plan, period, amount, status (draft/sent/paid/overdue), invoice date, due date
- Actions: Finalise / Resend / Mark paid

**Invoice generation:**
- Manual: [Generate invoice for trainer] → select trainer → generates based on their plan
- Auto: cron on 1st of each month generates invoices for all active trainers

**Plan pricing configuration:**
- Set monthly price per plan (Starter / Pro / Studio)
- Effective from date
- Per-trainer overrides (custom agreed pricing)

---

#### 3.3.5 Exercise Library

**Exercise list:**
- Table: name, category, tags, equipment, active/inactive
- Search + filter by category, tag, equipment
- [+ Add exercise] button

**Exercise form:**
- Name
- Category (strength / cardio / mobility / recovery)
- Tags (chips, multi-select from defined taxonomy)
- Equipment required (chips)
- Equipment advised (chips)
- Instructions (step list editor)
- Coaching cues (list editor)
- Pregnancy note (optional)
- Postnatal note (optional)
- Alternatives (search other exercises)
- Active / inactive toggle

**Bulk operations:**
- Deactivate selected
- Tag selected exercises
- Export to JSON

---

#### 3.3.6 Platform Settings

- Admin user management (add/remove admin accounts, set passwords)
- Magic link settings (expiry duration)
- Session TTL
- Trainer application email template
- Billing email settings (from address, reply-to)
- Invoice numbering (next invoice number for trainer billing)

---

### 3.4 Database Schema Additions

```sql
-- Admin users (JustFit owner team)
CREATE TABLE admin_justfit_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',  -- admin | viewer
  password_hash TEXT,
  is_active INTEGER DEFAULT 1,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

-- Admin sessions
CREATE TABLE admin_justfit_sessions (
  id TEXT PRIMARY KEY,  -- SHA-256 of raw cookie
  user_id TEXT NOT NULL REFERENCES admin_justfit_users(id),
  created_at_ms INTEGER NOT NULL,
  last_accessed_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  ip TEXT,
  user_agent TEXT
);

-- Trainer licence billing (JustFit → trainers)
-- Uses trainer_id and the trainers table; invoices stored in trainer_billing_invoices
CREATE TABLE trainer_billing_invoices (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES trainers(id),
  invoice_number TEXT NOT NULL,   -- e.g. JF-2026-001
  status TEXT DEFAULT 'draft',    -- draft | sent | paid | overdue | void
  period TEXT NOT NULL,           -- e.g. 2026-M05
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  plan TEXT NOT NULL,             -- starter | pro | studio
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'EUR',
  invoice_date TEXT NOT NULL,
  due_date TEXT,
  pdf_key TEXT,
  notes TEXT,
  sent_at_ms INTEGER,
  paid_at_ms INTEGER,
  voided_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

-- Trainer plan pricing
CREATE TABLE trainer_plan_pricing (
  id TEXT PRIMARY KEY,
  plan TEXT NOT NULL,             -- starter | pro | studio
  price_monthly REAL NOT NULL,
  currency TEXT DEFAULT 'EUR',
  effective_from TEXT NOT NULL,   -- YYYY-MM-DD
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at_ms INTEGER NOT NULL
);

-- Per-trainer pricing overrides
CREATE TABLE trainer_pricing_overrides (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES trainers(id),
  price_monthly REAL NOT NULL,
  currency TEXT DEFAULT 'EUR',
  effective_from TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at_ms INTEGER NOT NULL
);

-- Admin audit log
CREATE TABLE admin_justfit_audit (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES admin_justfit_users(id),
  action TEXT NOT NULL,  -- e.g. trainer.approve, trainer.suspend, plan.change, invoice.send
  target_type TEXT,      -- trainer | user | invoice
  target_id TEXT,
  payload TEXT,          -- JSON
  created_at_ms INTEGER NOT NULL
);
```

---

### 3.5 API Routes (admin.justfit.cc)

All routes under `/api/admin/*` require admin session cookie.

```
POST   /api/admin/login               Password login → session cookie
POST   /api/admin/magic-link          Request magic link email
GET    /api/admin/magic-link/:token   Consume token → session
GET    /api/admin/logout              Clear session
GET    /api/admin/me                  Current admin user

-- Dashboard
GET    /api/admin/dashboard           Platform KPIs + events

-- Users
GET    /api/admin/users               Paginated user list (search, filter)
GET    /api/admin/users/:id           User detail + session history
PATCH  /api/admin/users/:id          Actions: deactivate | reset | delete

-- Trainers
GET    /api/admin/trainers            Paginated trainer list (filter by status)
GET    /api/admin/trainers/pending    Applications awaiting approval
POST   /api/admin/trainers/:id/approve  Approve trainer + send activation email
POST   /api/admin/trainers/:id/reject   Reject with reason email
PATCH  /api/admin/trainers/:id       Update plan / suspend / reactivate
GET    /api/admin/trainers/:id       Trainer detail (profile + clients + billing)

-- Trainer billing
GET    /api/admin/trainer-billing/invoices   All trainer billing invoices
POST   /api/admin/trainer-billing/invoices   Create invoice for trainer
PATCH  /api/admin/trainer-billing/invoices/:id  Actions: send | paid | void
GET    /api/admin/trainer-billing/pricing    Current plan pricing table
PUT    /api/admin/trainer-billing/pricing    Update plan pricing

-- Exercise library
GET    /api/admin/exercises          Paginated exercise list (search, filter)
POST   /api/admin/exercises          Create exercise
GET    /api/admin/exercises/:id      Exercise detail
PUT    /api/admin/exercises/:id      Update exercise
PATCH  /api/admin/exercises/:id     Toggle active/inactive

-- Admin users
GET    /api/admin/team               Admin user list
POST   /api/admin/team               Create admin user
PATCH  /api/admin/team/:id          Activate/deactivate
POST   /api/admin/me/password        Set/change password

-- Audit
GET    /api/admin/audit              Audit log (paginated, searchable)
```

---

## Part 4 — User App API Additions

These additions are required in the existing `justfit.cc` Pages Functions:

```javascript
// functions/api/trainer-connect.js
// POST: user connects to trainer via token
//   body: { token: "abc123" }
//   1. Look up trainer by trainer_token
//   2. Check trainer is active + within client limit
//   3. Create trainer_connections row
//   4. Populate trainer_user_settings with defaults
//   Returns: { ok: true, trainer: { name, studio_name } }

// DELETE: user disconnects from their trainer
//   1. Sets trainer_connections.status = 'disconnected' + disconnected_at_ms
//   2. Clears trainer_user_settings overrides (optional: preserve as archived)
//   Returns: { ok: true }

// GET: get current trainer connection
//   Returns: { ok: true, trainer: null } or { ok: true, trainer: { name, studio_name, connected_at_ms } }
```

The plan.js engine must also read `trainer_user_settings` for the current user and apply:
- `goal_override` → replaces user's self-set goal for plan generation
- `intensity_modifier` → shifts the intensity level ±
- `training_days_json` → restricts which days sessions are generated

Both overrides are applied with lower priority than safety signals (check-in pain, recovery mode, etc.).

---

## Part 5 — Deployment Architecture

| Component | Type | Domain | Tech |
|-----------|------|--------|------|
| User app | Existing CF Pages | justfit.cc | React + Vite |
| Trainer portal | New CF Pages | trainer.justfit.cc | Plain HTML/JS + Pages Functions |
| Admin portal | New CF Pages | admin.justfit.cc | Plain HTML/JS + Pages Functions |
| Shared DB | Existing D1 | — | justfit-db |
| Email | Existing Resend | — | trainer@justfit.cc from address |

Both new portals follow the same no-npm Pages Functions constraint as the existing project.

---

## Part 6 — Privacy & Consent Design

**What trainers can see:**
- Client's goal (set during onboarding or trainer-overridden)
- Aggregate adherence (sessions completed vs planned, last 30 days)
- Aggregate check-in stats (average energy, average mood — numbers only, no text)
- Session history (date, session name, duration, perceived exertion rating)
- Trainer-set parameters they themselves configured

**What trainers cannot see:**
- Check-in free text entries
- Medical signals (pregnancy status, postnatal state, pain areas, injury details)
- Email address or other PII beyond name
- Individual check-in mood/energy scores (only the 14-day rolling average)

**Consent in the app:**
- On connecting to a trainer, user sees a clear consent screen listing exactly what data the trainer will access
- User can disconnect at any time from Settings → Your Trainer → Disconnect
- On disconnect: trainer immediately loses access to all data (soft-delete the connection)

**Data minimisation:**
- Trainer portal never queries `daily_checkins.checkin_json` (the raw JSON blob)
- Trainer adherence endpoint: computed aggregate only — no raw check-in rows returned
- This is enforced at the API level, not just the UI level

---

## Next Steps / Implementation Order

```
1. DB migrations (trainer tables + admin tables) — one migration file each
2. trainer.justfit.cc — auth + client roster (shell + dashboard)
3. justfit.cc — trainer connect endpoint + app UI (chip, consent screen, settings)
4. trainer.justfit.cc — client detail + overrides
5. trainer.justfit.cc — workout library + schedule builder
6. trainer.justfit.cc — invoicing
7. admin.justfit.cc — auth + trainer management (most critical: approvals)
8. admin.justfit.cc — user management
9. admin.justfit.cc — billing (trainer licences)
10. admin.justfit.cc — exercise library editor
11. onboarding redesign (justfit.cc)
12. home screen + settings redesign (justfit.cc)
```

Items 1–4 are the minimum viable trainer product. Items 7–8 are the minimum viable admin product. Onboarding and home screen redesign (11–12) can run in parallel with items 5–6.

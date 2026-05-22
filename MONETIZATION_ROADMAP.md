# JustFit — Monetization & Growth Roadmap [SUPERSEDED]

**Version:** 2.0 — SUPERSEDED 2026-05-22
**Status:** This document has been replaced by two focused files:

- **[ROADMAP.md](../ROADMAP.md)** — All improvements, bugs, fixes, and enhancements across all 4 products
- **[FUNCTIONAL_DOCS.md](../FUNCTIONAL_DOCS.md)** — What is live: architecture, billing flows, B2B2C, pricing, deploy commands

The content below is retained as historical reference only.

---

## Table of Contents

1. [Ecosystem Overview](#1-ecosystem-overview)
2. [Architecture per Product](#2-architecture-per-product)
3. [Domain Strategy](#3-domain-strategy)
4. [Language Strategy](#4-language-strategy)
5. [Pricing Model](#5-pricing-model)
6. [Trust & Positioning](#6-trust--positioning)
7. [Phased Roadmap](#7-phased-roadmap)
8. [Revenue Model](#8-revenue-model)

---

## 1. Ecosystem Overview

JustFit is two commercial products sharing one database and one identity system.

```
justfit.cc              — Marketing & company site (live — justfit-marketing CF Pages)
app.justfit.cc          — Consumer fitness PWA (live — justfit-app CF Pages)
trainer.justfit.cc      — Trainer/gym practice management SaaS (live)
admin.justfit.cc        — Owner control panel (live)

All products share:
  justfit-db (Cloudflare D1)
  JWT auth (shared JWT_SECRET)
  Mollie payment processor
```

The shared identity creates the B2B2C flywheel: a trainer's client is also a consumer app user. When a trainer's subscription is live, their clients can receive Pro features automatically — no second sale required.

---

## 2. Architecture per Product

### Product 1 — Consumer App (`app.justfit.cc`)

**Purpose:** Daily adaptive training coach for individuals. Free to start, Pro for serious athletes.

**Stack:**
- Cloudflare Pages project: `justfit`
- Frontend: React + Vite (monorepo `packages/client-app/`)
- API: Cloudflare Pages Functions (`functions/api/`)
- Database: D1 `justfit-db` (binding `DB`)
- Auth: JWT HMAC-SHA256, magic link, passkeys
- Payments: Mollie recurring subscriptions (live — consumer Pro billing)
- PWA: manifest, offline cache (IndexedDB), wake lock

**Live domain:** `app.justfit.cc` (migration complete)

**Free tier — what's included:**
- Adaptive daily planning + check-in system
- General fitness mode (all rules R510–R565)
- Military Coach (Keuring K1–K6 / Opleiding O1–O7)
- Women's health (cycle, pregnancy, postnatal, perimenopause)
- Exercise library (306 exercises), workout execution coaching
- Consistency scoring, awards/milestones
- Strava connect (connect, not sync — sync is Pro)
- Guest mode (no email required)

**Pro tier — what's gated:**
- Running Coach (structured programmes 5km → 50km)
- Cycling Coach (FTP model, TSS, PMC chart, structured workouts)
- Strava activity sync + TSS ingestion
- TCX / ZWO / ERG file export
- Polarised training mode
- Advanced cycling cross-training runs
- Future: AI coaching notes, custom programme builder

**Entitlements model (D1):** ✅ Live
```
entitlements
  user_id        — FK → users
  product_code   — 'pro_consumer'
  source         — 'mollie_sub' | 'trainer_grant' | 'voucher' | 'trial'
  status         — active | trialing | grace | canceled | expired
  starts_at_ms
  ends_at_ms
  mollie_sub_id  — Mollie subscription ID (migration 0072)
  mollie_customer_id — Mollie customer ID (migration 0072)
```

**Enforcement:** `plan.js` checks entitlements table for `isPro`. `preferences_json.isPro` remains as manual admin override. ProGate.jsx upgrade wall live. PathChoiceModal locks Running/Cycling for non-Pro users.

---

### Product 2 — Marketing Site (`justfit.cc`)

**Purpose:** Company homepage, product explainer, pricing page, trainer landing, blog/SEO. Converts visitors to app signups and trainer trials.

**Status: ✅ Live at `justfit.cc`**

**Stack:**
- Cloudflare Pages project: `justfit-marketing`
- Pure HTML/CSS — no framework, no bundler, no React
- Dutch primary, English mirror at `/en/` path prefix
- Static assets served directly by Cloudflare CDN — fast everywhere

**Why separate from the app:**
- SEO requires crawlable static HTML — the React SPA is not crawlable
- The marketing site and the product have different release cadences
- Pricing pages, blog, legal pages, and trainer landing all need to be standalone, not nested in the app shell
- `justfit.cc` must work without a login — it is the public face of the company

**Pages (Dutch primary) — 8 live pages:**
```
/              index.html     — NL homepage (value prop, 3 user paths, live stats counter)
/prijzen       prijzen.html   — NL pricing (consumer + trainer tiers, early bird)
/trainers      trainers.html  — NL trainer portal landing
/over-ons      over-ons.html  — NL about / founder story
/en/           en/index.html  — EN homepage
/en/pricing    en/pricing.html — EN pricing
/en/trainers   en/trainers.html — EN trainer landing
/en/about      en/about.html  — EN about
```

**Pending (not yet built):**
```
/privacy       — Privacy policy page
/voorwaarden   — Terms page
/blog/         — SEO content (training tips, Dutch military fitness, cycling coaching)
```

**Conversion flows:**
```
Homepage CTA "Start gratis" → app.justfit.cc/login.html?signup=1
Pricing "Kies Pro"          → app.justfit.cc/upgrade (new route)
Trainer landing "Probeer gratis" → trainer.justfit.cc
Blog article                → Homepage CTA → signup
```

**Trust signals on every page:**
- Session count pulled from admin API: "Al X workouts gelogd"
- "Nederlands bedrijf · AVG-compliant" badge
- 30-day money-back guarantee
- Cancel-anytime language
- Founder name and story (personal trust)
- GDPR/AVG badge

---

### Product 3 — Trainer Portal (`trainer.justfit.cc`)

**Purpose:** Practice management SaaS for personal trainers and small gyms. Client management, programme assignment, invoicing, BTW/VAT administration, GDPR/AVG compliance tooling.

**Stack:**
- Cloudflare Pages project: `justfit-trainer`
- Frontend: React + TypeScript + Tailwind v4 (monorepo `packages/trainer-app/`)
- API: Cloudflare Pages Functions (`functions/api/trainer/`)
- Database: D1 `justfit-db` (same as consumer app — shared user identity)
- Auth: JWT (shared `JWT_SECRET`), gym context via `X-Gym-Id` header
- Encryption: per-gym AES-GCM 256-bit keys, `GYM_MASTER_KEK`
- Payments: Mollie (trainer invoicing to clients already wired; portal subscription billing to add)

**Live tier model:** ✅ Active — subscription billing on `gyms` table (migration 0072)

| Tier | `sub_tier` value | Client limit | Trainers | BTW module | Price |
|---|---|---|---|---|---|
| Starter | `starter` | 15 active | 1 | No | €24/mo early bird → €29/mo |
| Pro | `pro` | Unlimited | 1 | Yes | €39/mo early bird → €59/mo |
| Gym | `gym` | Unlimited | Unlimited | Yes | €99/mo early bird → €149/mo |

Early bird = first 50 `mollie_sub` gyms. All gyms get 30-day trial (migration 0072 backfill).

**Gate enforcement — live:**
- `trainer/clients.js` — 402 when `sub_tier='starter'` and client count ≥ 15
- `trainer/btw/*` — 403 for `sub_tier='starter'` (4 endpoints)
- In-app: trial expiry banner (≤7 days), BTW lock modal, client limit banner, tier badge in sidebar

**B2B2C grant mechanism:** ✅ Live (`functions/lib/b2b2c.js`)
- `grantClientEntitlements(gymId, subEndsAtMs, DB)` — upserts `trainer_grant` entitlement for all gym clients
- `revokeClientEntitlements(gymId, DB)` — sets status=expired on all trainer_grant entitlements for the gym
- Called from Mollie trainer webhook (paid/recurring → grant; canceled → revoke)
- Called from DELETE /api/trainer/subscribe (cancel flow → revoke)
- Called from POST /api/connect (new client joins active gym → grant immediately, no webhook wait)

Unique index `idx_entitlements_user_source_product` on `(user_id, source, product_code)` ensures idempotent grants.

**Trainer portal subscriptions:** ✅ Live — `sub_status`, `sub_tier`, `sub_source`, `sub_starts_at_ms`, `sub_ends_at_ms`, `mollie_customer_id`, `mollie_sub_id` columns on `gyms` table (migration 0072). Mollie recurring subscription created via `POST /api/trainer/subscribe`.

---

### Product 4 — Admin Portal (`admin.justfit.cc`)

**Purpose:** Owner-only control panel. Platform KPIs, user management, trainer approval, billing overview, exercise CRUD.

**No changes to billing model.** The admin portal is the dashboard, not a revenue source. Two additions needed:
- Revenue dashboard: MRR, active Pro users, active trainer subscriptions, churn
- Manual entitlement grants: owner can set any user to Pro indefinitely (for partnerships, press, early users)

---

## 3. Domain Strategy

### Current state ✅ Resolved (2026-05-21)

```
justfit.cc     = justfit-marketing CF Pages (static HTML/CSS, 8 pages live)
app.justfit.cc = justfit-app CF Pages (React SPA — consumer PWA)
```

The domain split is complete. Marketing and product are separate deployments.

### Achieved state

```
justfit.cc              — Marketing site (separate CF Pages project, pure HTML/CSS)
app.justfit.cc          — Consumer PWA (existing CF Pages project, add custom domain)
trainer.justfit.cc      — Trainer portal (existing, unchanged)
admin.justfit.cc        — Admin portal (existing, unchanged)
```

### Migration plan

**Step 1 — Add `app.justfit.cc` custom domain to the existing `justfit` Pages project**
- Cloudflare Dashboard → Pages → justfit → Custom domains → Add `app.justfit.cc`
- No code change required — the app already works on any domain

**Step 2 — Update all internal links and redirect targets**
- `public/login.html` redirect after login: update `window.location` from `justfit.cc` to `app.justfit.cc`
- Magic link emails (`/api/auth` magic link): update redirect URL to `app.justfit.cc/magic.html`
- Password reset email: update redirect to `app.justfit.cc/reset-password.html`
- Strava OAuth redirect URI: update in Strava app settings + `STRAVA_REDIRECT_URI` env var

**Step 3 — Build the marketing site**
- New repo or subdirectory: `justfit-marketing/`
- New CF Pages project: `justfit-marketing` → connect to `justfit.cc` custom domain
- The existing `public/index.html` marketing page becomes the starting point — expand it significantly

**Step 4 — Redirect `justfit.cc/api/*` and `justfit.cc/app/*`**
- Add `_redirects` in the marketing site: `justfit.cc/app/* → app.justfit.cc/:splat 301`
- Old deep links still work

**Step 5 — Remove the marketing page from the app project**
- `public/index.html` in the app project can be simplified to just redirect to `justfit.cc` for unauthenticated root visits

**WebAuthn note:** The `WEBAUTHN_RP_ID` must be updated to `app.justfit.cc` after the move, or set to `justfit.cc` and use `rpId: 'justfit.cc'` so passkeys registered on the old domain still work. The safest path is keeping `RP_ID = justfit.cc` (parent domain covers subdomain passkey auth in WebAuthn spec).

---

## 4. Language Strategy

### Decision: Dutch-first, English toggle from day one

**Why Dutch-first:**
- The trainer market (BTW, DPA, KOR, invoicing in euros) is definitively Dutch
- The Military Coach (Keuring/Opleiding, Cooper test, march weight) targets a Dutch-speaking audience with no English equivalent
- Dutch SEO for "fitness app" and "personal trainer software" has far less competition than English
- AVG/GDPR compliance framing resonates stronger in Dutch ("Jouw data is van jou")
- Being explicitly Dutch is a trust signal in the NL market — consumers prefer local over unknown American SaaS

**Why English toggle (not English-only):**
- Cycling and running communities are globally English-dominant (FTP, TSS, PMC, Zone 2 are universal English terms — these stay in English in both languages)
- Strava, TrainingPeaks, Garmin are English — users of those integrations expect English alongside
- International trainers working in the Netherlands exist
- Long-term European expansion starts from a bilingual base

**What gets translated:**

| Component | Dutch | English | Notes |
|---|---|---|---|
| Marketing site (justfit.cc) | Primary | `/en/` path | SEO-driven Dutch content |
| App UI strings | Primary | Toggle | Session names, nav, settings labels, onboarding |
| App coaching notes | Primary | Toggle | Plan session names, rule trace labels, check-in copy |
| Planner rule names | Keep EN codes | — | R510–R582 codes stay technical/EN internally |
| Training terminology | Keep EN | — | FTP, TSS, Zone 2, PMC — never translate these |
| Trainer portal | Primary | Toggle | BTW, factuur, DPA all have existing Dutch UI text |
| Legal documents | Primary + EN | Both | AVG (NL) and GDPR (EN) are different audiences |
| Emails (Resend) | Dutch | — | Welcome, magic link, invoice emails |

**What stays English regardless:**
- FTP, TSS, PMC, Zone 2, Intervals, Endurance — training science terms
- Strava, Garmin, TrainingPeaks — brand names
- Internal code: all JS/TS stays English (function names, DB columns, API responses)
- API responses: `{ session_name: "..." }` values can be translated; keys stay English

**Implementation approach — no heavy i18n library:**

Use a simple translation object in the app. Since Functions cannot use npm, and the client app currently uses inline styles without a build-time i18n system, implement a minimal `src/i18n.js` module:

```javascript
// src/i18n.js
const LANG_KEY = 'jf_lang'; // 'nl' | 'en'

export const getLang = () => localStorage.getItem(LANG_KEY) ?? 'nl';
export const setLang = (l) => { localStorage.setItem(LANG_KEY, l); location.reload(); };

export function t(key) {
  const lang = getLang();
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['nl'][key] ?? key;
}

const TRANSLATIONS = {
  nl: {
    'nav.today': 'Vandaag',
    'nav.plan': 'Plan',
    'nav.progress': 'Voortgang',
    'nav.coach': 'Coach',
    'session.rest': 'Rustdag',
    'checkin.title': 'Hoe voel je je vandaag?',
    // ... etc
  },
  en: {
    'nav.today': 'Today',
    'nav.plan': 'Plan',
    'nav.progress': 'Progress',
    'nav.coach': 'Coach',
    'session.rest': 'Rest day',
    'checkin.title': 'How are you feeling today?',
    // ... etc
  }
};
```

Language toggle: a small NL/EN switch in Settings → Account. Flag icon, single tap, reloads the page. Does not require a server round-trip — the language is a client-side preference.

**Dutch-first rollout order:**
1. Marketing site (justfit.cc) — write in Dutch from the start; add EN mirror later
2. Trainer portal — already has Dutch concepts (BTW, factuur, AVG); add `t()` hook
3. App UI strings — onboarding, nav, settings labels first (high visibility, low volume)
4. App coaching copy — session names, check-in prompts, rule descriptions (larger volume)

---

## 5. Pricing Model

### Consumer App (app.justfit.cc)

#### Early bird pricing (first 200 Pro subscribers)

| Plan | Early Bird | Standard (after first 200) |
|---|---|---|
| Pro Monthly | **€4.99/month** | €6.99/month |
| Pro Annual | **€4.00/month** billed as €48/year | €5.00/month billed as €59.99/year |

Early bird subscribers lock in their price permanently (grandfathered). This is a strong acquisition and word-of-mouth tool — people tell others about deals they're in on.

Display on pricing page and in the upgrade wall:
```
Pro — Vroegboekkorting
~~€6.99~~ €4.99 /maand   [Maandelijks starten]
~~€59.99~~ €48 /jaar     [Jaarlijks — beste deal]  ← pre-selected
Nog 147 plekken over op dit tarief
```

Show the remaining slots counter on the pricing page. When 200 are reached, the counter disappears and the standard price takes effect. The admin portal can manage this threshold.

#### What free gets, what Pro gets (visible on pricing page)

| | Gratis | Pro |
|---|---|---|
| Dagelijks plan + check-in | Ja | Ja |
| Militaire coach (Keuring/Opleiding) | Ja | Ja |
| Vrouwengezondheid (cyclus, zwangerschap, postnataal) | Ja | Ja |
| 306 oefeningen + workout coaching | Ja | Ja |
| Consistentiescore + awards | Ja | Ja |
| Hardloopcoach (5km → 50km programma's) | — | Ja |
| Fietscoach (FTP, TSS, PMC, gestructureerde workouts) | — | Ja |
| Strava synchronisatie + TSS import | — | Ja |
| TCX / ZWO / ERG export | — | Ja |
| Gepolariseerd trainingsschema | — | Ja |
| Door trainer toegewezen Pro toegang | — | Automatisch |

#### Mollie recurring subscription

Use the existing `lib/mollie.js createSubscription()`. Flow:
1. User clicks upgrade CTA → `POST /api/subscribe { plan: 'pro_monthly' | 'pro_annual' }`
2. API creates Mollie customer + first payment (mandate)
3. On payment success webhook: write `entitlements` row, set `isPro` flag in preferences as a cache
4. On subscription renewal webhook: extend `entitlements.ends_at_ms`
5. On cancel/failed webhook: set `status = 'grace'` (7-day grace), then `expired`

Cancellation: self-service via Settings → Account → "Abonnement beheren" link to Mollie customer portal or a `DELETE /api/subscribe` endpoint.

---

### Trainer Portal (trainer.justfit.cc)

#### Early bird pricing (first 50 trainer subscriptions)

| Tier | Early Bird | Standard |
|---|---|---|
| Solo (≤10 klanten) | **€24/month** | €29/month |
| Pro (onbeperkt) | **€39/month** | €59/month |
| Gym (multi-trainer) | **€99/month** | €149/month |

Note: No annual billing for trainers in v1. Trainers budget monthly (they invoice clients monthly) and annual commitment is a harder sell for a new product. Add annual discount (2 months free) in Phase 3.

**Why trainers pay more per seat than consumers:**
- BTW/VAT module replaces a separate accounting tool (value: €20–50/mo standalone)
- DPA/AVG compliance tooling is legally required — it has a real alternative cost
- Audit logging is not available anywhere else for this use case
- The pricing is below alternatives (MinuteDock, exact Online, PlanningPod)

**Client Pro grant:**
Included in Solo, Pro, and Gym tiers — any connected client gets Pro in the consumer app while the gym relationship is active. This is not advertised as a paid feature; it is a default benefit of being linked to a paying trainer. The trainer communicates this to clients as a reason to use the JustFit app.

---

### Vouchers and trial ✅ Live

- Consumer Pro: 14-day free trial on signup (`source=trial, product_code=pro_trial`), no card required
- Trainer portal: 30-day free trial on all gyms (new + existing, backfilled via migration 0072); `sub_status='trialing'`; trial expiry banner shown ≤7 days before end
- Referral vouchers: existing `vouchers` table supports this — activate in Phase 5

---

## 6. Trust & Positioning

### On being "affordable" vs "cheap"

€4.99/month is not dangerously cheap. It sits in a credible zone:
- Below Strava Premium (€6.99) — directionally correct, you offer more adaptive value
- Well below TrainingPeaks (€19.99) — correct for the consumer segment
- Above free tools (Garmin Coach, free Strava) — signals this is a paid product with commitment behind it

The price is not the trust problem. **The absence of trust signals around the price is the trust problem.**

What must surround the price:

**Social proof (even when small):**
- "Al [X] workouts gelogd door echte gebruikers" — pull from admin API, show live on marketing site
- First testimonials: ask beta users explicitly; even 3 real testimonials from real names matter enormously

**Founder visibility:**
- Real name, photo, one sentence bio on `/over-ons`
- "Gemaakt in Nederland door [naam]" in footer of every page
- Support email that reaches a real person: `alexander@justfit.cc`

**Risk reversal:**
- "30 dagen niet goed, geld terug — geen vragen gesteld"
- "Elk moment opzegbaar, nooit vastzit"
- These phrases reduce the perceived cost of trying

**Legitimacy signals:**
- KvK number in footer (when registered)
- AVG/GDPR badge
- Mollie payment logo (Mollie is widely trusted in NL — showing their logo is credible)
- SSL/security badge

**What would make cheap feel dangerous:**
- No support email visible
- No founder name
- No user numbers (even small ones)
- Annual-only pricing with no monthly option
- Forcing card before a trial

None of these apply to JustFit if the marketing site is built correctly.

### Trainer portal trust (B2B is different)

Trainers are more price-sensitive to value, less to absolute cost. At €39–59/month, they need to see:
- "Dit vervangt je losse factuurprogramma en je AVG-registratie"
- DPA compliance is a legal requirement — frame the portal as a legal tool, not just a nice app
- Show the BTW module output (example invoice, example kwartaaloverzicht)
- A case study: "Trainer X manages 23 klanten, saves 3 hours per week on administration"

---

## 7. Phased Roadmap

### Phase 0 — Infrastructure ✅ COMPLETE (2026-05-21)

**Goal:** Get the domain structure right before any public pricing launch.

| Task | What | Status |
|---|---|---|
| 0A | Add `app.justfit.cc` custom domain to the `justfit-app` CF Pages project | ✅ Done |
| 0B | Update all internal redirect URLs to `app.justfit.cc` (login, magic link, reset, Strava OAuth) | ✅ Done |
| 0C | Set `WEBAUTHN_RP_ID = justfit.cc` (parent domain covers subdomains) | ✅ Done |
| 0D | Create new CF Pages project `justfit-marketing`, connect `justfit.cc` | ✅ Done |
| 0E | Build v1 marketing site (justfit.cc) — Dutch, 8 pages (NL + EN mirror) | ✅ Done |
| 0F | Point `justfit.cc` DNS to `justfit-marketing` Pages project | ✅ Done |
| 0G | Add live session count from `/api/stats` to marketing homepages | ⬜ Pending |

**Marketing site delivered:**
- 4 NL pages: /, /prijzen, /trainers, /over-ons
- 4 EN mirror pages: /en/, /en/pricing, /en/trainers, /en/about
- CTA "Start gratis" → `app.justfit.cc/login.html?signup=1`
- CTA "Trainers: probeer gratis" → `trainer.justfit.cc`
- `/api/stats` endpoint live at `app.justfit.cc/api/stats` (returns `{total_sessions, total_users}`, CORS *, 5-min cache)

**Remaining:** 0G live stats counter on homepages; /privacy + /voorwaarden + /blog/ pages not yet built.

---

### Phase 1 — Consumer Monetization ✅ COMPLETE (2026-05-21)

**Goal:** First paying subscribers. The gate is in place and the checkout flow is live.

| Task | What | Status |
|---|---|---|
| 1A | Migration 0072: `mollie_sub_id` and `mollie_customer_id` on `entitlements` + `billing_events` table | ✅ Done |
| 1B | `POST /api/subscribe` — Mollie customer + mandate payment + first subscription | ✅ Done |
| 1C | `POST /api/webhooks/mollie-consumer` — paid/failed/expired/canceled → update entitlements | ✅ Done |
| 1D | `GET /api/subscribe` — return current Pro status (isPro loaded on app load) | ✅ Done |
| 1E | `plan.js` checks entitlements table for isPro; `preferences_json.isPro` remains manual override | ✅ Done |
| 1F | PathChoiceModal locks Running and Cycling paths for non-Pro users | ✅ Done |
| 1G | ProGate.jsx — full-screen upgrade wall (NL, early bird pricing, Mollie checkout redirect) | ✅ Done |
| 1H | Early bird cap: 200 subscribers tracked; `?upgrade=success` handler in App.jsx | ✅ Done |
| 1I | `DELETE /api/subscribe` — cancel Mollie subscription, set entitlement to grace period | ✅ Done |
| 1J | Settings → Account → Abonnement: live status + cancel flow | ✅ Done |
| 1K | 14-day trial entitlement on signup (`source=trial, product_code=pro_trial`) | ✅ Done |

**Conversion gates live:**
- PathChoiceModal: Running/Cycling locked for non-Pro → ProGate wall
- Settings → Your Coach: Running/Cycling enrollment locked with "Upgrade naar Pro →" CTA
- Strava sync: Pro-gated
- TCX/ZWO/ERG exports: Pro-gated
- PMC chart: accessible (no blur treatment added — open for all cycling coach users)

---

### Phase 2 — Trainer Portal Monetization ✅ COMPLETE (2026-05-21)

**Goal:** Trainers move from free to paid. The portal is already feature-complete for Starter and Pro tiers.

| Task | What | Status |
|---|---|---|
| 2A | Migration 0072: `sub_status`, `sub_tier`, `sub_source`, `sub_starts_at_ms`, `sub_ends_at_ms`, `mollie_customer_id`, `mollie_sub_id` on `gyms` table; backfill 30-day trial for existing gyms | ✅ Done |
| 2B | `POST /api/trainer/subscribe` — Mollie mandate payment + early-bird pricing (first 50 gyms) | ✅ Done |
| 2C | `DELETE /api/trainer/subscribe` — cancel Mollie subscription, revoke client entitlements | ✅ Done |
| 2D | `POST /api/webhooks/mollie-trainer` — paid/failed/canceled → activate/grace/cancel gym, create recurring sub on first paid | ✅ Done |
| 2E | Enforce client limit in `trainer/clients.js` — 402 when `sub_tier='starter'` and count ≥ 15 | ✅ Done |
| 2F | Gate BTW module in `trainer/btw/*` (4 endpoints) — 403 for `sub_tier='starter'` | ✅ Done |
| 2G | BillingView.tsx — plan cards (Starter/Pro/Gym), current plan, cancel flow, B2B2C callout | ✅ Done |
| 2H | 30-day trial on all gyms (new + existing) via migration 0072 backfill | ✅ Done |
| 2I | In-app gates: trial expiry banner (≤7 days), BTW lock modal, client limit banner, tier badge in sidebar | ✅ Done |

**Pricing:** Starter €24/29, Pro €39/59, Gym €99/149 (early bird / standard). Early bird = first 50 `mollie_sub` gyms.

---

### Phase 3 — B2B2C Grant ✅ COMPLETE (2026-05-21)

**Goal:** Trainer subscriptions automatically unlock Pro for their clients.

| Task | What | Status |
|---|---|---|
| 3A | `functions/lib/b2b2c.js` — `grantClientEntitlements(gymId, subEndsAtMs, DB)` with ON CONFLICT upsert | ✅ Done |
| 3B | On Mollie trainer webhook paid (first + recurring): call `grantClientEntitlements` | ✅ Done |
| 3C | On Mollie trainer webhook canceled / DELETE subscribe: call `revokeClientEntitlements` | ✅ Done |
| 3D | Unique index `idx_entitlements_user_source_product` on entitlements (user_id, source, product_code) for idempotent grants | ✅ Done |
| 3E | B2B2C callout in BillingView: "Jouw klanten krijgen automatisch JustFit Pro…" | ✅ Done |

**Note:** 3A consumer-app hook — ✅ Now done. `POST /api/connect` checks `gyms.sub_status='active'`; if the gym has an active B2B subscription, inserts a `trainer_grant` entitlement immediately. Guarded: skips if an active trainer_grant already exists. No webhook delay for new client joins.

---

### Phase 4 — Dutch-First Localization ✅ COMPLETE (2026-05-21)

**Goal:** App and trainer portal speak Dutch by default. English toggle in settings.

| Task | What | Status |
|---|---|---|
| 4A | `src/i18n.js` with `t()`, `useLang()`, `setLang()` helpers | ✅ Done |
| 4B | 500+ NL translations: nav, onboarding, settings labels, coaching copy | ✅ Done |
| 4C | WorkoutView / PlanWeekView / HistoryView / SettingsView / App.jsx all wrapped | ✅ Done |
| 4D | Trainer portal UI — Dutch concepts (BTW, factuur, AVG) already native | ✅ Done |
| 4E | Dutch email templates via Resend | ✅ Done |
| 4F | NL/EN toggle in Settings → You → Appearance; stored in `localStorage('jf_lang')`; default `'nl'` | ✅ Done |
| 4G | Marketing site `/en/` English mirror — 4 translated pages | ✅ Done |
| 4H | Dutch SEO: meta tags on marketing site pages | ⬜ Pending (full hreflang + OG pass) |

**Note on training terminology:** FTP, TSS, PMC, Zone 2, Intervals, VO2max, and all structured workout terms stay in English in both language modes. These are the established international terms — translating them would confuse rather than help Dutch athletes who look these up in English online.

---

### Phase 5 — Growth & Retention (active — 2026 H2)

| Task | Priority | Status | Notes |
|---|---|---|---|
| Live stats counter on justfit.cc | High | ⬜ Pending | Fetch from `app.justfit.cc/api/stats` on page load; show "Al X workouts gelogd" on NL + EN homepages |
| SEO meta + structured data | High | ⬜ Pending | Full hreflang, OG tags, JSON-LD on all 8 marketing pages; target Dutch keywords |
| Blog skeleton + 3 NL articles | High | ⬜ Pending | `/blog/`, `/blog/militaire-keuring-voorbereiding`, `/blog/ftp-test-thuis`, `/blog/hardloopschema-10km`; Dutch articles with zero real SEO competition |
| Referral programme | Medium | ⬜ Pending | Existing `referrals` + `vouchers` tables; give 1 free Pro month per referred paid user |
| Trainer-to-client messaging UI | Medium | ⬜ Pending | Schema live (migration 0074: `trainer_message` + `trainer_message_sent_at_ms` on `gym_memberships`); PATCH endpoint needed; banner on Today screen live (amber, 7-day filter) |
| Client workout history view | Medium | ⬜ Pending | GET `/api/trainer/clients/:id/history` endpoint + UI panel in trainer portal |
| Assigned programs in client plan | Medium | ⬜ Pending | Assignments API exists; `plan.js` doesn't yet read trainer-assigned programs |
| Trainer discovery map | Medium | ⬜ Pending | justfit.cc/trainers/zoeken — map of trainers; drives organic trainer signups |
| Trainer partner programme | Low | ⬜ Pending | Trainers earn referral credit when clients upgrade independently |
| App Store (PWA listing) | Medium | ⬜ Pending | Google Play TWA; iOS via "Add to Home Screen" |
| Push notifications | Low | ⬜ Pending | Service Worker already set up; re-engagement nudge on missed check-in days |
| Marketing site legal pages | Low | ⬜ Pending | /privacy + /voorwaarden pages on justfit.cc |

---

## 8. Revenue Model

### Consumer App

| Metric | Conservative | Realistic | Optimistic |
|---|---|---|---|
| Monthly signups (after marketing site) | 50 | 150 | 400 |
| Trial-to-Pro conversion | 8% | 12% | 18% |
| Annual plan uptake (of Pro) | 40% | 55% | 65% |
| Monthly churn on Pro | 5% | 3% | 1.5% |

**Steady-state MRR examples:**

| Total Pro users | Avg revenue/user/month | MRR |
|---|---|---|
| 100 | €5.20 (mix of monthly/annual) | €520 |
| 500 | €5.20 | €2,600 |
| 2,000 | €5.20 | €10,400 |
| 5,000 | €5.20 | €26,000 |

### Trainer Portal

| Active gyms | Mix | MRR |
|---|---|---|
| 10 | 7 Solo + 2 Pro + 1 Gym | €7×24 + 2×39 + 1×99 = €345 |
| 30 | 15 Solo + 10 Pro + 5 Gym | €360 + €390 + €495 = **€1,245** |
| 100 | 50 Solo + 35 Pro + 15 Gym | €1,200 + €1,365 + €1,485 = **€4,050** |

### Combined at 18 months post-launch

| Source | Users/Gyms | MRR |
|---|---|---|
| Consumer Pro | 800 | €4,160 |
| Trainer Solo | 20 | €480 |
| Trainer Pro | 8 | €312 |
| Trainer Gym | 3 | €297 |
| **Total** | | **€5,249/month** |

Annual run rate: ~€63,000. Achievable with zero full-time employees if the product sells itself through organic SEO, the trainer network, and word of mouth in the Dutch military fitness and cycling communities.

### CAC is near zero — the leverage is the product

- Military Coach: no direct competitor in NL → SEO for "keuring voorbereiding app" is uncontested
- Cycling Coach + Strava sync: the one adaptive cycling app that's cheaper than TrainingPeaks
- Trainer portal BTW module: legal compliance is a non-optional purchase → sticky
- Guest mode → free → Pro: no friction to try, natural upgrade at the moment of value

The job of the marketing site is to explain this clearly and point people to the free signup. The job of the app is to earn the upgrade by being genuinely better than not having it.

---

*Last updated: 2026-05-21. Phases 0–4 complete. Phase 5 (Growth & Retention) is the active build track. All three products (consumer app, trainer portal, marketing site) are live in production. Monetization is live across all products — consumer Pro billing (Mollie), trainer tier billing (Mollie), and B2B2C grant flywheel all operational.*

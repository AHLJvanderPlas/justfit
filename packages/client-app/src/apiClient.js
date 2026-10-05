// ─── API CLIENT ───────────────────────────────────────────────────────────────
// Pure fetch wrappers. No React, no side effects.
// Auth: HttpOnly __Host-jf_session cookie, sent automatically on same-origin fetch (C-B17).
// Legacy `token` params are accepted but unused — kept to avoid churning every call site.

const api = {
  // R598 — force today's session to include the DCP self-assessment. Separate
  // from generatePlan because the server exempts this from the free daily cap:
  // measuring yourself is an input the bias depends on, not a session re-roll.
  // Returns { plan, preserved }: preserved means today's session is one the user
  // wrote (W4.1), so the server kept it and scheduled nothing — say so (F8).
  async forceAssessment(userId, date) {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, date, checkin: null, force_assessment: true }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "Could not schedule the self-assessment");
    return { plan: data.plan ?? data, preserved: data.preserved === true };
  },

  // W4.1 — install a session the user built as today's plan. Never throws on a
  // 400/409: the builder needs the body (unknown ids, or the safety notes that
  // need an explicit acknowledgement) to show the user what happened.
  async installCustomSession(date, { steps, sessionName, safetyAck = false, includeAssessment = false }) {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        session_name: sessionName ?? undefined,
        custom_steps: steps,
        safety_ack: safetyAck || undefined,
        include_assessment: includeAssessment || undefined,
      }),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON error page */ }
    return { status: res.status, data: data ?? {} };
  },

  // W4.4 — pin 1–3 exercises, the coach fills the rest. Opened from the
  // builder, so it is an explicit replacement of whatever today's plan is.
  async pinAndFill(date, pinnedIds) {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, checkin: null, pinned_exercise_ids: pinnedIds, replace_user_plan: true }),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON error page */ }
    return { status: res.status, data: data ?? {} };
  },

  // W4.3 — "Mijn trainingen": the user's saved sessions. The endpoint only
  // stores them; using one goes through installCustomSession below, so safety,
  // clamping and overwrite protection run exactly as for a freshly built session.
  async getMySessions() {
    const res = await fetch("/api/my-sessions");
    if (res.status === 401) return [];
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "Could not load your trainings");
    return data.templates ?? [];
  },

  // Never throws on a 400/404: the builder shows the reason (name, cap, unknown id).
  async saveMySession({ id, name, steps }) {
    const res = await fetch("/api/my-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id ?? undefined, name, steps }),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON error page */ }
    return { status: res.status, data: data ?? {} };
  },

  // true when it is gone (204, or 404: already deleted elsewhere).
  async deleteMySession(id) {
    const res = await fetch(`/api/my-sessions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    return res.status === 204 || res.status === 404;
  },

  // Install a saved training as today's plan — the W4.1 custom_steps contract,
  // unchanged. Same { status, data } as installCustomSession: a 409 carries the
  // safety notes that need an acknowledgement.
  async useMySession(template, date, { safetyAck = false, includeAssessment = false } = {}) {
    return api.installCustomSession(date, {
      steps: (template.steps ?? []).map((s) => ({
        exercise_id: s.exercise_id, sets: s.sets, rest_sec: s.rest_sec,
        target_reps: s.target_reps, target_duration_sec: s.target_duration_sec,
      })),
      sessionName: template.name,
      safetyAck, includeAssessment,
    });
  },

  // The whole active library, fetched once per page load — the builder filters
  // it locally so typing a search costs no round-trip.
  _library: null,
  async getLibrary() {
    if (!api._library) {
      api._library = fetch("/api/exercises")
        .then((r) => r.json())
        .then((d) => d.exercises ?? [])
        .catch((e) => { api._library = null; throw e; });
    }
    return api._library;
  },

  async generatePlan(userId, date, checkin, coachSim, isPro, { replaceUserPlan = false } = {}) {
    let res, data;
    try {
      res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // replace_user_plan is only ever sent from an explicit, confirmed user
        // action (WhyNotModal); every automatic call leaves a user-authored plan alone.
        body: JSON.stringify({ user_id: userId, date, checkin, coach_sim: coachSim ?? undefined, is_pro: !!isPro, replace_user_plan: replaceUserPlan || undefined }),
      });
      data = await res.json();
    } catch {
      const err = new Error("Network error — could not reach plan engine");
      err.planErrorCode = "PLAN-NET";
      throw err;
    }
    if (!data.ok) {
      const err = new Error(data.error ?? "Plan engine error");
      err.planErrorCode = "PLAN-500";
      throw err;
    }
    return data.plan;
  },

  async saveCheckin(userId, date, data) {
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        energy: data.energy != null ? Math.round(data.energy) : null,
        stress: data.stress != null ? Math.round(data.stress) : null,
        mood: data.mood != null ? Math.round(data.mood) : null,
        sleep_hours: data.sleep_hours ?? null,
        checkin_json: data.checkin_json ?? null,
      }),
    });
  },

  async adaptPlan(userId, date, checkin, basePlan) {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, date, checkin, adapt_mode: true, base_plan: basePlan }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return data.plan;
  },

  async getScore() {
    const res = await fetch(`/api/score`);
    const data = await res.json();
    return data.score ?? 0;
  },

  async saveExecution(userId, planId, date, steps, durationSec, perceivedExertion, sessionType = "workout", sessionProgram = null, notes = null) {
    const res = await fetch("/api/execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        day_plan_id: planId ?? null,
        session_type: sessionType,
        session_program: sessionProgram ?? undefined,
        duration_sec: durationSec,
        perceived_exertion: perceivedExertion ?? null,
        notes: notes ?? undefined,
        steps: steps.map((s) => ({
          exercise_id: s.exercise_id,
          prescribed: {
            sets: s.sets,
            reps: s.target_reps,
            duration_sec: s.target_duration_sec,
            rest_sec: s.rest_sec,
          },
          actual: s.actual ?? { completed: true },
        })),
      }),
    });
    return res.json();
  },

  async getHistory() {
    const res = await fetch(`/api/execution?limit=30`);
    const data = await res.json();
    return { results: data.executions ?? [], truncated: !!data.truncated };
  },

  async getExercisesBySlugs(slugs) {
    const res = await fetch("/api/exercises");
    const data = await res.json();
    const all = data.exercises ?? [];
    return all.filter((ex) => slugs.includes(ex.slug));
  },

  // Need C — record a session done outside the app, for today or up to 6 days back.
  // `steps` come from logSession.loggedStep (stepsActualRef shape, prescribed {}).
  // Returns { status, data }; 400 date_out_of_range carries the server's window.
  async logSession(date, { steps, perceivedExertion = null, notes = null }) {
    const res = await fetch("/api/execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        session_type: "logged",
        perceived_exertion: perceivedExertion,
        notes: notes || undefined,
        steps,
      }),
    });
    let data = {};
    try { data = await res.json(); } catch { /* empty body */ }
    return { status: res.status, data };
  },

  async saveActivity(userId, date, executionType, durationSec) {
    const res = await fetch("/api/execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        // The server reads session_type and stores it as execution_type. This sent
        // execution_type, which the server ignores, so every logged run/walk/bike/
        // rest day was stored as 'workout' and the step-less cardio stimulus path
        // never ran for them. Found 2026-10-05 while building backfill logging.
        session_type: executionType,
        duration_sec: durationSec,
      }),
    });
    return res.json();
  },

  async logPeriod(userId, startedOn) {
    const res = await fetch("/api/cycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ started_on: startedOn }),
    });
    return res.json();
  },

  async generateBonusPlan(userId, date, minutes, completedIds) {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        date,
        checkin: { time_budget: minutes },
        completed_exercise_ids: completedIds,
        bonus_session: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return data.plan;
  },

  async getTodayPlan(userId, date) {
    const res = await fetch(`/api/plan?user_id=${userId}&date=${date}`);
    const data = await res.json();
    if (!data.plan) return null;
    const planObj = typeof data.plan.plan_json === "string" ? JSON.parse(data.plan.plan_json) : data.plan.plan_json;
    return { id: data.plan.id, ...planObj };
  },

  async getLastCheckin(userId) {
    const res = await fetch(`/api/checkin?user_id=${userId}`);
    const data = await res.json();
    return (data.checkins ?? [])[0] ?? null;
  },

  async getCheckins(userId, limit = 30) {
    const res = await fetch(`/api/checkin?user_id=${userId}&limit=${limit}`);
    const data = await res.json();
    return data.checkins ?? [];
  },

  async getProfile(_token) {
    const res = await fetch("/api/profile", {
    });
    return res.json();
  },

  async saveProfile(_token, profile) {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    return res.json();
  },

  async deleteExecution(executionId) {
    const res = await fetch(`/api/execution?execution_id=${executionId}`, {
      method: "DELETE",
    });
    return res.json();
  },

  async deleteAccount() {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_account" }),
    });
    return res.json();
  },

  // include=recovery adds the C-F7 per-muscle freshness block. Requested on every
  // call because the Progress tab renders it and the extra query is one 14-day
  // window; splitting it into a second round trip costs more than it saves.
  async getProgression(_token) {
    const res = await fetch("/api/progression?include=recovery", {
    });
    return res.json();
  },

  // C-F11 — replayed history for one radar axis (drill-down).
  async getAxisHistory(axis) {
    const res = await fetch(`/api/progression?include=history&axis=${encodeURIComponent(axis)}`, {});
    return res.json();
  },

  // C-F8 — personal records and per-exercise strength curves.
  async getRecords(_token) {
    const res = await fetch("/api/records", {});
    return res.json();
  },

  async getCyclingPmc(_token) {
    const res = await fetch("/api/cycling-pmc", {
    });
    return res.json();
  },

  async saveProgressionPrefs(_token, prefs) {
    const res = await fetch("/api/progression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    return res.json();
  },

  async recomputeProgression(_token) {
    const res = await fetch("/api/progression?action=recompute", {
      method: "POST",
    });
    return res.json();
  },

  async resendVerification() {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend_verification" }),
    });
    return res.json();
  },

  async verifyEmailCode(code) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_email_code", code }),
    });
    return res.json();
  },

  async requestEmailChange(newEmail) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request_email_change", new_email: newEmail }),
    });
    return res.json();
  },

  async verifyChangeCode(code) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_change_code", code }),
    });
    return res.json();
  },

  async sendFeedback(_token, text) {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  // `write=1` requests activity:write alongside read, so JustFit sessions can be
  // uploaded to Strava. Asked for only when the user opts into uploads.
  // Fitness assessment ("Where you are"). Free for every account.
  async getAssessment(date) {
    const res = await fetch(`/api/assessment${date ? `?date=${date}` : ''}`);
    return res.json();
  },

  async submitAssessment(focus, results, date) {
    const res = await fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ focus, results, ...(date ? { date } : {}) }),
    });
    return res.json();
  },

  async getStravaStatus(_token, { write = false } = {}) {
    const res = await fetch(`/api/strava-auth${write ? '?write=1' : ''}`);
    return res.json();
  },

  async setStravaPush(_token, pushEnabled) {
    const res = await fetch('/api/strava-auth', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ push_enabled: pushEnabled }),
    });
    return res.json();
  },

  // Uploads one completed session to Strava as a structured weight-training
  // activity (per-set data + a text training summary in the description).
  async pushToStrava(_token, executionId, name) {
    const res = await fetch('/api/strava-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ execution_id: executionId, ...(name ? { name } : {}) }),
    });
    return res.json();
  },

  async disconnectStrava(_token) {
    const res = await fetch('/api/strava-auth', {
      method: 'DELETE',
    });
    return res.json();
  },

  async exchangeStravaCode(_token, code, state) {
    const res = await fetch('/api/strava-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    });
    // An edge error page is text/plain, so res.json() throws and the real status
    // is lost. Report the status instead of a generic failure.
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, error: `Server returned ${res.status}`, raw: text.slice(0, 120) };
    }
  },

  async passkeyBeginRegister(_token) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'passkey_begin_register' }),
    });
    return res.json();
  },

  async passkeyCompleteRegister(_token, payload) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'passkey_complete_register', ...payload }),
    });
    return res.json();
  },

  async stravaSync(_token) {
    const res = await fetch('/api/strava-sync', {
      method: 'POST',
    });
    return res.json();
  },

  async acceptTerms(_token, termsVersion, privacyVersion) {
    const res = await fetch("/api/accept-terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termsVersion, privacyVersion }),
    });
    return res.json();
  },

  // Trainer disclosures (P1B)
  async getDisclosures(_token) {
    const res = await fetch("/api/client/disclosures", {
    });
    return res.json();
  },

  async upsertDisclosure(_token, gymId, level, data = {}) {
    const res = await fetch("/api/client/disclosures", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Gym-Id": gymId },
      body: JSON.stringify({ level, ...data }),
    });
    return res.json();
  },

  async respondUpgradeRequest(_token, gymId, requestId, response) {
    const res = await fetch(`/api/client/disclosures/${gymId}/upgrade-response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: requestId, response }),
    });
    return res.json();
  },

  // Client intake (P1C)
  async getIntake(_token) {
    const res = await fetch("/api/client/intake", {
    });
    const data = await res.json();
    return data.intake ?? null;
  },

  async saveIntake(_token, intake) {
    const res = await fetch("/api/client/intake", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intake),
    });
    return res.json();
  },

  // GDPR (P1I)
  async gdprExport(_token) {
    const res = await fetch("/api/client/gdpr/export", {
      method: "POST",
    });
    return res.json();
  },

  // gdprRequestDelete removed 2026-09-21 (C-B23): the endpoint returned ok:true
  // while failing a CHECK constraint, referencing a column that does not exist,
  // and leaving no sweep to execute the deletion. Account deletion goes through
  // `deleteAccount()` above, which performs a real erasure.

  // Trainer invite (Sub-flow A + B)
  async lookupTrainerInvite(inviteToken) {
    const res = await fetch(`/api/trainer-invite?t=${encodeURIComponent(inviteToken)}`, {
    });
    return res.json();
  },

  async acceptTrainerInvite(_token, inviteToken, action = 'accept') {
    const res = await fetch('/api/trainer-invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: inviteToken, action }),
    });
    return res.json();
  },

  // Connect to trainer via QR/code (Sub-flow C)
  async lookupConnect(trainerToken) {
    const res = await fetch(`/api/connect?t=${encodeURIComponent(trainerToken)}`, {
    });
    return res.json();
  },

  async connectToTrainer(_token, trainerToken) {
    const res = await fetch('/api/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainer_token: trainerToken }),
    });
    return res.json();
  },

  // ─── BILLING ──────────────────────────────────────────────────────────────
  async getSubscription() {
    const res = await fetch('/api/subscribe');
    return res.json();
  },

  async startSubscription(plan) {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    return res.json();
  },

  async cancelSubscription() {
    const res = await fetch('/api/subscribe', { method: 'DELETE' });
    return res.json();
  },

  // ─── MULTI-TRAINER ─────────────────────────────────────────────────────────
  async getAssignments(_token) {
    const res = await fetch('/api/client/assignments', {
    });
    return res.json();
  },

  async getTrainerData(_token) {
    const res = await fetch('/api/client/trainer', {
    });
    return res.json();
  },

  async signConsent(_token) {
    const res = await fetch('/api/client/consent', {
      method: 'POST',
    });
    return res.json();
  },

  async getSessions(_token) {
    const res = await fetch('/api/client/sessions', {
    });
    return res.json();
  },

  async getAvailableSessions(_token) {
    const res = await fetch('/api/client/sessions/available', {
    });
    return res.json();
  },

  async enrollSession(_token, id) {
    const res = await fetch(`/api/client/sessions/${id}/enroll`, {
      method: 'POST',
    });
    return res.json();
  },

  async cancelSessionEnrollment(_token, id) {
    const res = await fetch(`/api/client/sessions/${id}/enroll`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getClientPackages(_token) {
    const res = await fetch('/api/client/packages', {
    });
    return res.json();
  },

  async getMessages(_token) {
    const res = await fetch('/api/client/messages', {
    });
    return res.json();
  },

  async sendMessage(_token, body) {
    const res = await fetch('/api/client/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    return res.json();
  },

  async markMessagesRead(_token) {
    const res = await fetch('/api/client/messages', {
      method: 'PATCH',
    });
    return res.json();
  },

  async submitSupportRequest(_token, message, broadcast = false) {
    const res = await fetch('/api/client/support-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, broadcast }),
    });
    return res.json();
  },

  async getActiveSupportRequest(_token) {
    const res = await fetch('/api/client/support-request/active', {
    });
    return res.json();
  },

  async submitSwitchRequest(_token, toTrainerUserId, message) {
    const res = await fetch('/api/client/switch-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_trainer_user_id: toTrainerUserId, message }),
    });
    return res.json();
  },

  async cancelSwitchRequest(_token, requestId) {
    const res = await fetch(`/api/client/switch-request/${requestId}/cancel`, {
      method: 'PATCH',
    });
    return res.json();
  },

  async getSwitchRequests(_token) {
    const res = await fetch('/api/client/switch-requests', {
    });
    return res.json();
  },

  async setTrainerSwitchConsent(_token, allow) {
    const res = await fetch('/api/client/trainer-switch-consent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allow }),
    });
    return res.json();
  },

  async getPushStatus() {
    const res = await fetch('/api/subscribe-push');
    return res.json();
  },

  async subscribePush(subscription) {
    const res = await fetch('/api/subscribe-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'subscribe', subscription }),
    });
    return res.json();
  },

  async unsubscribePush(endpoint) {
    const res = await fetch('/api/subscribe-push', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
    return res.json();
  },

  async getReferral() {
    const res = await fetch('/api/referral');
    return res.json();
  },

  async redeemReferral(code) {
    const res = await fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'redeem', code }),
    });
    return res.json();
  },

  async convertGuest(email, password) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'convert_guest', email, password }),
    });
    return res.json();
  },
};

export default api;

// ─── API CLIENT ───────────────────────────────────────────────────────────────
// Pure fetch wrappers. No React, no side effects.
// Auth token read from localStorage on each call so it's always current.

const api = {
  _auth() {
    const t = localStorage.getItem("jf_token") ?? "";
    return t ? { Authorization: `Bearer ${t}` } : {};
  },

  async generatePlan(userId, date, checkin, coachSim, isPro) {
    let res, data;
    try {
      res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...this._auth() },
        body: JSON.stringify({ user_id: userId, date, checkin, coach_sim: coachSim ?? undefined, is_pro: !!isPro }),
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
      headers: { "Content-Type": "application/json", ...this._auth() },
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
      headers: { "Content-Type": "application/json", ...this._auth() },
      body: JSON.stringify({ user_id: userId, date, checkin, adapt_mode: true, base_plan: basePlan }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return data.plan;
  },

  async getScore() {
    const res = await fetch(`/api/score`, { headers: this._auth() });
    const data = await res.json();
    return data.score ?? 0;
  },

  async saveExecution(userId, planId, date, steps, durationSec, perceivedExertion, sessionType = "workout", sessionProgram = null) {
    const res = await fetch("/api/execution", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this._auth() },
      body: JSON.stringify({
        date,
        day_plan_id: planId ?? null,
        session_type: sessionType,
        session_program: sessionProgram ?? undefined,
        duration_sec: durationSec,
        perceived_exertion: perceivedExertion ?? null,
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
    const res = await fetch(`/api/execution?limit=30`, { headers: this._auth() });
    const data = await res.json();
    return data.executions ?? [];
  },

  async getExercisesBySlugs(slugs) {
    const res = await fetch("/api/exercises");
    const data = await res.json();
    const all = data.exercises ?? [];
    return all.filter((ex) => slugs.includes(ex.slug));
  },

  async saveActivity(userId, date, executionType, durationSec) {
    const res = await fetch("/api/execution", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this._auth() },
      body: JSON.stringify({
        date,
        execution_type: executionType,
        duration_sec: durationSec,
      }),
    });
    return res.json();
  },

  async logPeriod(userId, startedOn) {
    const res = await fetch("/api/cycle", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this._auth() },
      body: JSON.stringify({ started_on: startedOn }),
    });
    return res.json();
  },

  async generateBonusPlan(userId, date, minutes, completedIds) {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this._auth() },
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
    const res = await fetch(`/api/plan?user_id=${userId}&date=${date}`, { headers: this._auth() });
    const data = await res.json();
    if (!data.plan) return null;
    const planObj = typeof data.plan.plan_json === "string" ? JSON.parse(data.plan.plan_json) : data.plan.plan_json;
    return { id: data.plan.id, ...planObj };
  },

  async getLastCheckin(userId) {
    const res = await fetch(`/api/checkin?user_id=${userId}`, { headers: this._auth() });
    const data = await res.json();
    return (data.checkins ?? [])[0] ?? null;
  },

  async getCheckins(userId, limit = 30) {
    const res = await fetch(`/api/checkin?user_id=${userId}&limit=${limit}`, { headers: this._auth() });
    const data = await res.json();
    return data.checkins ?? [];
  },

  async getProfile(token) {
    const res = await fetch("/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async saveProfile(token, profile) {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });
    return res.json();
  },

  async deleteExecution(executionId) {
    const res = await fetch(`/api/execution?execution_id=${executionId}`, {
      method: "DELETE",
      headers: this._auth(),
    });
    return res.json();
  },

  async deleteAccount() {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this._auth() },
      body: JSON.stringify({ action: "delete_account" }),
    });
    return res.json();
  },

  async getProgression(token) {
    const res = await fetch("/api/progression", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getCyclingPmc(token) {
    const res = await fetch("/api/cycling-pmc", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async saveProgressionPrefs(token, prefs) {
    const res = await fetch("/api/progression", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(prefs),
    });
    return res.json();
  },

  async recomputeProgression(token) {
    const res = await fetch("/api/progression?action=recompute", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async resendVerification() {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this._auth() },
      body: JSON.stringify({ action: "resend_verification" }),
    });
    return res.json();
  },

  async verifyEmailCode(code) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this._auth() },
      body: JSON.stringify({ action: "verify_email_code", code }),
    });
    return res.json();
  },

  async requestEmailChange(newEmail) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this._auth() },
      body: JSON.stringify({ action: "request_email_change", new_email: newEmail }),
    });
    return res.json();
  },

  async verifyChangeCode(code) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this._auth() },
      body: JSON.stringify({ action: "verify_change_code", code }),
    });
    return res.json();
  },

  async sendFeedback(token, text) {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  async saveStravaByo(token, clientId, clientSecret) {
    const res = await fetch('/api/strava-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'save_byo', client_id: clientId, client_secret: clientSecret }),
    });
    return res.json();
  },

  async stravaSync(token) {
    const res = await fetch('/api/strava-sync', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async acceptTerms(token, termsVersion, privacyVersion) {
    const res = await fetch("/api/accept-terms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ termsVersion, privacyVersion }),
    });
    return res.json();
  },

  // Trainer disclosures (P1B)
  async getDisclosures(token) {
    const res = await fetch("/api/client/disclosures", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async upsertDisclosure(token, gymId, level, data = {}) {
    const res = await fetch("/api/client/disclosures", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Gym-Id": gymId },
      body: JSON.stringify({ level, ...data }),
    });
    return res.json();
  },

  async respondUpgradeRequest(token, gymId, requestId, response) {
    const res = await fetch(`/api/client/disclosures/${gymId}/upgrade-response`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ request_id: requestId, response }),
    });
    return res.json();
  },

  // Client intake (P1C)
  async getIntake(token) {
    const res = await fetch("/api/client/intake", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.intake ?? null;
  },

  async saveIntake(token, intake) {
    const res = await fetch("/api/client/intake", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(intake),
    });
    return res.json();
  },

  // GDPR (P1I)
  async gdprExport(token) {
    const res = await fetch("/api/client/gdpr/export", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async gdprRequestDelete(token) {
    const res = await fetch("/api/client/gdpr/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Trainer invite (Sub-flow A + B)
  async lookupTrainerInvite(inviteToken) {
    const res = await fetch(`/api/trainer-invite?t=${encodeURIComponent(inviteToken)}`, {
      headers: this._auth(),
    });
    return res.json();
  },

  async acceptTrainerInvite(token, inviteToken, action = 'accept') {
    const res = await fetch('/api/trainer-invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ token: inviteToken, action }),
    });
    return res.json();
  },

  // Connect to trainer via QR/code (Sub-flow C)
  async lookupConnect(trainerToken) {
    const res = await fetch(`/api/connect?t=${encodeURIComponent(trainerToken)}`, {
      headers: this._auth(),
    });
    return res.json();
  },

  async connectToTrainer(token, trainerToken) {
    const res = await fetch('/api/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ trainer_token: trainerToken }),
    });
    return res.json();
  },

  // ─── BILLING ──────────────────────────────────────────────────────────────
  async getSubscription() {
    const res = await fetch('/api/subscribe', { headers: this._auth() });
    return res.json();
  },

  async startSubscription(plan) {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this._auth() },
      body: JSON.stringify({ plan }),
    });
    return res.json();
  },

  async cancelSubscription() {
    const res = await fetch('/api/subscribe', { method: 'DELETE', headers: this._auth() });
    return res.json();
  },

  // ─── MULTI-TRAINER ─────────────────────────────────────────────────────────
  async getTrainerData(token) {
    const res = await fetch('/api/client/trainer', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async submitSupportRequest(token, message, broadcast = false) {
    const res = await fetch('/api/client/support-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message, broadcast }),
    });
    return res.json();
  },

  async getActiveSupportRequest(token) {
    const res = await fetch('/api/client/support-request/active', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async submitSwitchRequest(token, toTrainerUserId, message) {
    const res = await fetch('/api/client/switch-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to_trainer_user_id: toTrainerUserId, message }),
    });
    return res.json();
  },

  async cancelSwitchRequest(token, requestId) {
    const res = await fetch(`/api/client/switch-request/${requestId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getSwitchRequests(token) {
    const res = await fetch('/api/client/switch-requests', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async setTrainerSwitchConsent(token, allow) {
    const res = await fetch('/api/client/trainer-switch-consent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ allow }),
    });
    return res.json();
  },
};

export default api;

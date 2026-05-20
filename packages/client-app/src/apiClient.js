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
};

export default api;

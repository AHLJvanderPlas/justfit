// POST /api/plan — today's stored check-in as the fallback input (UAT D4).
//
// The check-in sheet is the only place the user tells the coach how today feels.
// Every regeneration that does not carry it (app open with the sheet already done,
// a retry, a path change, a forced self-assessment) used to plan as if no
// check-in existed, so a "taking it easy" day could silently turn back into a full
// session. When a request has no `checkin` and is not an adapt (which always
// carries one), the handler reads today's daily_checkins row instead.

/**
 * Rebuild a daily_checkins row into the shape the check-in sheet sends:
 * the numeric columns top-level, the toggles nested in checkin_json (see
 * CheckInModal buildAndSave and flattenCheckin in planRequest.js). Columns the
 * sheet never sends (soreness, weight_kg, notes) are only included when set, so
 * a null cannot shadow a nested value once flattened.
 */
export function checkinFromRow(row) {
  if (!row) return null;
  let nested = {};
  if (typeof row.checkin_json === 'string') {
    try { nested = JSON.parse(row.checkin_json) ?? {}; } catch { nested = {}; }
  } else if (row.checkin_json && typeof row.checkin_json === 'object') {
    nested = row.checkin_json;
  }
  if (typeof nested !== 'object' || Array.isArray(nested)) nested = {};
  const out = {
    mood: row.mood ?? null,
    energy: row.energy ?? null,
    sleep_hours: row.sleep_hours ?? null,
    stress: row.stress ?? null,
    checkin_json: nested,
  };
  for (const k of ['soreness', 'weight_kg', 'notes']) if (row[k] != null) out[k] = row[k];
  return out;
}

/**
 * The check-in the planner should see: the request's own when it sent one,
 * otherwise today's stored row (null when there is none, or no user).
 */
export async function requestOrStoredCheckin(env, userId, req) {
  if (req.checkin != null || req.adapt_mode || !userId) return req.checkin ?? null;
  const row = await env.DB.prepare(
    'SELECT mood, energy, soreness, sleep_hours, stress, weight_kg, notes, checkin_json FROM daily_checkins WHERE user_id = ? AND date = ? LIMIT 1'
  ).bind(userId, req.date).first();
  return checkinFromRow(row);
}

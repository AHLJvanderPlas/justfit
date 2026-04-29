import { getAuthUserId } from './_shared/auth.js';

// GET /api/cycling-pmc
// Computes PMC (CTL / ATL / TSB) series from cycling executions (tss_source IS NOT NULL).
// Returns last 90 days of series + latest snapshot for the Progress tab chart.
export async function onRequestGet({ request, env }) {
  const userId = await getAuthUserId(request, env);
  if (!userId) return Response.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { results } = await env.DB.prepare(
      `SELECT date, tss_actual, tss_planned, tss_source
       FROM executions
       WHERE user_id = ? AND tss_source IS NOT NULL
       ORDER BY date ASC`
    ).bind(userId).all();

    if (!results || results.length === 0) {
      return Response.json({ ok: true, series: [], latest: null, hasEstimated: false });
    }

    // Build date → TSS map (sum if multiple executions on same day)
    const tssMap = {};
    let hasEstimated = false;
    for (const row of results) {
      const tss = row.tss_actual ?? row.tss_planned ?? 0;
      tssMap[row.date] = (tssMap[row.date] ?? 0) + tss;
      if (row.tss_source === 'rpe_estimated' || row.tss_source === 'strava_estimated') {
        hasEstimated = true;
      }
    }

    // PMC EMA constants
    const ctlDecay = Math.exp(-1 / 42);
    const atlDecay = Math.exp(-1 / 7);
    const ctlGain  = 1 - ctlDecay;
    const atlGain  = 1 - atlDecay;

    const today     = new Date().toISOString().slice(0, 10);
    const firstDate = results[0].date;

    const series = [];
    let ctl = 0;
    let atl = 0;
    const cur  = new Date(firstDate + 'T00:00:00Z');
    const end  = new Date(today + 'T00:00:00Z');

    while (cur <= end) {
      const dateStr = cur.toISOString().slice(0, 10);
      const tss = tssMap[dateStr] ?? 0;
      ctl = ctl * ctlDecay + tss * ctlGain;
      atl = atl * atlDecay + tss * atlGain;
      series.push({
        date: dateStr,
        tss,
        ctl: Math.round(ctl * 10) / 10,
        atl: Math.round(atl * 10) / 10,
        tsb: Math.round((ctl - atl) * 10) / 10,
      });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const last90  = series.slice(-90);
    const latest  = series[series.length - 1] ?? null;

    return Response.json({ ok: true, series: last90, latest, hasEstimated });
  } catch (e) {
    console.error('cycling-pmc error:', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

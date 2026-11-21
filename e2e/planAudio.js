// Shared by journey-voice and journey-media: decide per test which recorded clips a plan step carries.
/** Every step of every /api/plan answer gets `audio` for the languages given — none = no clip at all,
 *  also for the exercises that have a real recorded clip (migration 0128). */
export async function patchPlanAudio(page, langs) {
  const requested = [];   // what the media element really asked the server for (status and type included)
  page.on('response', (r) => { const u = new URL(r.url()); if (u.pathname.startsWith('/exercise-audio/')) requested.push({ path: u.pathname, status: r.status(), type: r.headers()['content-type'] }); });
  {
    await page.route('**/api/plan**', async (route) => {
      const res = await route.fetch();
      if (!(res.headers()['content-type'] ?? '').includes('json')) return route.fulfill({ response: res });
      const json = await res.json();
      const walk = (o) => {
        if (Array.isArray(o)) o.forEach(walk);
        else if (o && typeof o === 'object') {
          if (typeof o.exercise_slug === 'string') o.audio = langs.length ? Object.fromEntries(langs.map((l) => [l, `/exercise-audio/e2e-voice/${l}.mp3`])) : null;
          for (const [k, v] of Object.entries(o)) {
            // GET /api/plan carries the plan as a JSON string (plan_json).
            if (typeof v === 'string' && v.includes('"exercise_slug"')) { try { const inner = JSON.parse(v); walk(inner); o[k] = JSON.stringify(inner); } catch { /* not JSON */ } }
            else walk(v);
          }
        }
      };
      walk(json);
      return route.fulfill({ response: res, json });
    });
  }
  return requested;
}

async function _hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function _verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    if (sig !== await _hmacSign(`${header}.${body}`, secret)) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

async function getAuthUserId(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  if (!token || !env.JWT_SECRET) return null;
  const payload = await _verifyJWT(token, env.JWT_SECRET);
  return payload?.userId ?? null;
}

export async function onRequestGet({ request, env }) {
  try {
    const user_id = await getAuthUserId(request, env);
    if (!user_id) return Response.json({ error: 'unauthorized' }, { status: 401 });

    // Last 7 days of executions
    const result = await env.DB.prepare(`
      SELECT date, execution_type, perceived_exertion
      FROM executions 
      WHERE user_id = ? 
        AND status = 'completed'
        AND date >= date('now', '-7 days')
      ORDER BY date DESC
    `).bind(user_id).all();

    const executions = result.results;
    const activeDays = new Set(executions.map(e => e.date)).size;
    const activeDayPoints = activeDays * 10;

    // Resilience bonus — completed despite low energy (perceived_exertion <= 4 but still done)
    const resilienceBonus = Math.min(20,
      executions.filter(e => e.perceived_exertion && e.perceived_exertion <= 4).length * 5
    );

    // Streak bonus — fetch last 28 days
    const streakResult = await env.DB.prepare(`
      SELECT DISTINCT date FROM executions
      WHERE user_id = ? AND status = 'completed'
      ORDER BY date DESC LIMIT 28
    `).bind(user_id).all();

    const streakDays = streakResult.results.length;
    const continuityBonus = streakDays >= 28 ? 10 : streakDays >= 14 ? 5 : 0;

    const score = Math.min(100, activeDayPoints + resilienceBonus + continuityBonus);

    return Response.json({
      score,
      breakdown: { activeDayPoints, resilienceBonus, continuityBonus, activeDays }
    });
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

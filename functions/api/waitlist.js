const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const { email, source = 'marketing' } = await request.json();
    if (!email || !email.includes('@') || email.length > 254) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }
    await env.DB.prepare(
      'INSERT OR IGNORE INTO waitlist (email, source) VALUES (?, ?)'
    ).bind(email.toLowerCase().trim(), source).run();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
}

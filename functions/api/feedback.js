// POST /api/feedback — send feedback email via Resend

async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    if (sig !== await hmacSign(`${header}.${body}`, secret)) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

async function getUser(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  if (!token || !env.JWT_SECRET) return null;
  return verifyJWT(token, env.JWT_SECRET);
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const text = (body.text ?? '').trim();
    if (!text) return Response.json({ error: 'Feedback text required' }, { status: 400 });
    if (text.length > 5000) return Response.json({ error: 'Feedback too long' }, { status: 400 });

    if (env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'JustFit.cc <noreply@justfit.cc>',
          to: ['ahlj.vd.plas@gmail.com'],
          subject: `JustFit Feedback from ${user.email ?? user.userId}`,
          text: `User: ${user.email ?? user.userId}\nUser ID: ${user.userId}\n\n${text}`,
        }),
      });
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e); return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

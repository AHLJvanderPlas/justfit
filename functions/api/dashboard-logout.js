// POST /api/dashboard-logout — clears the jf_dash_session cookie.

export async function onRequestPost() {
  return Response.json({ ok: true }, {
    headers: {
      'Set-Cookie': 'jf_dash_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
    },
  });
}

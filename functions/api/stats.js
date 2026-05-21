export async function onRequestGet({ env }) {
  try {
    const [sessionsResult, usersResult] = await env.DB.batch([
      env.DB.prepare('SELECT COUNT(*) as total FROM executions'),
      env.DB.prepare('SELECT COUNT(*) as total FROM users'),
    ]);
    return new Response(JSON.stringify({
      total_sessions: sessionsResult.results[0]?.total ?? 0,
      total_users: usersResult.results[0]?.total ?? 0,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return new Response(JSON.stringify({ total_sessions: 0, total_users: 0 }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

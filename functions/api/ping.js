export async function onRequestGet({ env }) {
  // Check D1 connectivity as well — catches binding failures early.
  try {
    await env.DB.prepare('SELECT 1').first();
    return Response.json({ ok: true, db: true, ts: Date.now() });
  } catch {
    // Return 200 with db:false so monitors can distinguish app-up/db-down
    return Response.json({ ok: true, db: false, ts: Date.now() }, { status: 200 });
  }
}

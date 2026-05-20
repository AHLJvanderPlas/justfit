// GET /api/trainer/audit — paginated audit log for gym owners (P1I)
import { requireGymContext } from '../../lib/middleware.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const ctx = await requireGymContext(request, env, ['owner', 'admin']);
  if (ctx instanceof Response) return ctx;

  const url = new URL(request.url);
  const before = parseInt(url.searchParams.get('before') ?? '0') || Date.now();
  const limit = 50;

  try {
    const rows = await env.DB.prepare(
      `SELECT al.id, al.actor_user_id, al.action, al.target_type, al.target_id,
              al.payload_json, al.ip_address, al.created_at_ms,
              u.primary_email as actor_display
       FROM audit_log al
       LEFT JOIN users u ON u.id = al.actor_user_id
       WHERE al.gym_id = ? AND al.created_at_ms < ?
       ORDER BY al.created_at_ms DESC
       LIMIT ?`
    ).bind(ctx.gymId, before, limit + 1).all();

    const entries = (rows.results ?? []);
    const hasMore = entries.length > limit;
    const page = hasMore ? entries.slice(0, limit) : entries;
    const nextCursor = hasMore ? page[page.length - 1].created_at_ms : null;

    return Response.json({ entries: page, next_cursor: nextCursor });
  } catch (e) {
    console.error('audit GET error', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

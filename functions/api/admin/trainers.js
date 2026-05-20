// GET  /api/admin/trainers               — paginated list (filter by status)
// GET  /api/admin/trainers?id=xxx        — trainer detail
// POST /api/admin/trainers               — create trainer (admin-initiated)
// PATCH /api/admin/trainers              — approve | reject | suspend | reactivate | change_plan
import { verifyAdminSession, adminUnauthorized, logAudit } from './_shared/auth.js';

const PAGE = 25;

export async function onRequestGet({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const url    = new URL(request.url);
    const id     = url.searchParams.get('id');

    if (id) return getTrainerDetail(env, id);

    const page   = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const status = url.searchParams.get('status') || '';   // pending | active | suspended | all
    const search = (url.searchParams.get('search') || '').trim();
    const offset = (page - 1) * PAGE;

    const binds = [];
    let where = 'WHERE 1=1';

    if (status && status !== 'all') {
      where += ` AND t.status = ?`;
      binds.push(status);
    }
    if (search) {
      where += ` AND (t.name LIKE ? OR t.email LIKE ? OR t.studio_name LIKE ?)`;
      binds.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows, countRow] = await Promise.all([
      env.DB.prepare(
        `SELECT t.id, t.email, t.name, t.studio_name, t.plan, t.status, t.country,
                t.created_at_ms, t.approved_at_ms,
                (SELECT COUNT(*) FROM trainer_connections tc WHERE tc.trainer_id = t.id AND tc.status = 'active') as client_count
         FROM trainers t
         ${where}
         ORDER BY t.created_at_ms DESC
         LIMIT ? OFFSET ?`
      ).bind(...binds, PAGE, offset).all(),
      env.DB.prepare(
        `SELECT COUNT(*) as c FROM trainers t ${where}`
      ).bind(...binds).first(),
    ]);

    return Response.json({
      ok: true,
      trainers: rows.results,
      total: countRow.c,
      page,
      pages: Math.ceil(countRow.c / PAGE),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function getTrainerDetail(env, trainerId) {
  try {
    const [trainer, clients, invoices] = await Promise.all([
      env.DB.prepare(
        `SELECT t.*,
                (SELECT COUNT(*) FROM trainer_connections tc WHERE tc.trainer_id = t.id AND tc.status = 'active') as client_count
         FROM trainers t WHERE t.id = ?`
      ).bind(trainerId).first(),
      env.DB.prepare(
        `SELECT u.id, u.primary_email, up.display_name, tc.connected_at_ms
         FROM trainer_connections tc
         JOIN users u ON u.id = tc.user_id
         LEFT JOIN user_preferences up ON up.user_id = u.id
         WHERE tc.trainer_id = ? AND tc.status = 'active'
         ORDER BY tc.connected_at_ms DESC
         LIMIT 50`
      ).bind(trainerId).all(),
      env.DB.prepare(
        `SELECT id, invoice_number, status, period, amount, currency, invoice_date, due_date
         FROM trainer_billing_invoices WHERE trainer_id = ?
         ORDER BY created_at_ms DESC LIMIT 20`
      ).bind(trainerId).all(),
    ]);

    if (!trainer) return Response.json({ error: 'Not found' }, { status: 404 });

    return Response.json({
      ok: true,
      trainer,
      clients: clients.results,
      invoices: invoices.results,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPatch({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const body   = await request.json();
    const { id, action } = body;
    if (!id || !action) return Response.json({ error: 'id and action required' }, { status: 400 });

    const trainer = await env.DB.prepare('SELECT id, email, name, status, plan FROM trainers WHERE id = ?').bind(id).first();
    if (!trainer) return Response.json({ error: 'Not found' }, { status: 404 });

    const now = Date.now();

    if (action === 'approve') {
      await env.DB.prepare(
        `UPDATE trainers SET status = 'active', approved_at_ms = ?, approved_by = ?, updated_at_ms = ? WHERE id = ?`
      ).bind(now, admin.user_id, now, id).run();
      await logAudit(env, admin.user_id, 'trainer.approve', 'trainer', id, { name: trainer.name });
      // TODO: send activation email via Resend
      return Response.json({ ok: true });
    }

    if (action === 'reject') {
      const reason = body.reason || 'Application not approved.';
      await env.DB.prepare(
        `UPDATE trainers SET status = 'rejected', updated_at_ms = ? WHERE id = ?`
      ).bind(now, id).run();
      await logAudit(env, admin.user_id, 'trainer.reject', 'trainer', id, { name: trainer.name, reason });
      return Response.json({ ok: true });
    }

    if (action === 'suspend') {
      await env.DB.prepare(
        `UPDATE trainers SET status = 'suspended', updated_at_ms = ? WHERE id = ?`
      ).bind(now, id).run();
      await logAudit(env, admin.user_id, 'trainer.suspend', 'trainer', id, { name: trainer.name });
      return Response.json({ ok: true });
    }

    if (action === 'reactivate') {
      await env.DB.prepare(
        `UPDATE trainers SET status = 'active', updated_at_ms = ? WHERE id = ?`
      ).bind(now, id).run();
      await logAudit(env, admin.user_id, 'trainer.reactivate', 'trainer', id, { name: trainer.name });
      return Response.json({ ok: true });
    }

    if (action === 'change_plan') {
      const plan = body.plan;
      if (!['starter', 'pro', 'studio'].includes(plan)) {
        return Response.json({ error: 'Invalid plan' }, { status: 400 });
      }
      await env.DB.prepare(
        `UPDATE trainers SET plan = ?, updated_at_ms = ? WHERE id = ?`
      ).bind(plan, now, id).run();
      await logAudit(env, admin.user_id, 'trainer.change_plan', 'trainer', id, { name: trainer.name, old_plan: trainer.plan, new_plan: plan });
      return Response.json({ ok: true });
    }

    if (action === 'delete') {
      // Soft delete — keep data, mark deleted
      await env.DB.prepare(
        `UPDATE trainers SET status = 'deleted', updated_at_ms = ? WHERE id = ?`
      ).bind(now, id).run();
      await logAudit(env, admin.user_id, 'trainer.delete', 'trainer', id, { name: trainer.name });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

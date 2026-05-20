// GET /api/admin/dashboard — platform KPIs + recent events
import { verifyAdminSession, adminUnauthorized } from './_shared/auth.js';

export async function onRequestGet({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartMs = monthStart.getTime();
    const thirtyDaysAgo = Date.now() - 30 * 86_400_000;

    const [
      totalUsers,
      activeUsers30d,
      totalTrainers,
      pendingTrainers,
      newUsersMonth,
      newTrainersMonth,
      mrrData,
      outstandingBilling,
      recentEvents,
      recentAudit,
    ] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as c FROM users WHERE status != 'deleted'`).first(),
      env.DB.prepare(
        `SELECT COUNT(DISTINCT user_id) as c FROM executions WHERE created_at_ms > ?`
      ).bind(thirtyDaysAgo).first(),
      env.DB.prepare(`SELECT COUNT(*) as c FROM trainers WHERE status = 'active'`).first(),
      env.DB.prepare(`SELECT COUNT(*) as c FROM trainers WHERE status = 'pending'`).first(),
      env.DB.prepare(
        `SELECT COUNT(*) as c FROM users WHERE created_at_ms > ? AND status != 'deleted'`
      ).bind(monthStartMs).first(),
      env.DB.prepare(
        `SELECT COUNT(*) as c FROM trainers WHERE created_at_ms > ?`
      ).bind(monthStartMs).first(),
      // MRR = sum of active trainer plans × pricing
      env.DB.prepare(
        `SELECT plan, COUNT(*) as cnt FROM trainers WHERE status = 'active' GROUP BY plan`
      ).all(),
      env.DB.prepare(
        `SELECT COUNT(*) as cnt, SUM(amount) as total FROM trainer_billing_invoices WHERE status IN ('sent','overdue')`
      ).first(),
      env.DB.prepare(
        `SELECT id, event_type, detail, user_email, created_at_ms FROM app_events ORDER BY created_at_ms DESC LIMIT 40`
      ).all(),
      env.DB.prepare(
        `SELECT a.action, a.target_type, a.target_id, a.created_at_ms, u.name as actor_name
         FROM admin_justfit_audit a
         LEFT JOIN admin_justfit_users u ON u.id = a.actor_id
         ORDER BY a.created_at_ms DESC LIMIT 20`
      ).all(),
    ]);

    // Compute MRR from trainer plan distribution + current pricing
    const pricing = await env.DB.prepare(
      `SELECT plan, price_monthly FROM trainer_plan_pricing WHERE is_active = 1`
    ).all();
    const priceMap = Object.fromEntries(pricing.results.map(p => [p.plan, p.price_monthly]));
    let mrr = 0;
    for (const row of mrrData.results) {
      mrr += (priceMap[row.plan] || 0) * row.cnt;
    }

    return Response.json({
      ok: true,
      stats: {
        total_users: totalUsers.c,
        active_users_30d: activeUsers30d.c,
        total_trainers: totalTrainers.c,
        pending_trainers: pendingTrainers.c,
        new_users_month: newUsersMonth.c,
        new_trainers_month: newTrainersMonth.c,
        mrr,
        outstanding_invoices: outstandingBilling.cnt || 0,
        outstanding_amount: outstandingBilling.total || 0,
      },
      trainer_distribution: mrrData.results,
      recent_events: recentEvents.results,
      recent_audit: recentAudit.results,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET  /api/admin/billing?resource=invoices  — list billing invoices
// GET  /api/admin/billing?resource=pricing   — plan pricing
// GET  /api/admin/billing?resource=summary   — revenue summary
// POST /api/admin/billing                    — {resource:'invoice', ...} create invoice
// PATCH /api/admin/billing                   — {resource:'invoice', id, action} send|paid|void
// PUT  /api/admin/billing                    — {resource:'pricing', plan, price_monthly} update pricing
import { verifyAdminSession, adminUnauthorized, logAudit } from './_shared/auth.js';

const PAGE = 25;

export async function onRequestGet({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const url      = new URL(request.url);
    const resource = url.searchParams.get('resource') || 'invoices';

    if (resource === 'pricing') {
      const rows = await env.DB.prepare(
        `SELECT id, plan, price_monthly, currency, effective_from, is_active, notes
         FROM trainer_plan_pricing ORDER BY plan, effective_from DESC`
      ).all();
      return Response.json({ ok: true, pricing: rows.results });
    }

    if (resource === 'summary') {
      const [mrr, outstanding, paid_month] = await Promise.all([
        env.DB.prepare(
          `SELECT t.plan, COUNT(*) as cnt FROM trainers t WHERE t.status = 'active' GROUP BY t.plan`
        ).all(),
        env.DB.prepare(
          `SELECT COUNT(*) as cnt, COALESCE(SUM(amount),0) as total
           FROM trainer_billing_invoices WHERE status IN ('sent','overdue')`
        ).first(),
        env.DB.prepare(
          `SELECT COALESCE(SUM(amount),0) as total FROM trainer_billing_invoices
           WHERE status = 'paid' AND paid_at_ms > ?`
        ).bind(new Date(new Date().setDate(1)).setHours(0, 0, 0, 0)).first(),
      ]);
      const pricing = await env.DB.prepare(
        `SELECT plan, price_monthly FROM trainer_plan_pricing WHERE is_active = 1`
      ).all();
      const priceMap = Object.fromEntries(pricing.results.map(p => [p.plan, p.price_monthly]));
      let mrrTotal = 0;
      for (const r of mrr.results) mrrTotal += (priceMap[r.plan] || 0) * r.cnt;

      return Response.json({
        ok: true,
        mrr: mrrTotal,
        outstanding_count: outstanding.cnt,
        outstanding_amount: outstanding.total,
        paid_this_month: paid_month.total,
        trainer_distribution: mrr.results,
        price_map: priceMap,
      });
    }

    // Default: invoices
    const page       = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const status     = url.searchParams.get('status') || '';
    const trainer_id = url.searchParams.get('trainer_id') || '';
    const offset     = (page - 1) * PAGE;

    const binds = [];
    let where = 'WHERE 1=1';
    if (status) { where += ' AND i.status = ?'; binds.push(status); }
    if (trainer_id) { where += ' AND i.trainer_id = ?'; binds.push(trainer_id); }

    const [rows, countRow] = await Promise.all([
      env.DB.prepare(
        `SELECT i.id, i.invoice_number, i.trainer_id, t.name as trainer_name,
                i.status, i.period, i.plan, i.amount, i.currency,
                i.invoice_date, i.due_date, i.sent_at_ms, i.paid_at_ms
         FROM trainer_billing_invoices i
         JOIN trainers t ON t.id = i.trainer_id
         ${where}
         ORDER BY i.created_at_ms DESC
         LIMIT ? OFFSET ?`
      ).bind(...binds, PAGE, offset).all(),
      env.DB.prepare(
        `SELECT COUNT(*) as c FROM trainer_billing_invoices i ${where}`
      ).bind(...binds).first(),
    ]);

    return Response.json({
      ok: true,
      invoices: rows.results,
      total: countRow.c,
      page,
      pages: Math.ceil(countRow.c / PAGE),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const body = await request.json();
    if (body.resource !== 'invoice') return Response.json({ error: 'resource must be invoice' }, { status: 400 });

    const { trainer_id, plan, amount, currency, period, period_start, period_end, invoice_date, due_date, notes } = body;
    if (!trainer_id || !plan || amount == null || !invoice_date) {
      return Response.json({ error: 'trainer_id, plan, amount, invoice_date required' }, { status: 400 });
    }

    // Generate invoice number JF-YYYY-NNN
    const year = new Date().getFullYear();
    const countRow = await env.DB.prepare(
      `SELECT COUNT(*) as c FROM trainer_billing_invoices WHERE invoice_number LIKE ?`
    ).bind(`JF-${year}-%`).first();
    const seq = String(countRow.c + 1).padStart(3, '0');
    const invoiceNumber = `JF-${year}-${seq}`;

    const id  = crypto.randomUUID();
    const now = Date.now();

    await env.DB.prepare(
      `INSERT INTO trainer_billing_invoices
       (id, trainer_id, invoice_number, status, period, period_start, period_end,
        plan, amount, currency, invoice_date, due_date, notes, created_at_ms, updated_at_ms)
       VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, trainer_id, invoiceNumber,
      period || null, period_start || null, period_end || null,
      plan, amount, currency || 'EUR',
      invoice_date, due_date || null, notes || null,
      now, now
    ).run();

    await logAudit(env, admin.user_id, 'billing.invoice_create', 'invoice', id, { trainer_id, amount });
    return Response.json({ ok: true, id, invoice_number: invoiceNumber });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPatch({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const { id, action } = await request.json();
    if (!id || !action) return Response.json({ error: 'id and action required' }, { status: 400 });

    const inv = await env.DB.prepare('SELECT id, status FROM trainer_billing_invoices WHERE id = ?').bind(id).first();
    if (!inv) return Response.json({ error: 'Not found' }, { status: 404 });

    const now = Date.now();

    if (action === 'send') {
      await env.DB.prepare(
        `UPDATE trainer_billing_invoices SET status = 'sent', sent_at_ms = ?, updated_at_ms = ? WHERE id = ?`
      ).bind(now, now, id).run();
      await logAudit(env, admin.user_id, 'billing.invoice_send', 'invoice', id);
      return Response.json({ ok: true });
    }
    if (action === 'paid') {
      await env.DB.prepare(
        `UPDATE trainer_billing_invoices SET status = 'paid', paid_at_ms = ?, updated_at_ms = ? WHERE id = ?`
      ).bind(now, now, id).run();
      await logAudit(env, admin.user_id, 'billing.invoice_paid', 'invoice', id);
      return Response.json({ ok: true });
    }
    if (action === 'void') {
      await env.DB.prepare(
        `UPDATE trainer_billing_invoices SET status = 'void', voided_at_ms = ?, updated_at_ms = ? WHERE id = ?`
      ).bind(now, now, id).run();
      await logAudit(env, admin.user_id, 'billing.invoice_void', 'invoice', id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const body = await request.json();
    if (body.resource !== 'pricing') return Response.json({ error: 'resource must be pricing' }, { status: 400 });

    const { plan, price_monthly, currency, notes } = body;
    if (!['starter', 'pro', 'studio'].includes(plan) || price_monthly == null) {
      return Response.json({ error: 'plan and price_monthly required' }, { status: 400 });
    }

    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);

    // Deactivate existing pricing for this plan
    await env.DB.prepare(
      `UPDATE trainer_plan_pricing SET is_active = 0 WHERE plan = ? AND is_active = 1`
    ).bind(plan).run();

    // Insert new pricing row
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO trainer_plan_pricing (id, plan, price_monthly, currency, effective_from, is_active, notes, created_at_ms)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
    ).bind(id, plan, price_monthly, currency || 'EUR', today, notes || null, now).run();

    await logAudit(env, admin.user_id, 'billing.pricing_update', 'pricing', plan, { price_monthly, currency });
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

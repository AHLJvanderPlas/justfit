// CRUD /api/trainer/btw/supplier-invoices (P1H)
import { requireGymContext } from '../../../lib/middleware.js';
import { writeAudit, ACTIONS } from '../../../lib/audit.js';

export async function onRequest(context) {
  const { request, env } = context;
  const ctx = await requireGymContext(request, env, ['owner','trainer']);
  if (ctx instanceof Response) return ctx;
  const { user, gymId } = ctx;

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const quarter = url.searchParams.get('quarter');
    let where = `gym_id = ?`;
    const bind = [gymId];
    if (year && quarter) {
      const q = parseInt(quarter, 10);
      const m1 = String((q - 1) * 3 + 1).padStart(2, '0');
      const m2 = String(q * 3).padStart(2, '0');
      where += ` AND invoice_date >= '${year}-${m1}-01' AND invoice_date <= '${year}-${m2}-31'`;
    } else if (year) {
      where += ` AND invoice_date >= '${year}-01-01' AND invoice_date <= '${year}-12-31'`;
    }
    const rows = await env.DB.prepare(
      `SELECT * FROM supplier_invoices WHERE ${where} ORDER BY invoice_date DESC`
    ).bind(...bind).all();
    return Response.json(rows.results ?? []);
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const { supplier_name, invoice_date, amount_ex_btw, btw_rate, btw_amount,
            supplier_kvk, supplier_vat, invoice_number, category, notes } = body;
    if (!supplier_name || !invoice_date || amount_ex_btw == null) {
      return Response.json({ error: 'supplier_name, invoice_date, amount_ex_btw required' }, { status: 400 });
    }
    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO supplier_invoices (id, gym_id, supplier_name, supplier_kvk, supplier_vat,
       invoice_date, invoice_number, amount_ex_btw, btw_rate, btw_amount, category, notes,
       created_at_ms, updated_at_ms) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, gymId, supplier_name, supplier_kvk ?? null, supplier_vat ?? null,
           invoice_date, invoice_number ?? null, amount_ex_btw, btw_rate ?? 0, btw_amount ?? 0,
           category ?? null, notes ?? null, now, now).run();
    await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.SUPPLIER_INVOICE_CREATED,
      targetType: 'supplier_invoice', targetId: id, request, env });
    return Response.json({ ok: true, id });
  }

  if (request.method === 'DELETE') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    await env.DB.prepare(`DELETE FROM supplier_invoices WHERE id = ? AND gym_id = ?`).bind(id, gymId).run();
    await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.SUPPLIER_INVOICE_DELETED,
      targetType: 'supplier_invoice', targetId: id, request, env });
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

// GET /api/trainer/btw/year/:year — annual BTW + revenue summary (P1H)
import { requireGymContext } from '../../../../lib/middleware.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const ctx = await requireGymContext(request, env, ['owner','trainer']);
  if (ctx instanceof Response) return ctx;
  const { gymId } = ctx;
  const year = parseInt(params.year, 10);
  if (!year) return Response.json({ error: 'Invalid year' }, { status: 400 });

  const [sentInvoices, supplierInvoices] = await Promise.all([
    env.DB.prepare(
      `SELECT subtotal, vat_amount, btw_lines_json, invoice_date, user_id
       FROM trainer_invoices
       WHERE gym_id_ref = ? AND status IN ('sent','paid')
         AND invoice_date >= '${year}-01-01' AND invoice_date <= '${year}-12-31'`
    ).bind(gymId).all(),
    env.DB.prepare(
      `SELECT amount_ex_btw, btw_amount FROM supplier_invoices
       WHERE gym_id = ? AND invoice_date >= '${year}-01-01' AND invoice_date <= '${year}-12-31'`
    ).bind(gymId).all(),
  ]);

  const sent = sentInvoices.results ?? [];
  const supplier = supplierInvoices.results ?? [];

  const revenueExBtw = sent.reduce((s, i) => s + (i.subtotal ?? 0), 0);
  const totalOutputBtw = sent.reduce((s, i) => s + (i.vat_amount ?? 0), 0);
  const totalInputBtw = supplier.reduce((s, i) => s + (i.btw_amount ?? 0), 0);

  // Per quarter
  const quarters = [1, 2, 3, 4].map(q => {
    const m1 = String((q - 1) * 3 + 1).padStart(2, '0');
    const m2 = String(q * 3).padStart(2, '0');
    const qSent = sent.filter(i => i.invoice_date >= `${year}-${m1}-01` && i.invoice_date <= `${year}-${m2}-31`);
    return {
      quarter: q,
      revenue_ex_btw: round2(qSent.reduce((s, i) => s + (i.subtotal ?? 0), 0)),
      output_btw: round2(qSent.reduce((s, i) => s + (i.vat_amount ?? 0), 0)),
    };
  });

  return Response.json({
    year,
    revenue_ex_btw: round2(revenueExBtw),
    output_btw_total: round2(totalOutputBtw),
    input_btw_total: round2(totalInputBtw),
    net_btw_position: round2(totalOutputBtw - totalInputBtw),
    quarters,
    invoice_count: sent.length,
    disclaimer: 'Verify all values with your accountant or the Belastingdienst before submitting any aangifte.',
  });
}

function round2(n) { return Math.round((n ?? 0) * 100) / 100; }

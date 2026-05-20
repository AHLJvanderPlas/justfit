// GET /api/trainer/btw/quarter/:year/:quarter — quarterly BTW summary (P1H)
import { requireGymContext } from '../../../../../lib/middleware.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const ctx = await requireGymContext(request, env, ['owner','trainer']);
  if (ctx instanceof Response) return ctx;
  const { gymId, gym } = ctx;

  const year = parseInt(params.year, 10);
  const q = parseInt(params.quarter, 10);
  if (!year || q < 1 || q > 4) return Response.json({ error: 'Invalid year/quarter' }, { status: 400 });

  const m1 = String((q - 1) * 3 + 1).padStart(2, '0');
  const m2 = String(q * 3).padStart(2, '0');
  const dateStart = `${year}-${m1}-01`;
  const dateEnd = `${year}-${m2}-31`;

  const [sentInvoices, supplierInvoices] = await Promise.all([
    env.DB.prepare(
      `SELECT id, invoice_number_assigned, user_id, total, subtotal, vat_amount, btw_lines_json,
              invoice_date, status
       FROM trainer_invoices
       WHERE gym_id_ref = ? AND status IN ('sent','paid')
         AND invoice_date >= ? AND invoice_date <= ?
       ORDER BY invoice_date ASC`
    ).bind(gymId, dateStart, dateEnd).all(),
    env.DB.prepare(
      `SELECT * FROM supplier_invoices WHERE gym_id = ? AND invoice_date >= ? AND invoice_date <= ? ORDER BY invoice_date ASC`
    ).bind(gymId, dateStart, dateEnd).all(),
  ]);

  const sent = sentInvoices.results ?? [];
  const supplier = supplierInvoices.results ?? [];

  // Output BTW (sales) per rate
  const outputBtw = {};
  let revenueExBtw = 0;
  for (const inv of sent) {
    revenueExBtw += inv.subtotal ?? 0;
    const btwLines = inv.btw_lines_json ? JSON.parse(inv.btw_lines_json) : [];
    for (const line of btwLines) {
      const rate = String(line.btw_rate);
      outputBtw[rate] = (outputBtw[rate] ?? 0) + (line.btw_amount ?? 0);
    }
  }

  // Input BTW (purchases) per rate
  const inputBtw = {};
  let totalInputBtw = 0;
  for (const si of supplier) {
    const rate = String(si.btw_rate);
    inputBtw[rate] = (inputBtw[rate] ?? 0) + (si.btw_amount ?? 0);
    totalInputBtw += si.btw_amount ?? 0;
  }

  const totalOutputBtw = Object.values(outputBtw).reduce((s, v) => s + v, 0);
  const netBtwPosition = totalOutputBtw - totalInputBtw;

  return Response.json({
    year, quarter: q, period: { start: dateStart, end: dateEnd },
    kor_active: !!gym.kor_active,
    revenue_ex_btw: round2(revenueExBtw),
    output_btw: Object.fromEntries(Object.entries(outputBtw).map(([k, v]) => [k, round2(v)])),
    output_btw_total: round2(totalOutputBtw),
    input_btw: Object.fromEntries(Object.entries(inputBtw).map(([k, v]) => [k, round2(v)])),
    input_btw_total: round2(totalInputBtw),
    net_btw_position: round2(netBtwPosition),
    invoices: sent.map(i => ({ id: i.id, number: i.invoice_number_assigned ?? i.invoice_number,
      date: i.invoice_date, total: i.total, btw: i.vat_amount, status: i.status })),
    supplier_invoices: supplier,
    disclaimer: 'Verify all values with your accountant or the Belastingdienst before submitting any aangifte. JustFit does not provide tax advice.',
  });
}

function round2(n) { return Math.round((n ?? 0) * 100) / 100; }

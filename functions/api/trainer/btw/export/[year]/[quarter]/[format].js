// GET /api/trainer/btw/export/:year/:quarter/:format — BTW export (CSV or PDF summary) (P1H)
// format: 'csv' | 'pdf'
import { requireGymContext } from '../../../../../../lib/middleware.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const ctx = await requireGymContext(request, env, ['owner','trainer']);
  if (ctx instanceof Response) return ctx;
  const { gymId, gym } = ctx;

  const year = parseInt(params.year, 10);
  const q = parseInt(params.quarter, 10);
  const format = params.format;
  if (!year || q < 1 || q > 4 || !['csv','pdf-summary'].includes(format)) {
    return Response.json({ error: 'Invalid parameters. format must be csv or pdf-summary' }, { status: 400 });
  }

  const m1 = String((q - 1) * 3 + 1).padStart(2, '0');
  const m2 = String(q * 3).padStart(2, '0');
  const dateStart = `${year}-${m1}-01`;
  const dateEnd = `${year}-${m2}-31`;

  const [sentInvoices, supplierInvoices] = await Promise.all([
    env.DB.prepare(
      `SELECT invoice_number_assigned, invoice_date, user_id, subtotal, vat_amount, btw_lines_json
       FROM trainer_invoices WHERE gym_id_ref = ? AND status IN ('sent','paid')
         AND invoice_date >= ? AND invoice_date <= ? ORDER BY invoice_date`
    ).bind(gymId, dateStart, dateEnd).all(),
    env.DB.prepare(
      `SELECT supplier_name, invoice_date, invoice_number, amount_ex_btw, btw_rate, btw_amount, category
       FROM supplier_invoices WHERE gym_id = ? AND invoice_date >= ? AND invoice_date <= ? ORDER BY invoice_date`
    ).bind(gymId, dateStart, dateEnd).all(),
  ]);

  const sent = sentInvoices.results ?? [];
  const supplier = supplierInvoices.results ?? [];

  if (format === 'csv') {
    // Moneybird-compatible CSV format
    const rows = [
      ['Type', 'Datum', 'Referentie', 'Omschrijving', 'Bedrag ex BTW', 'BTW tarief', 'BTW bedrag', 'Categorie'],
    ];
    for (const inv of sent) {
      const btwLines = inv.btw_lines_json ? JSON.parse(inv.btw_lines_json) : [{ btw_rate: 0, btw_amount: inv.vat_amount }];
      for (const line of btwLines) {
        rows.push(['Verkoopfactuur', inv.invoice_date, inv.invoice_number_assigned ?? '',
          `Factuur ${inv.invoice_number_assigned ?? ''}`,
          fmtEur(inv.subtotal), fmtPct(line.btw_rate), fmtEur(line.btw_amount), 'Omzet']);
      }
    }
    for (const si of supplier) {
      rows.push(['Inkoopfactuur', si.invoice_date, si.invoice_number ?? '',
        si.supplier_name, fmtEur(si.amount_ex_btw), fmtPct(si.btw_rate), fmtEur(si.btw_amount),
        si.category ?? 'Overig']);
    }
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="btw-${year}-q${q}.csv"`,
      },
    });
  }

  // PDF summary — return JSON summary shaped for Belastingdienst aangifte fields
  // (Actual PDF rendering can be wired to @cloudflare/puppeteer; for now returns structured data)
  const revenueExBtw = sent.reduce((s, i) => s + (i.subtotal ?? 0), 0);
  const outputBtwByRate = {};
  for (const inv of sent) {
    const lines = inv.btw_lines_json ? JSON.parse(inv.btw_lines_json) : [];
    for (const l of lines) {
      const r = String(l.btw_rate ?? 0);
      outputBtwByRate[r] = (outputBtwByRate[r] ?? 0) + (l.btw_amount ?? 0);
    }
  }
  const inputBtwTotal = supplier.reduce((s, si) => s + (si.btw_amount ?? 0), 0);
  const outputBtwTotal = Object.values(outputBtwByRate).reduce((s, v) => s + v, 0);

  return Response.json({
    gym_name: gym.name,
    period: `Q${q} ${year} (${dateStart} – ${dateEnd})`,
    kor_active: !!gym.kor_active,
    rubriek_1a_21pct: round2(outputBtwByRate['0.21'] ?? 0),
    rubriek_1b_9pct: round2(outputBtwByRate['0.09'] ?? 0),
    rubriek_1c_0pct: round2(outputBtwByRate['0'] ?? 0),
    rubriek_5b_input_btw: round2(inputBtwTotal),
    revenue_ex_btw: round2(revenueExBtw),
    output_btw_total: round2(outputBtwTotal),
    net_position: round2(outputBtwTotal - inputBtwTotal),
    disclaimer: 'Verify all values with your accountant or the Belastingdienst before submitting your aangifte. JustFit does not provide tax advice.',
  });
}

function fmtEur(n) { return (Math.round((n ?? 0) * 100) / 100).toFixed(2).replace('.', ','); }
function fmtPct(r) { return r == null ? '0%' : `${Math.round(r * 100)}%`; }
function round2(n) { return Math.round((n ?? 0) * 100) / 100; }

// CRUD + send /api/trainer/invoices — invoice management (P1G)
import { requireGymContext } from '../../lib/middleware.js';
import { writeAudit, ACTIONS } from '../../lib/audit.js';
import { validateInvoiceForSend } from '../../lib/invoice-validator.js';
import { unwrapGymKey, decryptField } from '../../lib/crypto.js';

export async function onRequest(context) {
  const { request, env } = context;
  const ctx = await requireGymContext(request, env, ['owner','trainer']);
  if (ctx instanceof Response) return ctx;
  const { user, gymId, gym } = ctx;

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) {
      const inv = await env.DB.prepare(`SELECT * FROM trainer_invoices WHERE id = ? AND gym_id_ref = ?`).bind(id, gymId).first();
      if (!inv) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json(inv);
    }
    const rows = await env.DB.prepare(
      `SELECT id, invoice_number, invoice_number_assigned, user_id, status, invoice_date, due_date,
              currency, subtotal, vat_amount, total, sent_at_ms, paid_at_ms, mollie_payment_url
       FROM trainer_invoices WHERE gym_id_ref = ? ORDER BY created_at_ms DESC`
    ).bind(gymId).all();
    return Response.json(rows.results ?? []);
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const { user_id, invoice_date, due_date, lines, notes, payment_terms_days } = body;
    if (!user_id || !invoice_date || !lines?.length) {
      return Response.json({ error: 'user_id, invoice_date, lines required' }, { status: 400 });
    }

    // Check client disclosure level >= L3
    const disc = await env.DB.prepare(
      `SELECT level FROM trainer_disclosures WHERE user_id = ? AND gym_id = ? LIMIT 1`
    ).bind(user_id, gymId).first();
    if (!disc || !['L3','L4'].includes(disc.level)) {
      return Response.json({ error: 'disclosure_required', required_level: 'L3',
        detail: 'Client must share billing details (Level 3) before an invoice can be created.' }, { status: 403 });
    }

    const subtotal = lines.reduce((s, l) => s + (l.quantity ?? 1) * (l.unit_price ?? 0), 0);
    const vatAmount = lines.reduce((s, l) => s + (l.btw_amount ?? 0), 0);
    const total = subtotal + vatAmount;

    const id = crypto.randomUUID();
    const now = Date.now();
    const invoiceNumber = `DRAFT-${id.slice(0, 8).toUpperCase()}`;

    await env.DB.prepare(
      `INSERT INTO trainer_invoices (id, trainer_id, user_id, gym_id_ref, invoice_number, status,
       invoice_date, due_date, currency, lines_json, subtotal, vat_amount, total, notes,
       payment_terms_days, btw_lines_json, created_at_ms, updated_at_ms)
       VALUES (?,?,?,?,'${invoiceNumber}','draft',?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, user.userId, user_id, gymId, invoice_date, due_date ?? null,
           'EUR', JSON.stringify(lines), subtotal, vatAmount, total, notes ?? null,
           payment_terms_days ?? 14,
           JSON.stringify(buildBtwLines(lines)),
           now, now).run();

    await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.INVOICE_CREATED,
      targetType: 'invoice', targetId: id, request, env });
    return Response.json({ ok: true, id });
  }

  if (request.method === 'PUT') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const inv = await env.DB.prepare(`SELECT * FROM trainer_invoices WHERE id = ? AND gym_id_ref = ?`).bind(id, gymId).first();
    if (!inv) return Response.json({ error: 'Not found' }, { status: 404 });

    if (action === 'send') {
      if (inv.status !== 'draft') return Response.json({ error: 'Only draft invoices can be sent' }, { status: 400 });

      // Decrypt billing details for NL compliance check
      let customerBilling = null;
      if (gym.encryption_key_enc !== 'PENDING_KEY_GENERATION' && env.GYM_MASTER_KEK) {
        const gymKey = await unwrapGymKey(gym.encryption_key_enc, env.GYM_MASTER_KEK);
        const disc2 = await env.DB.prepare(
          `SELECT * FROM trainer_disclosures WHERE user_id = ? AND gym_id = ? LIMIT 1`
        ).bind(inv.user_id, gymId).first();
        if (disc2) {
          customerBilling = {
            name: await decryptField(disc2.billing_name_enc, gymKey),
            address: await decryptField(disc2.billing_address_enc, gymKey),
            postal: await decryptField(disc2.billing_postal_enc, gymKey),
            city: await decryptField(disc2.billing_city_enc, gymKey),
            country: disc2.billing_country,
            vat: await decryptField(disc2.billing_vat_enc, gymKey),
          };
        }
      }

      const validation = validateInvoiceForSend(inv, gym, customerBilling);
      if (!validation.ok) return Response.json({ error: 'send_validation_failed', errors: validation.errors }, { status: 422 });

      // Allocate sequential invoice number (atomic)
      const year = new Date(inv.invoice_date).getFullYear();
      await env.DB.prepare(
        `INSERT INTO invoice_counters (gym_id, year, last_number) VALUES (?, ?, 1)
         ON CONFLICT(gym_id, year) DO UPDATE SET last_number = last_number + 1`
      ).bind(gymId, year).run();
      const counter = await env.DB.prepare(
        `SELECT last_number FROM invoice_counters WHERE gym_id = ? AND year = ?`
      ).bind(gymId, year).first();
      const num = String(counter.last_number).padStart(4, '0');
      const prefix = gym.slug.toUpperCase().slice(0, 6);
      const invoiceNumberAssigned = `${prefix}-${year}-${num}`;

      const now = Date.now();
      await env.DB.prepare(
        `UPDATE trainer_invoices SET status='sent', invoice_number_assigned=?, sent_at_ms=?, updated_at_ms=? WHERE id=?`
      ).bind(invoiceNumberAssigned, now, now, id).run();

      // TODO P1G: generate PDF, upload to R2, create Mollie payment, send email via Resend
      // These hooks are stubbed — wire in when pdf.js and mollie.js are available.

      await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.INVOICE_SENT,
        targetType: 'invoice', targetId: id, payload: { invoice_number: invoiceNumberAssigned }, request, env });

      return Response.json({ ok: true, invoice_number: invoiceNumberAssigned });
    }

    if (action === 'void') {
      await env.DB.prepare(
        `UPDATE trainer_invoices SET status='void', voided_at_ms=?, updated_at_ms=? WHERE id=?`
      ).bind(Date.now(), Date.now(), id).run();
      await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.INVOICE_VOIDED,
        targetType: 'invoice', targetId: id, request, env });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

function buildBtwLines(lines) {
  const map = {};
  for (const l of lines) {
    const rate = l.btw_rate ?? 0;
    if (!map[rate]) map[rate] = { btw_rate: rate, btw_amount: 0 };
    map[rate].btw_amount += l.btw_amount ?? 0;
  }
  return Object.values(map);
}

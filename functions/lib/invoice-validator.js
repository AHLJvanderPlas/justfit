// functions/lib/invoice-validator.js
// Validates an invoice meets all NL mandatory fields before it can be sent.

/**
 * @param {object} invoice - trainer_invoices row
 * @param {object} gym - gyms row (name, kvk_number, vat_number, iban, address_json)
 * @param {object|null} customerBilling - decrypted billing fields {name, address, postal, city, country}
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateInvoiceForSend(invoice, gym, customerBilling) {
  const errors = [];

  // Gym (supplier) fields
  if (!gym.name) errors.push('Gym name is required on the invoice');
  if (!gym.kvk_number) errors.push('KVK number is required (set in Practice Settings)');
  if (!gym.kor_active && !gym.vat_number) errors.push('BTW number is required unless KOR is active');
  if (!gym.iban) errors.push('IBAN is required for payment details');
  const gymAddr = gym.address_json ? JSON.parse(gym.address_json) : {};
  if (!gymAddr.street && !gymAddr.city) errors.push('Gym address is required');

  // Invoice fields
  if (!invoice.invoice_date) errors.push('Invoice date is required');
  if (!invoice.due_date) errors.push('Payment due date is required');

  // Customer (client) fields — require L3+ disclosure
  if (!customerBilling) {
    errors.push('Client billing details not available — client must share Level 3 disclosure');
  } else {
    if (!customerBilling.name) errors.push('Customer name is required');
    if (!customerBilling.address) errors.push('Customer address is required');
    if (!customerBilling.country) errors.push('Customer country is required');
  }

  // Line items
  const lines = invoice.lines_json ? JSON.parse(invoice.lines_json) : [];
  if (!lines.length) errors.push('At least one line item is required');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.description) errors.push(`Line ${i + 1}: description is required`);
    if (l.btw_rate == null) errors.push(`Line ${i + 1}: BTW rate must be set (0, 9%, or 21%)`);
    if (l.unit_price == null) errors.push(`Line ${i + 1}: unit price is required`);
  }

  // Totals sanity check
  const linesTotal = lines.reduce((s, l) => s + ((l.quantity ?? 1) * (l.unit_price ?? 0) + (l.btw_amount ?? 0)), 0);
  if (Math.abs((invoice.total ?? 0) - linesTotal) > 0.02) {
    errors.push(`Invoice total (${invoice.total}) does not match line items sum (${linesTotal.toFixed(2)})`);
  }

  return { ok: errors.length === 0, errors };
}

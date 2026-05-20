// functions/lib/mollie.js
// Mollie REST API wrapper using plain fetch (Web Crypto / no npm). (P1G)

const MOLLIE_BASE = 'https://api.mollie.com/v2';

async function mollieReq(method, path, body, apiKey) {
  const res = await fetch(`${MOLLIE_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Mollie ${method} ${path}: ${json?.detail ?? res.status}`);
  return json;
}

/**
 * Create a one-time Mollie payment (for a sent invoice).
 * @returns {{ id, status, _links.checkout.href }} — use checkout.href as the payment URL
 */
export async function createPayment({ amount, description, redirectUrl, webhookUrl, metadata }, apiKey) {
  return mollieReq('POST', '/payments', {
    amount: { currency: 'EUR', value: Number(amount).toFixed(2) },
    description,
    redirectUrl,
    webhookUrl,
    metadata,
  }, apiKey);
}

/**
 * Get a Mollie payment by ID.
 */
export async function getPayment(paymentId, apiKey) {
  return mollieReq('GET', `/payments/${paymentId}`, null, apiKey);
}

/**
 * Create or retrieve a Mollie customer for a gym-client pair.
 */
export async function createCustomer({ name, email, metadata }, apiKey) {
  return mollieReq('POST', '/customers', { name, email, metadata }, apiKey);
}

/**
 * Create a recurring subscription for a Mollie customer.
 */
export async function createSubscription({ customerId, amount, interval, description, startDate, webhookUrl, metadata }, apiKey) {
  return mollieReq('POST', `/customers/${customerId}/subscriptions`, {
    amount: { currency: 'EUR', value: Number(amount).toFixed(2) },
    interval,
    description,
    startDate,
    webhookUrl,
    metadata,
  }, apiKey);
}

/**
 * Verify Mollie webhook signature.
 * Mollie sends payment ID in form body; we re-fetch to get current status.
 */
export async function verifyWebhook(request, apiKey) {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const paymentId = params.get('id');
  if (!paymentId) throw new Error('No payment ID in webhook body');
  const payment = await getPayment(paymentId, apiKey);
  return payment;
}

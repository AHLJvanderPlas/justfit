// Trainer-app API client — all API calls go through here
const BASE = '';  // same-origin (Cloudflare Pages)

class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function req(method: string, path: string, body?: unknown, token?: string | null, gymId?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (gymId) headers['X-Gym-Id'] = gymId;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `HTTP ${res.status}`, data);
  return data;
}

async function reqBlob(method: string, path: string, token?: string | null, gymId?: string | null) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (gymId) headers['X-Gym-Id'] = gymId;
  const res = await fetch(`${BASE}${path}`, { method, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data?.error ?? `HTTP ${res.status}`, data);
  }
  return res.blob();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    req('POST', '/api/auth', { action: 'login', email, password }),
  magicLink: (email: string) =>
    req('POST', '/api/auth', { action: 'magic_link', email }),

  // Gym
  getGym: (token: string, gymId: string) =>
    req('GET', '/api/trainer/gyms', undefined, token, gymId),
  updateGym: (token: string, gymId: string, data: Record<string, unknown>) =>
    req('PUT', '/api/trainer/gyms', data, token, gymId),
  acknowledgeDpa: (token: string, gymId: string) =>
    req('POST', '/api/trainer/dpa', {}, token, gymId),

  // Clients / Person Cards
  getClients: (token: string, gymId: string) =>
    req('GET', '/api/trainer/clients', undefined, token, gymId),
  getClient: (token: string, gymId: string, userId: string) =>
    req('GET', `/api/trainer/clients/${userId}`, undefined, token, gymId),
  requestUpgrade: (token: string, gymId: string, body: { user_id: string; target_level: string; reason?: string }) =>
    req('POST', '/api/trainer/clients/request-upgrade', body, token, gymId),

  // Exercises
  getExercises: (token: string, gymId: string) =>
    req('GET', '/api/trainer/exercises', undefined, token, gymId),
  createExercise: (token: string, gymId: string, data: Record<string, unknown>) =>
    req('POST', '/api/trainer/exercises', data, token, gymId),
  updateExercise: (token: string, gymId: string, id: string, data: Record<string, unknown>) =>
    req('PUT', `/api/trainer/exercises?id=${id}`, data, token, gymId),
  deleteExercise: (token: string, gymId: string, id: string) =>
    req('DELETE', `/api/trainer/exercises?id=${id}`, undefined, token, gymId),
  searchExercises: (token: string, gymId: string, params: Record<string, string>) => {
    const qs = new URLSearchParams({ gymId, ...params }).toString();
    return req('GET', `/api/exercises/search?${qs}`, undefined, token, gymId);
  },

  // Programs
  getPrograms: (token: string, gymId: string) =>
    req('GET', '/api/trainer/programs', undefined, token, gymId),
  getProgram: (token: string, gymId: string, id: string) =>
    req('GET', `/api/trainer/programs?id=${id}`, undefined, token, gymId),
  createProgram: (token: string, gymId: string, data: Record<string, unknown>) =>
    req('POST', '/api/trainer/programs', data, token, gymId),
  updateProgram: (token: string, gymId: string, id: string, data: Record<string, unknown>) =>
    req('PUT', `/api/trainer/programs?id=${id}`, data, token, gymId),
  deleteProgram: (token: string, gymId: string, id: string) =>
    req('DELETE', `/api/trainer/programs?id=${id}`, undefined, token, gymId),
  assignProgram: (token: string, gymId: string, programId: string, data: Record<string, unknown>) =>
    req('POST', `/api/trainer/programs/${programId}/assign`, data, token, gymId),
  getAssignment: (token: string, gymId: string, id: string) =>
    req('GET', `/api/trainer/assignments/${id}`, undefined, token, gymId),
  updateAssignment: (token: string, gymId: string, id: string, data: Record<string, unknown>) =>
    req('PUT', `/api/trainer/assignments/${id}`, data, token, gymId),

  // Invoices
  getInvoices: (token: string, gymId: string) =>
    req('GET', '/api/trainer/invoices', undefined, token, gymId),
  createInvoice: (token: string, gymId: string, data: Record<string, unknown>) =>
    req('POST', '/api/trainer/invoices', data, token, gymId),
  updateInvoice: (token: string, gymId: string, id: string, data: Record<string, unknown>) =>
    req('PUT', `/api/trainer/invoices?id=${id}`, data, token, gymId),
  sendInvoice: (token: string, gymId: string, id: string) =>
    req('PUT', `/api/trainer/invoices?id=${id}&action=send`, {}, token, gymId),
  voidInvoice: (token: string, gymId: string, id: string) =>
    req('PUT', `/api/trainer/invoices?id=${id}&action=void`, {}, token, gymId),

  // BTW
  getSupplierInvoices: (token: string, gymId: string, year?: number, quarter?: number) => {
    const qs = (year && quarter) ? `?year=${year}&quarter=${quarter}` : '';
    return req('GET', `/api/trainer/btw/supplier-invoices${qs}`, undefined, token, gymId);
  },
  createSupplierInvoice: (token: string, gymId: string, data: Record<string, unknown>) =>
    req('POST', '/api/trainer/btw/supplier-invoices', data, token, gymId),
  deleteSupplierInvoice: (token: string, gymId: string, id: string) =>
    req('DELETE', `/api/trainer/btw/supplier-invoices?id=${id}`, undefined, token, gymId),
  getBtwQuarter: (token: string, gymId: string, year: number, quarter: number) =>
    req('GET', `/api/trainer/btw/quarter/${year}/${quarter}`, undefined, token, gymId),
  getBtwYear: (token: string, gymId: string, year: number) =>
    req('GET', `/api/trainer/btw/year/${year}`, undefined, token, gymId),
  exportBtw: (token: string, gymId: string, year: number, quarter: number, format: string) =>
    reqBlob('GET', `/api/trainer/btw/export/${year}/${quarter}/${format}`, token, gymId),

  // Audit log
  getAuditLog: (token: string, gymId: string, before?: number | null) => {
    const qs = before ? `?before=${before}` : '';
    return req('GET', `/api/trainer/audit${qs}`, undefined, token, gymId);
  },
};

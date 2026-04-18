const C = {
  bg: '#020617',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.1)',
  text: '#f8fafc',
  muted: '#94a3b8',
  accent: '#10b981',
  danger: '#f87171',
};

function fmt(ms) {
  if (!ms) return '-';
  const d = new Date(ms);
  return d.toLocaleString();
}

function renderRows(rows) {
  const tbody = document.getElementById('errors-body');
  tbody.innerHTML = '';
  if (!rows.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="4" style="padding:14px;color:${C.muted};">No events found.</td>`;
    tbody.appendChild(tr);
    return;
  }

  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:12px 10px;border-top:1px solid ${C.border};color:${C.muted};white-space:nowrap;">${fmt(r.created_at_ms)}</td>
      <td style="padding:12px 10px;border-top:1px solid ${C.border};color:${C.text};font-weight:700;">${r.event_type || '-'}</td>
      <td style="padding:12px 10px;border-top:1px solid ${C.border};color:${C.muted};">${r.user_email || '-'}</td>
      <td style="padding:12px 10px;border-top:1px solid ${C.border};color:${C.text};max-width:680px;word-break:break-word;">${r.detail || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadDashboard(password) {
  const status = document.getElementById('status');
  status.textContent = 'Loading...';
  status.style.color = C.muted;

  const res = await fetch('/api/dashboard', {
    headers: { 'X-Dashboard-Password': password },
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  document.getElementById('users-count').textContent = String(data.registered_users ?? 0);
  renderRows(data.errors ?? []);
  status.textContent = `Updated ${fmt(data.generated_at_ms)}`;
  status.style.color = C.muted;
}

async function init() {
  const keyInput = document.getElementById('admin-key');
  const btn = document.getElementById('load-btn');
  const status = document.getElementById('status');
  const saved = sessionStorage.getItem('jf_dashboard_password') || '';
  keyInput.value = saved;

  async function run() {
    const adminKey = keyInput.value.trim();
    if (!adminKey) {
      status.textContent = 'Dashboard password required.';
      status.style.color = C.danger;
      return;
    }
    sessionStorage.setItem('jf_dashboard_password', adminKey);
    try {
      await loadDashboard(adminKey);
    } catch (e) {
      status.textContent = e.message || 'Failed to load dashboard.';
      status.style.color = C.danger;
    }
  }

  btn.addEventListener('click', run);
  if (saved) await run();
}

init();

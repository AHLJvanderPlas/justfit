const C = {
  border: 'rgba(255,255,255,0.1)',
  text: '#f8fafc',
  muted: '#94a3b8',
  danger: '#f87171',
};

function fmt(ms) {
  if (!ms) return '-';
  return new Date(ms).toLocaleString();
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

function showDashboard() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('dashboard-page').style.display = 'block';
}

function showLogin(msg) {
  document.getElementById('dashboard-page').style.display = 'none';
  document.getElementById('login-page').style.display = 'flex';
  if (msg) document.getElementById('login-error').textContent = msg;
}

async function tryLogin(password) {
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');

  if (!password) {
    errEl.textContent = 'Password required.';
    return;
  }

  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Signing in\u2026';

  try {
    const res = await fetch('/api/dashboard', {
      headers: { 'X-Dashboard-Password': password },
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 429) {
      errEl.textContent = 'Too many attempts \u2014 try again later.';
      return;
    }
    if (!res.ok || !data.ok) {
      errEl.textContent = 'Incorrect password.';
      return;
    }

    sessionStorage.setItem('jf_dashboard_password', password);
    showDashboard();
    document.getElementById('users-count').textContent = String(data.registered_users ?? 0);
    renderRows(data.errors ?? []);
    document.getElementById('status').textContent = `Updated ${fmt(data.generated_at_ms)}`;
  } catch {
    errEl.textContent = 'Connection error \u2014 try again.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
}

async function autoLoad(password) {
  const status = document.getElementById('status');
  status.textContent = 'Loading\u2026';
  showDashboard();
  try {
    const res = await fetch('/api/dashboard', {
      headers: { 'X-Dashboard-Password': password },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      sessionStorage.removeItem('jf_dashboard_password');
      showLogin('Session expired \u2014 please sign in again.');
      return;
    }
    document.getElementById('users-count').textContent = String(data.registered_users ?? 0);
    renderRows(data.errors ?? []);
    status.textContent = `Updated ${fmt(data.generated_at_ms)}`;
  } catch {
    status.textContent = 'Failed to load.';
    status.style.color = C.danger;
  }
}

function init() {
  const pwdInput = document.getElementById('pwd-input');
  const loginBtn = document.getElementById('login-btn');
  const signOutBtn = document.getElementById('sign-out-btn');

  const saved = sessionStorage.getItem('jf_dashboard_password');
  if (saved) {
    autoLoad(saved);
  }

  loginBtn.addEventListener('click', () => tryLogin(pwdInput.value.trim()));
  pwdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryLogin(pwdInput.value.trim());
  });

  signOutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('jf_dashboard_password');
    document.getElementById('status').textContent = '';
    document.getElementById('users-count').textContent = '-';
    document.getElementById('errors-body').innerHTML = '';
    showLogin();
    pwdInput.value = '';
  });
}

init();

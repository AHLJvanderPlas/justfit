// ── Constants ─────────────────────────────────────────────────────
const C = { border: 'rgba(255,255,255,0.1)', text: '#f8fafc', muted: '#94a3b8', danger: '#f87171' };
const PAGE = 10;

// ── State ─────────────────────────────────────────────────────────
const state = {
  data: { errors: [], activeUsers: [], feedbackNew: [], feedbackFlagged: [] },
  tables: {
    errors:     { tbl: 'errors',      filter: '', sortCol: 'created_at_ms',   sortDir: -1, page: 1 },
    activeUsers:{ tbl: 'active-users',filter: '', sortCol: 'last_login_at_ms',sortDir: -1, page: 1 },
    feedbackNew:{ tbl: 'fb-new',      filter: '', sortCol: 'created_at_ms',   sortDir: -1, page: 1 },
    feedbackFlag:{ tbl: 'fb-flag',    filter: '', sortCol: 'created_at_ms',   sortDir:  1, page: 1 },
  },
};

// ── Helpers ───────────────────────────────────────────────────────
function fmt(ms) {
  if (!ms) return '-';
  return new Date(ms).toLocaleString();
}

function maskEmail(email) {
  if (!email) return '-';
  const at = email.indexOf('@');
  if (at < 0) return email;
  const user = email.slice(0, at);
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  const name = dot > 0 ? domain.slice(0, dot) : domain;
  const tld  = dot > 0 ? domain.slice(dot) : '';
  const mu = user[0] + '*'.repeat(Math.max(user.length - 1, 3));
  const mn = '*'.repeat(Math.max(name.length - 1, 3)) + (name[name.length - 1] || '');
  return `${mu}@${mn}${tld}`;
}

function esc(s) {
  return String(s ?? '-')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Table engine ──────────────────────────────────────────────────
function filterSort(rows, { filter, sortCol, sortDir }) {
  let r = rows;
  if (filter) {
    const q = filter.toLowerCase();
    r = rows.filter(x => Object.values(x).some(v => String(v ?? '').toLowerCase().includes(q)));
  }
  return r.slice().sort((a, b) => {
    const va = a[sortCol] ?? '', vb = b[sortCol] ?? '';
    return va < vb ? -sortDir : va > vb ? sortDir : 0;
  });
}

function renderTable(key, rowFn) {
  const t = state.tables[key];
  const rows = filterSort(state.data[key], t);
  const visible = rows.slice(0, t.page * PAGE);
  const tbody = document.getElementById(`${t.tbl}-body`);
  tbody.innerHTML = '';
  if (!visible.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="padding:14px;color:${C.muted};">No results.</td></tr>`;
  } else {
    visible.forEach(r => tbody.appendChild(rowFn(r)));
  }
  const more = document.getElementById(`${t.tbl}-more`);
  if (more) more.style.display = visible.length < rows.length ? '' : 'none';
  const cnt = document.getElementById(`${t.tbl}-count`);
  if (cnt) cnt.textContent = `${visible.length} of ${rows.length}`;
  document.querySelectorAll(`[data-tbl="${t.tbl}"]`).forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.col === t.sortCol) th.classList.add(t.sortDir > 0 ? 'sort-asc' : 'sort-desc');
  });
}

// ── Row renderers ─────────────────────────────────────────────────
function errRow(r) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="ts">${fmt(r.created_at_ms)}</td>
    <td style="font-weight:700;white-space:nowrap;">${esc(r.event_type)}</td>
    <td style="color:${C.muted};">${esc(r.user_email)}</td>
    <td class="detail">${esc(r.detail)}</td>`;
  return tr;
}

function userRow(r) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="ts">${fmt(r.last_login_at_ms)}</td>
    <td class="uid">${esc(r.user_id)}</td>
    <td style="color:${C.muted};">${maskEmail(r.user_email)}</td>`;
  return tr;
}

function fbRow(r, dataKey) {
  const msg = r.message ? (r.message.length > 140 ? esc(r.message.slice(0, 140)) + '…' : esc(r.message)) : '-';
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="ts">${fmt(r.created_at_ms)}</td>
    <td style="white-space:nowrap;font-size:11px;">${esc(r.event_type)}</td>
    <td style="color:${C.muted};font-size:12px;">${maskEmail(r.user_email)}</td>
    <td class="msg">${msg}</td>
    <td style="white-space:nowrap;">
      <select class="classify-select" data-id="${esc(r.id)}" data-key="${dataKey}">
        <option value="new"      ${r.status==='new'      ?'selected':''}>New</option>
        <option value="discard"  ${r.status==='discard'  ?'selected':''}>Discard</option>
        <option value="react"    ${r.status==='react'    ?'selected':''}>React</option>
        <option value="fix"      ${r.status==='fix'      ?'selected':''}>Fix</option>
        <option value="roadmap"  ${r.status==='roadmap'  ?'selected':''}>Roadmap</option>
        <option value="resolved" ${r.status==='resolved' ?'selected':''}>Resolved</option>
      </select>
      <button class="flag-btn ${r.flagged ? 'on' : ''}" data-id="${esc(r.id)}" data-key="${dataKey}" title="${r.flagged ? 'Unflag' : 'Flag'}">&#9873;</button>
    </td>`;
  return tr;
}

function renderAll() {
  renderTable('errors',      errRow);
  renderTable('activeUsers', userRow);
  renderTable('feedbackNew',  r => fbRow(r, 'feedbackNew'));
  renderTable('feedbackFlag', r => fbRow(r, 'feedbackFlag'));
}

// ── API helpers ───────────────────────────────────────────────────
async function patchFeedback(id, updates) {
  try {
    await fetch('/api/feedback-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id, ...updates }),
    });
  } catch { /* non-fatal */ }
}

function findInFeedback(id) {
  return state.data.feedbackNew.find(x => x.id === id)
      || state.data.feedbackFlag.find(x => x.id === id);
}

function syncFeedbackItem(id, updates) {
  ['feedbackNew', 'feedbackFlag'].forEach(key => {
    const item = state.data[key].find(x => x.id === id);
    if (item) Object.assign(item, updates);
  });
}

// ── Event delegation ──────────────────────────────────────────────
function bindTableEvents(page) {
  // Sort headers
  page.addEventListener('click', e => {
    const th = e.target.closest('th[data-col]');
    if (!th) return;
    const tblId = th.dataset.tbl;
    const key = Object.keys(state.tables).find(k => state.tables[k].tbl === tblId);
    if (!key) return;
    const t = state.tables[key];
    if (t.sortCol === th.dataset.col) { t.sortDir *= -1; } else { t.sortCol = th.dataset.col; t.sortDir = -1; }
    t.page = 1;
    renderAll();
  });

  // Load more buttons
  page.addEventListener('click', e => {
    const btn = e.target.closest('.more-btn');
    if (!btn) return;
    const tblId = btn.id.replace('-more', '');
    const key = Object.keys(state.tables).find(k => state.tables[k].tbl === tblId);
    if (!key) return;
    state.tables[key].page++;
    renderAll();
  });

  // Classify select
  page.addEventListener('change', async e => {
    if (!e.target.classList.contains('classify-select')) return;
    const { id } = e.target.dataset;
    const status = e.target.value;
    syncFeedbackItem(id, { status });
    renderAll();
    await patchFeedback(id, { status });
  });

  // Flag button
  page.addEventListener('click', async e => {
    const btn = e.target.closest('.flag-btn');
    if (!btn) return;
    const { id } = btn.dataset;
    const item = findInFeedback(id);
    if (!item) return;
    const newFlagged = item.flagged ? 0 : 1;
    syncFeedbackItem(id, { flagged: newFlagged });
    if (newFlagged) {
      if (!state.data.feedbackFlag.find(x => x.id === id)) {
        state.data.feedbackFlag.push({ ...item, flagged: 1 });
        state.data.feedbackFlag.sort((a, b) => a.created_at_ms - b.created_at_ms);
      }
    } else {
      state.data.feedbackFlag = state.data.feedbackFlag.filter(x => x.id !== id);
    }
    renderAll();
    await patchFeedback(id, { flagged: newFlagged });
  });

  // Filters
  [
    ['errors-filter',      'errors'],
    ['active-users-filter','activeUsers'],
    ['fb-new-filter',      'feedbackNew'],
    ['fb-flag-filter',     'feedbackFlag'],
  ].forEach(([inputId, key]) => {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('input', () => {
      state.tables[key].filter = el.value;
      state.tables[key].page = 1;
      renderAll();
    });
  });
}

// ── Login / session ───────────────────────────────────────────────
function showDashboard() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('dashboard-page').style.display = 'block';
}
function showLogin(msg) {
  document.getElementById('dashboard-page').style.display = 'none';
  document.getElementById('login-page').style.display = 'flex';
  if (msg) document.getElementById('login-error').textContent = msg;
}

function populateData(data) {
  state.data.errors       = data.errors        ?? [];
  state.data.activeUsers  = data.active_users  ?? [];
  state.data.feedbackNew  = data.feedback_new  ?? [];
  state.data.feedbackFlag = data.feedback_flagged ?? [];
  document.getElementById('users-count').textContent = String(data.registered_users ?? 0);
  document.getElementById('status').textContent = `Updated ${fmt(data.generated_at_ms)}`;
  renderAll();
}

async function tryLogin(password) {
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  if (!password) { errEl.textContent = 'Password required.'; return; }
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Signing in\u2026';
  try {
    const res = await fetch('/api/dashboard-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) { errEl.textContent = 'Too many attempts \u2014 try again later.'; return; }
    if (!res.ok || !data.ok) { errEl.textContent = 'Incorrect password.'; return; }
    await autoLoad();
  } catch {
    errEl.textContent = 'Connection error \u2014 try again.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
}

async function autoLoad() {
  const status = document.getElementById('status');
  status.textContent = 'Loading\u2026';
  showDashboard();
  try {
    const res = await fetch('/api/dashboard', { credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 || !data.ok) {
      showLogin();
      return;
    }
    populateData(data);
  } catch {
    status.textContent = 'Failed to load.';
    status.style.color = C.danger;
  }
}

// ── Init ──────────────────────────────────────────────────────────
function init() {
  const pwdInput  = document.getElementById('pwd-input');
  const loginBtn  = document.getElementById('login-btn');
  const signOutBtn = document.getElementById('sign-out-btn');
  const page       = document.getElementById('dashboard-page');

  bindTableEvents(page);

  autoLoad();

  loginBtn.addEventListener('click', () => tryLogin(pwdInput.value.trim()));
  pwdInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(pwdInput.value.trim()); });

  signOutBtn.addEventListener('click', async () => {
    try { await fetch('/api/dashboard-logout', { method: 'POST', credentials: 'same-origin' }); } catch { /* non-fatal */ }
    document.getElementById('status').textContent = '';
    document.getElementById('users-count').textContent = '-';
    showLogin();
    pwdInput.value = '';
  });
}

init();

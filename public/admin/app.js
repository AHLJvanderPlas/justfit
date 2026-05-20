// JustFit Admin Portal — app.js
// Vanilla JS, no framework. All API calls to /api/admin/*

// ── State ─────────────────────────────────────────────────
const S = {
  admin:   null,    // { id, email, name, role }
  view:    'overview',
  sort:    {},      // { [view]: { col, dir } }
  page:    {},      // { [view]: number }
  filter:  {},      // { [view]: string }
  pending: 0,       // pending trainer applications badge
};

// ── Helpers ───────────────────────────────────────────────
function fmt(ms) {
  if (!ms) return '—';
  const d = new Date(ms);
  return d.toLocaleDateString('nl-NL', { day:'2-digit', month:'short', year:'numeric' })
       + ' ' + d.toLocaleTimeString('nl-NL', { hour:'2-digit', minute:'2-digit' });
}
function fmtDate(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('nl-NL', { day:'2-digit', month:'short', year:'numeric' });
}
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function euros(v) {
  if (v == null) return '—';
  return '€' + Number(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function relTime(ms) {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return Math.floor(diff/86400000) + 'd ago';
}

function badge(status) {
  const map = {
    active: 'badge-active', pending: 'badge-pending', suspended: 'badge-suspend',
    draft: 'badge-draft', sent: 'badge-sent', paid: 'badge-paid',
    overdue: 'badge-overdue', void: 'badge-void', deleted: 'badge-deleted',
    starter: 'badge-starter', pro: 'badge-pro', studio: 'badge-studio',
    rejected: 'badge-deleted',
  };
  const cls = map[status] || 'badge-draft';
  return `<span class="badge ${cls}">${esc(status)}</span>`;
}

async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: 'same-origin', ...opts });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function setContent(html) {
  document.getElementById('content').innerHTML = html;
}

function showModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('modal-content').innerHTML = '';
}

function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:200;
    background:${type==='err'?'rgba(248,113,113,.15)':'rgba(16,185,129,.15)'};
    border:1px solid ${type==='err'?'rgba(248,113,113,.4)':'rgba(16,185,129,.4)'};
    color:${type==='err'?'#f87171':'#10b981'};
    border-radius:10px;padding:10px 16px;font-size:13px;font-weight:600;
    box-shadow:0 4px 20px rgba(0,0,0,.4);`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Navigation ────────────────────────────────────────────
function navigate(view) {
  S.view = view;
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === view);
  });
  render(view);
}

function render(view) {
  setContent('<div class="loading">Loading…</div>');
  switch (view) {
    case 'overview':  renderOverview(); break;
    case 'users':     renderUsers(); break;
    case 'trainers':  renderTrainers(); break;
    case 'billing':   renderBilling(); break;
    case 'exercises': renderExercises(); break;
    case 'team':      renderTeam(); break;
  }
}

// ── Overview tab ──────────────────────────────────────────
async function renderOverview() {
  const { ok, data } = await api('/api/admin/dashboard');
  if (!ok) { setContent('<div class="loading">Failed to load.</div>'); return; }

  const st = data.stats;
  setContent(`
    <div class="page-header">
      <div>
        <div class="page-title">Overview</div>
        <div class="page-sub">Platform status · ${new Date().toLocaleDateString()}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total users</div>
        <div class="kpi-value">${st.total_users.toLocaleString()}</div>
        <div class="kpi-sub kpi-accent">+${st.new_users_month} this month</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Active (30d)</div>
        <div class="kpi-value">${st.active_users_30d.toLocaleString()}</div>
        <div class="kpi-sub">logged a session</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Active trainers</div>
        <div class="kpi-value">${st.total_trainers}</div>
        <div class="kpi-sub kpi-warn">${st.pending_trainers} pending approval</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">MRR</div>
        <div class="kpi-value kpi-accent">${euros(st.mrr)}</div>
        <div class="kpi-sub">${st.outstanding_invoices} invoices outstanding</div>
      </div>
    </div>

    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <div style="flex:1;min-width:300px;">
        <div class="card">
          <div class="card-header"><div class="card-title">Recent platform events</div></div>
          <div id="events-list">${renderEventsList(data.recent_events)}</div>
        </div>
      </div>
      <div style="flex:1;min-width:280px;">
        <div class="card">
          <div class="card-header"><div class="card-title">Trainer distribution</div></div>
          ${renderDistribution(data.trainer_distribution, st)}
        </div>
        ${st.pending_trainers > 0 ? `
        <div class="card" style="border-color:rgba(251,191,36,.3);background:rgba(251,191,36,.04);">
          <div class="card-header"><div class="card-title" style="color:#fbbf24;">⚠ Pending approvals</div></div>
          <div style="font-size:13px;margin-bottom:12px;">${st.pending_trainers} trainer application${st.pending_trainers>1?'s':''} waiting for review.</div>
          <button class="btn btn-warn" onclick="navigate('trainers')">Review applications →</button>
        </div>` : ''}
      </div>
    </div>
  `);

  // Update pending badge
  updatePendingBadge(st.pending_trainers);
}

function renderEventsList(events) {
  if (!events || !events.length) return '<div class="empty">No events yet.</div>';
  return events.slice(0, 20).map(ev => `
    <div class="event-row">
      <div class="event-dot ${ev.event_type?.includes('error') ? 'err' : 'info'}"></div>
      <div class="event-body">
        <div class="event-type">${esc(ev.event_type)}</div>
        <div class="event-detail">${esc((ev.detail || '').slice(0, 120))}</div>
        ${ev.user_email ? `<div class="event-detail">${esc(ev.user_email)}</div>` : ''}
      </div>
      <div class="event-ts">${relTime(ev.created_at_ms)}</div>
    </div>`).join('');
}

function renderDistribution(dist, st) {
  if (!dist || !dist.length) return '<div class="empty">No active trainers.</div>';
  return dist.map(r => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
      <div>${badge(r.plan)}</div>
      <div style="font-weight:700;">${r.cnt} trainer${r.cnt !== 1 ? 's' : ''}</div>
    </div>`).join('') + `
    <div style="padding-top:10px;font-size:12px;color:var(--muted);">
      +${st.new_trainers_month} new this month
    </div>`;
}

function updatePendingBadge(count) {
  const el = document.getElementById('pending-badge');
  if (!el) return;
  el.style.display = count > 0 ? '' : 'none';
  el.textContent = count;
}

// ── Users tab ─────────────────────────────────────────────
async function renderUsers(page = 1) {
  const search = S.filter['users'] || '';
  const status = S.filter['users-status'] || '';
  const params = new URLSearchParams({ page, search, status });
  const { ok, data } = await api(`/api/admin/users?${params}`);
  if (!ok) { setContent('<div class="loading">Failed to load.</div>'); return; }

  setContent(`
    <div class="page-header">
      <div><div class="page-title">Users</div><div class="page-sub">${data.total.toLocaleString()} total</div></div>
    </div>

    <div class="filter-bar">
      <input class="filter-input" id="user-search" placeholder="Search email or name…" value="${esc(search)}" />
      <select class="filter-select" id="user-status">
        <option value="">All users</option>
        <option value="active" ${status==='active'?'selected':''}>Active</option>
        <option value="guest" ${status==='guest'?'selected':''}>Guest</option>
        <option value="deleted" ${status==='deleted'?'selected':''}>Deleted</option>
      </select>
    </div>

    <div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Email / Name</th>
            <th>Goal</th>
            <th>Sessions</th>
            <th>Last active</th>
            <th>Trainer</th>
            <th>Status</th>
            <th>Joined</th>
          </tr></thead>
          <tbody id="users-tbody">
            ${data.users.map(u => `
              <tr class="clickable" onclick="openUserModal('${esc(u.id)}')">
                <td>
                  <div style="font-weight:600;">${esc(u.primary_email || '(no email)')}</div>
                  ${u.display_name ? `<div class="muted">${esc(u.display_name)}</div>` : ''}
                </td>
                <td class="muted">${esc(u.training_goal || '—')}</td>
                <td class="nowrap">${u.session_count || 0}</td>
                <td class="muted nowrap">${relTime(u.last_active_ms)}</td>
                <td class="muted">${esc(u.trainer_name || '—')}</td>
                <td>${badge(u.status || 'active')}</td>
                <td class="muted nowrap">${fmtDate(u.created_at_ms)}</td>
              </tr>`).join('')}
            ${!data.users.length ? '<tr><td colspan="7" class="empty">No users found.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
      <div class="tbl-footer">
        <div class="tbl-count">Showing ${data.users.length} of ${data.total}</div>
        <div style="display:flex;gap:8px;">
          ${page > 1 ? `<button class="btn btn-neutral btn-sm" onclick="renderUsers(${page-1})">← Prev</button>` : ''}
          ${page < data.pages ? `<button class="btn btn-neutral btn-sm" onclick="renderUsers(${page+1})">Next →</button>` : ''}
        </div>
      </div>
    </div>
  `);

  document.getElementById('user-search').addEventListener('input', e => {
    S.filter['users'] = e.target.value;
  });
  document.getElementById('user-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') renderUsers(1);
  });
  document.getElementById('user-status').addEventListener('change', e => {
    S.filter['users-status'] = e.target.value;
    renderUsers(1);
  });
}

async function openUserModal(userId) {
  showModal('<div class="loading">Loading…</div>');
  const { ok, data } = await api(`/api/admin/users?id=${userId}`);
  if (!ok) { document.getElementById('modal-content').innerHTML = '<div class="loading">Failed to load.</div>'; return; }

  const u = data.user;
  const p = u.prefs || {};
  showModal(`
    <div class="modal-title">${esc(p.display_name || 'User')}</div>
    <div class="modal-sub">${esc(u.primary_email || '(no email)')} · ${badge(u.status || 'active')}</div>

    <div class="modal-row">
      <div class="modal-col"><div class="modal-label">Goal</div><div class="modal-value">${esc(p.training_goal || '—')}</div></div>
      <div class="modal-col"><div class="modal-label">Experience</div><div class="modal-value">${esc(p.experience_level || '—')}</div></div>
      <div class="modal-col"><div class="modal-label">Sessions</div><div class="modal-value">${u.session_count}</div></div>
    </div>
    <div class="modal-row">
      <div class="modal-col"><div class="modal-label">Sex</div><div class="modal-value">${esc(p.sex || '—')}</div></div>
      <div class="modal-col"><div class="modal-label">Weight</div><div class="modal-value">${p.weight_kg ? p.weight_kg + ' kg' : '—'}</div></div>
      <div class="modal-col"><div class="modal-label">Joined</div><div class="modal-value">${fmtDate(u.created_at_ms)}</div></div>
    </div>
    <div class="modal-row">
      <div class="modal-col"><div class="modal-label">Equipment</div><div class="modal-value">${esc(p.equipment_json || '—')}</div></div>
      <div class="modal-col"><div class="modal-label">Trainer</div><div class="modal-value">${u.trainer ? esc(u.trainer.name + (u.trainer.studio_name ? ' · ' + u.trainer.studio_name : '')) : '—'}</div></div>
    </div>

    <hr class="modal-divider" />

    <div class="modal-actions">
      ${u.status !== 'deleted' ? `
        <button class="btn btn-warn" onclick="userAction('${userId}', '${u.status==='suspended'?'reactivate':'deactivate'}')">
          ${u.status === 'suspended' ? 'Reactivate' : 'Deactivate account'}
        </button>
        <button class="btn btn-red" onclick="confirmUserDelete('${userId}')">GDPR delete</button>
      ` : '<div style="color:var(--muted);font-size:12px;">Account has been deleted.</div>'}
    </div>
    <div id="delete-confirm" style="margin-top:12px;display:none;">
      <div style="font-size:13px;color:var(--danger);margin-bottom:8px;">
        This will permanently erase email and profile data. Cannot be undone.
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-red" onclick="userAction('${userId}','delete')">Confirm delete</button>
        <button class="btn btn-neutral" onclick="document.getElementById('delete-confirm').style.display='none'">Cancel</button>
      </div>
    </div>
  `);
}

function confirmUserDelete(userId) {
  document.getElementById('delete-confirm').style.display = 'block';
}

async function userAction(userId, action) {
  const { ok } = await api('/api/admin/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, action }),
  });
  if (ok) {
    toast('Done.');
    closeModal();
    renderUsers();
  } else {
    toast('Action failed.', 'err');
  }
}

// ── Trainers tab ──────────────────────────────────────────
async function renderTrainers(status = S.filter['trainers-status'] || '', page = 1) {
  S.filter['trainers-status'] = status;
  const search = S.filter['trainers'] || '';
  const params = new URLSearchParams({ status, page, search });
  const { ok, data } = await api(`/api/admin/trainers?${params}`);
  if (!ok) { setContent('<div class="loading">Failed to load.</div>'); return; }

  const tabs = ['', 'pending', 'active', 'suspended'];
  const tabLabels = { '': 'All', pending: 'Pending', active: 'Active', suspended: 'Suspended' };

  setContent(`
    <div class="page-header">
      <div><div class="page-title">Trainers</div><div class="page-sub">${data.total} total</div></div>
      <button class="btn btn-green" onclick="openCreateTrainerModal()">+ Invite trainer</button>
    </div>

    <div class="tab-bar">
      ${tabs.map(t => `<button class="tab-btn ${status===t?'active':''}" onclick="renderTrainers('${t}')">${tabLabels[t]}</button>`).join('')}
    </div>

    <div class="filter-bar">
      <input class="filter-input" id="trainer-search" placeholder="Search name, email, studio…" value="${esc(search)}" />
    </div>

    <div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Name / Studio</th>
            <th>Email</th>
            <th>Plan</th>
            <th>Clients</th>
            <th>Status</th>
            <th>Applied</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            ${data.trainers.map(t => `
              <tr class="clickable" onclick="openTrainerModal('${esc(t.id)}')">
                <td>
                  <div style="font-weight:600;">${esc(t.name)}</div>
                  ${t.studio_name ? `<div class="muted">${esc(t.studio_name)}</div>` : ''}
                </td>
                <td class="muted">${esc(t.email)}</td>
                <td>${badge(t.plan)}</td>
                <td>${t.client_count}</td>
                <td>${badge(t.status)}</td>
                <td class="muted nowrap">${fmtDate(t.created_at_ms)}</td>
                <td class="actions" onclick="event.stopPropagation()">
                  ${t.status === 'pending' ? `
                    <button class="btn btn-green btn-sm" onclick="trainerAction('${esc(t.id)}','approve')">Approve</button>
                    <button class="btn btn-red btn-sm" style="margin-left:4px;" onclick="openRejectModal('${esc(t.id)}','${esc(t.name)}')">Reject</button>
                  ` : ''}
                  ${t.status === 'active' ? `
                    <button class="btn btn-warn btn-sm" onclick="trainerAction('${esc(t.id)}','suspend')">Suspend</button>
                  ` : ''}
                  ${t.status === 'suspended' ? `
                    <button class="btn btn-green btn-sm" onclick="trainerAction('${esc(t.id)}','reactivate')">Reactivate</button>
                  ` : ''}
                </td>
              </tr>`).join('')}
            ${!data.trainers.length ? '<tr><td colspan="7" class="empty">No trainers found.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
      <div class="tbl-footer">
        <div class="tbl-count">Showing ${data.trainers.length} of ${data.total}</div>
        <div style="display:flex;gap:8px;">
          ${page > 1 ? `<button class="btn btn-neutral btn-sm" onclick="renderTrainers('${status}',${page-1})">← Prev</button>` : ''}
          ${page < data.pages ? `<button class="btn btn-neutral btn-sm" onclick="renderTrainers('${status}',${page+1})">Next →</button>` : ''}
        </div>
      </div>
    </div>
  `);

  document.getElementById('trainer-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') { S.filter['trainers'] = e.target.value; renderTrainers(status); }
  });
  document.getElementById('trainer-search').addEventListener('input', e => { S.filter['trainers'] = e.target.value; });
}

async function openTrainerModal(trainerId) {
  showModal('<div class="loading">Loading…</div>');
  const { ok, data } = await api(`/api/admin/trainers?id=${trainerId}`);
  if (!ok) { document.getElementById('modal-content').innerHTML = '<div class="loading">Failed.</div>'; return; }

  const t = data.trainer;
  showModal(`
    <div class="modal-title">${esc(t.name)}</div>
    <div class="modal-sub">${esc(t.email)} · ${badge(t.status)} · ${badge(t.plan)}</div>

    <div class="modal-row">
      <div class="modal-col"><div class="modal-label">Studio</div><div class="modal-value">${esc(t.studio_name || '—')}</div></div>
      <div class="modal-col"><div class="modal-label">Country</div><div class="modal-value">${esc(t.country || '—')}</div></div>
      <div class="modal-col"><div class="modal-label">Clients</div><div class="modal-value">${t.client_count}</div></div>
    </div>
    <div class="modal-row">
      <div class="modal-col"><div class="modal-label">Applied</div><div class="modal-value">${fmtDate(t.created_at_ms)}</div></div>
      <div class="modal-col"><div class="modal-label">Approved</div><div class="modal-value">${fmtDate(t.approved_at_ms)}</div></div>
      <div class="modal-col"><div class="modal-label">Currency</div><div class="modal-value">${esc(t.invoice_currency || 'EUR')}</div></div>
    </div>

    <hr class="modal-divider" />

    <div style="margin-bottom:12px;">
      <div class="modal-label" style="margin-bottom:8px;">Change plan</div>
      <div style="display:flex;gap:8px;">
        ${['starter','pro','studio'].map(p => `
          <button class="btn ${t.plan===p?'btn-green':'btn-neutral'} btn-sm"
            onclick="trainerAction('${t.id}','change_plan','${p}')">
            ${p}
          </button>`).join('')}
      </div>
    </div>

    <div class="modal-actions">
      ${t.status === 'pending'    ? `<button class="btn btn-green" onclick="trainerAction('${t.id}','approve')">Approve</button>` : ''}
      ${t.status === 'pending'    ? `<button class="btn btn-red" onclick="openRejectModal('${t.id}','${esc(t.name)}')">Reject</button>` : ''}
      ${t.status === 'active'     ? `<button class="btn btn-warn" onclick="trainerAction('${t.id}','suspend')">Suspend</button>` : ''}
      ${t.status === 'suspended'  ? `<button class="btn btn-green" onclick="trainerAction('${t.id}','reactivate')">Reactivate</button>` : ''}
      ${t.status !== 'deleted'    ? `<button class="btn btn-red" onclick="trainerAction('${t.id}','delete')">Delete trainer</button>` : ''}
    </div>

    ${data.clients.length ? `
    <hr class="modal-divider" />
    <div class="modal-label" style="margin-bottom:8px;">Connected clients (${data.clients.length})</div>
    <div style="max-height:180px;overflow-y:auto;">
      ${data.clients.map(c => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">
          <div>${esc(c.display_name || c.primary_email || '(guest)')}</div>
          <div style="color:var(--muted);">${fmtDate(c.connected_at_ms)}</div>
        </div>`).join('')}
    </div>` : ''}
  `);
}

async function trainerAction(id, action, plan) {
  const body = { id, action };
  if (plan) body.plan = plan;
  const { ok } = await api('/api/admin/trainers', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (ok) { toast('Done.'); closeModal(); renderTrainers(); }
  else toast('Action failed.', 'err');
}

function openRejectModal(id, name) {
  showModal(`
    <div class="modal-title">Reject application</div>
    <div class="modal-sub">${esc(name)}</div>
    <div class="form-group">
      <label class="form-label">Reason (sent to trainer)</label>
      <textarea id="reject-reason" class="form-textarea" placeholder="Your application could not be approved at this time…"></textarea>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="btn btn-red" onclick="submitReject('${id}')">Reject</button>
      <button class="btn btn-neutral" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

async function submitReject(id) {
  const reason = document.getElementById('reject-reason').value.trim();
  const { ok } = await api('/api/admin/trainers', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action: 'reject', reason }),
  });
  if (ok) { toast('Application rejected.'); closeModal(); renderTrainers(); }
  else toast('Failed.', 'err');
}

function openCreateTrainerModal() {
  toast('Trainer self-registration via trainer.justfit.cc/apply', 'ok');
}

// ── Billing tab ───────────────────────────────────────────
async function renderBilling(tab = S.filter['billing-tab'] || 'invoices') {
  S.filter['billing-tab'] = tab;

  if (tab === 'pricing') {
    await renderBillingPricing();
    return;
  }

  const page   = 1;
  const status = S.filter['billing-status'] || '';
  const params = new URLSearchParams({ resource: 'summary' });
  const [summary, invoices] = await Promise.all([
    api(`/api/admin/billing?${params}`),
    api(`/api/admin/billing?resource=invoices&status=${status}&page=${page}`),
  ]);

  if (!summary.ok) { setContent('<div class="loading">Failed.</div>'); return; }
  const st = summary.data;

  setContent(`
    <div class="page-header">
      <div><div class="page-title">Billing</div></div>
      <button class="btn btn-green" onclick="openCreateInvoiceModal()">+ Create invoice</button>
    </div>

    <div class="kpi-grid" style="margin-bottom:20px;">
      <div class="kpi-card">
        <div class="kpi-label">MRR</div>
        <div class="kpi-value kpi-accent">${euros(st.mrr)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Outstanding</div>
        <div class="kpi-value kpi-warn">${euros(st.outstanding_amount)}</div>
        <div class="kpi-sub">${st.outstanding_count} invoices</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Paid this month</div>
        <div class="kpi-value kpi-accent">${euros(st.paid_this_month)}</div>
      </div>
    </div>

    <div class="tab-bar">
      <button class="tab-btn ${tab==='invoices'?'active':''}" onclick="renderBilling('invoices')">Invoices</button>
      <button class="tab-btn ${tab==='pricing'?'active':''}" onclick="renderBilling('pricing')">Plan pricing</button>
    </div>

    <div class="filter-bar">
      <select class="filter-select" id="billing-status-filter">
        <option value="">All statuses</option>
        ${['draft','sent','paid','overdue','void'].map(s => `<option value="${s}" ${status===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>

    <div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Invoice #</th>
            <th>Trainer</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Invoice date</th>
            <th>Due date</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            ${(invoices.data.invoices || []).map(inv => `
              <tr>
                <td class="mono">${esc(inv.invoice_number)}</td>
                <td style="font-weight:600;">${esc(inv.trainer_name)}</td>
                <td>${badge(inv.plan)}</td>
                <td class="nowrap" style="font-weight:700;">${euros(inv.amount)}</td>
                <td>${badge(inv.status)}</td>
                <td class="muted nowrap">${esc(inv.invoice_date)}</td>
                <td class="muted nowrap">${esc(inv.due_date || '—')}</td>
                <td class="actions nowrap">
                  ${inv.status === 'draft' ? `<button class="btn btn-blue btn-sm" onclick="billingAction('${inv.id}','send')">Send</button>` : ''}
                  ${inv.status === 'sent' || inv.status === 'overdue' ? `<button class="btn btn-green btn-sm" onclick="billingAction('${inv.id}','paid')">Mark paid</button>` : ''}
                  ${inv.status !== 'void' && inv.status !== 'paid' ? `<button class="btn btn-neutral btn-sm" style="margin-left:4px;" onclick="billingAction('${inv.id}','void')">Void</button>` : ''}
                </td>
              </tr>`).join('')}
            ${!invoices.data.invoices?.length ? '<tr><td colspan="8" class="empty">No invoices found.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `);

  document.getElementById('billing-status-filter').addEventListener('change', e => {
    S.filter['billing-status'] = e.target.value;
    renderBilling('invoices');
  });
}

async function renderBillingPricing() {
  const { ok, data } = await api('/api/admin/billing?resource=pricing');
  if (!ok) { setContent('<div class="loading">Failed.</div>'); return; }

  const active = data.pricing.filter(p => p.is_active);
  const priceFor = plan => active.find(p => p.plan === plan)?.price_monthly ?? 0;

  setContent(`
    <div class="page-header">
      <div><div class="page-title">Billing</div></div>
    </div>
    <div class="tab-bar">
      <button class="tab-btn" onclick="renderBilling('invoices')">Invoices</button>
      <button class="tab-btn active">Plan pricing</button>
    </div>

    <div class="card" style="max-width:500px;">
      <div class="card-header"><div class="card-title">Monthly prices (EUR)</div></div>
      ${['starter','pro','studio'].map(plan => `
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
          <div style="width:70px;">${badge(plan)}</div>
          <input class="form-input" id="price-${plan}" type="number" step="0.01" min="0"
            value="${priceFor(plan)}" style="max-width:120px;" />
          <div style="font-size:12px;color:var(--muted);">/ month</div>
        </div>`).join('')}
      <button class="btn btn-green" style="margin-top:8px;" onclick="savePricing()">Save pricing</button>
    </div>

    <div class="card" style="max-width:500px;">
      <div class="card-header"><div class="card-title">Pricing history</div></div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Plan</th><th>Price</th><th>Effective from</th><th>Active</th></tr></thead>
          <tbody>
            ${data.pricing.map(p => `
              <tr>
                <td>${badge(p.plan)}</td>
                <td style="font-weight:700;">${euros(p.price_monthly)}</td>
                <td class="muted">${esc(p.effective_from)}</td>
                <td>${p.is_active ? '<span style="color:var(--accent)">✓</span>' : '<span style="color:var(--muted)">—</span>'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

async function savePricing() {
  const plans = ['starter', 'pro', 'studio'];
  let ok = true;
  for (const plan of plans) {
    const price = parseFloat(document.getElementById(`price-${plan}`).value);
    if (isNaN(price)) continue;
    const res = await api('/api/admin/billing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource: 'pricing', plan, price_monthly: price }),
    });
    if (!res.ok) ok = false;
  }
  toast(ok ? 'Pricing updated.' : 'Some updates failed.', ok ? 'ok' : 'err');
  if (ok) renderBilling('pricing');
}

async function billingAction(id, action) {
  const { ok } = await api('/api/admin/billing', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action }),
  });
  toast(ok ? 'Done.' : 'Failed.', ok ? 'ok' : 'err');
  if (ok) renderBilling();
}

async function openCreateInvoiceModal() {
  // Load active trainers for dropdown
  const { data } = await api('/api/admin/trainers?status=active&page=1');
  const trainers = data.trainers || [];

  const today = new Date().toISOString().slice(0, 10);
  const due   = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const month = new Date().toISOString().slice(0, 7).replace('-', '-M');

  showModal(`
    <div class="modal-title">Create invoice</div>
    <div class="modal-sub">JustFit → trainer licence fee</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Trainer</label>
        <select class="form-select" id="inv-trainer">
          <option value="">Select trainer…</option>
          ${trainers.map(t => `<option value="${t.id}" data-plan="${t.plan}">${esc(t.name)} (${t.plan})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Plan</label>
        <select class="form-select" id="inv-plan">
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="studio">Studio</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Amount (EUR)</label>
        <input class="form-input" id="inv-amount" type="number" step="0.01" min="0" placeholder="29.00" />
      </div>
      <div class="form-group">
        <label class="form-label">Period</label>
        <input class="form-input" id="inv-period" type="text" value="${month}" placeholder="2026-M05" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Invoice date</label>
        <input class="form-input" id="inv-date" type="date" value="${today}" />
      </div>
      <div class="form-group">
        <label class="form-label">Due date</label>
        <input class="form-input" id="inv-due" type="date" value="${due}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="form-textarea" id="inv-notes" placeholder="Optional notes…" style="min-height:60px;"></textarea>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="btn btn-green" onclick="submitCreateInvoice()">Create invoice</button>
      <button class="btn btn-neutral" onclick="closeModal()">Cancel</button>
    </div>
  `);

  // Auto-fill plan when trainer selected
  document.getElementById('inv-trainer').addEventListener('change', e => {
    const opt = e.target.selectedOptions[0];
    if (opt && opt.dataset.plan) document.getElementById('inv-plan').value = opt.dataset.plan;
  });
}

async function submitCreateInvoice() {
  const body = {
    resource: 'invoice',
    trainer_id: document.getElementById('inv-trainer').value,
    plan: document.getElementById('inv-plan').value,
    amount: parseFloat(document.getElementById('inv-amount').value),
    period: document.getElementById('inv-period').value,
    invoice_date: document.getElementById('inv-date').value,
    due_date: document.getElementById('inv-due').value,
    notes: document.getElementById('inv-notes').value,
  };
  if (!body.trainer_id || !body.plan || isNaN(body.amount)) {
    toast('Fill in trainer, plan and amount.', 'err'); return;
  }
  const { ok } = await api('/api/admin/billing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  toast(ok ? 'Invoice created.' : 'Failed.', ok ? 'ok' : 'err');
  if (ok) { closeModal(); renderBilling(); }
}

// ── Exercises tab ─────────────────────────────────────────
let exState = { page: 1, search: '', category: '', active: '' };

async function renderExercises(page = 1) {
  exState.page = page;
  const params = new URLSearchParams({
    page, search: exState.search, category: exState.category, active: exState.active
  });
  const { ok, data } = await api(`/api/admin/exercises?${params}`);
  if (!ok) { setContent('<div class="loading">Failed.</div>'); return; }

  setContent(`
    <div class="page-header">
      <div><div class="page-title">Exercise Library</div><div class="page-sub">${data.total} exercises</div></div>
      <button class="btn btn-green" onclick="openExerciseForm()">+ New exercise</button>
    </div>

    <div class="filter-bar">
      <input class="filter-input" id="ex-search" placeholder="Search name or slug…" value="${esc(exState.search)}" />
      <select class="filter-select" id="ex-category">
        <option value="">All categories</option>
        ${['strength','cardio','mobility','recovery','skill','mixed'].map(c =>
          `<option value="${c}" ${exState.category===c?'selected':''}>${c}</option>`).join('')}
      </select>
      <select class="filter-select" id="ex-active">
        <option value="">Active + Inactive</option>
        <option value="1" ${exState.active==='1'?'selected':''}>Active only</option>
        <option value="0" ${exState.active==='0'?'selected':''}>Inactive only</option>
      </select>
    </div>

    <div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Category</th>
            <th>Tags</th>
            <th>Status</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            ${data.exercises.map(ex => `
              <tr>
                <td style="font-weight:600;">${esc(ex.name)}</td>
                <td class="mono">${esc(ex.slug)}</td>
                <td>${badge(ex.category)}</td>
                <td style="font-size:11px;color:var(--muted);max-width:200px;">
                  ${formatTagsShort(ex.tags_json)}
                </td>
                <td>${ex.is_active ? badge('active') : badge('deleted')}</td>
                <td class="actions nowrap">
                  <button class="btn btn-blue btn-sm" onclick="openExerciseForm('${ex.id}')">Edit</button>
                  <button class="btn btn-neutral btn-sm" style="margin-left:4px;"
                    onclick="toggleExercise('${ex.id}','${esc(ex.name)}',${ex.is_active})">
                    ${ex.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>`).join('')}
            ${!data.exercises.length ? '<tr><td colspan="6" class="empty">No exercises found.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
      <div class="tbl-footer">
        <div class="tbl-count">Showing ${data.exercises.length} of ${data.total}</div>
        <div style="display:flex;gap:8px;">
          ${page > 1 ? `<button class="btn btn-neutral btn-sm" onclick="renderExercises(${page-1})">← Prev</button>` : ''}
          ${page < data.pages ? `<button class="btn btn-neutral btn-sm" onclick="renderExercises(${page+1})">Next →</button>` : ''}
        </div>
      </div>
    </div>
  `);

  document.getElementById('ex-search').addEventListener('input', e => { exState.search = e.target.value; });
  document.getElementById('ex-search').addEventListener('keydown', e => { if (e.key === 'Enter') renderExercises(1); });
  document.getElementById('ex-category').addEventListener('change', e => { exState.category = e.target.value; renderExercises(1); });
  document.getElementById('ex-active').addEventListener('change', e => { exState.active = e.target.value; renderExercises(1); });
}

function formatTagsShort(tagsJson) {
  try {
    const tags = JSON.parse(tagsJson || '[]');
    return tags.slice(0, 5).join(', ') + (tags.length > 5 ? ` +${tags.length - 5}` : '');
  } catch { return '—'; }
}

async function toggleExercise(id, name, isActive) {
  if (!confirm(`${isActive ? 'Deactivate' : 'Activate'} "${name}"?`)) return;
  const { ok } = await api('/api/admin/exercises', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action: 'toggle' }),
  });
  toast(ok ? 'Done.' : 'Failed.', ok ? 'ok' : 'err');
  if (ok) renderExercises(exState.page);
}

async function openExerciseForm(exerciseId) {
  let ex = null;
  if (exerciseId) {
    showModal('<div class="loading">Loading…</div>');
    const { ok, data } = await api(`/api/admin/exercises?id=${exerciseId}`);
    if (!ok) { document.getElementById('modal-content').innerHTML = '<div class="loading">Failed.</div>'; return; }
    ex = data.exercise;
  }

  const title = ex ? 'Edit exercise' : 'New exercise';
  const tagsStr = ex ? (JSON.parse(ex.tags_json || '[]')).join(', ') : '';
  const eqReqStr = ex ? (JSON.parse(ex.equipment_required_json || '["none"]')).join(', ') : 'none';
  const eqAdvStr = ex ? (JSON.parse(ex.equipment_advised_json || '[]')).join(', ') : '';

  showModal(`
    <div class="modal-title">${title}</div>
    ${ex ? `<div class="modal-sub mono">${esc(ex.slug)}</div>` : ''}

    <div class="form-row">
      <div class="form-group" style="flex:2;">
        <label class="form-label">Name *</label>
        <input class="form-input" id="ef-name" type="text" value="${esc(ex?.name || '')}" placeholder="Push-up" />
      </div>
      <div class="form-group">
        <label class="form-label">Slug *</label>
        <input class="form-input" id="ef-slug" type="text" value="${esc(ex?.slug || '')}" placeholder="push-up" />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category *</label>
        <select class="form-select" id="ef-category">
          ${['strength','cardio','mobility','recovery','skill','mixed'].map(c =>
            `<option value="${c}" ${ex?.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Active</label>
        <select class="form-select" id="ef-active">
          <option value="1" ${!ex || ex.is_active ? 'selected' : ''}>Active</option>
          <option value="0" ${ex && !ex.is_active ? 'selected' : ''}>Inactive</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Tags (comma-separated)</label>
      <input class="form-input" id="ef-tags" type="text" value="${esc(tagsStr)}"
        placeholder="strength, bodyweight, no_floor, low_impact, …" />
      <div class="form-hint">Key tags: strength, cardio, mobility, recovery, bodyweight, dumbbell, military, pregnancy_safe, postnatal_safe, no_floor, low_impact, high_impact, supine, prone, crunch, valsalva</div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Equipment required (comma-separated)</label>
        <input class="form-input" id="ef-eq-req" type="text" value="${esc(eqReqStr)}" placeholder="none" />
      </div>
      <div class="form-group">
        <label class="form-label">Equipment advised (comma-separated)</label>
        <input class="form-input" id="ef-eq-adv" type="text" value="${esc(eqAdvStr)}" placeholder="mat, …" />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Instructions JSON</label>
      <textarea class="form-textarea" id="ef-instr" style="min-height:120px;font-family:'JetBrains Mono',monospace;font-size:11px;"
        placeholder='{"steps":["Step 1…","Step 2…"],"cues":["💡 Tip…"]}'>${esc(ex?.instructions_json || '')}</textarea>
      <div class="form-hint">Format: {"steps": ["…"], "cues": ["💡 …"], "pregnancy_note": "…", "postnatal_note": "…"}</div>
    </div>

    <div class="form-group">
      <label class="form-label">Alternatives JSON</label>
      <input class="form-input" id="ef-alt" type="text"
        value="${esc(ex?.alternatives_json || '')}"
        placeholder='{"substitutions":["slug1","slug2"]}' />
    </div>

    <div id="ef-error" class="form-error"></div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="btn btn-green" onclick="submitExerciseForm('${exerciseId || ''}')">
        ${ex ? 'Save changes' : 'Create exercise'}
      </button>
      <button class="btn btn-neutral" onclick="closeModal()">Cancel</button>
    </div>
  `);

  // Auto-fill slug from name if creating new
  if (!exerciseId) {
    document.getElementById('ef-name').addEventListener('input', e => {
      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      document.getElementById('ef-slug').value = slug;
    });
  }
}

function parseCommaSep(str) {
  return JSON.stringify(str.split(',').map(s => s.trim()).filter(Boolean));
}

async function submitExerciseForm(exerciseId) {
  const name     = document.getElementById('ef-name').value.trim();
  const slug     = document.getElementById('ef-slug').value.trim();
  const category = document.getElementById('ef-category').value;
  const is_active = parseInt(document.getElementById('ef-active').value);
  const tagsJson = parseCommaSep(document.getElementById('ef-tags').value);
  const eqReqJson = parseCommaSep(document.getElementById('ef-eq-req').value || 'none');
  const eqAdvRaw = document.getElementById('ef-eq-adv').value.trim();
  const eqAdvJson = eqAdvRaw ? parseCommaSep(eqAdvRaw) : null;
  const instrRaw = document.getElementById('ef-instr').value.trim();
  const altRaw   = document.getElementById('ef-alt').value.trim();
  const errEl    = document.getElementById('ef-error');
  errEl.textContent = '';

  if (!name || !slug || !category) { errEl.textContent = 'Name, slug and category are required.'; return; }

  // Validate JSON fields
  for (const [label, raw] of [['Instructions', instrRaw], ['Alternatives', altRaw]]) {
    if (raw) { try { JSON.parse(raw); } catch { errEl.textContent = `${label}: invalid JSON.`; return; } }
  }

  const body = {
    name, slug, category, is_active,
    tags_json: tagsJson,
    equipment_required_json: eqReqJson,
    equipment_advised_json: eqAdvJson,
    instructions_json: instrRaw || null,
    alternatives_json: altRaw || null,
  };
  if (exerciseId) body.id = exerciseId;

  const { ok, data } = await api('/api/admin/exercises', {
    method: exerciseId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (ok) {
    toast(exerciseId ? 'Exercise updated.' : 'Exercise created.');
    closeModal();
    renderExercises(exState.page);
  } else {
    errEl.textContent = data.error || 'Save failed.';
  }
}

// ── Team tab ──────────────────────────────────────────────
async function renderTeam() {
  const { ok, data } = await api('/api/admin/team');
  if (!ok) { setContent('<div class="loading">Failed.</div>'); return; }

  setContent(`
    <div class="page-header">
      <div><div class="page-title">Admin Team</div></div>
      <button class="btn btn-green" onclick="openCreateAdminModal()">+ Add admin</button>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">Admin users</div></div>
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            ${data.team.map(u => `
              <tr>
                <td style="font-weight:600;">${esc(u.name)}</td>
                <td class="muted">${esc(u.email)}</td>
                <td>${badge(u.role)}</td>
                <td>${u.is_active ? badge('active') : badge('deleted')}</td>
                <td class="muted nowrap">${fmtDate(u.created_at_ms)}</td>
                <td class="actions nowrap">
                  <button class="btn btn-neutral btn-sm" onclick="openSetPasswordModal('${u.id}','${esc(u.name)}')">Set password</button>
                  ${u.is_active
                    ? `<button class="btn btn-warn btn-sm" style="margin-left:4px;" onclick="teamAction('${u.id}','deactivate')">Deactivate</button>`
                    : `<button class="btn btn-green btn-sm" style="margin-left:4px;" onclick="teamAction('${u.id}','activate')">Activate</button>`}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">Audit log (last 100 actions)</div></div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Action</th><th>Target</th><th>Actor</th><th>When</th></tr></thead>
          <tbody>
            ${data.audit.map(a => `
              <tr>
                <td style="font-weight:600;">${esc(a.action)}</td>
                <td class="muted">${esc(a.target_type || '—')} ${esc(a.target_id ? a.target_id.slice(0,8)+'…' : '')}</td>
                <td class="muted">${esc(a.actor_id ? a.actor_id.slice(0,8)+'…' : 'system')}</td>
                <td class="muted nowrap">${relTime(a.created_at_ms)}</td>
              </tr>`).join('')}
            ${!data.audit.length ? '<tr><td colspan="4" class="empty">No audit events yet.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

function openCreateAdminModal() {
  showModal(`
    <div class="modal-title">Add admin user</div>
    <div class="form-group">
      <label class="form-label">Name</label>
      <input class="form-input" id="tm-name" type="text" placeholder="Alex" />
    </div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input class="form-input" id="tm-email" type="email" placeholder="admin@justfit.cc" />
    </div>
    <div class="form-group">
      <label class="form-label">Password (min 8 chars)</label>
      <input class="form-input" id="tm-password" type="password" placeholder="••••••••" />
    </div>
    <div class="form-group">
      <label class="form-label">Role</label>
      <select class="form-select" id="tm-role">
        <option value="admin">Admin</option>
        <option value="viewer">Viewer</option>
      </select>
    </div>
    <div id="tm-error" class="form-error"></div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="btn btn-green" onclick="submitCreateAdmin()">Create</button>
      <button class="btn btn-neutral" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

async function submitCreateAdmin() {
  const name     = document.getElementById('tm-name').value.trim();
  const email    = document.getElementById('tm-email').value.trim();
  const password = document.getElementById('tm-password').value;
  const role     = document.getElementById('tm-role').value;
  const errEl    = document.getElementById('tm-error');

  if (!name || !email || !password) { errEl.textContent = 'All fields required.'; return; }
  if (password.length < 8) { errEl.textContent = 'Password must be at least 8 characters.'; return; }

  const { ok, data } = await api('/api/admin/team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });

  if (ok) { toast('Admin created.'); closeModal(); renderTeam(); }
  else errEl.textContent = data.error || 'Failed.';
}

function openSetPasswordModal(userId, name) {
  showModal(`
    <div class="modal-title">Set password</div>
    <div class="modal-sub">${esc(name)}</div>
    <div class="form-group">
      <label class="form-label">New password (min 8 chars)</label>
      <input class="form-input" id="pw-new" type="password" placeholder="••••••••" />
    </div>
    <div id="pw-error" class="form-error"></div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="btn btn-green" onclick="submitSetPassword('${userId}')">Set password</button>
      <button class="btn btn-neutral" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

async function submitSetPassword(userId) {
  const password = document.getElementById('pw-new').value;
  const errEl    = document.getElementById('pw-error');
  if (password.length < 8) { errEl.textContent = 'Password must be at least 8 characters.'; return; }

  const { ok, data } = await api('/api/admin/team', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, action: 'set_password', password }),
  });
  if (ok) { toast('Password updated.'); closeModal(); }
  else errEl.textContent = data.error || 'Failed.';
}

async function teamAction(id, action) {
  const { ok } = await api('/api/admin/team', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action }),
  });
  toast(ok ? 'Done.' : 'Failed.', ok ? 'ok' : 'err');
  if (ok) renderTeam();
}

// ── Auth / Login ──────────────────────────────────────────
async function tryLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');
  const errEl    = document.getElementById('login-error');

  if (!email || !password) { errEl.textContent = 'Email and password required.'; return; }
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const { ok, data } = await api('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!ok) {
      errEl.textContent = data.error || 'Invalid credentials.';
    } else {
      await autoLoad();
    }
  } catch {
    errEl.textContent = 'Connection error.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
}

async function logout() {
  await api('/api/admin/login', { method: 'DELETE' });
  S.admin = null;
  showLogin();
}

function showLogin() {
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('admin-shell').style.display = 'none';
}

function showShell(admin) {
  S.admin = admin;
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('admin-shell').style.display = 'block';
  document.getElementById('admin-name').textContent = `${admin.name} · ${admin.email}`;
}

async function autoLoad() {
  const { ok, data } = await api('/api/admin/login');
  if (!ok) { showLogin(); return; }
  showShell(data.admin);
  navigate('overview');
}

// ── Bootstrap ─────────────────────────────────────────────
function init() {
  // Login form
  document.getElementById('login-btn').addEventListener('click', tryLogin);
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') tryLogin();
  });
  document.getElementById('login-email').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-password').focus();
  });

  // Sidebar nav
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', logout);

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Escape key closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Check session on load
  autoLoad();
}

init();

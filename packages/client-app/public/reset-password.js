const params = new URLSearchParams(window.location.search);
const token  = params.get('token');

if (!token) {
  document.getElementById('reset-view').style.display   = 'none';
  document.getElementById('invalid-view').style.display = 'block';
}

function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.style.display = 'block';
  document.getElementById('success').style.display = 'none';
}

function showSuccess(msg) {
  const el = document.getElementById('success');
  el.textContent = msg;
  el.style.display = 'block';
  document.getElementById('error').style.display = 'none';
}

async function handleSubmit() {
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm').value;
  const btn      = document.getElementById('submit-btn');

  if (!password || password.length < 6) { showError('Password must be at least 6 characters.'); return; }
  if (password !== confirm)             { showError('Passwords do not match.'); return; }

  btn.disabled = true;
  btn.textContent = 'Saving…';
  document.getElementById('error').style.display = 'none';

  try {
    const res  = await fetch('/api/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'reset_password', reset_token: token, new_password: password }),
    });
    const data = await res.json();

    if (!data.ok) {
      if (res.status === 400 && data.error?.includes('expired')) {
        document.getElementById('reset-view').style.display   = 'none';
        document.getElementById('invalid-view').style.display = 'block';
      } else {
        showError(data.error || 'Something went wrong.');
        btn.disabled = false;
        btn.textContent = 'Set New Password';
      }
      return;
    }

    showSuccess('Password updated! Redirecting to login…');
    setTimeout(() => { window.location.href = '/login.html'; }, 1800);
  } catch {
    showError('Network error. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Set New Password';
  }
}

document.getElementById('submit-btn').addEventListener('click', handleSubmit);
document.addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); });

(async () => {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('token');

  function show(id) {
    ['verifying-view', 'success-view', 'error-view'].forEach(v => {
      document.getElementById(v).style.display = v === id ? 'block' : 'none';
    });
  }

  if (!token) {
    document.getElementById('error-msg').textContent = 'No magic link token found. Please request a new link.';
    show('error-view');
    return;
  }

  try {
    const res  = await fetch(`/api/auth?magic=${encodeURIComponent(token)}`);
    const data = await res.json();

    if (data.ok) {
      localStorage.setItem('jf_token',   data.token);
      localStorage.setItem('jf_user_id', data.userId);
      show('success-view');
      setTimeout(() => { window.location.href = '/'; }, 800);
      return;
    }

    if (data.needsSignup && data.email) {
      const dest = `/login.html?email=${encodeURIComponent(data.email)}&mode=signup`;
      window.location.href = dest;
      return;
    }

    const msg = data.error || 'This magic link has expired or already been used.';
    document.getElementById('error-msg').textContent = msg;
    show('error-view');
  } catch {
    document.getElementById('error-msg').textContent = 'Network error. Please try again.';
    show('error-view');
  }
})();

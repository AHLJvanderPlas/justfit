// Shared handler for all legal/info standalone pages.
// Config is read from data-* attributes on <body>:
//   data-document  — API document key (e.g. 'privacy', 'how_it_works')
//   data-title     — Page title for Web Share API
//   data-url       — Canonical URL for sharing

(function () {
  var body = document.body;
  var DOCUMENT  = body.getAttribute('data-document');
  var PAGE_TITLE = body.getAttribute('data-title');
  var PAGE_URL  = body.getAttribute('data-url');

  // ── Share button ─────────────────────────────────────────────────────────
  var shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async function () {
      if (navigator.share) {
        try { await navigator.share({ title: PAGE_TITLE, url: PAGE_URL }); return; } catch { /* user cancelled or unsupported */ }
      }
      await navigator.clipboard.writeText(PAGE_URL).catch(function () { /* ignore */ });
      shareBtn.textContent = '✓ Link copied';
      setTimeout(function () { shareBtn.innerHTML = '&#8679; Share'; }, 2000);
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getJWT() {
    try { return localStorage.getItem('jf_token'); } catch { return null; }
  }

  function decodeEmail(token) {
    try {
      var parts = token.split('.');
      if (parts.length !== 3) return null;
      var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.email || null;
    } catch { return null; }
  }

  // ── Email toggle ─────────────────────────────────────────────────────────
  var emailBtn = document.getElementById('email-btn');
  var emailForm = document.getElementById('email-form');
  var emailConfirm = document.getElementById('email-confirm');
  var sendBtn = document.getElementById('send-btn');

  if (emailBtn && emailForm) {
    emailBtn.addEventListener('click', function () {
      var isOpen = emailForm.classList.toggle('open');
      if (!isOpen) return;

      var token = getJWT();
      if (!token) {
        if (emailConfirm) emailConfirm.textContent = 'Sign in to email this to yourself.';
        if (sendBtn) sendBtn.style.display = 'none';
        return;
      }
      var email = decodeEmail(token);
      if (emailConfirm) {
        emailConfirm.textContent = 'Send to ' + (email || 'your account email') + '?';
      }
      if (sendBtn) sendBtn.style.display = '';
    });
  }

  // ── Send button ──────────────────────────────────────────────────────────
  if (sendBtn && emailBtn && emailForm) {
    sendBtn.addEventListener('click', async function () {
      var token = getJWT();
      if (!token) {
        if (emailConfirm) emailConfirm.textContent = 'Sign in to email this to yourself.';
        return;
      }

      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending\u2026';
      try {
        var res = await fetch('/api/legal-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({ document: DOCUMENT }),
        });
        var data = await res.json();
        if (res.ok) {
          sendBtn.textContent = '✓ Sent!';
          emailBtn.innerHTML = '&#10003; Emailed';
          setTimeout(function () {
            emailForm.classList.remove('open');
            sendBtn.textContent = 'Send';
            sendBtn.disabled = false;
          }, 2500);
        } else {
          sendBtn.textContent = data.error || 'Error \u2014 try again';
          sendBtn.disabled = false;
          setTimeout(function () { sendBtn.textContent = 'Send'; }, 3000);
        }
      } catch {
        sendBtn.textContent = 'Error \u2014 try again';
        sendBtn.disabled = false;
        setTimeout(function () { sendBtn.textContent = 'Send'; }, 3000);
      }
    });
  }
})();

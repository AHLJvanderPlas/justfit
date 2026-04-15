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
        try { await navigator.share({ title: PAGE_TITLE, url: PAGE_URL }); return; } catch (e) {}
      }
      await navigator.clipboard.writeText(PAGE_URL).catch(function () {});
      shareBtn.textContent = '✓ Link copied';
      setTimeout(function () { shareBtn.innerHTML = '&#8679; Share'; }, 2000);
    });
  }

  // ── Email toggle ─────────────────────────────────────────────────────────
  var emailBtn = document.getElementById('email-btn');
  var emailForm = document.getElementById('email-form');
  var emailInput = document.getElementById('email-input');
  if (emailBtn && emailForm && emailInput) {
    emailBtn.addEventListener('click', function () {
      var isOpen = emailForm.classList.toggle('open');
      if (isOpen) emailInput.focus();
    });
  }

  // ── Send button ──────────────────────────────────────────────────────────
  var sendBtn = document.getElementById('send-btn');
  if (sendBtn && emailInput && emailBtn && emailForm) {
    sendBtn.addEventListener('click', async function () {
      var email = emailInput.value.trim();
      if (!email) { emailInput.focus(); return; }
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending\u2026';
      try {
        var res = await fetch('/api/legal-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, document: DOCUMENT }),
        });
        var data = await res.json();
        if (res.ok) {
          sendBtn.textContent = '✓ Sent!';
          emailInput.value = '';
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
      } catch (e) {
        sendBtn.textContent = 'Error \u2014 try again';
        sendBtn.disabled = false;
        setTimeout(function () { sendBtn.textContent = 'Send'; }, 3000);
      }
    });

    emailInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendBtn.click();
    });
  }
})();

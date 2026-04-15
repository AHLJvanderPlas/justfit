// POST /api/legal-email
// Sends a legal/info document to the authenticated user's own email.
// Requires Authorization: Bearer <jwt>. Rate-limited 5/hr per user.

async function verifyJWT(token, secret) {
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(`${headerB64}.${payloadB64}`));
    if (!valid) return null;
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

async function isRateLimited(userId, env) {
  const bucket = `legal_email:user:${userId}`;
  const maxCount = 5;
  const windowMs = 60 * 60 * 1000; // 1 hour
  const now = Date.now();
  const cutoff = now - windowMs;
  await env.DB.prepare(`
    INSERT INTO auth_rate_limits (bucket, count, window_start_ms)
    VALUES (?, 1, ?)
    ON CONFLICT(bucket) DO UPDATE SET
      count           = CASE WHEN window_start_ms <= ? THEN 1         ELSE count + 1    END,
      window_start_ms = CASE WHEN window_start_ms <= ? THEN ?         ELSE window_start_ms END
  `).bind(bucket, now, cutoff, cutoff, now).run();
  const row = await env.DB.prepare(`SELECT count FROM auth_rate_limits WHERE bucket = ?`).bind(bucket).first();
  return (row?.count ?? 1) > maxCount;
}

function emailShell(title, versionLine, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;">

  <!-- Header -->
  <tr><td style="background:#020617;border-radius:16px 16px 0 0;padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.08);">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><table cellpadding="0" cellspacing="0"><tr>
        <td style="background:#10b981;border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
          <span style="color:#fff;font-weight:900;font-size:12px;line-height:32px;">JF</span>
        </td>
        <td style="padding-left:10px;font-size:17px;font-weight:900;letter-spacing:-0.02em;color:#f8fafc;">
          Just<span style="color:#10b981;">Fit</span>.cc
        </td>
      </tr></table></td>
    </tr></table>
  </td></tr>

  <!-- Title band -->
  <tr><td style="background:#020617;padding:32px 32px 0;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:900;letter-spacing:0.15em;color:#10b981;text-transform:uppercase;">Legal Document</p>
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:900;letter-spacing:-0.02em;color:#f8fafc;">${title}</h1>
    <p style="margin:0 0 32px;font-size:13px;color:#64748b;">${versionLine}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#020617;padding:0 32px 40px;border-radius:0 0 16px 16px;">
    ${bodyHtml}
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:24px 0 0;text-align:center;">
    <p style="margin:0 0 6px;font-size:12px;color:#64748b;">You requested this document from <a href="https://justfit.cc" style="color:#10b981;text-decoration:none;">justfit.cc</a></p>
    <p style="margin:0;font-size:11px;color:#475569;">JustFit.cc &mdash; Consistency over Intensity</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

function section(heading, body) {
  const paras = body.split('\n\n').map(p => {
    const isBullet = p.startsWith('•') || p.startsWith('-');
    return `<p style="margin:0 0 10px;font-size:14px;color:${isBullet ? '#94a3b8' : '#e2e8f0'};line-height:1.75;font-weight:500;white-space:pre-line;">${p}</p>`;
  }).join('');
  return `
    <div style="margin-bottom:28px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:900;letter-spacing:0.12em;color:#10b981;text-transform:uppercase;">${heading}</p>
      ${paras}
    </div>`;
}

function getPrivacyEmail() {
  const body = [
    section('Version 1.0 — Effective 1 April 2025', 'JustFit collects only what is strictly necessary to provide the service. Your fitness data is yours.'),
    section('1. Data Controller', 'JustFit.cc, Netherlands. Contact: support@justfit.cc\n\nProcessing falls under the GDPR as implemented by the Dutch Autoriteit Persoonsgegevens (AP).'),
    section('2. Data We Collect', 'Account data: email address, salted password hash (plaintext never stored), last login timestamp.\n\nProfile & fitness data: display name, sex, weight, height, goal, experience, equipment, sport preferences, injury areas, cycle tracking (all optional beyond email).\n\nDaily check-ins: mood, energy, sleep, stress, pain signals, free-text notes (all optional).\n\nWorkout history: completed sessions, duration, perceived exertion, per-exercise detail.\n\nPasskey credentials: public key and sign counter only. Biometric data never leaves your device.\n\nWhat we do NOT collect:\n• IP addresses or device fingerprints\n• Location data\n• Cookies or tracking pixels\n• Data from ad networks or analytics platforms'),
    section('3. Legal Basis', 'Contract (Art. 6(1)(b)) — account data and workout history to provide the service.\n\nLegitimate interest (Art. 6(1)(f)) — aggregate server-side error logs (no PII).\n\nConsent (Art. 9(2)(a)) — health data (cycle, pregnancy, injury) processed only because you explicitly provide it. Remove it at any time via Settings or account deletion.'),
    section('4. Data Retention', 'Data is retained while your account is active. Account deletion removes all data within 24 hours; backups purged within 30 days. Inactive accounts (24 months) receive a reminder before scheduled deletion.'),
    section('5. Third-Party Processors', 'Cloudflare, Inc. — infrastructure (CDN, Pages, D1 database). EU edge nodes.\n\nResend, Inc. — transactional email. Only your email address and the specific email content are transmitted.\n\nNo other third parties. No data sold, rented, or shared for marketing or analytics.'),
    section('6. Security', 'All data over HTTPS. Passwords: salted SHA-256 hash. Passkeys: WebAuthn ECDSA P-256. JWTs: 7-day, HMAC-signed. Auth rate-limited per IP and email. Identity and health data stored in separate database tables.'),
    section('7. Cookies & Tracking', 'No tracking cookies. No analytics scripts. No third-party pixels.\n\nWe use localStorage (auth token, preferences) and sessionStorage (plan cache) on your device only. Never sent to third parties.'),
    section('8. Your GDPR Rights', 'Access — request a copy of your data\nRectification — correct data in Settings or by email\nErasure — delete your account instantly in Settings → Account\nExport/Portability — request machine-readable data export\nRestriction — ask us to pause processing during a dispute\nObject — object to legitimate-interest processing\n\nEmail: support@justfit.cc (from your account address). Response within 30 days.\n\nComplaint: Autoriteit Persoonsgegevens — autoriteitpersoonsgegevens.nl — +31 70 888 8500'),
    section('9. Minimum Age', 'JustFit is not for users under 16. If a child has created an account, contact support@justfit.cc for immediate deletion.'),
    section('10. Policy Changes', 'Material changes notified by email before the effective date. Continued use = acceptance. Previous versions available on request.'),
    section('11. Contact', 'support@justfit.cc'),
  ].join('');
  return emailShell('Privacy Policy', 'Version 1.0 &mdash; Effective 1 April 2025 &mdash; Controller: JustFit.cc (Netherlands)', body);
}

function getTermsEmail() {
  const body = [
    section('Version 1.1 — Effective 1 April 2025', 'By creating an account you agree to these Terms. Your account creation timestamp is our record of acceptance.'),
    section('1. Acceptance', 'By accessing or using JustFit.cc you confirm you have read, understood, and agree to be bound by these Terms and the Privacy Policy. These Terms form a binding legal agreement.'),
    section('2. Service Description', 'JustFit provides a rule-based fitness planning tool for general wellness purposes only. It is not a medical service, personal training service, rehabilitation service, or healthcare provider.'),
    section('3. Eligibility', 'You must be at least 16 years old. Pregnancy and postnatal features require that you have obtained appropriate medical clearance before use.'),
    section('4. Account Responsibilities', 'You are responsible for maintaining the confidentiality of your credentials and all activity under your account. Notify us immediately at support@justfit.cc if you suspect unauthorised access.'),
    section('5. Acceptable Use', 'You agree not to:\n• Misuse the service or harm other users\n• Attempt to access another user\'s data\n• Reverse-engineer or reproduce any part of the platform\n• Use automated means (bots, scrapers) to access the service\n• Use the service for any unlawful purpose'),
    section('6. Health and Safety', 'JustFit is a general wellness tool. You are solely responsible for your health and safety. Before beginning any exercise programme — especially if you have a medical condition, are pregnant, postnatal, have had recent surgery, or are on medication — consult a qualified health professional.'),
    section('7. Intellectual Property', 'All content, code, design, and branding of JustFit.cc is our intellectual property. Your personal fitness data remains yours — see the Privacy Policy for your rights.'),
    section('8. Your Data', 'Your data belongs to you. You can export, correct, or delete it at any time. See the Privacy Policy for full details including your GDPR rights.'),
    section('9. Disclaimer of Warranties', 'The Service is provided "as is" without warranties of any kind. JustFit.cc does not warrant the Service will be uninterrupted, error-free, or suitable for any particular purpose.'),
    section('10. Limitation of Liability', 'To the fullest extent permitted by law, JustFit.cc and its founders, employees, and agents are not liable for any indirect, incidental, or consequential damages. Total liability shall not exceed the amount paid in the 12 months preceding the claim (or €10 if nothing was paid).'),
    section('11. Changes to Terms', 'Material changes will be notified by email at least 14 days before they take effect. Continued use after the effective date = acceptance.'),
    section('12. Governing Law', 'These Terms are governed by the laws of the Netherlands. Disputes are subject to Dutch courts, unless mandatory consumer protection laws in your country require otherwise.\n\nFor informal resolution: support@justfit.cc'),
    section('13. Contact', 'support@justfit.cc'),
  ].join('');
  return emailShell('Terms &amp; Conditions', 'Version 1.1 &mdash; Effective 1 April 2025 &mdash; Governed by Dutch law', body);
}

function getMissionEmail() {
  const body = [
    section('Version 1.0 — Effective 1 April 2025', 'What JustFit stands for and the philosophy that guides every product decision.'),
    section('Our Vision', 'A world where fitness is built into everyday life — not reserved for the motivated, the athletic, or the disciplined. JustFit exists to make consistent movement the default, not the exception.'),
    section('Our Mission', 'To give every person a personal training intelligence that adapts to their real life — not an ideal version of it. Sleep bad? Stressed? Travelling? JustFit adjusts so you still move. Every single day.'),
    section('Philosophy: Consistency > Intensity', 'The science is clear: showing up consistently at moderate effort produces better long-term results than sporadic bursts of maximum intensity.\n\nWe do not reward pain. We reward presence. A ten-minute session on a hard day is worth more than a skipped session after a hard week.\n\nYour level never drops because you had a hard week. Your programme adapts to fit your life, not the other way around.'),
    section('Running Coach', 'A structured programme that builds you toward a distance target — 5, 10, 15, 20, or 30 km — over 8 to 20 weeks. Three sessions per week, alternating HIIT and Zone 2. If you miss more than 7 days, the programme steps back one week. Consistency is always the goal.'),
    section('Polarised Training', 'Roughly 80% of sessions at low intensity (Zone 2) and 20% at high intensity (HIIT). When enabled, JustFit alternates automatically. If life signals have already pushed today toward recovery, Zone 2 is always chosen — your body\'s signals take priority over training balance.'),
    section('Why We Don\'t Use AI for Plans', 'Your plan is generated by a transparent, rule-based engine — not a black box. Every decision is traceable to a specific rule. No hallucinated workouts, no random variation for its own sake.'),
    section('Privacy First', 'Your fitness data is yours. We separate your identity from your health data at the database level. We do not sell data, profile you for ads, or share your information with third parties.'),
    section('Contact', 'Questions or feedback on our philosophy: support@justfit.cc'),
  ].join('');
  return emailShell('Mission, Vision &amp; Philosophy', 'Version 1.0 &mdash; Effective 1 April 2025', body);
}

function getHowItWorksEmail() {
  const body = [
    section('Version 1.0 — Effective 1 April 2025', 'How JustFit generates personalised daily workout plans, coaches you through sessions, and tracks your progress.'),
    section('Daily Calibration (Optional)', 'Each day, tell JustFit how you\'re doing: sleep, energy, mood, stress, and practical constraints. Under 30 seconds.\n\nIf you skip, JustFit still generates a plan from your goal, experience level, equipment, and schedule — automatically.'),
    section('The Planner Engine', 'A rule-based engine (not AI). Rules fire in priority order:\n• Pain → rest day, no exceptions\n• Low sleep (≤5h) → intensity and volume reduced\n• High stress → session shifts toward mobility\n• Travelling or no gear → bodyweight-only\n• No time (≤10 min) → micro session\n• Pregnancy → high-impact excluded, pelvic floor included\n• Postnatal → phase-gated recovery programme\n• Running Coach enrolled → structured run session\n• Outdoor exercises always last'),
    section('Goals & Experience', 'Set your goal and experience level. These drive exercise count, sets, rest periods, intensity, and session naming.'),
    section('Cycle & Body Awareness', 'Smart Cycle Tracking adjusts intensity across the four cycle phases. Pregnancy and postnatal modes activate full safety rule sets.'),
    section('Workout Coaching', 'Step-by-step coaching: instruction cards, rep tap zone, automatic rest timer, difficulty controls, and exercise alternatives. Wake Lock keeps your screen on.'),
    section('Consistency Score', 'Calculated from the last 7 days:\n• Active days × 10 (max 70)\n• Resilience bonus × 5 (max 20)\n• Streak bonus (max 10)\n\nIt rewards showing up — especially on hard days.'),
    section('History & Awards', 'Every completed session is logged. 26 milestone achievements tracked — from your first session to 100-day streaks.'),
    section('Contact', 'Questions about how the app works: support@justfit.cc'),
  ].join('');
  return emailShell('How JustFit Works', 'Version 1.0 &mdash; Effective 1 April 2025', body);
}

function getDisclaimerEmail() {
  const body = [
    section('Version 1.0 — Effective 1 April 2025', 'This disclaimer applies to all use of JustFit.cc and any workout plans generated by the app.'),
    section('Not a Medical App', 'JustFit is a general-purpose fitness tool for healthy adults. It is NOT a medical application, medical device, or healthcare service. Nothing in JustFit constitutes medical advice, diagnosis, or treatment.'),
    section('Consult a Professional', 'Always seek the advice of a qualified physician, physiotherapist, or other licensed health professional before beginning any exercise programme, particularly if you:\n• Have or suspect any medical condition\n• Are pregnant or postnatal\n• Have recently had surgery or injury\n• Are on medication that may affect your exercise capacity'),
    section('Exercise Risk', 'Physical exercise carries inherent risks including musculoskeletal injury, cardiovascular events, and falls. By using JustFit, you acknowledge and accept these risks.'),
    section('Liability Waiver', 'To the fullest extent permitted by applicable law, JustFit.cc, its founders, employees, and agents are not liable for any injury, illness, loss, or damage — direct or indirect — arising from your use of the app.\n\nYou use JustFit entirely at your own risk.'),
    section('BMI & Body Metrics', 'BMI is a population-level screening tool with well-documented limitations. JustFit uses it solely to apply conservative exercise selection rules. It does not constitute a health assessment or diagnosis.'),
    section('Pregnancy & Postnatal', 'Pregnancy and postnatal modes apply general safety guidelines from exercise science. They do not replace individualised advice from your midwife, obstetrician, or physiotherapist.'),
    section('Data Accuracy', 'Plan recommendations are based on the information you provide. JustFit cannot verify user-submitted data.'),
    section('Contact', 'Safety questions or concerns: support@justfit.cc'),
  ].join('');
  return emailShell('Disclaimer &amp; Liability Waiver', 'Version 1.0 &mdash; Effective 1 April 2025 &mdash; Netherlands', body);
}

const VALID_DOCS = ['privacy', 'terms', 'mission', 'how_it_works', 'disclaimer'];

export async function onRequestPost({ request, env }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Sign in to email this document to yourself.' }, { status: 401 });
    }
    const payload = await verifyJWT(authHeader.slice(7), env.JWT_SECRET);
    if (!payload) {
      return Response.json({ error: 'Invalid or expired session — please sign in again.' }, { status: 401 });
    }
    const userId = payload.userId;

    if (await isRateLimited(userId, env)) {
      return Response.json({ error: 'Too many requests — try again in an hour.' }, { status: 429 });
    }

    const { document } = await request.json();
    if (!document || !VALID_DOCS.includes(document)) {
      return Response.json({ error: 'Invalid document.' }, { status: 400 });
    }

    const user = await env.DB.prepare('SELECT primary_email FROM users WHERE id = ?').bind(userId).first();
    if (!user?.primary_email) {
      return Response.json({ error: 'Account email not found.' }, { status: 404 });
    }

    const SUBJECTS = {
      privacy:      'JustFit.cc — Privacy Policy (v1.0)',
      terms:        'JustFit.cc — Terms & Conditions (v1.1)',
      mission:      'JustFit.cc — Mission, Vision & Philosophy',
      how_it_works: 'JustFit.cc — How JustFit Works',
      disclaimer:   'JustFit.cc — Disclaimer & Liability Waiver',
    };
    const GENERATORS = {
      privacy:      getPrivacyEmail,
      terms:        getTermsEmail,
      mission:      getMissionEmail,
      how_it_works: getHowItWorksEmail,
      disclaimer:   getDisclaimerEmail,
    };
    const subject = SUBJECTS[document];
    const html = GENERATORS[document]();

    if (!env.RESEND_API_KEY) {
      console.error('[legal-email] RESEND_API_KEY not configured');
      return Response.json({ error: 'Email service unavailable — please try again later.' }, { status: 503 });
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: 'JustFit.cc <noreply@justfit.cc>', to: [user.primary_email], subject, html }),
    });
    if (!resendRes.ok) {
      const resendBody = await resendRes.text();
      console.error('[legal-email] Resend error', resendRes.status, resendBody);
      return Response.json({ error: 'Failed to send email — try again shortly.' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// F8 — the self-measurement on a day the user wrote their own session.
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import api from '../src/apiClient.js';
import { ownSessionAssessmentOffer, ownSessionAsTemplate } from '../src/planUtils.js';

const here = path.dirname(fileURLToPath(import.meta.url));
// i18n.js reads localStorage at import, so its dictionary is checked as source.
const i18nSrc = fs.readFileSync(path.join(here, '../src/i18n.js'), 'utf8');
const hasNl = (en) => i18nSrc.includes(JSON.stringify(en).slice(1, -1)) || i18nSrc.includes(`'${en}'`);

const realFetch = globalThis.fetch;
const respond = (body) => { globalThis.fetch = async () => ({ json: async () => body }); };
afterEach(() => { globalThis.fetch = realFetch; });

describe('item 5 — recalibrate on a user-authored day', () => {
  it('forceAssessment reports a preserved (user-authored) plan instead of dropping the flag', async () => {
    respond({ ok: true, saved: true, preserved: true, plan: { id: 'row-u', authored_by_user: true } });
    const r = await api.forceAssessment('u', '2026-10-05');
    expect(r.preserved).toBe(true);
    expect(r.plan.id).toBe('row-u');
  });

  it('forceAssessment on an engine day is not preserved', async () => {
    respond({ ok: true, saved: true, plan: { id: 'row-e', assessment_planned: true } });
    const r = await api.forceAssessment('u', '2026-10-05');
    expect(r.preserved).toBe(false);
    expect(r.plan.assessment_planned).toBe(true);
  });

  it('the explanation has a Dutch translation', () => {
    expect(hasNl("You built today's session yourself, so it stays as it is; add the self-measurement with the button under your session.")).toBe(true);
  });
});

describe('item 6 — the measurement offer after a one-tap install', () => {
  const own = { authored_by_user: true, assessment_offer: true, assessment_planned: false, session_name: 'Hotel', safety_ack_ms: null,
    steps: [{ exercise_id: 'a', sets: 3, target_reps: 10, rest_sec: 45 }, { exercise_id: 'm', max_effort: true, measures: 'dcp_pushups' }] };

  it('a user-authored plan with a due measurement offers it; nothing else does', () => {
    expect(ownSessionAssessmentOffer(own)).toBe(true);
    expect(ownSessionAssessmentOffer({ ...own, assessment_planned: true })).toBe(false);  // already in the session
    expect(ownSessionAssessmentOffer({ ...own, assessment_offer: false })).toBe(false);   // not due
    expect(ownSessionAssessmentOffer({ ...own, authored_by_user: false })).toBe(false);   // engine plans schedule it themselves (R598)
    expect(ownSessionAssessmentOffer(null)).toBe(false);
  });

  it('re-installs the same session without any measurement steps', () => {
    expect(ownSessionAsTemplate(own)).toEqual({ name: 'Hotel', steps: [own.steps[0]] });
  });

  it('the one-tap install path forwards include_assessment and the earlier acknowledgement', async () => {
    let sent = null;
    globalThis.fetch = async (_url, init) => { sent = JSON.parse(init.body); return { status: 200, json: async () => ({ ok: true }) }; };
    await api.useMySession(ownSessionAsTemplate(own), '2026-10-05', { includeAssessment: true, safetyAck: true });
    expect(sent.include_assessment).toBe(true);
    expect(sent.safety_ack).toBe(true);
    expect(sent.custom_steps.map(s => s.exercise_id)).toEqual(['a']);
  });

  // No DOM in this suite, so the wiring is pinned at the source: the Today card
  // renders the offer, and App passes the options through to useMySession.
  it('the Today card renders it and App forwards the options', () => {
    const src = (f) => fs.readFileSync(path.join(here, '../src', f), 'utf8');
    expect(src('Dashboard.jsx')).toMatch(/<OwnSessionAssessmentOffer plan=\{plan\} onUse=\{onUseTemplate\} \/>/);
    expect(src('App.jsx')).toMatch(/api\.useMySession\(tpl, today, opts\)/);
  });
});

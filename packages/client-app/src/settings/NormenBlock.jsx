// NormenBlock — coach-dcp release 1, fix 1: the control the DCP never had.
//
// Settings → Coaches → NORMEN, for every user (the DCP is a standing standard,
// not a coach: dcpCardVisible already allows it without the military coach, via
// the bias). It renders; SettingsView owns the write (saveDcp) and App owns the
// measurement (handleForceAssessment, R598 into today's session).
//
//   Keuring K3 · over 60 dagen       read-only, only while the military coach is active
//   DCP-norm · doorlopend      [Aan]  needs a birth year 1930–2015 (the age band is the norm)
//   Geboortejaar [1990] · man (uit Jij)
//   the norm sentence                 blank, with "Stel je geslacht in bij Jij", when sex is unset
//   Altijd DCP-klaar           [Aan]  the bias toggle, moved here from "You"
//   [Nulmeting inplannen]             → "Meting staat in je sessie van vandaag"

import { useState } from "react";
import { t } from "../i18n.js";
import { milClL } from "../planUtils.js";
import { dcpMeasureLabel, dcpMeasurePlanned, dcpNormsFor, parseBirthYear } from "../dcpUi.js";

export default function NormenBlock({ prefs, assessmentPlanned, onSaveDcp, onMeasure }) {
  const mil = prefs.preferences?.military_coach ?? {};
  const dcp = mil.dcp ?? {};
  const [nowMs] = useState(() => Date.now());
  const [yearText, setYearText] = useState(dcp.birth_year ? String(dcp.birth_year) : "");
  const [busy, setBusy] = useState(false);
  const year = parseBirthYear(yearText);
  const enabled = !!dcp.enabled;
  const bias = !!dcp.bias_enabled;
  const lastAt = dcp.last?.at_ms ?? null;
  const planned = dcpMeasurePlanned({ assessmentPlanned, lastAtMs: lastAt, nowMs });
  const sex = prefs.sex === "male" || prefs.sex === "female" ? prefs.sex : null;
  const norms = dcpNormsFor(sex, year, nowMs);

  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } catch { /* the toggle shows the stored state either way */ } finally { setBusy(false); }
  };
  const toggleDcp = () => run(async () => {
    if (enabled) { await onSaveDcp({ enabled: false, birth_year: dcp.birth_year ?? year, bias_enabled: bias }); return; }
    if (!year) return;
    await onSaveDcp({ enabled: true, birth_year: year, bias_enabled: true });
    // No baseline yet: schedule it now, the same call as the button below.
    if (!lastAt) await onMeasure?.();
  });
  const saveYear = () => {
    if (enabled && year && year !== dcp.birth_year) run(() => onSaveDcp({ enabled, birth_year: year, bias_enabled: bias }));
  };

  const daysOut = mil.target_date ? Math.max(0, Math.ceil((new Date(mil.target_date).getTime() - nowMs) / 86400000)) : null;
  const level = milClL(mil.track ?? "keuring", mil.cluster_target ?? 1);

  return (
    <div className="jf-norm">
      <div className="jf-norm__eyebrow">{t("Standards")}</div>
      <div className="jf-norm__panel">
        {mil.active && (
          <div className="jf-norm__keuring">
            {daysOut != null ? t("Keuring {level} · in {n} days", { level, n: daysOut }) : t("Keuring {level}", { level })}
          </div>
        )}

        <div className="jf-norm__row">
          <div className="jf-norm__title">{t("DCP standard · standing")}</div>
          <button
            className={`jf-norm__toggle${enabled ? " jf-norm__toggle--on" : ""}`}
            onClick={toggleDcp}
            disabled={busy || (!enabled && !year)}
            aria-pressed={enabled}
            aria-label={t("DCP standard · standing")}
          >
            {enabled ? t("On") : t("Off")}
          </button>
        </div>
        <label className="jf-norm__year">
          {t("Birth year")}
          <input
            inputMode="numeric" maxLength={4} placeholder="1990" value={yearText}
            onChange={(e) => setYearText(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onBlur={saveYear}
          />
          {sex && <span>{t("{sex} (from You)", { sex: sex === "female" ? t("woman") : t("man") })}</span>}
        </label>
        {!year && !enabled && <div className="jf-norm__hint">{t("Enter a birth year between 1930 and 2015 to switch the DCP on.")}</div>}
        {!sex
          ? <div className="jf-norm__hint">{t("Set your sex under You")}</div>
          : !norms && sex === "female"
            ? <div className="jf-norm__hint">{t("The DCP standard for women is not in the app yet.")}</div>
            : norms && (
              <div className="jf-norm__text">
                {t("2 min push-ups, 2 min sit-ups, 12 min run. Your norm: {push} · {situp} · {run} m. You train to 20% above it, then the bias stops. Retest every 6 weeks.",
                  { push: norms.pushups, situp: norms.situps, run: norms.run_m.toLocaleString("nl-NL") })}
              </div>
            )}

        {enabled && (
          <>
            <div className="jf-norm__row jf-norm__sub-row">
              <div>
                <div className="jf-norm__title">{t("Stay DCP-ready")}</div>
                <div className="jf-norm__text">
                  {bias
                    ? t("Planner keeps you 20% above the DCP minimum, and stops pushing once you are.")
                    : t("Planner ignores the DCP standard.")}
                </div>
              </div>
              <button
                className={`jf-norm__toggle${bias ? " jf-norm__toggle--on" : ""}`}
                onClick={() => run(() => onSaveDcp({ enabled, birth_year: dcp.birth_year, bias_enabled: !bias }))}
                disabled={busy}
                aria-pressed={bias}
                aria-label={t("Stay DCP-ready")}
              >
                {bias ? t("On") : t("Off")}
              </button>
            </div>
            <button className="jf-dcp-measure jf-dcp-measure--wide" onClick={() => run(() => onMeasure?.())} disabled={busy || planned}>
              {t(dcpMeasureLabel({ never: !lastAt, planned }))}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

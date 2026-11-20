// Media 1 — Settings → Jij → "Tijdens de training": read each new exercise aloud. Per device
// (readAloudPref.js), off by default; not shown where the browser has no speech synthesis.
import { useState } from "react";
import { t } from "./i18n.js";
import { Glass } from "./uiComponents.jsx";
import { speechSupported } from "./speech.js";
import { autoReadOn, setAutoRead } from "./readAloudPref.js";

export default function ReadAloudSetting() {
  const [on, setOn] = useState(autoReadOn);
  if (!speechSupported()) return null;
  const toggle = () => { const next = !on; setOn(next); setAutoRead(next); };
  return (
    <div className="jf-set-block" data-testid="read-aloud-setting">
      <h2 className="jf-set-block__eyebrow">{t("During the workout")}</h2>
      <Glass className="jf-set-card">
        <div className="jf-set-row">
          <div className="jf-set-row__text">
            <div className="jf-set-row__title" id="jf-readaloud-label">{t("Read each exercise aloud")}</div>
            <div className="jf-set-row__hint">{t("When a new exercise starts, your phone reads the name, sets and steps aloud with its own voice. Nothing is sent anywhere. Saved on this device.")}</div>
          </div>
          <button type="button" role="switch" aria-checked={on} aria-labelledby="jf-readaloud-label" className={`jf-switch${on ? " jf-switch--on" : ""}`} onClick={toggle}>
            <span className="jf-switch__knob" />
          </button>
        </div>
      </Glass>
    </div>
  );
}

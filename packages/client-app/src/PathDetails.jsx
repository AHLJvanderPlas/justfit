// The follow-up a sport path asks for — km target, cycling sub-goal, military track /
// mode / date. One form for the onboarding goal step and PathChoiceModal (UAT R6), so
// both store the same thing (pathPrefs.js).
import { t } from "./i18n.js";
import { RUN_KM_OPTIONS } from "./pathPrefs.js";

export default function PathDetails({ path, value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  if (path === "running") {
    return (
      <div className="jf-path__chips">
        {RUN_KM_OPTIONS.map((km) => (
          <button key={km} type="button" aria-pressed={value.runKm === km}
            className={`jf-path__chip${value.runKm === km ? " jf-path__chip--on" : ""}`} onClick={() => set("runKm", km)}>{km}km</button>
        ))}
      </div>
    );
  }
  if (path === "cycling") {
    const SUBGOALS = [
      { id: "build_fitness", label: "Build fitness", desc: "General aerobic base" },
      { id: "climbing", label: "Climbing", desc: "Strength + sustained power" },
      { id: "sprint", label: "Sprint", desc: "Short explosive efforts" },
      { id: "aerobic_base", label: "Aerobic base", desc: "Zone 2 foundation" },
      { id: "race_fitness", label: "Race fitness", desc: "Event-ready conditioning" },
    ];
    return (
      <div className="jf-path__list">
        {SUBGOALS.map((sg) => {
          const on = value.cycleSubgoal === sg.id;
          return (
            <button key={sg.id} type="button" aria-pressed={on} className={`jf-path__row${on ? " jf-path__row--on" : ""}`} onClick={() => set("cycleSubgoal", sg.id)}>
              <span>
                <span className="jf-path__row-title">{t(sg.label)}</span>
                <span className="jf-path__row-sub">{t(sg.desc)}</span>
              </span>
              {on && <span className="jf-path__tick" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>
    );
  }
  if (path === "military") {
    const TRACKS = [["keuring", "Keuring", "Physical assessment KB–K6"], ["opleiding", "Opleiding", "Training programme O1–O7"]];
    const MODES = [["target", "Target date"], ["fit", "Get fit"], ["open", "Open"]];
    return (
      <>
        <div className="jf-path__label">{t("Track")}</div>
        <div className="jf-path__pair">
          {TRACKS.map(([val, label, sub]) => {
            const on = value.milTrack === val;
            return (
              <button key={val} type="button" aria-pressed={on} className={`jf-path__row${on ? " jf-path__row--on" : ""}`} onClick={() => set("milTrack", val)}>
                <span>
                  <span className="jf-path__row-title">{label}</span>
                  <span className="jf-path__row-sub">{t(sub)}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="jf-path__label">{t("Mode")}</div>
        <div className="jf-path__pair">
          {MODES.map(([val, label]) => (
            <button key={val} type="button" aria-pressed={value.milMode === val}
              className={`jf-path__chip jf-path__chip--grow${value.milMode === val ? " jf-path__chip--on" : ""}`} onClick={() => set("milMode", val)}>{t(label)}</button>
          ))}
        </div>
        {value.milMode === "target" && (
          <>
            <div className="jf-path__label">{t("Assessment date (optional)")}</div>
            <input type="date" className="jf-path__date" value={value.milTargetDate} min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => set("milTargetDate", e.target.value)} />
          </>
        )}
      </>
    );
  }
  return null;
}

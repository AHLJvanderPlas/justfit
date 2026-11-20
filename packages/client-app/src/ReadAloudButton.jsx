// Media 1 — "Voorlezen" / "Stop" next to the instructions. 44 px hit area, aria-pressed while
// speaking. WorkoutView owns the speaking state (it also stops speech on set finish, exercise
// change, rest, leaving and page hide); this is only the control.
import { t } from "./i18n.js";

export default function ReadAloudButton({ speaking, onToggle }) {
  return (
    <button type="button" className={`jf-speak${speaking ? " jf-speak--on" : ""}`} aria-pressed={speaking} onClick={onToggle} data-testid="read-aloud">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {speaking
          ? <><line x1="16" y1="9" x2="22" y2="15" /><line x1="22" y1="9" x2="16" y2="15" /></>
          : <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></>}
      </svg>
      <span>{speaking ? t("Stop") : t("Read aloud")}</span>
    </button>
  );
}

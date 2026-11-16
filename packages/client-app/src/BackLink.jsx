import { t } from "./i18n.js";

// UX review D (finding 15) — the ONE back control: a chevron and the parent view's
// name ("‹ Instellingen"), a real button with a 44 px hit area. `to` is the parent
// name, already translated. The in-session "← Annuleren" is a cancel action, not a back.
export default function BackLink({ to, onClick }) {
  return (
    <button type="button" className="jf-back" data-testid="back-link" aria-label={t("Back to {name}", { name: to })} onClick={onClick}>
      <span className="jf-back__chev" aria-hidden="true">‹</span>
      <span>{to}</span>
    </button>
  );
}

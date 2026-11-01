import { Component } from "react";
import { t } from "./i18n.js";

// Catches unhandled render errors anywhere in the tree.
// Must be a class component — React requires it for error boundaries.
// UAT R4: Dutch first (i18n reads jf_lang from localStorage, no React state needed) and on
// the app's fonts and tokens through the .jf-orphan classes.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="jf-orphan jf-orphan--boundary">
        <div className="jf-orphan__card jf-orphan__card--center">
          <div className="jf-orphan__icon">⚠️</div>
          <div className="jf-orphan__title">{t("Something went wrong")}</div>
          <div className="jf-orphan__text">
            {t("An unexpected error occurred. Your data is safe — reload to continue.")}
          </div>
          <button className="jf-orphan__btn jf-orphan__btn--solid" onClick={() => window.location.reload()}>
            {t("Reload app")}
          </button>
        </div>
      </div>
    );
  }
}

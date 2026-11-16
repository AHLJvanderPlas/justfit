// One dialog behaviour for every modal and sheet (UX review C, finding 8):
//   * focus moves INTO the dialog on open (the first control, or the dialog itself),
//   * Tab and Shift+Tab are trapped inside it while it is open,
//   * Escape closes it (unless `onClose` is null — a gate the user must answer),
//   * focus returns to the control that opened it when it closes.
// The pure parts (what is focusable, where Tab goes next) are exported and unit-tested without a DOM;
// useDialog() only wires them to a ref and the document.
import { useEffect, useRef } from "react";

export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keep the elements a keyboard can actually reach (visible, not inert). */
export function reachable(list) {
  return [...list].filter((el) => !el.hidden && el.getAttribute?.("aria-hidden") !== "true" && el.offsetParent !== null);
}

/**
 * Where should Tab go? `items` = the focusable elements in DOM order, `active` = document.activeElement,
 * `container` = the dialog. Returns the element to focus, or null to let the browser move on by itself.
 */
export function nextFocus(items, active, shift, container = null) {
  if (!items.length) return container;
  const first = items[0], last = items[items.length - 1];
  const i = items.indexOf(active);
  if (i === -1) return shift ? last : first;      // focus is on the dialog itself or outside it
  if (shift && active === first) return last;
  if (!shift && active === last) return first;
  return null;
}

/** Key handling shared by the hook and the tests: returns "close", { focus }, or null. */
export function dialogKey(e, { items, active, container, onClose }) {
  if (e.key === "Escape" && onClose) return "close";
  if (e.key === "Tab") {
    const el = nextFocus(items, active, e.shiftKey, container);
    return el ? { focus: el } : null;
  }
  return null;
}

// Open dialogs, innermost last: only the top one answers Escape and Tab (a confirm over a sheet).
const stack = [];

/**
 * Attach to the dialog's root element. `onClose` null/undefined = Escape does nothing (a gate).
 * `initialFocus`: a selector for the control to focus first; default = the first focusable element,
 * and the root itself when it has none (give the root tabIndex={-1}).
 */
export function useDialog(ref, { onClose = null, initialFocus = null, enabled = true } = {}) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }); // latest handler, set after every commit
  useEffect(() => {
    const root = ref.current;
    if (!enabled || !root) return undefined;
    const trigger = document.activeElement;
    // A control that already took focus itself (autoFocus) keeps it.
    if (!root.contains(document.activeElement)) {
      const target = (initialFocus && root.querySelector(initialFocus)) || reachable(root.querySelectorAll(FOCUSABLE))[0] || root;
      target.focus?.({ preventScroll: true });
    }
    const token = {};
    stack.push(token);
    const onKey = (e) => {
      if (stack[stack.length - 1] !== token) return;
      const cur = ref.current ?? root; // the root may be swapped (a wizard step) while the dialog stays open
      const r = dialogKey(e, { items: reachable(cur.querySelectorAll(FOCUSABLE)), active: document.activeElement, container: cur, onClose: closeRef.current });
      if (r === "close") { e.stopPropagation(); closeRef.current?.(); }
      else if (r) { e.preventDefault(); r.focus.focus?.(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(token), 1);
      // Back to where the user was — only when that control is still on the page.
      if (trigger && trigger !== document.body && trigger.isConnected) trigger.focus?.({ preventScroll: true });
    };
  }, [ref, enabled, initialFocus]);
}

/** The attributes every dialog root carries (spread them, then give the element its own ref). */
export const dialogAttrs = (label) => ({ role: "dialog", "aria-modal": "true", "aria-label": label, tabIndex: -1 });

/** Enter / Space activate a non-button control that has role="button" or "switch". */
export const activateKey = (fn) => (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(e); } };

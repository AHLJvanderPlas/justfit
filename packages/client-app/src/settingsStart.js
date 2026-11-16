// Today's goal link opens Settings straight on "Doel & coach". Settings mounts fresh
// on every visit, so a one-shot hand-off is enough and App.jsx needs no extra state.
let start = null;
export function openSettingsAt(sub) { start = sub; }
export function takeSettingsStart() { const s = start; start = null; return s; }

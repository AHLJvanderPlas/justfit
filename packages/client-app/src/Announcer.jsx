// The two live regions behind announce() — see announce.js. Mounted once, outside every view.
import { useEffect, useState } from "react";
import { subscribe } from "./announce.js";

export default function Announcer() {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");
  useEffect(() => subscribe(({ message, mode, seq }) => {
    // Every other message gets a trailing zero-width space (U+200B), so a repeated sentence is still a change.
    const text = seq % 2 ? message : message + String.fromCharCode(0x200b);
    if (mode === "assertive") setAssertive(text); else setPolite(text);
  }), []);
  return (
    <>
      <div className="jf-sr-only" role="status" aria-live="polite" aria-atomic="true" data-testid="announcer">{polite}</div>
      <div className="jf-sr-only" role="alert" aria-live="assertive" aria-atomic="true">{assertive}</div>
    </>
  );
}

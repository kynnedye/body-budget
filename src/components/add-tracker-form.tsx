"use client";

import { useActionState } from "react";
import { createTracker } from "@/app/actions";

export function AddTrackerForm() {
  const [state, action, pending] = useActionState(createTracker, null);

  return (
    <form action={action} className="form-grid">
      <label>Name<input className="field" name="name" required placeholder="e.g. Magnesium" /></label>
      <label>Emoji<input className="field" name="emoji" placeholder="✨" maxLength={4} /></label>
      <label>Group<select className="field" name="kind"><option value="HABIT">Input / habit</option><option value="SYMPTOM">Symptom</option></select></label>
      <label>Input type<select className="field" name="valueType"><option value="BOOLEAN">Checkbox</option><option value="NUMBER">Amount</option></select></label>
      <label>Unit<input className="field" name="unit" placeholder="mg, minutes…" /></label>
      <label>Color<input className="field" name="color" type="color" defaultValue="#667966" /></label>
      <button className="button primary" type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add tracker"}
      </button>
      {state?.error ? <p className="form-error">{state.error}</p> : null}
    </form>
  );
}

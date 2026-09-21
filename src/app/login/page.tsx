import { unlockApp } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <section className="card section-card" style={{ maxWidth: 420, margin: "12vh auto 0" }}>
      <span className="eyebrow">Private log</span>
      <h1>Body Budget</h1>
      <p className="lede">Enter the app password to continue.</p>
      <form action={unlockApp} style={{ marginTop: 24, display: "grid", gap: 12 }}>
        <label>
          Password
          <input className="field" type="password" name="password" required autoFocus />
        </label>
        {error ? <p className="form-error">That password didn’t match.</p> : null}
        <button className="button primary" type="submit">Unlock</button>
      </form>
    </section>
  );
}

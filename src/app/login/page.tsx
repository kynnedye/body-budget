import { unlockApp } from "@/app/actions";
import { gatePassword, isGateRequired } from "@/lib/auth";
import { hasUnlockedSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await hasUnlockedSession()) redirect("/");

  const { error } = await searchParams;
  const configured = Boolean(gatePassword());
  const needsSetup = isGateRequired() && !configured;

  return (
    <section className="card section-card" style={{ maxWidth: 420, margin: "12vh auto 0" }}>
      <span className="eyebrow">Private log</span>
      <h1>Body Budget</h1>
      {needsSetup ? (
        <p className="lede">
          This deployment is locked until you set <code>APP_PASSWORD</code> in Vercel
          (Project → Settings → Environment Variables), then redeploy. Don’t put quotes
          around the value.
        </p>
      ) : (
        <>
          <p className="lede">Enter the app password to continue.</p>
          <form action={unlockApp} style={{ marginTop: 24, display: "grid", gap: 12 }}>
            <label>
              Password
              <input
                className="field"
                type="password"
                name="password"
                required
                autoFocus
                autoComplete="current-password"
              />
            </label>
            {error ? <p className="form-error">That password didn’t match.</p> : null}
            <button className="button primary" type="submit">Unlock</button>
          </form>
        </>
      )}
    </section>
  );
}

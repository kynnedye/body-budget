const COOKIE = "bb_gate";

export function gatePassword() {
  return process.env.APP_PASSWORD?.trim() || "";
}

export function gateCookieName() {
  return COOKIE;
}

export async function gateToken(password = gatePassword()) {
  const data = new TextEncoder().encode(`body-budget:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function isValidGateToken(token: string | undefined) {
  const password = gatePassword();
  if (!password || !token) return false;
  const expected = await gateToken(password);
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

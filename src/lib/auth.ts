const COOKIE = "bb_gate";

function readSecret(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

export function gatePassword() {
  return readSecret(process.env.APP_PASSWORD);
}

export function isGateRequired() {
  return process.env.NODE_ENV === "production";
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

export function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  );
}

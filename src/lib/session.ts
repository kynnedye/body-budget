import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  gateCookieName,
  gatePassword,
  isGateRequired,
  isValidGateToken,
} from "@/lib/auth";

export async function hasUnlockedSession() {
  if (!gatePassword()) return !isGateRequired();
  return isValidGateToken((await cookies()).get(gateCookieName())?.value);
}

export async function requireUnlocked() {
  if (await hasUnlockedSession()) return;
  redirect("/login");
}

export async function requireUnlockedApi() {
  if (await hasUnlockedSession()) return true;
  return false;
}

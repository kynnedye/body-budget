import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Fraunces } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import { requireUnlocked } from "@/lib/session";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Body Budget",
  description: "A gentle personal wellbeing and habit tracker.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const pathname = (await headers()).get("x-pathname");
  const showNav = pathname !== "/login";
  if (showNav) await requireUnlocked();

  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        {showNav ? <AppNav /> : null}
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}

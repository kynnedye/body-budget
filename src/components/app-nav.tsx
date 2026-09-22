import Link from "next/link";
import { BarChart3, CalendarCheck, Download, History, LogOut, SlidersHorizontal } from "lucide-react";
import { lockApp } from "@/app/actions";
import { gatePassword } from "@/lib/auth";

const links = [
  { href: "/", label: "Today", icon: CalendarCheck },
  { href: "/history", label: "History", icon: History },
  { href: "/trends", label: "Trends", icon: BarChart3 },
  { href: "/trackers", label: "Trackers", icon: SlidersHorizontal },
  { href: "/export", label: "Export", icon: Download },
];

export function AppNav() {
  const showSignOut = Boolean(gatePassword());

  return (
    <nav className="nav-shell" aria-label="Primary navigation">
      <Link className="brand" href="/">
        <span className="brand-mark">B</span>
        <span>
          <strong>Body Budget</strong>
          <small>notice patterns, gently</small>
        </span>
      </Link>
      <div className="nav-end">
        <div className="nav-links">
          {links.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href}>
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </Link>
          ))}
        </div>
        {showSignOut ? (
          <form className="sign-out" action={lockApp}>
            <button className="icon-button" type="submit" aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </form>
        ) : null}
      </div>
    </nav>
  );
}

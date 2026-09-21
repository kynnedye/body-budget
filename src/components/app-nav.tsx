import Link from "next/link";
import { BarChart3, CalendarCheck, Download, SlidersHorizontal } from "lucide-react";

const links = [
  { href: "/", label: "Today", icon: CalendarCheck },
  { href: "/trends", label: "Trends", icon: BarChart3 },
  { href: "/trackers", label: "Trackers", icon: SlidersHorizontal },
  { href: "/export", label: "Export", icon: Download },
];

export function AppNav() {
  return (
    <nav className="nav-shell" aria-label="Primary navigation">
      <Link className="brand" href="/">
        <span className="brand-mark">B</span>
        <span>
          <strong>Body Budget</strong>
          <small>notice patterns, gently</small>
        </span>
      </Link>
      <div className="nav-links">
        {links.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}>
            <Icon size={18} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

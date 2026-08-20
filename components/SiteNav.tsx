"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  CalendarDays,
  Home,
  MessagesSquare,
  Search,
  Settings2,
} from "lucide-react";

const TOP_LINKS = [
  { href: "/quran", label: "Quran", icon: BookOpenText },
  { href: "/khatmah", label: "Khatmah", icon: CalendarDays },
  { href: "/ask", label: "Ask", icon: MessagesSquare },
  { href: "/search", label: "Search", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

const BOTTOM_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/quran", label: "Quran", icon: BookOpenText },
  { href: "/ask", label: "Ask", icon: MessagesSquare },
  { href: "/search", label: "Search", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {TOP_LINKS.map((l) => {
        const active = isActive(l.href, pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-xl px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-forest/10 font-medium text-forest"
                : "text-ink/60 hover:bg-surface hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {BOTTOM_LINKS.map((l) => {
          const active = isActive(l.href, pathname);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-label={l.label}
              className="flex flex-col items-center gap-1 py-2"
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                  active
                    ? "bg-forest/12 text-forest"
                    : "text-ink/40"
                }`}
              >
                <l.icon
                  size={19}
                  strokeWidth={active ? 2.2 : 1.7}
                  className={active ? "scale-in" : ""}
                />
              </span>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-forest" : "text-ink/45"
                }`}
              >
                {l.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Home, MessagesSquare, Search, Settings2 } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/quran", label: "Quran", icon: BookOpenText },
  { href: "/ask", label: "Ask", icon: MessagesSquare },
  { href: "/search", label: "Search", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {LINKS.map((l) => {
          const active =
            l.href === "/"
              ? pathname === "/"
              : pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
                active ? "text-forest" : "text-ink/45"
              }`}
            >
              <l.icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
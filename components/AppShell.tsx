import Link from "next/link";
import { BookOpen, CalendarDays, Search, Settings2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="app-header glass sticky top-0 z-50 border-b border-ink/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white">
              <BookOpen size={18} />
            </span>
            <span className="font-semibold tracking-tight">Digital Quran</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/quran" className="rounded-xl px-3 py-2 text-sm text-ink/65 hover:bg-surface">
              Quran
            </Link>
            <Link href="/khatmah" aria-label="Khatmah planner" className="hidden rounded-xl p-2 text-ink/65 hover:bg-surface sm:block">
              <CalendarDays size={18} />
            </Link>
            <Link href="/search" aria-label="Search" className="rounded-xl p-2 text-ink/65 hover:bg-surface">
              <Search size={18} />
            </Link>
            <Link href="/settings" aria-label="Settings" className="rounded-xl p-2 text-ink/65 hover:bg-surface">
              <Settings2 size={18} />
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      {children}
      <footer className="app-footer border-t border-ink/5 bg-surface/40">
        <div className="mx-auto max-w-7xl px-5 py-10 text-center text-sm text-ink/45 md:px-8">
          Digital Quran · Read · Understand · Listen · Reflect
        </div>
      </footer>
    </>
  );
}
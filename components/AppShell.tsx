import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { TopNav, BottomNav } from "./SiteNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="app-header glass sticky top-0 z-50 border-b border-ink/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="brand-icon hidden h-9 w-9 items-center justify-center rounded-xl text-white shadow-card transition-transform duration-300 group-hover:scale-105 min-[400px]:flex">
              <BookOpen size={18} />
            </span>
            <span className="hidden text-[17px] font-semibold tracking-tight min-[400px]:inline">
              Digital <span className="gradient-text">Quran</span>
            </span>
          </Link>
          <div className="hidden md:block">
            <TopNav />
          </div>
          <ThemeToggle />
        </div>
      </header>
      {children}
      <footer className="app-footer border-t border-ink/5 bg-surface/40">
        <div className="mx-auto max-w-7xl px-5 py-10 text-center text-sm text-ink/45 md:px-8">
          Digital Quran · Read · Understand · Listen · Reflect
        </div>
      </footer>
      <BottomNav />
    </>
  );
}
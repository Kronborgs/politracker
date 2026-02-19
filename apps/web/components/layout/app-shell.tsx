import Link from "next/link";
import { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";
import { appVersion } from "@/lib/config";

export function AppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-sm font-semibold tracking-wide">
            Politracker
          </Link>
          <div className="flex items-center gap-3 text-xs text-foreground/60">
            <span>{appVersion}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 py-6">
        {admin && (
          <aside className="hidden w-60 shrink-0 lg:block">
            <nav className="glass rounded-2xl p-3 text-sm">
              <ul className="space-y-1">
                <li><Link className="block rounded-lg px-3 py-2 hover:bg-muted" href="/admin">Dashboard</Link></li>
                <li><Link className="block rounded-lg px-3 py-2 hover:bg-muted" href="/admin/ingest">Ingest</Link></li>
                <li><Link className="block rounded-lg px-3 py-2 hover:bg-muted" href="/admin/analyze">Analyze</Link></li>
                <li><Link className="block rounded-lg px-3 py-2 hover:bg-muted" href="/admin/politicians">Politicians</Link></li>
                <li><Link className="block rounded-lg px-3 py-2 hover:bg-muted" href="/admin/topics">Topics</Link></li>
                <li><Link className="block rounded-lg px-3 py-2 hover:bg-muted" href="/admin/sources">Sources</Link></li>
                <li><Link className="block rounded-lg px-3 py-2 hover:bg-muted" href="/admin/settings">Settings</Link></li>
              </ul>
            </nav>
          </aside>
        )}
        <main className="w-full">{children}</main>
      </div>
    </div>
  );
}

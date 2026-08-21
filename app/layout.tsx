"use client";

import "./globals.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AnalyticsTracker from "./components/AnalyticsTracker";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/clients", label: "Clients" },
  { href: "/invoices", label: "Invoices" },
  { href: "/billing", label: "Billing" },
  { href: "/company", label: "Company" },
  { href: "/account", label: "Account" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Public pages provide their own focused layout.
  const isPublicPage = pathname === "/" || pathname === "/auth" || pathname?.startsWith("/admin") || pathname?.startsWith("/pay/");

  useEffect(() => {
    // Check auth state
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <html lang="en">
      <head>
        <title>Kuvlo</title>
        <meta
          name="description"
          content="Simple field service operations for independent businesses."
        />
      </head>
      <body className="min-h-screen bg-[#07111f] bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.22),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.2),_transparent_34%)] text-slate-50">
        <AnalyticsTracker />
        {isPublicPage ? (
          pathname === "/auth" ? (
            <div className="flex min-h-screen items-center justify-center">
              <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-sky-900/30 backdrop-blur">
                {children}
              </div>
            </div>
          ) : (
            children
          )
        ) : (
          // App shell with header + content
          <div className="flex min-h-screen flex-col">
            {/* Top bar */}
            <header className="relative z-30 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-sky-400 to-violet-500 shadow-lg shadow-cyan-500/20">
                    <span className="text-sm font-black tracking-tight text-slate-950">
                      K
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-slate-50">
                      Kuvlo
                    </div>
                    <div className="text-[11px] text-cyan-200/80">
                      Your business, in motion.
                    </div>
                  </div>
                </Link>

                <nav className="hidden items-center gap-2 text-xs font-semibold text-white/90 md:flex" aria-label="App navigation">
                  {NAV_LINKS.map((link) => {
                    const active =
                      pathname === link.href ||
                      (link.href !== "/" && pathname?.startsWith(link.href));
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={[
                          "rounded-full px-3 py-1 transition",
                          active
                            ? "bg-gradient-to-r from-cyan-300 to-sky-400 text-slate-950 shadow-sm shadow-cyan-500/30"
                            : "hover:bg-white/10 hover:text-cyan-200",
                        ].join(" ")}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  {!loading && user && (
                    <button
                      onClick={handleLogout}
                      className="rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1 text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                    >
                      Logout
                    </button>
                  )}
                </nav>

                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white md:hidden"
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={mobileMenuOpen}
                  onClick={() => setMobileMenuOpen((current) => !current)}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    {mobileMenuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                  </svg>
                </button>
              </div>

              {mobileMenuOpen ? (
                <nav className="absolute left-3 right-3 top-full mt-2 rounded-2xl border border-white/10 bg-[#0b1729] p-3 shadow-2xl shadow-black/60 md:hidden" aria-label="Mobile app navigation">
                  {NAV_LINKS.map((link) => {
                    const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                    return <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className={active ? "block rounded-xl bg-gradient-to-r from-cyan-300 to-sky-400 px-4 py-3.5 font-bold text-slate-950" : "block rounded-xl px-4 py-3.5 font-semibold text-slate-200 hover:bg-white/5"}>{link.label}</Link>;
                  })}
                  {!loading && user ? <button onClick={handleLogout} className="mt-2 w-full rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3.5 text-left font-semibold text-rose-300">Log out</button> : null}
                </nav>
              ) : null}
            </header>

            {/* Main content */}
            <main className="flex-1">
              <div className="mx-auto max-w-6xl px-2 py-3 sm:px-4 sm:py-6">
                <div className="rounded-xl border border-white/10 bg-[#0b1729]/85 p-2 shadow-xl shadow-black/30 backdrop-blur sm:rounded-2xl sm:p-4">
                  {children}
                </div>
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-[#07111f]/80">
              <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-4 text-[11px] text-slate-400 sm:flex-row sm:justify-between">
                <span>Kuvlo · Simple field service CRM</span>
                <span>v0.1 • Early access</span>
              </div>
            </footer>
          </div>
        )}
      </body>
    </html>
  );
}

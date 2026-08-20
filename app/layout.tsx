"use client";

import "./globals.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/clients", label: "Clients" },
  { href: "/invoices", label: "Invoices" },
  { href: "/company", label: "Company" },
  { href: "/account", label: "Account" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Hide the app chrome on the auth page
  const isAuthPage = pathname === "/auth";

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
      <body className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_#1d4ed8_0,_#020617_55%)] text-slate-50">
        {isAuthPage ? (
          // Auth page: no menu, just center the content
          <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-sky-900/30 backdrop-blur">
              {children}
            </div>
          </div>
        ) : (
          // App shell with header + content
          <div className="flex min-h-screen flex-col">
            {/* Top bar */}
            <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-500/40">
                    <span className="text-xs font-semibold tracking-tight text-sky-300">
                      K
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-slate-50">
                      Kuvlo
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Solo service ops, simplified.
                    </div>
                  </div>
                </div>

                <nav className="flex items-center gap-4 text-xs font-medium text-white/90">
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
                            ? "bg-sky-500 text-slate-900 shadow-sm shadow-sky-500/50"
                            : "hover:bg-slate-800/80 hover:text-slate-50",
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
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1">
              <div className="mx-auto max-w-6xl px-4 py-6">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-xl shadow-black/40 backdrop-blur">
                  {children}
                </div>
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-900/60 bg-slate-950/80">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-[11px] text-slate-400">
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

"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#why-kuvlo", label: "Why Kuvlo" },
];

export default function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-30 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-sky-400 to-violet-500 text-lg font-black text-slate-950 shadow-lg shadow-cyan-500/20">K</span>
          <span className="text-xl font-bold tracking-tight">Kuvlo</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex" aria-label="Public navigation">
          {LINKS.map((link) => <a key={link.href} href={link.href} className="transition hover:text-cyan-300">{link.label}</a>)}
          <Link href="/auth" className="transition hover:text-cyan-300">Sign in</Link>
          <Link href="/auth?mode=signup" className="rounded-full bg-gradient-to-r from-cyan-300 to-sky-400 px-5 py-2.5 font-bold text-slate-950 transition hover:brightness-110">Get started</Link>
        </nav>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open ? (
        <nav className="absolute left-4 right-4 top-full mt-2 rounded-2xl border border-white/10 bg-[#0b1729] p-3 shadow-2xl shadow-black/50 md:hidden" aria-label="Mobile public navigation">
          {LINKS.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3.5 font-semibold text-slate-200 hover:bg-white/5">{link.label}</a>)}
          <Link href="/auth" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3.5 font-semibold text-slate-200 hover:bg-white/5">Sign in</Link>
          <Link href="/auth?mode=signup" onClick={() => setOpen(false)} className="mt-2 block rounded-xl bg-gradient-to-r from-cyan-300 to-sky-400 px-4 py-3.5 text-center font-bold text-slate-950">Get started</Link>
        </nav>
      ) : null}
    </header>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("denied")) setError("This area is restricted to the Kuvlo creator.");
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(null);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.session) { setError(signInError?.message || "Could not sign in."); setLoading(false); return; }
    const access = await fetch("/api/admin/access", { headers: { Authorization: `Bearer ${data.session.access_token}` } });
    const result = await access.json();
    if (!access.ok || !result.creator) {
      await supabase.auth.signOut(); setError("This area is restricted to the Kuvlo creator."); setLoading(false); return;
    }
    router.replace("/admin"); router.refresh();
  }

  return <main className="grid min-h-screen place-items-center bg-[#070b18] px-4 text-white">
    <div className="w-full max-w-md rounded-3xl border border-violet-300/20 bg-[#0b1022] p-7 shadow-2xl shadow-black/50">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-300 to-fuchsia-400 text-xl font-black text-slate-950">K</div>
      <p className="mt-5 text-center text-xs font-black uppercase tracking-[.22em] text-violet-300">Restricted administration</p>
      <h1 className="mt-2 text-center text-2xl font-black">Kuvlo Creator Sign In</h1>
      <p className="mt-2 text-center text-sm text-slate-400">Separate from the customer workspace and available only to the authorized creator account.</p>
      {error ? <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</div> : null}
      <form onSubmit={signIn} className="mt-6 space-y-4">
        <div><label className="text-sm font-semibold text-slate-200">Creator email</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-violet-300" /></div>
        <div><label className="text-sm font-semibold text-slate-200">Password</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-violet-300" /></div>
        <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-violet-300 to-fuchsia-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50">{loading ? "Checking creator access…" : "Enter Creator Console"}</button>
      </form>
      <a href="/" className="mt-5 block text-center text-sm text-slate-500 hover:text-slate-300">Return to Kuvlo</a>
    </div>
  </main>;
}

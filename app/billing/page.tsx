"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type Profile = { plan?: string; subscription_status?: string | null };
type StripeStatus = { connected: boolean; chargesEnabled: boolean; detailsSubmitted: boolean };

export default function BillingPage() {
  const router = useRouter();
  const [notice, setNotice] = useState<{ upgraded: boolean; stripe: string | null }>({ upgraded: false, stripe: null });
  const [profile, setProfile] = useState<Profile>({});
  const [stripe, setStripe] = useState<StripeStatus>({ connected: false, chargesEnabled: false, detailsSubmitted: false });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authorizedFetch = async (url: string, init?: RequestInit) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Please sign in again.");
    return fetch(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${session.access_token}` } });
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setNotice({ upgraded: Boolean(query.get("upgraded")), stripe: query.get("stripe") });
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const { data } = await supabase.from("company_profiles").select("plan,subscription_status").eq("user_id", user.id).maybeSingle();
      setProfile(data || {});
      try {
        const response = await authorizedFetch("/api/stripe/connect");
        if (response.ok) setStripe(await response.json());
      } catch { /* Stripe may not be configured yet. */ }
      setLoading(false);
    }
    load();
  }, [router]);

  async function begin(endpoint: string, name: string) {
    setBusy(name); setError(null);
    try {
      const response = await authorizedFetch(endpoint, { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Could not continue.");
      window.location.href = result.url;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not continue.");
      setBusy(null);
    }
  }

  if (loading) return <div className="p-6 text-slate-200">Loading billing…</div>;
  const pro = profile.plan === "pro";

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Billing & payments</p>
        <h1 className="mt-2 text-3xl font-black text-white">Simple money tools for your business</h1>
        <p className="mt-2 max-w-2xl text-slate-300">Upgrade Kuvlo when you need more than five clients, and connect Stripe so customers can pay invoices online.</p>
      </div>
      {notice.upgraded && <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">Thanks! Your upgrade is being confirmed.</div>}
      {notice.stripe === "return" && <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-cyan-100">Stripe setup returned successfully. Your payment status will update shortly.</div>}
      {error && <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-rose-200">{error}</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-white">Your Kuvlo plan</h2><span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black uppercase text-slate-950">{pro ? "Pro" : "Free"}</span></div>
          <p className="mt-4 text-slate-300">{pro ? "Unlimited clients and full access to Kuvlo." : "Use every core tool with up to 5 clients. No time limit."}</p>
          <button onClick={() => begin(pro ? "/api/billing/portal" : "/api/billing/checkout", "plan")} disabled={busy !== null} className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-sky-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50">{busy === "plan" ? "Opening…" : pro ? "Manage subscription" : "Upgrade to Pro"}</button>
          {profile.subscription_status && <p className="mt-3 text-xs text-slate-400">Subscription status: {profile.subscription_status.replaceAll("_", " ")}</p>}
        </section>
        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-white">Receive invoice payments</h2><span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${stripe.chargesEnabled ? "bg-emerald-300 text-slate-950" : "bg-white/10 text-slate-300"}`}>{stripe.chargesEnabled ? "Ready" : "Setup needed"}</span></div>
          <p className="mt-4 text-slate-300">Connect your business to Stripe. Each invoice email gets a secure Pay Now button, and payments go to your connected account.</p>
          <button onClick={() => begin("/api/stripe/connect", "stripe")} disabled={busy !== null} className="mt-6 w-full rounded-xl border border-violet-300/40 bg-violet-400/15 px-5 py-3 font-bold text-violet-100 disabled:opacity-50">{busy === "stripe" ? "Opening…" : stripe.detailsSubmitted ? "Review Stripe account" : stripe.connected ? "Finish Stripe setup" : "Connect Stripe"}</button>
        </section>
      </div>
      <p className="text-xs text-slate-400">Kuvlo never stores customer card numbers. Stripe securely handles checkout and payment details.</p>
    </div>
  );
}

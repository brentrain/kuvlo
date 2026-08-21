"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type Overview = {
  health: { status: string; failedWebhooks: number; latestWebhook: string | null; stripeConfigured: boolean; subscriptionsConfigured: boolean; emailConfigured: boolean };
  users: { total: number; businesses: number; pro: number; paymentReady: number };
  payments: { paidWeekCents: number; paidMonthCents: number; paidAllCents: number; outstandingCents: number; paidInvoices: number; openInvoices: number };
  analytics: { available: boolean; totalViews: number; uniqueVisitors: number; viewsToday: number; viewsWeek: number; viewsMonth: number; uniqueToday: number; uniqueMonth: number; signupConversionPercent: number; topPages: { name: string; count: number }[]; devices: { name: string; count: number }[]; referrers: { name: string; count: number }[] };
  recentWebhooks: { provider: string; event_name: string; received_at: string; processed_at: string | null }[];
  generatedAt: string;
};

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/admin/login"); return; }
      const response = await fetch("/api/admin/overview", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json();
      if (response.status === 401 || response.status === 403) {
        await supabase.auth.signOut();
        router.replace("/admin/login?denied=1");
        return;
      }
      if (!response.ok) { setError(result.error || "Creator dashboard unavailable"); return; }
      setData(result);
    }
    load();
  }, [router]);

  if (error) return <main className="min-h-screen bg-[#070b18] p-6"><h1 className="text-2xl font-bold text-white">Kuvlo Creator Console</h1><div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-rose-200">{error}</div></main>;
  if (!data) return <main className="min-h-screen bg-[#070b18] p-6 text-slate-300">Loading Kuvlo Creator Console…</main>;
  const cards = [
    ["Total users", data.users.total], ["Businesses", data.users.businesses], ["Pro subscribers", data.users.pro], ["Ready for payments", data.users.paymentReady],
    ["Paid this week", money(data.payments.paidWeekCents)], ["Paid this month", money(data.payments.paidMonthCents)], ["All payments", money(data.payments.paidAllCents)], ["Outstanding", money(data.payments.outstandingCents)],
  ];
  return <main className="min-h-screen bg-[#070b18] text-white">
    <header className="border-b border-violet-300/15 bg-[#0b1022]"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4"><div><p className="text-xs font-black uppercase tracking-[.22em] text-violet-300">Kuvlo Administration</p><p className="mt-1 font-bold text-white">Creator Console</p></div><div className="flex items-center gap-2"><a href="/dashboard" className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5">Open customer app</a><button onClick={signOut} className="rounded-lg border border-rose-300/25 px-3 py-2 text-sm text-rose-200 hover:bg-rose-400/10">Sign out</button></div></div></header>
    <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-7">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-violet-300">Kuvlo creator</p><h1 className="mt-2 text-3xl font-black text-white">Platform health</h1><p className="mt-1 text-slate-300">Users, subscriptions, payments, and backend activity in one private view.</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-black uppercase ${data.health.status === "healthy" ? "bg-emerald-300 text-slate-950" : "bg-amber-300 text-slate-950"}`}>{data.health.status}</span></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-slate-900/80 p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-white">{value}</p></div>)}</div>
    <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold text-white">Website analytics</h2><p className="mt-1 text-sm text-slate-400">Privacy-conscious traffic totals. Creator and admin pages are excluded.</p></div><span className="text-xs font-semibold text-slate-400">Anonymous visitors</span></div>{data.analytics.available ? <><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Views today",data.analytics.viewsToday],["Unique today",data.analytics.uniqueToday],["Views this week",data.analytics.viewsWeek],["Views this month",data.analytics.viewsMonth],["Unique this month",data.analytics.uniqueMonth],["All recorded views",data.analytics.totalViews],["All unique visitors",data.analytics.uniqueVisitors],["Visitor to signup",`${data.analytics.signupConversionPercent}%`]].map(([label,value]) => <div key={String(label)} className="rounded-xl bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>)}</div><div className="mt-4 grid gap-4 lg:grid-cols-3">{[["Top pages",data.analytics.topPages],["Devices",data.analytics.devices],["Referrals",data.analytics.referrers]].map(([title,items]) => <div key={String(title)} className="rounded-xl border border-white/10 bg-white/[.03] p-4"><h3 className="font-bold text-white">{String(title)}</h3><div className="mt-3 space-y-2">{(items as {name:string;count:number}[]).length ? (items as {name:string;count:number}[]).map((item) => <div key={item.name} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-slate-300">{item.name}</span><span className="font-bold text-white">{item.count}</span></div>) : <p className="text-sm text-slate-500">No visits recorded yet.</p>}</div></div>)}</div></> : <p className="mt-4 rounded-xl bg-amber-300/10 p-4 text-sm text-amber-200">Analytics database setup is still required.</p>}</section>
    <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5"><h2 className="text-xl font-bold text-white">Connections</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{[["Stripe payments",data.health.stripeConfigured],["Kuvlo subscriptions",data.health.subscriptionsConfigured],["Invoice email",data.health.emailConfigured]].map(([name,ready]) => <div key={String(name)} className="rounded-xl bg-white/5 p-4"><p className="font-semibold text-white">{name}</p><p className={`mt-1 text-sm ${ready ? "text-emerald-300" : "text-amber-200"}`}>{ready ? "Connected" : "Setup required"}</p></div>)}</div></section>
    <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-white">Recent backend activity</h2><span className="text-xs text-slate-400">{data.health.failedWebhooks} need attention</span></div><div className="mt-4 space-y-2">{data.recentWebhooks.length ? data.recentWebhooks.map((event,index) => <div key={`${event.provider}-${event.received_at}-${index}`} className="flex flex-col gap-1 rounded-xl bg-white/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="font-semibold text-white">{event.provider}: {event.event_name}</span><span className={event.processed_at ? "text-emerald-300" : "text-amber-200"}>{event.processed_at ? "Processed" : "Needs attention"} · {new Date(event.received_at).toLocaleString()}</span></div>) : <p className="text-slate-400">No payment or subscription events yet.</p>}</div></section>
    <p className="text-xs text-slate-500">Updated {new Date(data.generatedAt).toLocaleString()}. Vercel remains the detailed source for deployment logs and performance.</p>
    </div>
  </main>;
}

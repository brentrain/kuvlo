"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type InvoiceData = {
  invoice: { invoiceNumber: string; issueDate: string; dueDate: string; totalCents: number; status: string; notes?: string | null };
  client: { name: string };
  company: { name: string; email?: string | null };
  items: { description: string; quantity: number; unit_price_cents: number }[];
  canPay: boolean;
};

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const date = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default function PayInvoicePage() {
  const { token } = useParams<{ token: string }>();
  const [paymentResult, setPaymentResult] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  useEffect(() => {
    setPaymentResult(new URLSearchParams(window.location.search).get("payment"));
    fetch(`/api/payments/${token}`).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Invoice unavailable");
      setData(result);
    }).catch(cause => setError(cause.message));
  }, [token]);
  async function pay() {
    setPaying(true); setError(null);
    try {
      const response = await fetch(`/api/payments/${token}`, { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Could not start payment");
      window.location.href = result.url;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start payment"); setPaying(false); }
  }
  return <main className="min-h-screen bg-[#07111f] px-4 py-8 text-white">
    <div className="mx-auto max-w-2xl">
      <a href="/" className="inline-flex items-center gap-2 font-bold text-cyan-300"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-violet-500 text-slate-950">K</span>Kuvlo</a>
      {paymentResult === "success" && <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">Payment received. Thank you!</div>}
      {paymentResult === "cancelled" && <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">Payment was cancelled. You can try again whenever you’re ready.</div>}
      {error && <div className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-rose-200">{error}</div>}
      {!data && !error && <div className="mt-8 text-slate-300">Loading invoice…</div>}
      {data && <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#0b1729] shadow-2xl shadow-black/40">
        <div className="bg-gradient-to-r from-cyan-300 to-violet-400 p-6 text-slate-950"><p className="text-sm font-bold uppercase tracking-wider">Invoice from</p><h1 className="mt-1 text-3xl font-black">{data.company.name}</h1></div>
        <div className="space-y-6 p-5 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wider text-slate-400">Bill to</p><p className="mt-1 font-bold">{data.client.name}</p></div><div className="sm:text-right"><p className="text-xs uppercase tracking-wider text-slate-400">Invoice</p><p className="mt-1 font-bold">#{data.invoice.invoiceNumber}</p></div></div>
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/5 p-4 text-sm"><div><span className="text-slate-400">Issued</span><br />{date(data.invoice.issueDate)}</div><div><span className="text-slate-400">Due</span><br />{date(data.invoice.dueDate)}</div></div>
          <div className="divide-y divide-white/10">{data.items.map((item, index) => <div key={index} className="flex justify-between gap-4 py-3"><div><p className="font-semibold">{item.description}</p><p className="text-sm text-slate-400">{item.quantity} × {money(item.unit_price_cents)}</p></div><p className="font-bold">{money(item.quantity * item.unit_price_cents)}</p></div>)}</div>
          <div className="flex items-end justify-between border-t-2 border-white/10 pt-5"><span className="text-slate-300">Total due</span><span className="text-3xl font-black text-cyan-300">{money(data.invoice.totalCents)}</span></div>
          {data.invoice.notes && <div className="rounded-xl bg-white/5 p-4 text-sm text-slate-300"><strong className="text-white">Notes:</strong> {data.invoice.notes}</div>}
          {data.invoice.status === "paid" ? <div className="rounded-xl bg-emerald-400/15 p-4 text-center font-bold text-emerald-200">Paid in full</div> : data.canPay ? <button onClick={pay} disabled={paying} className="w-full rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-4 text-lg font-black text-slate-950 disabled:opacity-50">{paying ? "Opening secure checkout…" : `Pay ${money(data.invoice.totalCents)} securely`}</button> : <div className="rounded-xl bg-amber-400/10 p-4 text-center text-amber-100">Online payment is not yet available. Contact {data.company.email || data.company.name} to arrange payment.</div>}
        </div>
      </section>}
      <p className="mt-5 text-center text-xs text-slate-500">Secure invoice experience powered by Kuvlo</p>
    </div>
  </main>;
}

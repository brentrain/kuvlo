import Link from "next/link";
import LandingHeader from "./components/LandingHeader";

const FEATURES = [
  {
    visual: "schedule",
    eyebrow: "Scheduling",
    title: "Know where the work is",
    description: "Plan upcoming jobs, track their status, and keep your day moving without juggling calendars and notes.",
  },
  {
    visual: "contacts",
    eyebrow: "Contacts",
    title: "Keep every customer close",
    description: "Store names, phone numbers, addresses, and job details together, ready whenever you need them in the field.",
  },
  {
    visual: "invoice",
    eyebrow: "Invoicing",
    title: "Send an invoice with a Pay Now button",
    description: "Create a professional invoice and give customers a direct way to pay through your preferred payment provider.",
  },
  {
    visual: "billing",
    eyebrow: "Payments",
    title: "Make it easier for customers to pay",
    description: "Connect a Stripe, PayPal, Venmo, or Lemon Squeezy payment link and move from completed work to payment with fewer steps.",
  },
];

function FeaturePreview({ type }: { type: string }) {
  if (type === "schedule") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400"><span>Today&apos;s schedule</span><span>3 jobs</span></div>
        {[
          ["8:30", "HVAC maintenance", "Confirmed"],
          ["11:00", "Kitchen repair", "In progress"],
          ["2:30", "Estimate visit", "Scheduled"],
        ].map(([time, job, status], index) => (
          <div key={job} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-slate-950/80 p-3 text-xs">
            <span className="font-semibold text-sky-300">{time}</span><span className="text-slate-200">{job}</span>
            <span className={index === 1 ? "text-amber-300" : "text-emerald-300"}>{status}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "contacts") {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-white/10 bg-slate-950/80 p-4">
          <div className="flex items-start justify-between">
            <div><p className="font-semibold text-white">Jordan&apos;s Coffee</p><p className="mt-1 text-xs text-slate-400">Primary contact · Jordan Lee</p></div>
            <span className="rounded-full bg-sky-400/15 px-2 py-1 text-[10px] font-bold text-sky-300">CUSTOMER</span>
          </div>
          <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
            <p>☎ (555) 014-2280</p><p>✉ jordan@example.com</p><p className="sm:col-span-2">⌖ 225 Market Street, Raleigh, NC</p>
          </div>
        </div>
        <div className="flex gap-2"><span className="rounded-md bg-sky-400 px-3 py-2 text-[11px] font-bold text-slate-950">Schedule job</span><span className="rounded-md border border-white/10 px-3 py-2 text-[11px] text-slate-300">View history</span></div>
      </div>
    );
  }

  if (type === "invoice") {
    return (
      <div className="rounded-lg border border-white/10 bg-slate-950/80 p-4 text-xs">
        <div className="flex justify-between border-b border-white/10 pb-3"><div><p className="text-base font-bold text-white">INVOICE</p><p className="text-slate-500">#INV-1042</p></div><div className="text-right"><p className="text-slate-400">Amount due</p><p className="text-lg font-bold text-white">$485.00</p></div></div>
        <div className="grid grid-cols-[1fr_auto] gap-y-3 py-4 text-slate-300"><span>Service call</span><span>$125.00</span><span>Parts &amp; installation</span><span>$360.00</span></div>
        <div className="flex items-center justify-between border-t border-white/10 pt-3"><span className="rounded-full bg-emerald-400/15 px-2 py-1 font-bold text-emerald-300">READY TO PAY</span><span className="rounded-md bg-gradient-to-r from-cyan-300 to-sky-400 px-3 py-2 font-bold text-slate-950">Pay now</span></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["Outstanding", "$1,240"], ["Paid", "$3,860"], ["This month", "$5,100"]].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-slate-950/80 p-3"><p className="text-[10px] text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-white">{value}</p></div>
        ))}
      </div>
      <div className="rounded-lg border border-white/10 bg-slate-950/80 p-4">
        <div className="mb-3 flex items-end justify-between text-xs"><span className="text-slate-400">Monthly revenue</span><span className="font-semibold text-emerald-300">+18%</span></div>
        <div className="flex h-20 items-end gap-2">{[35, 52, 44, 68, 57, 82, 72, 94].map((height, index) => <span key={index} className="flex-1 rounded-t bg-sky-400/80" style={{ height: `${height}%` }} />)}</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <LandingHeader />

      <main>
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.28),_transparent_45%),radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.3),_transparent_38%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 sm:mb-5 sm:text-sm">Built for independent service businesses and solopreneurs</p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">Schedule jobs, manage customers, <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-transparent">send invoices, and get paid.</span></h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Kuvlo helps independent service professionals run their business from the field—all in one place, without spreadsheets, paperwork, or complicated software.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth?mode=signup" className="w-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-400 px-7 py-4 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:brightness-110 sm:w-auto">
                Start organizing your business
              </Link>
              <Link href="/auth" className="w-full rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold transition hover:bg-white/10 sm:w-auto">
                I already have an account
              </Link>
            </div>
            <div className="mx-auto mt-10 grid max-w-3xl gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm font-semibold text-slate-200 backdrop-blur sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center sm:p-4">
              <span className="rounded-xl bg-white/5 px-3 py-3">Send the invoice</span>
              <span className="hidden text-cyan-300 sm:block">→</span>
              <span className="rounded-xl bg-white/5 px-3 py-3">Customer taps Pay Now</span>
              <span className="hidden text-cyan-300 sm:block">→</span>
              <span className="rounded-xl bg-emerald-400/10 px-3 py-3 text-emerald-300">Receive payment</span>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 border-y border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">One simple workspace</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to run the day</h2>
              <p className="mt-4 text-lg leading-8 text-slate-400">
                No scattered spreadsheets, paper notes, or disconnected tools. Kuvlo keeps the essentials of your service business together and easy to reach.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-white/10 bg-[#0b1729]/90 p-4 shadow-xl shadow-black/20 sm:p-7">
                <div className="mb-6 rounded-xl border border-white/10 bg-slate-900 p-4 shadow-2xl shadow-black/20">
                  <div className="mb-4 flex gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400/70" /><span className="h-2 w-2 rounded-full bg-amber-400/70" /><span className="h-2 w-2 rounded-full bg-emerald-400/70" /></div>
                  <FeaturePreview type={feature.visual} />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{feature.eyebrow}</p>
                <h3 className="mt-3 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-400">{feature.description}</p>
              </article>
            ))}
            </div>
          </div>
        </section>

        <section id="why-kuvlo" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Made for the way you work</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Less time running software. More time running your business.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                Kuvlo is designed for one-person and independent service businesses that need useful tools without a complicated system to manage.
              </p>
            </div>
            <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/20 to-cyan-400/10 p-6 sm:p-8">
              <p className="text-2xl font-semibold leading-9">Schedule the job. Keep the contact. Send the invoice. Give customers a simple way to pay.</p>
              <p className="mt-5 text-cyan-200">One place, from first call to received payment.</p>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-cyan-300 via-sky-400 to-violet-500 px-5 py-10 text-slate-950 shadow-2xl shadow-cyan-500/20 sm:px-8 sm:py-12">
            <h2 className="text-3xl font-bold tracking-tight">Ready to put the busywork in one place?</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-800">Start organizing your customers, schedule, invoices, and billing with Kuvlo.</p>
            <Link href="/auth?mode=signup" className="mt-8 inline-flex rounded-full bg-slate-950 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800">
              Create your account
            </Link>
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Kuvlo. Simple field service operations.
      </footer>
    </div>
  );
}

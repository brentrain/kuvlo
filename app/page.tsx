import Link from "next/link";

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
    title: "Turn finished work into invoices",
    description: "Create clear, professional invoices from the same place you manage the job and the customer.",
  },
  {
    visual: "billing",
    eyebrow: "Billing",
    title: "Stay on top of what you earn",
    description: "Keep billing organized so completed work does not get lost and your business keeps moving forward.",
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
        <div className="flex items-center justify-between border-t border-white/10 pt-3"><span className="rounded-full bg-amber-400/15 px-2 py-1 font-bold text-amber-300">DRAFT</span><span className="rounded-md bg-sky-400 px-3 py-2 font-bold text-slate-950">Send invoice</span></div>
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
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-lg font-bold text-slate-950">K</span>
            <span className="text-xl font-semibold tracking-tight">Kuvlo</span>
          </Link>
          <Link href="/auth" className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold transition hover:border-sky-400 hover:text-sky-300">
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 py-24 sm:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.28),_transparent_55%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Built for independent service businesses and solopreneurs</p>
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">Schedule jobs, manage customers, send invoices, and track payments.</h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Kuvlo helps independent service professionals run their business from the field—all in one place, without spreadsheets, paperwork, or complicated software.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth?mode=signup" className="w-full rounded-full bg-sky-400 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:bg-sky-300 sm:w-auto">
                Start organizing your business
              </Link>
              <Link href="/auth" className="w-full rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold transition hover:bg-white/10 sm:w-auto">
                I already have an account
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.03] px-6 py-20">
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
              <article key={feature.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-7">
                <div className="mb-6 rounded-xl border border-white/10 bg-slate-900 p-4 shadow-2xl shadow-black/20">
                  <div className="mb-4 flex gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400/70" /><span className="h-2 w-2 rounded-full bg-amber-400/70" /><span className="h-2 w-2 rounded-full bg-emerald-400/70" /></div>
                  <FeaturePreview type={feature.visual} />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">{feature.eyebrow}</p>
                <h3 className="mt-3 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-400">{feature.description}</p>
              </article>
            ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Made for the way you work</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Less time running software. More time running your business.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                Kuvlo is designed for one-person and independent service businesses that need useful tools without a complicated system to manage.
              </p>
            </div>
            <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-8">
              <p className="text-2xl font-semibold leading-9">Schedule the job. Keep the contact. Send the invoice. Track the billing.</p>
              <p className="mt-5 text-sky-200">One place, from first call to final payment.</p>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl rounded-3xl bg-sky-400 px-8 py-12 text-slate-950">
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

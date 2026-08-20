import Link from "next/link";

const FEATURES = [
  {
    title: "Keep every job organized",
    description: "Schedule work, track status, and see what is coming next at a glance.",
  },
  {
    title: "Know your customers",
    description: "Keep client details, addresses, and job history together in one simple place.",
  },
  {
    title: "Invoice with confidence",
    description: "Create professional invoices and stay on top of the money you have earned.",
  },
];

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
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">Built for independent service businesses</p>
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">Run your field business without the busywork.</h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Kuvlo brings your clients, jobs, and invoices into one focused workspace—so you can spend less time managing and more time getting the work done.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth?mode=signup" className="w-full rounded-full bg-sky-400 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:bg-sky-300 sm:w-auto">
                Get started
              </Link>
              <Link href="/auth" className="w-full rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold transition hover:bg-white/10 sm:w-auto">
                I already have an account
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.03] px-6 py-20">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-7">
                <div className="mb-5 h-1 w-12 rounded-full bg-sky-400" />
                <h2 className="text-xl font-semibold">{feature.title}</h2>
                <p className="mt-3 leading-7 text-slate-400">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Kuvlo. Simple field service operations.
      </footer>
    </div>
  );
}

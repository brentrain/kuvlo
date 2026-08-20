"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type Job = {
  id: string;
  scheduled_at: string;
  price_cents: number | null;
  status: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [jobsToday, setJobsToday] = useState<Job[]>([]);
  const [jobsThisWeek, setJobsThisWeek] = useState<Job[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      // Check authentication first
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      setAuthChecking(false);
      setLoading(true);

      const now = new Date();

      // Today range
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const endOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

      // Start of week (Sunday as 0)
      const startOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay()
      );

      // Next 7 days
      const nextWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 7
      );

      // Jobs today
      const { data: todayData } = await supabase
        .from("jobs")
        .select("id, scheduled_at, price_cents, status")
        .gte("scheduled_at", startOfToday.toISOString())
        .lt("scheduled_at", endOfToday.toISOString());

      // Jobs this week
      const { data: weekData } = await supabase
        .from("jobs")
        .select("id, scheduled_at, price_cents, status")
        .gte("scheduled_at", startOfWeek.toISOString())
        .lt("scheduled_at", endOfToday.toISOString());

      // Upcoming jobs (next 7 days)
      const { data: upcomingData } = await supabase
        .from("jobs")
        .select("id, scheduled_at, price_cents, status")
        .gte("scheduled_at", now.toISOString())
        .lt("scheduled_at", nextWeek.toISOString())
        .order("scheduled_at", { ascending: true });

      setJobsToday(todayData || []);
      setJobsThisWeek(weekData || []);
      setUpcomingJobs(upcomingData || []);
      setLoading(false);
    };

    loadStats();
  }, [router]);

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-white">Checking authentication…</p>
      </div>
    );
  }

  const sumRevenue = (jobs: Job[]) =>
    jobs.reduce(
      (total, job) => total + (job.price_cents ?? 0),
      0
    ) / 100;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/80">
          Quick view of your work and revenue.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-slate-800/90 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase text-white/70">
            Jobs Today
          </p>
          <p className="mt-2 text-4xl font-bold text-white">
            {loading ? "…" : jobsToday.length}
          </p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/90 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase text-white/70">
            This Week&apos;s Revenue
          </p>
          <p className="mt-2 text-4xl font-bold text-white">
            {loading ? "…" : `$${sumRevenue(jobsThisWeek).toFixed(2)}`}
          </p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/90 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase text-white/70">
            Upcoming (7 days)
          </p>
          <p className="mt-2 text-4xl font-bold text-white">
            {loading ? "…" : upcomingJobs.length}
          </p>
        </div>
      </div>

      {/* Optional: list of upcoming jobs */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/90 p-4 shadow-sm backdrop-blur">
        <h2 className="text-lg font-semibold text-white">Next jobs</h2>
        {loading ? (
          <p className="mt-2 text-sm text-white/80">Loading…</p>
        ) : upcomingJobs.length === 0 ? (
          <p className="mt-2 text-sm text-white/80">
            No upcoming jobs scheduled.
          </p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-white">
            {upcomingJobs.slice(0, 5).map((job) => (
              <li key={job.id}>
                {new Date(job.scheduled_at).toLocaleString()}{" "}
                <span className="ml-1 text-xs uppercase text-white/70">
                  ({job.status})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

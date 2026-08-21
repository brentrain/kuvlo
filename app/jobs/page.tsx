"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { exportToExcel } from "../lib/exportToExcel";

type Client = {
  id: string;
  name: string;
};

type Job = {
  id: string;
  client_id: string;
  scheduled_at: string;
  price_cents: number | null;
  status: string;
  notes: string | null;
};

type Filter = "all" | "today" | "scheduled" | "completed" | "cancelled";

export default function JobsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  // Form fields
  const [clientId, setClientId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // For update/delete UI feedback
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<Filter>("all");

  // Load clients + jobs
  useEffect(() => {
    const load = async () => {
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
      setError(null);

      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");

      if (clientsError) {
        console.error(clientsError);
        setError(clientsError.message);
      }

      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .order("scheduled_at", { ascending: true });

      if (jobsError) {
        console.error(jobsError);
        setError(jobsError.message);
      }

      setClients(clientsData || []);
      setJobs(jobsData || []);
      setLoading(false);
    };

    load();
  }, [router]);

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-white">Checking authentication…</p>
      </div>
    );
  }

  // Add a job (Create)
  const handleAddJob = async (e: FormEvent) => {
    e.preventDefault();

    if (!clientId || !startTime) {
      setError("Client and start time are required.");
      return;
    }

    setAdding(true);
    setError(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("Your session expired. Please sign in again.");
      setAdding(false);
      return;
    }

    const price_cents = price ? Math.round(parseFloat(price) * 100) : null;

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        user_id: user.id,
        client_id: clientId,
        scheduled_at: startTime,
        price_cents,
        status,
        notes: notes || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error(error);
      setError(error.message);
      setAdding(false);
      return;
    }

    if (data) {
      setJobs((prev) => [...prev, data]);
      // Clear form
      setClientId("");
      setStartTime("");
      setPrice("");
      setStatus("scheduled");
      setNotes("");
    }

    setAdding(false);
  };

  // Update job status (Update)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setError(null);
    setUpdatingId(id);

    const { error } = await supabase
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error(error);
      setError(error.message);
      setUpdatingId(null);
      return;
    }

    // Update local state
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: newStatus } : job
      )
    );

    setUpdatingId(null);
  };

  // Delete job (Delete)
  const handleDeleteJob = async (id: string) => {
    setError(null);
    setDeletingId(id);

    const { error } = await supabase.from("jobs").delete().eq("id", id);

    if (error) {
      console.error(error);
      setError(error.message);
      setDeletingId(null);
      return;
    }

    // Remove from local state
    setJobs((prev) => prev.filter((job) => job.id !== id));
    setDeletingId(null);
  };

  const formatPrice = (cents: number | null) =>
    cents != null ? `$${(cents / 100).toFixed(2)}` : "-";

  // Helper: is job on "today"
  const isJobToday = (job: Job) => {
    const d = new Date(job.scheduled_at);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  // Derived filtered list
  const filteredJobs = jobs.filter((job) => {
    if (filter === "all") return true;
    if (filter === "today") return isJobToday(job);
    return job.status === filter;
  });

  // Quick counts for filter labels
  const countToday = jobs.filter(isJobToday).length;
  const countScheduled = jobs.filter((j) => j.status === "scheduled").length;
  const countCompleted = jobs.filter((j) => j.status === "completed").length;
  const countCancelled = jobs.filter((j) => j.status === "cancelled").length;

  const filterButtonClass = (value: Filter) =>
    [
      "rounded-full border px-3 py-1 text-xs font-medium",
      filter === value
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-slate-700 text-white border-slate-600 hover:bg-slate-600",
    ].join(" ");

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Jobs</h1>
          <p className="mt-1 text-sm text-white/80">
            Schedule, update, and manage your field jobs.
          </p>
        </div>
        {jobs.length > 0 && (
          <button
            onClick={() => {
              const exportData = filteredJobs.map((job) => {
                const client = clients.find((c) => c.id === job.client_id);
                return {
                  "Job ID": job.id,
                  Client: client?.name || "Unknown",
                  "Scheduled Date": new Date(job.scheduled_at).toLocaleDateString(),
                  "Scheduled Time": new Date(job.scheduled_at).toLocaleTimeString(),
                  Price: job.price_cents ? `$${(job.price_cents / 100).toFixed(2)}` : "",
                  Status: job.status,
                  Notes: job.notes || "",
                };
              });
              exportToExcel(exportData, "jobs", "Jobs");
            }}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Export to Excel
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-300/50 bg-red-500/20 p-3 text-xs text-white">
          {error}
        </div>
      )}

      {/* Add Job Form */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/90 p-4 shadow-sm backdrop-blur">
        <h2 className="text-sm font-semibold text-white">Add New Job</h2>

        <form
          onSubmit={handleAddJob}
          className="mt-4 grid gap-3 md:grid-cols-2"
        >
          {/* Client select */}
          <div>
            <label className="block text-xs font-medium text-white/80">
              Client *
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white backdrop-blur"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="" className="bg-slate-800 text-white">Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-800 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start time */}
          <div>
            <label className="block text-xs font-medium text-white/80">
              Start Time *
            </label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white placeholder:text-white/50 backdrop-blur"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-white/80">
              Price ($)
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white placeholder:text-white/50 backdrop-blur"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="100"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-white/80">
              Status
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white backdrop-blur"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="scheduled" className="bg-slate-800 text-white">Scheduled</option>
              <option value="completed" className="bg-slate-800 text-white">Completed</option>
              <option value="cancelled" className="bg-slate-800 text-white">Cancelled</option>
            </select>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-white/80">
              Notes
            </label>
            <textarea
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white placeholder:text-white/50 backdrop-blur"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={adding}
              className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add Job"}
            </button>
          </div>
        </form>
      </div>

      {/* Filters + Job List */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/90 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-white">All Jobs</h2>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={filterButtonClass("all")}
              onClick={() => setFilter("all")}
            >
              All ({jobs.length})
            </button>
            <button
              type="button"
              className={filterButtonClass("today")}
              onClick={() => setFilter("today")}
            >
              Today ({countToday})
            </button>
            <button
              type="button"
              className={filterButtonClass("scheduled")}
              onClick={() => setFilter("scheduled")}
            >
              Scheduled ({countScheduled})
            </button>
            <button
              type="button"
              className={filterButtonClass("completed")}
              onClick={() => setFilter("completed")}
            >
              Completed ({countCompleted})
            </button>
            <button
              type="button"
              className={filterButtonClass("cancelled")}
              onClick={() => setFilter("cancelled")}
            >
              Cancelled ({countCancelled})
            </button>
          </div>
        </div>

        {loading ? (
          <p className="mt-3 text-sm text-white/80">Loading jobs…</p>
        ) : filteredJobs.length === 0 ? (
          <p className="mt-3 text-sm text-white/80">
            No jobs match this filter.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-white/10">
            {filteredJobs.map((job) => {
              const clientName =
                clients.find((c) => c.id === job.client_id)?.name || "Unknown";

              return (
                <div
                  key={job.id}
                  className="flex flex-col justify-between gap-2 py-2 text-sm md:flex-row md:items-center"
                >
                  <div>
                    <p className="font-medium text-white">
                      {clientName}
                    </p>
                    <p className="text-xs text-white/80">
                      {new Date(job.scheduled_at).toLocaleString()}
                    </p>
                    {job.notes && (
                      <p className="text-xs text-white/70">{job.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 text-xs text-white/80">
                    <p>{formatPrice(job.price_cents)}</p>

                    <div className="flex items-center gap-2">
                      <select
                        className="rounded border border-slate-600 bg-slate-700 px-1.5 py-1 text-[11px] text-white backdrop-blur"
                        value={job.status}
                        onChange={(e) =>
                          handleUpdateStatus(job.id, e.target.value)
                        }
                        disabled={updatingId === job.id}
                      >
                        <option value="scheduled" className="bg-slate-800 text-white">Scheduled</option>
                        <option value="completed" className="bg-slate-800 text-white">Completed</option>
                        <option value="cancelled" className="bg-slate-800 text-white">Cancelled</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job.id)}
                        disabled={deletingId === job.id}
                        className="rounded border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === job.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

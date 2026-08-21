"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { exportToExcel } from "../lib/exportToExcel";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  created_at?: string;
};

const FREE_CLIENT_LIMIT = 5;

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const freeLimitReached = clients.length >= FREE_CLIENT_LIMIT;

  // form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCity("");
    setState("");
    setZipCode("");
    setEditingId(null);
    setEditing(false);
  };

  useEffect(() => {
    const fetchClients = async () => {
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

      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*"); // no order() so we don't depend on created_at

      if (error) {
        console.error("Supabase error loading clients:", error);
        
        // Provide more helpful error messages
        if (
          error.message?.includes("relation") ||
          error.message?.includes("does not exist") ||
          error.message?.includes("schema cache") ||
          error.code === "42P01"
        ) {
          setError(
            "❌ CLIENTS TABLE NOT FOUND\n\n" +
            "The database table doesn't exist. To fix this:\n\n" +
            "1. Go to Supabase Dashboard → SQL Editor\n" +
            "2. Open 'FIX_CLIENTS_TABLE.sql' from this project\n" +
            "3. Copy the entire script and paste into SQL Editor\n" +
            "4. Click 'Run'\n" +
            "5. Wait 10 seconds, then refresh this page"
          );
          setClients([]);
        } else if (
          error.message?.includes("permission") ||
          error.message?.includes("row-level security") ||
          error.message?.includes("RLS") ||
          error.code === "42501"
        ) {
          setError(
            "❌ PERMISSION DENIED\n\n" +
            "Row Level Security is blocking access. To fix:\n\n" +
            "1. Go to Supabase Dashboard → SQL Editor\n" +
            "2. Run 'FIX_CLIENTS_TABLE.sql'\n" +
            "3. This will set up the correct permissions"
          );
          setClients([]);
        } else {
          setError(
            "❌ ERROR: " + (error.message || "Failed to load clients.") + "\n\n" +
            "Check the browser console (F12) for details."
          );
          setClients([]);
        }
        } else {
          setClients(data || []);
        }
      } catch (err: any) {
        console.error("Unexpected error loading clients:", err);
        setError("Unexpected error loading clients.");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [router]);

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-white">Checking authentication…</p>
      </div>
    );
  }

  const handleEditClient = (client: Client) => {
    setName(client.name);
    setPhone(client.phone || "");
    setEmail(client.email || "");
    setAddress(client.address || "");
    setCity(client.city || "");
    setState(client.state || "");
    setZipCode(client.zip_code || "");
    setEditingId(client.id);
    setEditing(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddClient = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setAdding(true);
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/auth");
        return;
      }

      const clientData = {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip_code: zipCode.trim() || null,
      };

      let data, error;
      
      if (editingId) {
        // Update existing client
        ({ data, error } = await supabase
          .from("clients")
          .update(clientData)
          .eq("id", editingId)
          .select("*")
          .single());
      } else {
        // Insert new client
        ({ data, error } = await supabase
          .from("clients")
          .insert({ ...clientData, user_id: user.id })
          .select("*")
          .single());
      }

      if (error) {
        console.error("Supabase error adding client:", error);

        // Provide more helpful error messages
        if (error.message?.includes("FREE_PLAN_CLIENT_LIMIT")) {
          setError(
            "FREE PLAN LIMIT REACHED\n\n" +
            "Your free plan includes up to 5 clients. Upgrade to add more clients while keeping everything you have already created."
          );
        } else if (
          error.message?.includes("relation") ||
          error.message?.includes("does not exist") ||
          error.message?.includes("schema cache") ||
          error.code === "42P01"
        ) {
          setError(
            "❌ CLIENTS TABLE NOT FOUND\n\n" +
            "The database table doesn't exist. To fix:\n\n" +
            "1. Go to Supabase Dashboard → SQL Editor\n" +
            "2. Open 'FIX_CLIENTS_TABLE.sql' from this project\n" +
            "3. Copy the entire script and paste into SQL Editor\n" +
            "4. Click 'Run'\n" +
            "5. Wait 10 seconds, then try again"
          );
        } else if (
          error.message?.includes("permission") ||
          error.message?.includes("row-level security") ||
          error.message?.includes("RLS") ||
          error.code === "42501"
        ) {
          setError(
            "❌ PERMISSION DENIED\n\n" +
            "Your session does not have permission to add this client. " +
            "Please sign out, sign back in, and try again."
          );
        } else if (error.message?.includes("violates foreign key")) {
          setError(
            "❌ DATABASE ERROR\n\n" +
            "Database constraint error. Please check that all required tables exist.\n\n" +
            "Run 'COMPLETE_DATABASE_SETUP.sql' in Supabase SQL Editor."
          );
        } else {
          setError(
            "❌ ERROR: " + (error.message || "Failed to add client.") + "\n\n" +
            "Check the browser console (F12) for details."
          );
        }
      } else if (data) {
        if (editingId) {
          // Update existing client in the list
          setClients((prev) =>
            prev.map((c) => (c.id === editingId ? data : c))
          );
          resetForm();
        } else {
          // Add new client
          setClients((prev) => [data, ...prev]);
          resetForm();
        }
      }
    } catch (err: any) {
      console.error("Unexpected error adding client:", err);
      setError("Unexpected error adding client.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Clients</h1>
          <p className="mt-1 text-sm text-white/80">
            Manage your customers and their contact info.
          </p>
        </div>
        {clients.length > 0 && (
          <button
            onClick={() => {
              const exportData = clients.map((client) => ({
                Name: client.name,
                Phone: client.phone || "",
                Email: client.email || "",
                Address: client.address || "",
                City: client.city || "",
                State: client.state || "",
                "Zip Code": client.zip_code || "",
              }));
              exportToExcel(exportData, "clients", "Clients");
            }}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Export to Excel
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 to-violet-500/10 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">Free plan</p>
            <p className="mt-1 text-xs text-slate-300">
              Try every core workflow with up to {FREE_CLIENT_LIMIT} clients.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-cyan-200">
            {Math.min(clients.length, FREE_CLIENT_LIMIT)} / {FREE_CLIENT_LIMIT}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-950/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-[width]"
            style={{ width: `${Math.min((clients.length / FREE_CLIENT_LIMIT) * 100, 100)}%` }}
          />
        </div>
        {freeLimitReached ? (
          <p className="mt-3 text-sm font-semibold text-amber-200">
            You have reached the free-plan limit. Your five clients remain fully available; upgrade access will unlock additional clients.
          </p>
        ) : null}
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-md border-2 border-red-400/50 bg-red-500/30 p-4 text-sm text-white">
          <div className="font-semibold mb-2">⚠️ Database Setup Required</div>
          <pre className="whitespace-pre-wrap text-xs font-mono">{error}</pre>
        </div>
      )}

      {/* Add/Edit Client Form */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/90 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">
            {editing ? "Edit Client" : "Add Client"}
          </h2>
          {editing && (
            <button
              onClick={resetForm}
              className="text-xs text-white/60 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>

        <form
          onSubmit={handleAddClient}
          className="mt-3 grid gap-3 md:grid-cols-2"
        >
          <div>
            <label className="block text-xs font-medium text-white/80">
              Name *
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white placeholder:text-white/50 backdrop-blur"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80">
              Phone
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white placeholder:text-white/50 backdrop-blur"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="555-123-4567"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-white/80">
              Email
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white placeholder:text-white/50 backdrop-blur"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-white/80">
              Address
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white placeholder:text-white/50 backdrop-blur"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80">
              City
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white placeholder:text-white/50 backdrop-blur"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80">
              State
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white placeholder:text-white/50 backdrop-blur"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80">
              Zip Code
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white placeholder:text-white/50 backdrop-blur"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="12345"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md bg-slate-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={adding || (!editing && freeLimitReached)}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {adding
                ? editing ? "Updating..." : "Adding..."
                : editing ? "Update Client"
                : freeLimitReached ? "5-client limit reached"
                : "Add Client"}
            </button>
          </div>
        </form>
      </div>

      {/* Client List */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/90 p-4 shadow-sm backdrop-blur">
        <h2 className="text-sm font-semibold text-white">Client List</h2>

        {loading ? (
          <p className="mt-3 text-sm text-white/80">Loading clients…</p>
        ) : clients.length === 0 ? (
          <p className="mt-3 text-sm text-white/80">
            No clients added yet. Add your first one above.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-white/10">
            {clients.map((client) => {
              const fullAddress = [
                client.address,
                client.city,
                client.state,
                client.zip_code,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <div key={client.id} className="py-3 text-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white">{client.name}</p>
                      {client.phone && (
                        <p className="text-xs text-white/80">
                          Phone: {client.phone}
                        </p>
                      )}
                      {client.email && (
                        <p className="text-xs text-white/80">
                          Email: {client.email}
                        </p>
                      )}
                      {fullAddress && (
                        <p className="text-xs text-white/80">
                          Address: {fullAddress}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => handleEditClient(client)}
                        className="rounded-md bg-yellow-600/20 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-600/30 transition"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      {client.phone && (
                        <>
                          <a
                            href={`tel:${client.phone.replace(/[^\d+]/g, "")}`}
                            className="rounded-md bg-green-600/20 px-3 py-1.5 text-xs text-green-400 hover:bg-green-600/30 transition"
                            title="Call"
                          >
                            📞
                          </a>
                          <a
                            href={`sms:${client.phone.replace(/[^\d+]/g, "")}`}
                            className="rounded-md bg-blue-600/20 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-600/30 transition"
                            title="Text"
                          >
                            💬
                          </a>
                        </>
                      )}
                      {fullAddress && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md bg-purple-600/20 px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-600/30 transition"
                          title="Get Directions"
                        >
                          🗺️
                        </a>
                      )}
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

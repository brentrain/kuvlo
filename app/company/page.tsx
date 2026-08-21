"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

type CompanyProfile = {
  id?: string;
  user_id: string;
  company_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  paypal_link: string | null;
  stripe_link: string | null;
  venmo_link: string | null;
  lemonsqueezy_link: string | null;
};

export default function CompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CompanyProfile>({
    user_id: "",
    company_name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    email: "",
    website: "",
    logo_url: "",
    paypal_link: "",
    stripe_link: "",
    venmo_link: "",
    lemonsqueezy_link: "",
  });

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      setUserId(user.id);
      setAuthChecking(false);
      setLoading(true);

      try {
        // Try to fetch existing company profile
        const { data, error } = await supabase
          .from("company_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "not found" error, which is fine for first-time setup
          console.error("Error fetching company profile:", error);
          setError(error.message);
        } else if (data) {
          setFormData({
            ...formData,
            ...data,
            user_id: user.id,
          });
        } else {
          // No profile exists yet, initialize with user ID
          setFormData({
            ...formData,
            user_id: user.id,
          });
        }
      } catch (err: any) {
        console.error("Unexpected error:", err);
        setError("Failed to load company profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyProfile();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from("company_profiles")
        .upsert(
          {
            user_id: userId,
            company_name: formData.company_name || null,
            address: formData.address || null,
            city: formData.city || null,
            state: formData.state || null,
            zip_code: formData.zip_code || null,
            phone: formData.phone || null,
            email: formData.email || null,
            website: formData.website || null,
            logo_url: formData.logo_url || null,
            paypal_link: formData.paypal_link || null,
            stripe_link: formData.stripe_link || null,
            venmo_link: formData.venmo_link || null,
            lemonsqueezy_link: formData.lemonsqueezy_link || null,
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) throw error;

      setSuccess("Company profile saved successfully!");
    } catch (err: any) {
      console.error("Error saving company profile:", err);
      setError(err.message || "Failed to save company profile.");
    } finally {
      setSaving(false);
    }
  };

  if (authChecking || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Company Settings</h1>
        <p className="mt-1 text-sm text-white/80">
          Manage your company information for invoices and communications.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-300/50 bg-red-500/20 p-3 text-sm text-white">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-300/50 bg-green-500/20 p-3 text-sm text-white">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/90 p-4 shadow-sm backdrop-blur">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Company Information
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Your Company Name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white">
                Address
              </label>
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="123 Main St"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">City</label>
              <input
                type="text"
                value={formData.city || ""}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">State</label>
              <input
                type="text"
                value={formData.state || ""}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
                Zip Code
              </label>
              <input
                type="text"
                value={formData.zip_code || ""}
                onChange={(e) =>
                  setFormData({ ...formData, zip_code: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">Phone</label>
              <input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="555-123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">Email</label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="contact@company.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white">
                Website
              </label>
              <input
                type="url"
                value={formData.website || ""}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://www.company.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logo_url || ""}
                onChange={(e) =>
                  setFormData({ ...formData, logo_url: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
              />
              <p className="mt-1 text-xs text-white/60">
                Enter a URL to your company logo image
              </p>
            </div>
          </div>
        </div>

        {/* Payment Integration */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/90 p-4 shadow-sm backdrop-blur">
          <h2 className="text-lg font-semibold text-white">How you get paid</h2>
          <p className="mt-1 text-sm text-white/80">Offer customers the payment methods you accept. These appear on their secure invoice page.</p>
          <div className="my-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4">
            <p className="font-semibold text-emerald-100">Bank deposits and card payments</p>
            <p className="mt-1 text-sm text-slate-300">Connect Stripe securely. Your bank details are entered directly with Stripe and are never stored by Kuvlo.</p>
            <Link href="/billing" className="mt-3 inline-flex rounded-lg bg-emerald-300 px-4 py-2 text-sm font-bold text-slate-950">Set up bank and card payments</Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-white">
                PayPal Link
              </label>
              <input
                type="url"
                value={formData.paypal_link || ""}
                onChange={(e) =>
                  setFormData({ ...formData, paypal_link: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://paypal.me/yourname"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
                Backup Stripe payment link
              </label>
              <input
                type="url"
                value={formData.stripe_link || ""}
                onChange={(e) =>
                  setFormData({ ...formData, stripe_link: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://buy.stripe.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
                Venmo Link
              </label>
              <input
                type="url"
                value={formData.venmo_link || ""}
                onChange={(e) =>
                  setFormData({ ...formData, venmo_link: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://venmo.com/yourname"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
                Other checkout link
              </label>
              <input
                type="url"
                value={formData.lemonsqueezy_link || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lemonsqueezy_link: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://yourstore.lemonsqueezy.com/checkout/..."
              />
              <p className="mt-1 text-xs text-white/60">
                Optional legacy checkout link. Stripe Connect is recommended for invoice payments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Company Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
};

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
};

type Invoice = {
  id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_cents: number;
  status: string;
  notes: string | null;
};

type CompanyProfile = {
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

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendingText, setSendingText] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      setAuthChecking(false);
      setLoading(true);

      try {
        // Fetch invoice
        const { data: invoiceData, error: invoiceError } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .single();

        if (invoiceError) {
          // Check if it's a missing table error
          if (
            invoiceError.message?.includes("relation") ||
            invoiceError.message?.includes("does not exist") ||
            invoiceError.code === "42P01"
          ) {
            setError(
              "Invoices table not found. Please run the SQL setup script in Supabase (see supabase_setup.sql file)."
            );
            setLoading(false);
            return;
          }
          throw invoiceError;
        }

        // Fetch client
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", invoiceData.client_id)
          .single();

        if (clientError) throw clientError;

        // Fetch invoice items
        const { data: itemsData, error: itemsError } = await supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", invoiceId);

        if (itemsError) {
          // If invoice_items table doesn't exist, just set empty array
          if (
            itemsError.message?.includes("relation") ||
            itemsError.message?.includes("does not exist") ||
            itemsError.code === "42P01"
          ) {
            setInvoiceItems([]);
          } else {
            throw itemsError;
          }
        } else {
          setInvoiceItems(itemsData || []);
        }

        // Fetch company profile
        const { data: companyData, error: companyError } = await supabase
          .from("company_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (companyError) {
          if (companyError.code === "PGRST116") {
            // No company profile yet, that's okay
            setCompanyProfile(null);
          } else if (
            companyError.message?.includes("relation") ||
            companyError.message?.includes("does not exist") ||
            companyError.code === "42P01"
          ) {
            // Table doesn't exist yet, that's okay for now
            setCompanyProfile(null);
          } else {
            console.error("Error fetching company profile:", companyError);
            setCompanyProfile(null);
          }
        } else {
          setCompanyProfile(companyData || null);
        }

        setInvoice(invoiceData);
        setClient(clientData);
      } catch (err: any) {
        console.error("Error fetching invoice:", err);
        setError(
          err.message ||
            "Failed to load invoice. Please check that all database tables are set up correctly."
        );
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId, router]);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCompanyAddress = () => {
    if (!companyProfile) return "";
    const parts = [
      companyProfile.address,
      companyProfile.city,
      companyProfile.state,
      companyProfile.zip_code,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const getClientAddress = () => {
    if (!client) return "";
    const parts = [
      client.address,
      client.city,
      client.state,
      client.zip_code,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const handleSendEmail = async () => {
    if (!client?.email || !invoice) {
      setError("Client email is required to send invoice.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Get the user's access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to send invoices.");
      }

      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          clientEmail: client.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      alert(`Invoice sent successfully to ${client.email}!`);
    } catch (err: any) {
      setError(err.message || "Failed to send email. Make sure RESEND_API_KEY is set in your environment variables.");
    } finally {
      setSending(false);
    }
  };

  const handleSendText = () => {
    if (!client?.phone || !invoice) {
      setError("Client phone number is required to send invoice via text.");
      return;
    }

    setSendingText(true);
    setError(null);

    try {
      // Create SMS link with invoice URL
      const invoiceUrl = `${window.location.origin}/invoices/${invoice.id}`;
      const message = encodeURIComponent(
        `Invoice ${invoice.invoice_number} from ${companyProfile?.company_name || "Your Company"}\n\n` +
        `Amount: ${formatCurrency(invoice.total_cents)}\n` +
        `Due: ${formatDate(invoice.due_date)}\n\n` +
        `View invoice: ${invoiceUrl}`
      );

      // Clean phone number (remove non-digits except +)
      const cleanPhone = client.phone.replace(/[^\d+]/g, "");
      
      // Open SMS app
      window.location.href = `sms:${cleanPhone}?body=${message}`;
      
      // Reset after a moment
      setTimeout(() => {
        setSendingText(false);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to open text message.");
      setSendingText(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (authChecking || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-white">Loading...</p>
      </div>
    );
  }

  if (error || !invoice || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-400">{error || "Invoice not found"}</p>
          <button
            onClick={() => router.push("/invoices")}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const subtotal = invoiceItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_cents,
    0
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/invoices")}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to Invoices
        </button>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
          >
            Print
          </button>
          {client.email && (
            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 shadow-lg"
            >
              {sending ? "Sending..." : "📧 Send Email"}
            </button>
          )}
          {client.phone && (
            <button
              onClick={handleSendText}
              disabled={sendingText}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-lg"
            >
              {sendingText ? "Opening..." : "💬 Send Text"}
            </button>
          )}
          {!client.email && !client.phone && (
            <div className="rounded-md bg-yellow-500/20 border border-yellow-500/50 px-4 py-2 text-sm text-yellow-200">
              ⚠️ No client email/phone - add in Clients page
            </div>
          )}
        </div>
      </div>

      {/* Invoice Document */}
      <div className="mx-auto max-w-4xl rounded-lg border border-slate-700 bg-white p-8 shadow-lg print:shadow-none">
        {/* Company Header */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-start justify-between">
            <div>
              {companyProfile?.logo_url && (
                <img
                  src={companyProfile.logo_url}
                  alt="Company Logo"
                  className="mb-4 h-16 w-auto"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {companyProfile?.company_name || "Your Company"}
              </h1>
              {getCompanyAddress() && (
                <p className="mt-2 text-sm text-gray-600">
                  {getCompanyAddress()}
                </p>
              )}
              {companyProfile?.phone && (
                <p className="text-sm text-gray-600">
                  Phone: {companyProfile.phone}
                </p>
              )}
              {companyProfile?.email && (
                <p className="text-sm text-gray-600">
                  Email: {companyProfile.email}
                </p>
              )}
              {companyProfile?.website && (
                <p className="text-sm text-gray-600">
                  Website: {companyProfile.website}
                </p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
              <p className="mt-2 text-sm text-gray-600">
                Invoice #: {invoice.invoice_number}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="mb-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Bill To:
            </h3>
            <p className="font-medium text-gray-900">{client.name}</p>
            {getClientAddress() && (
              <p className="mt-1 text-sm text-gray-600">{getClientAddress()}</p>
            )}
            {client.email && (
              <p className="text-sm text-gray-600">{client.email}</p>
            )}
          </div>
          <div className="text-right">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Issue Date:</p>
              <p className="font-medium text-gray-900">
                {formatDate(invoice.issue_date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date:</p>
              <p className="font-medium text-gray-900">
                {formatDate(invoice.due_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left text-sm font-semibold text-gray-700">
                  Description
                </th>
                <th className="py-3 text-right text-sm font-semibold text-gray-700">
                  Quantity
                </th>
                <th className="py-3 text-right text-sm font-semibold text-gray-700">
                  Unit Price
                </th>
                <th className="py-3 text-right text-sm font-semibold text-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600">
                    {formatCurrency(item.unit_price_cents)}
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(item.quantity * item.unit_price_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mb-8 flex justify-end">
          <div className="w-64">
            <div className="flex justify-between border-t border-gray-200 pt-4">
              <span className="text-sm font-semibold text-gray-700">Total:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(invoice.total_cents)}
              </span>
            </div>
          </div>
        </div>

        {/* Pay Now Button - Prominent - Always Visible */}
        <div className="mb-8 text-center">
          <div className="inline-block rounded-lg border-2 border-green-500 bg-green-50 p-6 shadow-lg">
            <p className="mb-4 text-lg font-semibold text-gray-900">
              Amount Due: {formatCurrency(invoice.total_cents)}
            </p>
            {(companyProfile?.lemonsqueezy_link ||
              companyProfile?.paypal_link ||
              companyProfile?.stripe_link ||
              companyProfile?.venmo_link) ? (
              <div className="flex flex-wrap justify-center gap-3">
                {companyProfile.lemonsqueezy_link && (
                  <a
                    href={companyProfile.lemonsqueezy_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-green-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-green-700 hover:shadow-xl"
                  >
                    💳 Pay Now
                  </a>
                )}
                {!companyProfile?.lemonsqueezy_link && companyProfile?.stripe_link && (
                  <a
                    href={companyProfile.stripe_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-purple-600 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-purple-700 hover:shadow-lg"
                  >
                    💳 Pay Now with Stripe
                  </a>
                )}
                {!companyProfile?.lemonsqueezy_link && companyProfile?.paypal_link && (
                  <a
                    href={companyProfile.paypal_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
                  >
                    💳 Pay Now with PayPal
                  </a>
                )}
                {!companyProfile?.lemonsqueezy_link && companyProfile?.venmo_link && (
                  <a
                    href={companyProfile.venmo_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-blue-600 hover:shadow-lg"
                  >
                    💳 Pay Now with Venmo
                  </a>
                )}
              </div>
            ) : (
              <p className="text-red-600 font-medium">
                Payment link not configured. Please contact {companyProfile?.email || "the sender"} to arrange payment.
              </p>
            )}
            {invoice.status !== "paid" && (
              <p className="mt-4 text-sm text-gray-600">
                Due: {formatDate(invoice.due_date)}
              </p>
            )}
          </div>
        </div>

        {/* Additional Payment Options */}
        {(companyProfile?.lemonsqueezy_link ||
          companyProfile?.paypal_link ||
          companyProfile?.stripe_link ||
          companyProfile?.venmo_link) && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">
              Other Payment Options:
            </p>
            <div className="flex flex-wrap gap-2">
              {companyProfile.lemonsqueezy_link && (
                <a
                  href={companyProfile.lemonsqueezy_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  LemonSqueezy
                </a>
              )}
              {companyProfile.stripe_link && (
                <a
                  href={companyProfile.stripe_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Stripe
                </a>
              )}
              {companyProfile.paypal_link && (
                <a
                  href={companyProfile.paypal_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  PayPal
                </a>
              )}
              {companyProfile.venmo_link && (
                <a
                  href={companyProfile.venmo_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  Venmo
                </a>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-700">Notes:</p>
            <p className="mt-1 text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}


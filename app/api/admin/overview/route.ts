import { NextResponse } from "next/server";
import { authenticateRequest, createServiceClient } from "../../../lib/serverSupabase";

export async function GET(request: Request) {
  const started = Date.now();
  const requestId = request.headers.get("x-vercel-id");
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const admins = new Set((process.env.ADMIN_USER_IDS || "").split(",").map((id) => id.trim()).filter(Boolean));
    if (!admins.has(auth.user.id)) return NextResponse.json({ error: "Creator access required" }, { status: 403 });

    const service = createServiceClient();
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [usersResult, profilesResult, invoicesResult, webhookResult] = await Promise.all([
      service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      service.from("company_profiles").select("user_id,plan,subscription_status,stripe_charges_enabled,created_at"),
      service.from("invoices").select("id,total_cents,status,paid_at,created_at"),
      service.from("webhook_events").select("provider,event_name,received_at,processed_at").order("received_at", { ascending: false }).limit(100),
    ]);
    if (usersResult.error || profilesResult.error || invoicesResult.error || webhookResult.error) throw new Error("Could not load platform metrics");

    const profiles = profilesResult.data || [];
    const invoices = invoicesResult.data || [];
    const paid = invoices.filter((invoice) => invoice.status === "paid");
    const paidSince = (date: Date) => paid.filter((invoice) => invoice.paid_at && new Date(invoice.paid_at) >= date).reduce((sum, invoice) => sum + invoice.total_cents, 0);
    const openAmount = invoices.filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + invoice.total_cents, 0);
    const webhookEvents = webhookResult.data || [];
    const failedWebhooks = webhookEvents.filter((event) => !event.processed_at);
    const latestWebhook = webhookEvents[0]?.received_at || null;

    console.log(JSON.stringify({ level: "info", msg: "admin_overview", requestId, ms: Date.now() - started }));
    return NextResponse.json({
      health: {
        status: failedWebhooks.length ? "attention" : "healthy",
        failedWebhooks: failedWebhooks.length,
        latestWebhook,
        stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
        subscriptionsConfigured: Boolean(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_WEBHOOK_SECRET),
        emailConfigured: Boolean(process.env.RESEND_API_KEY),
      },
      users: {
        total: usersResult.data.users.length,
        businesses: profiles.length,
        pro: profiles.filter((profile) => profile.plan === "pro").length,
        paymentReady: profiles.filter((profile) => profile.stripe_charges_enabled).length,
      },
      payments: {
        paidWeekCents: paidSince(weekStart),
        paidMonthCents: paidSince(monthStart),
        paidAllCents: paid.reduce((sum, invoice) => sum + invoice.total_cents, 0),
        outstandingCents: openAmount,
        paidInvoices: paid.length,
        openInvoices: invoices.length - paid.length,
      },
      recentWebhooks: webhookEvents.slice(0, 12),
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "admin_overview_failed", requestId, error: error instanceof Error ? error.message : String(error), ms: Date.now() - started }));
    return NextResponse.json({ error: "Could not load creator dashboard" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServiceClient } from "../../../lib/serverSupabase";
import { getStripe } from "../../../lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    const { data: existing } = await service
      .from("webhook_events")
      .select("processed_at")
      .eq("provider", "stripe")
      .eq("event_id", event.id)
      .maybeSingle();
    if (existing?.processed_at) return NextResponse.json({ received: true, duplicate: true });

    await service.from("webhook_events").upsert({
      provider: "stripe",
      event_id: event.id,
      event_name: event.type,
      payload: event,
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoice_id;
      if (invoiceId && session.payment_status === "paid") {
        const { error } = await service
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
          })
          .eq("id", invoiceId);
        if (error) throw error;
      }
    } else if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const { error } = await service
        .from("company_profiles")
        .update({
          stripe_charges_enabled: account.charges_enabled,
          stripe_details_submitted: account.details_submitted,
        })
        .eq("stripe_account_id", account.id);
      if (error) throw error;
    }

    await service
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("provider", "stripe")
      .eq("event_id", event.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

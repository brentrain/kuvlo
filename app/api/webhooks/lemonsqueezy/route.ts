import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "../../../lib/serverSupabase";

type LemonWebhook = {
  meta?: { event_name?: string; custom_data?: { user_id?: string } };
  data?: {
    id?: string;
    attributes?: {
      customer_id?: number;
      status?: string;
      renews_at?: string | null;
      ends_at?: string | null;
      updated_at?: string;
      created_at?: string;
    };
  };
};

const PRO_STATUSES = new Set(["on_trial", "active", "past_due", "cancelled"]);

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });

  const rawBody = await request.text();
  const suppliedSignature = request.headers.get("x-signature") || "";
  const expectedSignature = createHmac("sha256", secret).update(rawBody).digest("hex");
  const supplied = Buffer.from(suppliedSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const payload = JSON.parse(rawBody) as LemonWebhook;
    const eventName = payload.meta?.event_name || request.headers.get("x-event-name") || "unknown";
    const subscriptionId = payload.data?.id;
    const attributes = payload.data?.attributes;
    if (!subscriptionId || !attributes) return NextResponse.json({ received: true });

    const eventId = `${eventName}:${subscriptionId}:${attributes.updated_at || attributes.created_at || "unknown"}`;
    const service = createServiceClient();
    const { data: existing } = await service
      .from("webhook_events")
      .select("processed_at")
      .eq("provider", "lemonsqueezy")
      .eq("event_id", eventId)
      .maybeSingle();
    if (existing?.processed_at) return NextResponse.json({ received: true, duplicate: true });

    await service.from("webhook_events").upsert({
      provider: "lemonsqueezy",
      event_id: eventId,
      event_name: eventName,
      payload,
    });

    let userId = payload.meta?.custom_data?.user_id;
    if (!userId) {
      const { data: profile } = await service
        .from("company_profiles")
        .select("user_id")
        .eq("lemonsqueezy_subscription_id", subscriptionId)
        .maybeSingle();
      userId = profile?.user_id;
    }

    if (userId && eventName.startsWith("subscription_")) {
      const status = attributes.status || "unknown";
      const { error } = await service.from("company_profiles").upsert(
        {
          user_id: userId,
          plan: PRO_STATUSES.has(status) ? "pro" : "free",
          lemonsqueezy_subscription_id: subscriptionId,
          lemonsqueezy_customer_id: attributes.customer_id ? String(attributes.customer_id) : null,
          subscription_status: status,
          subscription_renews_at: attributes.renews_at || null,
          subscription_ends_at: attributes.ends_at || null,
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    }

    await service
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("provider", "lemonsqueezy")
      .eq("event_id", eventId);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Lemon Squeezy webhook error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

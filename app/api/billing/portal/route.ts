import { NextResponse } from "next/server";
import { authenticateRequest } from "../../../lib/serverSupabase";

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Lemon Squeezy is not configured" }, { status: 503 });

    const { data: profile } = await auth.supabase
      .from("company_profiles")
      .select("lemonsqueezy_subscription_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!profile?.lemonsqueezy_subscription_id) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${profile.lemonsqueezy_subscription_id}`,
      { headers: { Accept: "application/vnd.api+json", Authorization: `Bearer ${apiKey}` } }
    );
    const payload = await response.json();
    const url = payload?.data?.attributes?.urls?.customer_portal;
    if (!response.ok || !url) return NextResponse.json({ error: "Subscription portal unavailable" }, { status: 502 });
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Billing portal error", error);
    return NextResponse.json({ error: "Could not open subscription portal" }, { status: 500 });
  }
}

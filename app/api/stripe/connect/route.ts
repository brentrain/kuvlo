import { NextResponse } from "next/server";
import { authenticateRequest } from "../../../lib/serverSupabase";
import { getStripe } from "../../../lib/stripe";

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kuvlo.io";
    const { data: profile } = await auth.supabase
      .from("company_profiles")
      .select("stripe_account_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    let accountId = profile?.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: process.env.STRIPE_CONNECTED_ACCOUNT_COUNTRY || "US",
        email: auth.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: { product_description: "Independent field service business" },
        metadata: { kuvlo_user_id: auth.user.id },
      });
      accountId = account.id;
      const { error } = await auth.supabase.from("company_profiles").upsert(
        { user_id: auth.user.id, stripe_account_id: accountId },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/billing?stripe=refresh`,
      return_url: `${appUrl}/billing?stripe=return`,
      type: "account_onboarding",
    });
    return NextResponse.json({ url: link.url });
  } catch (error) {
    console.error("Stripe Connect onboarding error", error);
    return NextResponse.json({ error: "Could not start Stripe onboarding" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await auth.supabase
      .from("company_profiles")
      .select("stripe_account_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (!profile?.stripe_account_id) {
      return NextResponse.json({ connected: false, chargesEnabled: false, detailsSubmitted: false });
    }

    const account = await getStripe().accounts.retrieve(profile.stripe_account_id);
    const status = {
      connected: true,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    };
    await auth.supabase
      .from("company_profiles")
      .update({
        stripe_charges_enabled: status.chargesEnabled,
        stripe_details_submitted: status.detailsSubmitted,
      })
      .eq("user_id", auth.user.id);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Stripe Connect status error", error);
    return NextResponse.json({ error: "Could not load Stripe status" }, { status: 500 });
  }
}

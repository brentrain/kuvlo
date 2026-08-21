import { NextResponse } from "next/server";
import { authenticateRequest } from "../../../lib/serverSupabase";

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const variantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kuvlo.io";
    if (!apiKey || !storeId || !variantId) {
      return NextResponse.json({ error: "Lemon Squeezy is not configured" }, { status: 503 });
    }

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            product_options: {
              redirect_url: `${appUrl}/billing?upgraded=1`,
              enabled_variants: [Number(variantId)],
            },
            checkout_data: {
              email: auth.user.email,
              custom: { user_id: auth.user.id },
            },
          },
          relationships: {
            store: { data: { type: "stores", id: String(storeId) } },
            variant: { data: { type: "variants", id: String(variantId) } },
          },
        },
      }),
    });

    const payload = await response.json();
    const url = payload?.data?.attributes?.url;
    if (!response.ok || !url) {
      console.error("Lemon Squeezy checkout error", payload);
      return NextResponse.json({ error: "Could not create checkout" }, { status: 502 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Billing checkout error", error);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}

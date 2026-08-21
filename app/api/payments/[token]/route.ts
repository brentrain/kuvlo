import { NextResponse } from "next/server";
import { createServiceClient } from "../../../lib/serverSupabase";
import { getStripe } from "../../../lib/stripe";

type Context = { params: Promise<{ token: string }> };

async function loadInvoice(token: string) {
  const service = createServiceClient();
  const { data: invoice, error } = await service
    .from("invoices")
    .select("id,user_id,client_id,invoice_number,issue_date,due_date,total_cents,status,notes,payment_token")
    .eq("payment_token", token)
    .maybeSingle();
  if (error || !invoice) return null;

  const [{ data: client }, { data: company }, { data: items }] = await Promise.all([
    service.from("clients").select("name,email").eq("id", invoice.client_id).maybeSingle(),
    service
      .from("company_profiles")
      .select("company_name,email,stripe_account_id,stripe_charges_enabled")
      .eq("user_id", invoice.user_id)
      .maybeSingle(),
    service
      .from("invoice_items")
      .select("description,quantity,unit_price_cents")
      .eq("invoice_id", invoice.id),
  ]);
  return { service, invoice, client, company, items: items || [] };
}

export async function GET(_request: Request, context: Context) {
  try {
    const { token } = await context.params;
    const result = await loadInvoice(token);
    if (!result) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    const { invoice, client, company, items } = result;
    return NextResponse.json({
      invoice: {
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        totalCents: invoice.total_cents,
        status: invoice.status,
        notes: invoice.notes,
      },
      client: { name: client?.name || "Customer" },
      company: { name: company?.company_name || "Service provider", email: company?.email || null },
      items,
      canPay: Boolean(company?.stripe_account_id && company?.stripe_charges_enabled && invoice.status !== "paid"),
    });
  } catch (error) {
    console.error("Public invoice error", error);
    return NextResponse.json({ error: "Invoice unavailable" }, { status: 500 });
  }
}

export async function POST(_request: Request, context: Context) {
  try {
    const { token } = await context.params;
    const result = await loadInvoice(token);
    if (!result) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    const { service, invoice, client, company } = result;
    if (invoice.status === "paid") return NextResponse.json({ error: "Invoice is already paid" }, { status: 409 });
    if (!company?.stripe_account_id || !company.stripe_charges_enabled) {
      return NextResponse.json({ error: "Online payments are not enabled for this business" }, { status: 409 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kuvlo.io";
    const feePercent = Math.max(0, Math.min(100, Number(process.env.STRIPE_APPLICATION_FEE_PERCENT || 0)));
    const applicationFee = Math.round((invoice.total_cents * feePercent) / 100);
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        customer_email: client?.email || undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: invoice.total_cents,
              product_data: { name: `Invoice ${invoice.invoice_number}` },
            },
          },
        ],
        metadata: { invoice_id: invoice.id, kuvlo_user_id: invoice.user_id },
        payment_intent_data: {
          metadata: { invoice_id: invoice.id, kuvlo_user_id: invoice.user_id },
          ...(applicationFee > 0 ? { application_fee_amount: applicationFee } : {}),
        },
        success_url: `${appUrl}/pay/${token}?payment=success`,
        cancel_url: `${appUrl}/pay/${token}?payment=cancelled`,
      },
      { stripeAccount: company.stripe_account_id }
    );

    await service
      .from("invoices")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", invoice.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Invoice checkout error", error);
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }
}

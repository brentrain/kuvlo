import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, clientEmail } = await request.json();

    if (!invoiceId || !clientEmail) {
      return NextResponse.json(
        { error: "Invoice ID and client email are required" },
        { status: 400 }
      );
    }

    if (!resend) {
      return NextResponse.json(
        { error: "Resend API key not configured. Please set RESEND_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    // Get the authorization token from the request
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error:
            "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.",
        },
        { status: 500 }
      );
    }

    // Create an authenticated Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: `Unauthorized. ${authError?.message || "Invalid session."}` },
        { status: 401 }
      );
    }

    // Fetch invoice data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          address,
          city,
          state,
          zip_code
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError) {
      console.error("Error fetching invoice:", invoiceError);
      return NextResponse.json(
        { error: `Invoice not found: ${invoiceError.message}` },
        { status: 404 }
      );
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Verify the invoice belongs to the authenticated user
    if (invoice.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized. This invoice does not belong to you." },
        { status: 403 }
      );
    }

    // Fetch invoice items
    const { data: invoiceItems, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId);

    if (itemsError) {
      console.error("Error fetching invoice items:", itemsError);
    }

    // Fetch company profile (using the invoice's user_id)
    const { data: companyProfile } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", invoice.user_id)
      .single();

    // Format currency
    const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

    // Format date
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    // Get payment link (prioritize LemonSqueezy, then others)
    const paymentLink = companyProfile?.lemonsqueezy_link || 
                       companyProfile?.stripe_link || 
                       companyProfile?.paypal_link || 
                       companyProfile?.venmo_link;

    // Build invoice HTML
    const itemsHtml = (invoiceItems || []).map((item: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${item.description}</td>
        <td style="padding: 12px; text-align: right;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">${formatCurrency(item.unit_price_cents)}</td>
        <td style="padding: 12px; text-align: right; font-weight: 600;">${formatCurrency(item.quantity * item.unit_price_cents)}</td>
      </tr>
    `).join("");

    const clientAddress = [
      invoice.clients?.address,
      invoice.clients?.city,
      invoice.clients?.state,
      invoice.clients?.zip_code,
    ].filter(Boolean).join(", ");

    const companyAddress = [
      companyProfile?.address,
      companyProfile?.city,
      companyProfile?.state,
      companyProfile?.zip_code,
    ].filter(Boolean).join(", ");

    // Create invoice view URL (public link)
    const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoices/${invoiceId}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
            ${companyProfile?.logo_url ? `<img src="${companyProfile.logo_url}" alt="Company Logo" style="max-height: 60px; margin-bottom: 20px;">` : ""}
            
            <h1 style="color: #111827; font-size: 24px; margin-bottom: 10px;">${companyProfile?.company_name || "Invoice"}</h1>
            
            ${companyAddress ? `<p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">${companyAddress}</p>` : ""}
            ${companyProfile?.phone ? `<p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Phone: ${companyProfile.phone}</p>` : ""}
            ${companyProfile?.email ? `<p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">Email: ${companyProfile.email}</p>` : ""}
            
            <div style="text-align: right; margin-bottom: 30px;">
              <h2 style="color: #111827; font-size: 28px; margin: 0;">INVOICE</h2>
              <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Invoice #: ${invoice.invoice_number}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
              <div>
                <h3 style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 8px;">Bill To:</h3>
                <p style="color: #111827; font-weight: 500; margin: 0;">${invoice.clients?.name || "Client"}</p>
                ${clientAddress ? `<p style="color: #6b7280; font-size: 14px; margin-top: 4px;">${clientAddress}</p>` : ""}
                ${invoice.clients?.email ? `<p style="color: #6b7280; font-size: 14px;">${invoice.clients.email}</p>` : ""}
              </div>
              <div style="text-align: right;">
                <div style="margin-bottom: 15px;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Issue Date:</p>
                  <p style="color: #111827; font-weight: 500; margin-top: 4px;">${formatDate(invoice.issue_date)}</p>
                </div>
                <div>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Due Date:</p>
                  <p style="color: #111827; font-weight: 500; margin-top: 4px;">${formatDate(invoice.due_date)}</p>
                </div>
              </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                <tr style="border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px; text-align: left; color: #374151; font-size: 14px; font-weight: 600;">Description</th>
                  <th style="padding: 12px; text-align: right; color: #374151; font-size: 14px; font-weight: 600;">Quantity</th>
                  <th style="padding: 12px; text-align: right; color: #374151; font-size: 14px; font-weight: 600;">Unit Price</th>
                  <th style="padding: 12px; text-align: right; color: #374151; font-size: 14px; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
              <div style="width: 200px;">
                <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid #e5e7eb;">
                  <span style="color: #374151; font-size: 14px; font-weight: 600;">Total:</span>
                  <span style="color: #111827; font-size: 18px; font-weight: 700;">${formatCurrency(invoice.total_cents)}</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 40px 0; padding: 30px; background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px;">
              <p style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 20px;">
                Amount Due: ${formatCurrency(invoice.total_cents)}
              </p>
              ${paymentLink ? `
                <a href="${paymentLink}" 
                   style="display: inline-block; background: #22c55e; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  💳 Pay Now
                </a>
              ` : `
                <p style="color: #dc2626; font-size: 14px; margin: 0;">
                  Payment link not configured. Please contact ${companyProfile?.email || "the sender"} to arrange payment.
                </p>
              `}
              <p style="color: #6b7280; font-size: 14px; margin-top: 15px; margin-bottom: 0;">
                Due: ${formatDate(invoice.due_date)}
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                You can also view this invoice online: <a href="${invoiceUrl}" style="color: #3b82f6;">${invoiceUrl}</a>
              </p>
            </div>
            
            ${invoice.notes ? `
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 8px;">Notes:</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">${invoice.notes}</p>
              </div>
            ` : ""}
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">Thank you for your business!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    const fromEmail = companyProfile?.email || process.env.FROM_EMAIL || "noreply@fieldpro.app";
    const { error: emailError } = await resend.emails.send({
      from: `${companyProfile?.company_name || "FieldPro"} <${fromEmail}>`,
      to: [clientEmail],
      subject: `Invoice ${invoice.invoice_number} from ${companyProfile?.company_name || "Your Company"}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      return NextResponse.json(
        { error: "Failed to send email", details: emailError },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Invoice sent successfully", invoiceId },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error", details: err.message },
      { status: 500 }
    );
  }
}


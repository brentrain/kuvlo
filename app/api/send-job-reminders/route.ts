import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const notifyEmail = process.env.NOTIFY_EMAIL;

function escapeHtml(value: string | null | undefined) {
  return (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!notifyEmail) {
    return NextResponse.json(
      { error: "NOTIFY_EMAIL is not configured" },
      { status: 500 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server-side Supabase credentials are not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select(`
        id,
        scheduled_at,
        price_cents,
        status,
        notes,
        clients:client_id ( name )
      `)
      .gte("scheduled_at", startOfToday.toISOString())
      .lt("scheduled_at", endOfToday.toISOString())
      .order("scheduled_at", { ascending: true });

    if (jobsError) {
      console.error("Error loading jobs:", jobsError);
      return NextResponse.json({ error: jobsError.message }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json(
        { message: "No jobs scheduled for today." },
        { status: 200 }
      );
    }

    const formatPrice = (cents: number | null) =>
      cents != null ? `$${(cents / 100).toFixed(2)}` : "-";

    type JobWithClient = {
      id: string;
      scheduled_at: string;
      price_cents: number | null;
      status: string;
      notes: string | null;
      clients: { name: string }[] | null;
    };

    const listItemsHtml = (jobs as JobWithClient[])
      .map((job) => {
        const clientName = escapeHtml(job.clients?.[0]?.name ?? "Unknown client");
        const when = escapeHtml(new Date(job.scheduled_at).toLocaleString());
        const price = escapeHtml(formatPrice(job.price_cents));
        const status = escapeHtml(job.status);
        const notes = job.notes ? `<em>${escapeHtml(job.notes)}</em>` : "";

        return `<li>
          <strong>${clientName}</strong><br/>
          ${when}<br/>
          Price: ${price}<br/>
          Status: ${status}<br/>
          ${notes}
        </li>`;
      })
      .join("");

    const html = `
      <div>
        <h2>Today's Jobs</h2>
        <p>Here are your jobs scheduled for today:</p>
        <ul>${listItemsHtml}</ul>
        <p style="font-size: 12px; color: #666;">Sent by Kuvlo.</p>
      </div>
    `;

    const fromEmail = process.env.FROM_EMAIL || "noreply@example.com";
    const { error: emailError } = await resend.emails.send({
      from: `Kuvlo <${fromEmail}>`,
      to: [notifyEmail],
      subject: `Today's jobs (${jobs.length})`,
      html,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json(
      { message: `Reminder email sent to ${notifyEmail}`, count: jobs.length },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

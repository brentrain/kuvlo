import { NextResponse } from "next/server";
import { createServiceClient } from "../../../lib/serverSupabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEVICES = new Set(["mobile", "tablet", "desktop"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const visitorId = typeof body.visitorId === "string" ? body.visitorId : "";
    const path = typeof body.path === "string" ? body.path : "";
    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 255) : null;
    const device = typeof body.device === "string" ? body.device : "";

    if (!UUID_PATTERN.test(visitorId) || !path.startsWith("/") || path.length > 500 || !DEVICES.has(device)) {
      return NextResponse.json({ error: "Invalid analytics event" }, { status: 400 });
    }

    const { error } = await createServiceClient().from("page_views").insert({
      visitor_id: visitorId,
      path,
      referrer,
      device,
    });
    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      msg: "analytics_visit_failed",
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json({ error: "Could not record visit" }, { status: 500 });
  }
}


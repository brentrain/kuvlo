import { NextResponse } from "next/server";
import { authenticateRequest, isCreator } from "../../../lib/serverSupabase";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ creator: false }, { status: 401 });
  return NextResponse.json({ creator: isCreator(auth.user) });
}

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function createServiceClient(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function authenticateRequest(
  request: Request
): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const accessToken = authorization.slice("Bearer ".length);
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { user: data.user, supabase };
}

export function isCreator(user: User) {
  const ids = new Set((process.env.ADMIN_USER_IDS || "").split(",").map((value) => value.trim()).filter(Boolean));
  const emails = new Set([
    "brentvsmaximvs@gmail.com",
    ...(process.env.ADMIN_EMAILS || "").toLowerCase().split(","),
  ].map((value) => value.trim()).filter(Boolean));
  return ids.has(user.id) || Boolean(user.email && emails.has(user.email.toLowerCase()));
}

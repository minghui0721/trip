import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export type SignedInUser = { id: string; email?: string };

// The login token was already checked for this request. Reading its claims
// stays on this server. getUser() would ask Supabase again on every click.
export async function currentUser(supabase: Client): Promise<SignedInUser | null> {
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims.sub;
  if (!id) return null;
  const email = data.claims.email;
  return { id, email: typeof email === "string" ? email : undefined };
}

// Returns the signed-in user and a Supabase client, or sends them to /login.
// `path` is where to come back to after signing in.
export async function requireUser(path: string) {
  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  return { supabase, user };
}

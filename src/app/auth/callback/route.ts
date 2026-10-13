import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

// Google sends the user back here (via Supabase) with a one-time code.
// We swap the code for a session cookie, then continue to where they were going.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const remembered = request.cookies.get("auth-next")?.value;
  const next = safeNext(searchParams.get("next") ?? decodeNext(remembered));

  const response = await finish(origin, code, next);
  response.cookies.set("auth-next", "", { path: "/", maxAge: 0 });
  return response;
}

function decodeNext(value: string | undefined) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

async function finish(origin: string, code: string | null, next: string) {
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=1&next=${encodeURIComponent(next)}`,
  );
}

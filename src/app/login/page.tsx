import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/components/google-sign-in";
import { LogoIcon } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const hasError = params.error !== undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next);

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-secondary to-background to-60%">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-10 px-6 py-12">
        <div className="text-center">
          <LogoIcon className="mx-auto size-20 rounded-3xl ring-1 ring-white/10" />
          <h1 className="mt-4 text-4xl font-black tracking-tighter">Sign in to <span className="whitespace-nowrap">Jalan Jalan</span></h1>
          <p className="mt-2 text-muted-foreground">Plan trips together with your friends.</p>
        </div>
        {hasError && (
          <p className="rounded-md bg-destructive/15 p-3 text-center text-sm text-destructive">
            Sign-in failed. Please try again.
          </p>
        )}
        <GoogleSignIn next={next} />
      </main>
    </div>
  );
}

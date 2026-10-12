import Link from "next/link";
import { ArrowLeftRight, ChevronRight, Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { HomeTrips, type HomeTrip } from "./home-trips";
import { Landing } from "./landing";
import { UserMenu } from "./user-menu";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <Landing />;

  const [{ data: profile }, { data: trips }] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
    // RLS only returns trips you're a member of (and their members).
    supabase
      .from("trips")
      .select(
        "id, name, destination, start_date, end_date, trip_members(joined_at, profiles(display_name, avatar_url))",
      )
      .order("created_at", { ascending: false }),
  ]);

  const name = profile?.display_name ?? user.email ?? "You";
  const firstName = name.split(" ")[0];

  const homeTrips: HomeTrip[] = (trips ?? []).map(({ trip_members, ...trip }) => ({
    ...trip,
    members: [...trip_members]
      .sort((a, b) => a.joined_at.localeCompare(b.joined_at))
      .flatMap((m) => (m.profiles ? [m.profiles] : [])),
  }));

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-secondary to-background to-40%">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-28 md:max-w-5xl md:px-8 md:pt-8 md:pb-16">
        <header className="flex items-center gap-3">
          <Logo className="flex-1" />
          {homeTrips.length > 0 && (
            <Link href="/trips/new" className={cn(buttonVariants(), "hidden h-10 px-4 md:inline-flex")}>
              <Plus className="size-4" strokeWidth={2.5} /> New trip
            </Link>
          )}
          <UserMenu name={name} email={user.email} avatarUrl={profile?.avatar_url ?? null} />
        </header>

        <h1 className="mt-2 text-4xl font-black tracking-tighter md:text-5xl">Hey {firstName} 👋</h1>

        <Link
          href="/exchange"
          className="group flex items-center gap-4 rounded-2xl bg-[oklch(0.36_0_0)] p-4 transition-colors hover:bg-[oklch(0.42_0_0)] active:scale-[0.99] md:max-w-md"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ArrowLeftRight className="size-5" strokeWidth={2.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold tracking-tight">Exchange rate</span>
            <span className="block text-sm text-muted-foreground">Look up today&apos;s rate</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>

        <HomeTrips trips={homeTrips} serverToday={new Date().toISOString().slice(0, 10)} />
      </main>

      {homeTrips.length > 0 && (
        // Phones: floating "+" in the thumb zone. Desktop uses the header button.
        <div className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] mx-auto flex w-full max-w-md justify-end px-5 md:hidden">
          <Link
            href="/trips/new"
            aria-label="New trip"
            className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-black/50 transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="size-7" strokeWidth={2.5} />
          </Link>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/components/google-sign-in";
import { buttonVariants } from "@/components/ui/button";
import { formatDateRange } from "@/lib/format";
import { normalizeInviteCode } from "@/lib/invite";
import { currentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tripColor } from "@/lib/trip-color";
import { cn } from "@/lib/utils";
import { JoinTripForm } from "./join-trip-form";

export default async function JoinPage({ params }: PageProps<"/join/[code]">) {
  const { code: rawCode } = await params;
  const code = normalizeInviteCode(rawCode);
  if (!code) return <InviteMessage title="This invite link isn't valid." />;

  const supabase = await createClient();
  const { data: trips, error } = await supabase.rpc("trip_by_invite", { p_code: code });
  if (error) {
    // PGRST202: the function is not in the database yet (0002_join_trip.sql).
    const missingFunction = error.code === "PGRST202";
    if (!missingFunction) console.error("trip_by_invite failed", error.message);
    return (
      <InviteMessage
        title={missingFunction ? "Invites aren't set up yet." : "Couldn't open this invite."}
        body={
          missingFunction
            ? "The database is missing the join function. Run supabase/migrations/0002_join_trip.sql in the Supabase SQL Editor, then reload this page."
            : error.message.includes("fetch failed")
              ? "Check your connection and try again."
              : "Please try again in a moment."
        }
      />
    );
  }

  const trip = trips?.[0];
  if (!trip) return <InviteMessage title="This invite link isn't valid." />;

  const user = await currentUser(supabase);
  if (user) {
    // Members can read the trip; everyone else gets nothing back.
    const { data: existing } = await supabase
      .from("trips")
      .select("id")
      .eq("id", trip.id)
      .maybeSingle();
    if (existing) redirect(`/trips/${trip.id}`);
  }

  const color = tripColor(trip.id);
  const dates = formatDateRange(trip.start_date, trip.end_date);
  const meta = [trip.destination, dates].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-1 flex-col">
      <header
        className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-8 md:px-8 md:pt-8 md:pb-10"
        style={{ background: `linear-gradient(to bottom, ${color.solid}, ${color.deep} 60%, var(--background))` }}
      >
        <div className="mx-auto w-full max-w-md md:max-w-lg">
          <p className="mt-16 text-sm font-medium text-white/80 md:mt-24">
            {trip.owner_name ? `${trip.owner_name} invited you` : "You're invited"}
          </p>
          <h1 className="mt-1 text-5xl leading-[0.95] font-black tracking-tighter break-words text-white md:text-7xl">
            {trip.name}
          </h1>
          {meta && <p className="mt-4 text-sm font-medium text-white/80 md:text-base">{meta}</p>}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pb-12 md:max-w-lg md:px-8">
        <p className="text-muted-foreground">
          {user
            ? "Join to see this trip with everyone else."
            : "Sign in with Google to join this trip."}
        </p>
        {user ? <JoinTripForm code={code} /> : <GoogleSignIn next={`/join/${code}`} />}
      </main>
    </div>
  );
}

function InviteMessage({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-secondary to-background to-40%">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h1 className="text-3xl font-black tracking-tighter">{title}</h1>
        {body && <p className="text-muted-foreground">{body}</p>}
        <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-2 h-12 px-6 text-base")}>
          Go home
        </Link>
      </main>
    </div>
  );
}

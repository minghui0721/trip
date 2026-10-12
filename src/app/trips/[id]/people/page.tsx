import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { InviteLink } from "@/components/invite-link";
import { requireUser } from "@/lib/auth";
import { loadTripShell } from "../trip-data";
import { TripShell } from "../trip-shell";

export default async function TripPeoplePage({ params }: PageProps<"/trips/[id]/people">) {
  const { id } = await params;
  const { supabase } = await requireUser(`/trips/${id}/people`);
  const { trip } = await loadTripShell(supabase, id);
  if (!trip) notFound();

  const { data: members } = await supabase
    .from("trip_members")
    .select("user_id, role, profiles(display_name, avatar_url)")
    .eq("trip_id", trip.id)
    .order("joined_at");

  return (
    <TripShell trip={trip} memberCount={members?.length ?? 0} active="people">
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold tracking-tight">Invite friends</h2>
          <p className="text-sm text-muted-foreground">Anyone with this link can join the trip.</p>
          <InviteLink code={trip.invite_code} tripName={trip.name} />
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold tracking-tight">Members</h2>
          <ol className="flex flex-col md:grid md:grid-cols-2 md:gap-x-6">
            {members?.map((member, index) => (
              <li
                key={member.user_id}
                className="flex items-center gap-4 rounded-md px-2 py-2.5 transition-colors hover:bg-card"
              >
                <span className="w-4 text-right text-sm text-muted-foreground tabular-nums">{index + 1}</span>
                <Avatar
                  name={member.profiles?.display_name ?? "?"}
                  url={member.profiles?.avatar_url ?? null}
                />
                <span className="flex-1 truncate font-medium">{member.profiles?.display_name}</span>
                {member.role === "owner" && <span className="text-xs font-semibold text-primary">Owner</span>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </TripShell>
  );
}

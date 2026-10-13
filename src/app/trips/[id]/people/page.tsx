import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PeoplePanel, type TripMember } from "../people-panel";
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

  const people: TripMember[] = (members ?? []).map((member) => ({
    id: member.user_id,
    name: member.profiles?.display_name ?? "Someone",
    avatarUrl: member.profiles?.avatar_url ?? null,
    role: member.role,
  }));

  return (
    <TripShell trip={trip} memberCount={people.length} active="people">
      <PeoplePanel tripName={trip.name} inviteCode={trip.invite_code} members={people} />
    </TripShell>
  );
}

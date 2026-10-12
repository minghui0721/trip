import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ExpenseForm } from "../expense-form";

export default async function NewExpensePage({ params }: PageProps<"/trips/[id]/expenses/new">) {
  const { id } = await params;
  const { supabase, user } = await requireUser(`/trips/${id}/expenses/new`);

  const { data: trip } = await supabase.from("trips").select("id, name").eq("id", id).maybeSingle();
  if (!trip) notFound();

  const { data: members } = await supabase
    .from("trip_members")
    .select("user_id, profiles(display_name)")
    .eq("trip_id", trip.id)
    .order("joined_at");

  const people = (members ?? []).map((member) => ({
    id: member.user_id,
    name: member.profiles?.display_name ?? "Someone",
  }));

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-secondary to-background to-40%">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-12 md:max-w-lg md:pt-12">
        <Link
          href={`/trips/${trip.id}/expenses`}
          aria-label="Back to the trip"
          className="-ml-1 flex size-9 items-center justify-center rounded-full bg-black/30 transition-colors hover:bg-black/50"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{trip.name}</p>
          <h1 className="mt-1 text-4xl font-black tracking-tighter md:text-5xl">Add an expense</h1>
        </div>
        <ExpenseForm tripId={trip.id} people={people} currentUserId={user.id} />
      </main>
    </div>
  );
}

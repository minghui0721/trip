import { TripBoard } from "./trip-board";

// Reopening this trip within 30 seconds uses the copy already on the phone.
// Saving clears it, so the next open asks Supabase again.
export const unstable_dynamicStaleTime = 30;

export default async function TripPage({ params }: PageProps<"/trips/[id]">) {
  const { id } = await params;
  return <TripBoard tripId={id} tab="itinerary" />;
}

import { TripBoard } from "./trip-board";

export default async function TripPage({ params }: PageProps<"/trips/[id]">) {
  const { id } = await params;
  return <TripBoard tripId={id} tab="itinerary" />;
}

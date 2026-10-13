import { TripBoard } from "../trip-board";

export default async function TripPlacesPage({ params }: PageProps<"/trips/[id]/places">) {
  const { id } = await params;
  return <TripBoard tripId={id} tab="places" />;
}

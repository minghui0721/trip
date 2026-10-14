import { TripBoard } from "../trip-board";

export const unstable_dynamicStaleTime = 30;

export default async function TripPlacesPage({ params }: PageProps<"/trips/[id]/places">) {
  const { id } = await params;
  return <TripBoard tripId={id} tab="places" />;
}

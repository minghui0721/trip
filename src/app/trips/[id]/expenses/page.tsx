import { TripBoard } from "../trip-board";

export const unstable_dynamicStaleTime = 30;

export default async function TripExpensesPage({ params }: PageProps<"/trips/[id]/expenses">) {
  const { id } = await params;
  return <TripBoard tripId={id} tab="expenses" />;
}

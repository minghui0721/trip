import { TripBoard } from "../trip-board";

export default async function TripExpensesPage({ params }: PageProps<"/trips/[id]/expenses">) {
  const { id } = await params;
  return <TripBoard tripId={id} tab="expenses" />;
}

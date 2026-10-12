"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateTripState = { error?: string };

export async function createTrip(
  _prev: CreateTripState,
  formData: FormData,
): Promise<CreateTripState> {
  const name = String(formData.get("name") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim() || null;
  const startDate = String(formData.get("start_date") ?? "") || null;
  const endDate = String(formData.get("end_date") ?? "") || null;

  if (!name) return { error: "Please give your trip a name." };
  if (name.length > 100) return { error: "Trip name is too long (max 100 characters)." };
  if (destination && destination.length > 100) {
    return { error: "Destination is too long (max 100 characters)." };
  }
  if (startDate && endDate && endDate < startDate) {
    return { error: "End date can't be before the start date." };
  }

  const supabase = await createClient();
  // The database fills in created_by and the invite code, and adds you as owner.
  const { data, error } = await supabase
    .from("trips")
    .insert({ name, destination, start_date: startDate, end_date: endDate })
    .select("id")
    .single();

  if (error) return { error: "Couldn't create the trip. Please try again." };

  redirect(`/trips/${data.id}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { isIsoDate } from "@/lib/itinerary";
import { createClient } from "@/lib/supabase/server";

export type CreateTripState = { error?: string };

export type UpdateTripState = { error?: string; saved?: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readTripFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim() || null;
  const startDate = String(formData.get("start_date") ?? "") || null;
  const endDate = String(formData.get("end_date") ?? "") || null;

  if (!name) return { error: "Please give your trip a name." };
  if (name.length > 100) return { error: "Trip name is too long (max 100 characters)." };
  if (destination && destination.length > 100) {
    return { error: "Destination is too long (max 100 characters)." };
  }
  if (startDate && !isIsoDate(startDate)) return { error: "That start date isn't valid." };
  if (endDate && !isIsoDate(endDate)) return { error: "That end date isn't valid." };
  if (startDate && endDate && endDate < startDate) {
    return { error: "End date can't be before the start date." };
  }

  return { name, destination, startDate, endDate };
}

export async function createTrip(
  _prev: CreateTripState,
  formData: FormData,
): Promise<CreateTripState> {
  const fields = readTripFields(formData);
  if ("error" in fields) return fields;
  const { name, destination, startDate, endDate } = fields;

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

export async function updateTrip(
  _prev: UpdateTripState,
  formData: FormData,
): Promise<UpdateTripState> {
  const tripId = String(formData.get("trip_id") ?? "");
  if (!UUID.test(tripId)) return { error: "This trip could not be found." };

  const fields = readTripFields(formData);
  if ("error" in fields) return fields;

  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${tripId}`)}`);

  const { data, error } = await supabase
    .from("trips")
    .update({
      name: fields.name,
      destination: fields.destination,
      start_date: fields.startDate,
      end_date: fields.endDate,
    })
    .eq("id", tripId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: "Couldn't save the trip. Please try again." };

  revalidatePath("/");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/places`);
  revalidatePath(`/trips/${tripId}/expenses`);
  return { saved: true };
}

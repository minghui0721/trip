"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isIsoDate, isTime } from "@/lib/itinerary";
import { createClient } from "@/lib/supabase/server";

export type ItineraryFormState = { error?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID.test(value);
}

function readItem(formData: FormData) {
  const tripId = String(formData.get("trip_id") ?? "");
  const placeId = String(formData.get("place_id") ?? "");
  const day = String(formData.get("day") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!isUuid(tripId)) return { error: "This trip could not be found." };
  if (placeId && !isUuid(placeId)) return { error: "That place isn't on this trip." };
  if (!isIsoDate(day)) return { error: "Pick a date." };
  if (startsAt && !isTime(startsAt)) return { error: "That time isn't valid." };
  if (!title) return { error: "Please say what you're doing." };
  if (title.length > 100) return { error: "That's too long (max 100 characters)." };
  if (notes.length > 500) return { error: "Notes are too long (max 500 characters)." };

  return {
    tripId,
    placeId: placeId || null,
    day,
    startsAt: startsAt || null,
    title,
    notes: notes || null,
  };
}

function writeError(message: string | undefined, fallback: string) {
  if (message?.includes("itinerary_items") || message?.includes("schema cache")) {
    return "The itinerary isn't set up yet. Run supabase/migrations/0006_v2_itinerary.sql in the Supabase SQL Editor.";
  }
  return fallback;
}

async function placeOnTrip(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tripId: string,
  placeId: string | null,
) {
  if (!placeId) return true;
  const { data } = await supabase
    .from("places")
    .select("id")
    .eq("id", placeId)
    .eq("trip_id", tripId)
    .maybeSingle();
  return Boolean(data);
}

export async function createItineraryItem(
  _prev: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const item = readItem(formData);
  if ("error" in item) return item;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${item.tripId}/itinerary/new`)}`);

  if (!(await placeOnTrip(supabase, item.tripId, item.placeId))) {
    return { error: "That place isn't on this trip." };
  }

  const { error } = await supabase.from("itinerary_items").insert({
    trip_id: item.tripId,
    place_id: item.placeId,
    day: item.day,
    starts_at: item.startsAt,
    title: item.title,
    notes: item.notes,
  });
  if (error) return { error: writeError(error.message, "Couldn't add this. Please try again.") };

  revalidatePath(`/trips/${item.tripId}`);
  redirect(`/trips/${item.tripId}`);
}

export async function updateItineraryItem(
  _prev: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const itemId = String(formData.get("item_id") ?? "");
  const item = readItem(formData);
  if (!isUuid(itemId)) return { error: "This plan could not be found." };
  if ("error" in item) return item;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/trips/${item.tripId}/itinerary/${itemId}/edit`)}`);
  }

  if (!(await placeOnTrip(supabase, item.tripId, item.placeId))) {
    return { error: "That place isn't on this trip." };
  }

  const { data, error } = await supabase
    .from("itinerary_items")
    .update({
      place_id: item.placeId,
      day: item.day,
      starts_at: item.startsAt,
      title: item.title,
      notes: item.notes,
    })
    .eq("id", itemId)
    .eq("trip_id", item.tripId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { error: writeError(error?.message, "Couldn't save this. Please try again.") };
  }

  revalidatePath(`/trips/${item.tripId}`);
  redirect(`/trips/${item.tripId}`);
}

export async function deleteItineraryItem(formData: FormData) {
  const tripId = String(formData.get("trip_id") ?? "");
  const itemId = String(formData.get("item_id") ?? "");
  if (!isUuid(tripId) || !isUuid(itemId)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${tripId}`)}`);

  await supabase.from("itinerary_items").delete().eq("id", itemId).eq("trip_id", tripId);
  revalidatePath(`/trips/${tripId}`);
}

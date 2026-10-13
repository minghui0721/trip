"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isPlaceCategory, isPlaceStatus, placePhotosBucket } from "@/lib/place";
import { currentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type PlaceFormState = { error?: string; placeId?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID.test(value);
}

function coordinate(value: FormDataEntryValue | null, min: number, max: number) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  if (!Number.isFinite(number) || number < min || number > max) return "invalid" as const;
  return number;
}

function readPlace(formData: FormData) {
  const tripId = String(formData.get("trip_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const latitude = coordinate(formData.get("latitude"), -90, 90);
  const longitude = coordinate(formData.get("longitude"), -180, 180);

  if (!isUuid(tripId)) return { error: "This trip could not be found." };
  if (!name) return { error: "Please give the place a name." };
  if (name.length > 100) return { error: "Name is too long (max 100 characters)." };
  if (!isPlaceCategory(category)) return { error: "Pick a category." };
  if (notes.length > 500) return { error: "Notes are too long (max 500 characters)." };
  if (location.length > 500) return { error: "Location is too long (max 500 characters)." };
  if (latitude === "invalid" || longitude === "invalid") return { error: "That map pin isn't valid." };
  if ((latitude === null) !== (longitude === null)) return { error: "That map pin isn't valid." };

  return {
    tripId,
    name,
    category,
    notes: notes || null,
    location: location || null,
    latitude,
    longitude,
  };
}

function placeWriteError(message: string | undefined, fallback: string) {
  if (message?.includes("latitude") || message?.includes("longitude")) {
    return "Map pins aren't set up yet. Run supabase/migrations/0005_v1_place_map.sql in the Supabase SQL Editor.";
  }
  if (message?.includes("location")) {
    return "Location isn't set up yet. Run supabase/migrations/0004_v1_place_details.sql in the Supabase SQL Editor.";
  }
  return fallback;
}

export async function createPlace(
  _prev: PlaceFormState,
  formData: FormData,
): Promise<PlaceFormState> {
  const place = readPlace(formData);
  if ("error" in place) return place;

  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${place.tripId}/places/new`)}`);

  const { data, error } = await supabase
    .from("places")
    .insert({
      trip_id: place.tripId,
      name: place.name,
      category: place.category,
      notes: place.notes,
      location: place.location,
      latitude: place.latitude,
      longitude: place.longitude,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { error: placeWriteError(error?.message, "Couldn't add this place. Please try again.") };
  }

  revalidatePath(`/trips/${place.tripId}/places`);
  return { placeId: data.id };
}

export async function updatePlace(
  _prev: PlaceFormState,
  formData: FormData,
): Promise<PlaceFormState> {
  const placeId = String(formData.get("place_id") ?? "");
  const place = readPlace(formData);
  if (!isUuid(placeId)) return { error: "This place could not be found." };
  if ("error" in place) return place;

  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/trips/${place.tripId}/places/${placeId}/edit`)}`);
  }

  const { data, error } = await supabase
    .from("places")
    .update({
      name: place.name,
      category: place.category,
      notes: place.notes,
      location: place.location,
      latitude: place.latitude,
      longitude: place.longitude,
    })
    .eq("id", placeId)
    .eq("trip_id", place.tripId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { error: placeWriteError(error?.message, "Couldn't save this place. Please try again.") };
  }

  revalidatePath(`/trips/${place.tripId}`);
  revalidatePath(`/trips/${place.tripId}/places`);
  redirect(`/trips/${place.tripId}/places`);
}

export async function setPlaceStatus(formData: FormData) {
  const tripId = String(formData.get("trip_id") ?? "");
  const placeId = String(formData.get("place_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!isUuid(tripId) || !isUuid(placeId) || !isPlaceStatus(status)) return;

  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${tripId}/places`)}`);

  await supabase.from("places").update({ status }).eq("id", placeId).eq("trip_id", tripId);
  revalidatePath(`/trips/${tripId}/places`);
}

export async function deletePlace(formData: FormData) {
  const tripId = String(formData.get("trip_id") ?? "");
  const placeId = String(formData.get("place_id") ?? "");
  if (!isUuid(tripId) || !isUuid(placeId)) return;

  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${tripId}/places`)}`);

  const { data: photos } = await supabase.from("place_photos").select("path").eq("place_id", placeId);
  const paths = (photos ?? []).map((photo) => photo.path);
  if (paths.length > 0) await supabase.storage.from(placePhotosBucket).remove(paths);

  await supabase.from("places").delete().eq("id", placeId).eq("trip_id", tripId);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/places`);
}

export async function deletePlacePhoto(formData: FormData) {
  const tripId = String(formData.get("trip_id") ?? "");
  const placeId = String(formData.get("place_id") ?? "");
  const photoId = String(formData.get("photo_id") ?? "");
  if (!isUuid(tripId) || !isUuid(placeId) || !isUuid(photoId)) return;

  const supabase = await createClient();
  const user = await currentUser(supabase);
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${tripId}/places`)}`);

  const { data: place } = await supabase
    .from("places")
    .select("id")
    .eq("id", placeId)
    .eq("trip_id", tripId)
    .maybeSingle();
  if (!place) return;

  const { data: photo } = await supabase
    .from("place_photos")
    .select("path")
    .eq("id", photoId)
    .eq("place_id", placeId)
    .maybeSingle();
  if (!photo) return;

  await supabase.storage.from(placePhotosBucket).remove([photo.path]);
  await supabase.from("place_photos").delete().eq("id", photoId);
  revalidatePath(`/trips/${tripId}/places`);
}

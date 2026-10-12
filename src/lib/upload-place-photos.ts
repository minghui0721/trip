"use client";

import { placePhotoExtension, placePhotosBucket } from "@/lib/place";
import { createClient } from "@/lib/supabase/client";

// Uploads files for a place that already exists. Returns an error message, or null.
export async function uploadPlacePhotos(tripId: string, placeId: string, files: File[]) {
  const supabase = createClient();
  for (const file of files) {
    const extension = placePhotoExtension(file.type);
    if (!extension) return "Use a JPEG, PNG, or WebP photo.";
    const path = `${tripId}/${placeId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(placePhotosBucket).upload(path, file, {
      contentType: file.type,
    });
    if (uploadError) return "Couldn't upload that photo. Please try again.";
    const { error: insertError } = await supabase.from("place_photos").insert({ place_id: placeId, path });
    if (insertError) {
      await supabase.storage.from(placePhotosBucket).remove([path]);
      return "Couldn't save that photo. Please try again.";
    }
  }
  return null;
}

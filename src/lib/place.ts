export const placeCategories = ["eat", "stay", "see", "do"] as const;
export type PlaceCategory = (typeof placeCategories)[number];

export const placeStatuses = ["going", "idea", "skipped"] as const;
export type PlaceStatus = (typeof placeStatuses)[number];

export const placeCategoryLabel: Record<PlaceCategory, string> = {
  eat: "Eat",
  stay: "Stay",
  see: "See",
  do: "Do",
};

export const placeStatusLabel: Record<PlaceStatus, string> = {
  going: "Going",
  idea: "Idea",
  skipped: "Skip",
};

export const placeStatusGroupLabel: Record<PlaceStatus, string> = {
  going: "Going",
  idea: "Ideas",
  skipped: "Skipped",
};

export const placePhotosBucket = "place-photos";
export const maxPlacePhotos = 8;
export const maxPlacePhotoBytes = 5 * 1024 * 1024;

const placePhotoTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function placePhotoExtension(type: string) {
  return placePhotoTypes[type] ?? null;
}

// Null when these files can be added on top of `already` saved or chosen photos.
export function placePhotoError(files: File[], already: number) {
  if (files.length === 0) return null;
  if (already >= maxPlacePhotos || already + files.length > maxPlacePhotos) {
    return `You can add up to ${maxPlacePhotos} photos.`;
  }
  for (const file of files) {
    if (!placePhotoExtension(file.type)) return "Use a JPEG, PNG, or WebP photo.";
    if (file.size > maxPlacePhotoBytes) return "Each photo must be under 5 MB.";
  }
  return null;
}

// An address opens in Google Maps search. A pasted http(s) link is opened as-is.
export function placeMapHref(
  location: string,
  latitude?: number | null,
  longitude?: number | null,
) {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
  const trimmed = location.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

export function placeLocationLabel(location: string) {
  return /^https?:\/\//i.test(location.trim()) ? "Open map" : location.trim();
}

export function isPlaceCategory(value: string): value is PlaceCategory {
  return (placeCategories as readonly string[]).includes(value);
}

export function isPlaceStatus(value: string): value is PlaceStatus {
  return (placeStatuses as readonly string[]).includes(value);
}

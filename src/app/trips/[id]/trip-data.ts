import { requireUser } from "@/lib/auth";
import { centsFromAmount } from "@/lib/expense";
import { isPlaceCategory, isPlaceStatus, placePhotosBucket } from "@/lib/place";
import type { ItineraryItem } from "./itinerary-section";
import type { TripPlace } from "./places-section";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

export async function loadTripShell(supabase: Supabase, tripId: string) {
  const [{ data: trip }, { data: memberRows }] = await Promise.all([
    supabase
      .from("trips")
      .select("id, name, destination, start_date, end_date, invite_code")
      .eq("id", tripId)
      .maybeSingle(),
    supabase.from("trip_members").select("user_id").eq("trip_id", tripId),
  ]);
  return { trip, memberCount: memberRows?.length ?? 0 };
}

export async function loadExpenses(supabase: Supabase, tripId: string): Promise<{
  expenses: {
    id: string;
    title: string;
    cents: number;
    currency: string;
    payments: { userId: string; cents: number }[];
    spentOn: string | null;
    shares: { userId: string; cents: number }[];
  }[];
  unavailable?: "missing" | "failed";
}> {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, title, amount, currency, spent_on")
    .eq("trip_id", tripId)
    .order("spent_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    const missing = error.code === "PGRST205" || error.message.includes("schema cache");
    return { expenses: [], unavailable: missing ? "missing" : "failed" };
  }

  const rows = (data ?? []).flatMap((expense) => {
    const cents = centsFromAmount(expense.amount);
    if (cents === null || cents <= 0) return [];
    return [{
      id: expense.id,
      title: expense.title,
      cents,
      currency: expense.currency,
      payments: [] as { userId: string; cents: number }[],
      spentOn: expense.spent_on,
      shares: [] as { userId: string; cents: number }[],
    }];
  });
  if (rows.length === 0) return { expenses: rows };

  const ids = rows.map((expense) => expense.id);
  const byExpense = new Map(rows.map((expense) => [expense.id, expense]));
  const paymentResult = await supabase
    .from("expense_payments")
    .select("expense_id, user_id, amount")
    .in("expense_id", ids);
  if (
    paymentResult.error &&
    (paymentResult.error.code === "PGRST205" || paymentResult.error.message.includes("expense_payments"))
  ) {
    const legacy = await supabase.from("expenses").select("id, payer_id").in("id", ids);
    for (const row of legacy.data ?? []) {
      const expense = byExpense.get(row.id);
      if (expense && row.payer_id) expense.payments.push({ userId: row.payer_id, cents: expense.cents });
    }
  } else if (paymentResult.error) {
    return { expenses: [], unavailable: "failed" };
  } else {
    for (const payment of paymentResult.data ?? []) {
      const expense = byExpense.get(payment.expense_id);
      const cents = centsFromAmount(payment.amount);
      if (!expense || cents === null || cents <= 0) continue;
      expense.payments.push({ userId: payment.user_id, cents });
    }
  }

  const { data: splits, error: splitError } = await supabase
    .from("expense_splits")
    .select("expense_id, user_id, amount")
    .in("expense_id", ids);
  if (splitError) {
    const missing = splitError.code === "PGRST205" || splitError.message.includes("schema cache");
    return { expenses: [], unavailable: missing ? "missing" : "failed" };
  }

  for (const split of splits ?? []) {
    const expense = byExpense.get(split.expense_id);
    const cents = centsFromAmount(split.amount);
    if (!expense || cents === null || cents <= 0) continue;
    expense.shares.push({ userId: split.user_id, cents });
  }
  return { expenses: rows };
}

export async function loadItinerary(
  supabase: Supabase,
  tripId: string,
): Promise<{ items: ItineraryItem[]; unavailable?: "missing" | "failed" }> {
  const { data, error } = await supabase
    .from("itinerary_items")
    .select("id, day, starts_at, title, notes, place_id")
    .eq("trip_id", tripId)
    .order("day")
    .order("starts_at", { ascending: true, nullsFirst: false })
    .order("created_at");

  if (error) {
    const missing = error.code === "PGRST205" || error.message.includes("schema cache");
    return { items: [], unavailable: missing ? "missing" : "failed" };
  }

  return {
    items: (data ?? []).map((item) => ({
      id: item.id,
      day: item.day,
      startsAt: item.starts_at,
      title: item.title,
      notes: item.notes,
      placeId: item.place_id,
      placeName: null,
    })),
  };
}

export async function loadPlaces(supabase: Supabase, tripId: string): Promise<{
  places: TripPlace[];
  placesUnavailable?: "missing" | "failed";
  detailsMissing: boolean;
  mapMissing: boolean;
}> {
  const withMap = await supabase
    .from("places")
    .select("id, name, category, status, notes, location, latitude, longitude")
    .eq("trip_id", tripId)
    .order("created_at");

  let detailsMissing = false;
  let mapMissing = false;
  let rows = withMap.data;
  let placesError = withMap.error;
  if (placesError && /latitude|longitude/i.test(placesError.message)) {
    mapMissing = true;
    const withLocation = await supabase
      .from("places")
      .select("id, name, category, status, notes, location")
      .eq("trip_id", tripId)
      .order("created_at");
    placesError = withLocation.error;
    rows = (withLocation.data ?? []).map((place) => ({ ...place, latitude: null, longitude: null }));
  }
  if (placesError && /location/i.test(placesError.message)) {
    detailsMissing = true;
    const fallback = await supabase
      .from("places")
      .select("id, name, category, status, notes")
      .eq("trip_id", tripId)
      .order("created_at");
    placesError = fallback.error;
    rows = (fallback.data ?? []).map((place) => ({
      ...place,
      location: null,
      latitude: null,
      longitude: null,
    }));
  }

  const placesUnavailable = placesError
    ? placesError.code === "PGRST205" || placesError.message.includes("schema cache")
      ? "missing"
      : "failed"
    : undefined;

  const base: TripPlace[] = (rows ?? []).flatMap((place) =>
    isPlaceCategory(place.category) && isPlaceStatus(place.status)
      ? [{
          ...place,
          location: place.location,
          latitude: place.latitude,
          longitude: place.longitude,
          photos: [],
        }]
      : [],
  );
  if (placesUnavailable || detailsMissing || base.length === 0) {
    return { places: base, placesUnavailable, detailsMissing, mapMissing };
  }

  const { data: photoRows, error: photoError } = await supabase
    .from("place_photos")
    .select("id, place_id, path")
    .in("place_id", base.map((place) => place.id));
  if (photoError) {
    const missing = photoError.code === "PGRST205" || photoError.message.includes("schema cache");
    return { places: base, placesUnavailable, detailsMissing: missing || detailsMissing, mapMissing };
  }
  if (!photoRows?.length) return { places: base, placesUnavailable, detailsMissing, mapMissing };

  const { data: signed } = await supabase.storage
    .from(placePhotosBucket)
    .createSignedUrls(photoRows.map((photo) => photo.path), 60 * 60);
  const urlByPath = new Map(
    (signed ?? []).flatMap((item) => (item.signedUrl ? [[item.path, item.signedUrl] as const] : [])),
  );
  const photosByPlace = new Map<string, TripPlace["photos"]>();
  for (const photo of photoRows) {
    const url = urlByPath.get(photo.path);
    if (!url) continue;
    const list = photosByPlace.get(photo.place_id) ?? [];
    list.push({ id: photo.id, url });
    photosByPlace.set(photo.place_id, list);
  }

  return {
    places: base.map((place) => ({ ...place, photos: photosByPlace.get(place.id) ?? [] })),
    placesUnavailable,
    detailsMissing,
    mapMissing,
  };
}

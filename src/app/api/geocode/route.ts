import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OpenStreetMap search. The browser cannot set a User-Agent, which Nominatim requires,
// so signed-in requests are proxied from here.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");

  const url = new URL(
    lat && lon
      ? "https://nominatim.openstreetmap.org/reverse"
      : "https://nominatim.openstreetmap.org/search",
  );
  url.searchParams.set("format", "jsonv2");
  if (lat && lon) {
    if (!isCoord(lat, -90, 90) || !isCoord(lon, -180, 180)) {
      return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
    }
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);
  } else {
    if (query.length < 2 || query.length > 200) return NextResponse.json([]);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "5");
  }

  const response = await fetch(url, {
    headers: { "User-Agent": "JalanJalan/0.1 (personal trip planner)" },
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ error: "Map search failed." }, { status: 502 });

  const body = await response.json();
  const rows = Array.isArray(body) ? body : [body];
  const results = rows.flatMap((row: { lat?: string; lon?: string; display_name?: string }) => {
    const latitude = Number(row.lat);
    const longitude = Number(row.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !row.display_name) return [];
    return [{ latitude, longitude, label: row.display_name }];
  });
  return NextResponse.json(results);
}

function isCoord(value: string, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

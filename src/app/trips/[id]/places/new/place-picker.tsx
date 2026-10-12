"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPinValue = { latitude: number; longitude: number; label: string };

type SearchResult = MapPinValue;

export function PlacePicker({
  destination,
  pin,
  onChange,
}: {
  destination: string | null;
  pin?: { latitude: number; longitude: number } | null;
  onChange: (pin: MapPinValue) => void;
}) {
  const mapElement = useRef<HTMLDivElement>(null);
  const chooseRef = useRef<(pin: MapPinValue) => void>(() => {});
  const onChangeRef = useRef(onChange);
  const initialPin = useRef(pin);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const element = mapElement.current;
    if (!element) return;
    let cancelled = false;
    let map: LeafletMap | null = null;
    let marker: Marker | null = null;

    async function start() {
      const L = (await import("leaflet")).default;
      if (cancelled || !element) return;

      map = L.map(element, { zoomControl: true }).setView([20, 100], 3);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "place-pin",
        html: '<span class="place-pin-dot"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      function drop(next: MapPinValue, notify: boolean) {
        if (!map) return;
        if (!marker) marker = L.marker([next.latitude, next.longitude], { icon }).addTo(map);
        else marker.setLatLng([next.latitude, next.longitude]);
        map.setView([next.latitude, next.longitude], notify ? Math.max(map.getZoom(), 15) : 15);
        if (!notify) return;
        void (async () => {
          const label = next.label || (await reverseLabel(next.latitude, next.longitude));
          onChangeRef.current({ ...next, label });
        })();
      }

      chooseRef.current = (next) => drop(next, true);

      map.on("click", (event) => {
        chooseRef.current({ latitude: event.latlng.lat, longitude: event.latlng.lng, label: "" });
      });

      const savedPin = initialPin.current;
      if (savedPin) {
        drop({ ...savedPin, label: "" }, false);
      } else if (destination) {
        const found = await searchPlaces(destination);
        if (!cancelled && found[0] && map) map.setView([found[0].latitude, found[0].longitude], 11);
      }
      map.invalidateSize();
    }

    void start();
    return () => {
      cancelled = true;
      chooseRef.current = () => {};
      map?.remove();
    };
  }, [destination]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      void searchPlaces(query.trim()).then((found) => {
        setResults(found);
        setSearching(false);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <label className="font-bold" htmlFor="map-search">Find on the map</label>
      <input
        id="map-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search a street, cafe, or area"
        className="h-12 rounded-md bg-input px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {searching && <p className="text-sm text-muted-foreground">Searching…</p>}
      {results.length > 0 && (
        <ul className="overflow-hidden rounded-md bg-card">
          {results.map((result) => (
            <li key={`${result.latitude},${result.longitude}`}>
              <button
                type="button"
                onClick={() => {
                  chooseRef.current(result);
                  setQuery(result.label);
                  setResults([]);
                }}
                className="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-white/10"
              >
                {result.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition((position) => {
            chooseRef.current({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              label: "",
            });
          });
        }}
        className="cursor-pointer self-start text-sm font-semibold text-primary hover:underline"
      >
        Use my location
      </button>
      <div ref={mapElement} className="z-0 h-64 overflow-hidden rounded-xl" />
      <p className="text-sm text-muted-foreground">Tap the map to drop a pin.</p>
    </div>
  );
}

async function searchPlaces(query: string): Promise<SearchResult[]> {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  if (!response.ok) return [];
  const body = await response.json();
  return Array.isArray(body) ? body : [];
}

async function reverseLabel(latitude: number, longitude: number) {
  const response = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
  if (!response.ok) return "";
  const body = await response.json();
  return Array.isArray(body) && body[0]?.label ? String(body[0].label) : "";
}

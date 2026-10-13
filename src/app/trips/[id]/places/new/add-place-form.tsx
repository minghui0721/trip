"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maxPlacePhotos, placeCategories, placeCategoryLabel, placePhotoError } from "@/lib/place";
import { uploadPlacePhotos } from "@/lib/upload-place-photos";
import { cn } from "@/lib/utils";
import { createPlace } from "../../../place-actions";
import type { MapPinValue } from "./place-picker";

const PlacePicker = dynamic(
  () => import("./place-picker").then((mod) => mod.PlacePicker),
  { ssr: false, loading: () => <div className="h-64 rounded-xl bg-card" /> },
);

export function AddPlaceForm({
  tripId,
  destination,
  onDone,
}: {
  tripId: string;
  destination: string | null;
  onDone?: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>();
  const [phase, setPhase] = useState<"idle" | "saving" | "uploading">("idle");
  const [saved, setSaved] = useState(false);
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const pending = phase !== "idle";

  function onPin(pin: MapPinValue) {
    setLatitude(pin.latitude);
    setLongitude(pin.longitude);
    if (pin.label) setLocation(pin.label);
  }

  function addFiles(list: FileList | null) {
    const incoming = [...(list ?? [])];
    if (inputRef.current) inputRef.current.value = "";
    const problem = placePhotoError(incoming, files.length);
    if (problem) {
      setError(problem);
      return;
    }
    setError(undefined);
    setFiles((current) => [...current, ...incoming]);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || saved) return;
    setPhase("saving");
    setError(undefined);
    const result = await createPlace({}, new FormData(event.currentTarget));
    if (result.error || !result.placeId) {
      setError(result.error ?? "Couldn't add this place. Please try again.");
      setPhase("idle");
      return;
    }
    if (files.length > 0) {
      setPhase("uploading");
      const uploadError = await uploadPlacePhotos(tripId, result.placeId, files);
      if (uploadError) {
        setSaved(true);
        setPhase("idle");
        setError("The place was added, but the photos didn't upload. You can add them from the trip page.");
        router.refresh();
        return;
      }
    }
    if (onDone) {
      onDone();
      router.refresh();
      return;
    }
    router.push(`/trips/${tripId}/places`);
  }

  const buttonLabel = phase === "uploading" ? "Uploading photos…" : phase === "saving" ? "Adding…" : "Add place";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <input type="hidden" name="trip_id" value={tripId} />
      <input type="hidden" name="latitude" value={latitude ?? ""} />
      <input type="hidden" name="longitude" value={longitude ?? ""} />
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Pho Thin"
          required
          maxLength={100}
          className="h-12 rounded-md bg-input px-3 text-base"
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="font-bold">Category</legend>
        <div className="flex flex-wrap gap-2">
          {placeCategories.map((category) => (
            <label
              key={category}
              className={cn(
                "cursor-pointer rounded-full bg-card px-4 py-2 text-sm font-semibold",
                "has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
              )}
            >
              <input type="radio" name="category" value={category} required className="sr-only" />
              {placeCategoryLabel[category]}
            </label>
          ))}
        </div>
      </fieldset>
      <PlacePicker destination={destination} onChange={onPin} />
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="location">Location (optional)</Label>
        <Input
          id="location"
          name="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Street address, or drop a pin above"
          maxLength={500}
          className="h-12 rounded-md bg-input px-3 text-base"
        />
        <p className="text-sm text-muted-foreground">A pin fills this in. You can shorten it, or paste a maps link instead.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          maxLength={500}
          rows={4}
          placeholder="Queue is long. Go early."
          className="rounded-md bg-input px-3 py-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="font-bold">Photos (optional)</Label>
        {files.length > 0 && (
          <ul className="flex gap-2 overflow-x-auto">
            {files.map((file, index) => (
              <ChosenPhoto
                key={`${file.name}-${file.lastModified}-${index}`}
                file={file}
                onRemove={() => setFiles((current) => current.filter((_, i) => i !== index))}
              />
            ))}
          </ul>
        )}
        {files.length < maxPlacePhotos && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(event) => addFiles(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              disabled={pending || saved}
              onClick={() => inputRef.current?.click()}
            >
              Add photo
            </Button>
          </>
        )}
        <p className="text-sm text-muted-foreground">JPEG, PNG, or WebP. Up to {maxPlacePhotos}, 5 MB each.</p>
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      {saved ? (
        <Link href={`/trips/${tripId}/places`} className={cn(buttonVariants({ size: "lg" }), "mt-2 h-12 px-6 text-base")}>
          Back to the trip
        </Link>
      ) : (
        <Button type="submit" size="lg" className="mt-2 h-12 text-base" disabled={pending}>
          {buttonLabel}
        </Button>
      )}
    </form>
  );
}

function ChosenPhoto({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <li className="relative size-24 shrink-0">
      {/* Local preview only; nothing is uploaded until the place is created. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="size-full rounded-md object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white"
      >
        Remove
      </button>
    </li>
  );
}

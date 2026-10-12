"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { maxPlacePhotos, placePhotoError } from "@/lib/place";
import { uploadPlacePhotos } from "@/lib/upload-place-photos";
import { deletePlacePhoto } from "../place-actions";

export type PlacePhoto = { id: string; url: string };

export function PlacePhotos({
  tripId,
  placeId,
  photos,
}: {
  tripId: string;
  placeId: string;
  photos: PlacePhoto[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const remaining = maxPlacePhotos - photos.length;
  const viewing = viewIndex !== null ? photos[viewIndex] : undefined;

  function showPhoto(index: number) {
    if (photos.length === 0) return;
    setViewIndex((index + photos.length) % photos.length);
  }

  useEffect(() => {
    if (viewIndex === null) return;
    if (viewIndex >= photos.length) {
      setViewIndex(photos.length === 0 ? null : photos.length - 1);
    }
  }, [photos.length, viewIndex]);

  async function onFiles(list: FileList | null) {
    const files = [...(list ?? [])];
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;
    if (remaining <= 0) {
      setError(`You can add up to ${maxPlacePhotos} photos.`);
      return;
    }

    const chosen = files.slice(0, remaining);
    const problem = placePhotoError(chosen, photos.length);
    if (problem) {
      setError(problem);
      return;
    }

    setError(undefined);
    setUploading(true);
    const uploadError = await uploadPlacePhotos(tripId, placeId, chosen);
    setUploading(false);
    if (uploadError) {
      setError(uploadError);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {photos.length > 0 && (
        <ul className="flex gap-2 overflow-x-auto">
          {photos.map((photo, index) => (
            <li key={photo.id} className="relative size-24 shrink-0">
              <button
                type="button"
                aria-label="View photo"
                onClick={() => setViewIndex(index)}
                className="size-24 cursor-pointer overflow-hidden rounded-md"
              >
                {/* Signed URLs change every load, so the image optimizer would not help. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="size-full object-cover" />
              </button>
              {confirmingId !== photo.id && (
                <button
                  type="button"
                  onClick={() => setConfirmingId(photo.id)}
                  className="absolute top-1 right-1 cursor-pointer rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white"
                >
                  Remove
                </button>
              )}
              {confirmingId === photo.id && (
                <form
                  action={deletePlacePhoto}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-md bg-black/70 p-1"
                >
                  <input type="hidden" name="trip_id" value={tripId} />
                  <input type="hidden" name="place_id" value={placeId} />
                  <input type="hidden" name="photo_id" value={photo.id} />
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="text-xs font-semibold text-white"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="text-xs font-semibold text-red-300">
                    Remove
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      {remaining > 0 && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(event) => onFiles(event.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Add photo"}
          </Button>
        </>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {viewing && viewIndex !== null && (
        <PhotoViewer
          url={viewing.url}
          index={viewIndex}
          count={photos.length}
          onClose={() => setViewIndex(null)}
          onPrevious={() => showPhoto(viewIndex - 1)}
          onNext={() => showPhoto(viewIndex + 1)}
        />
      )}
    </div>
  );
}

function PhotoViewer({
  url,
  index,
  count,
  onClose,
  onPrevious,
  onNext,
}: {
  url: string;
  index: number;
  count: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const drag = useRef({ x: 0, swiped: false });
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  const onPreviousRef = useRef(onPrevious);
  const onNextRef = useRef(onNext);
  onCloseRef.current = onClose;
  onPreviousRef.current = onPrevious;
  onNextRef.current = onNext;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key === "ArrowRight" && count > 1) onNextRef.current();
      if (event.key === "ArrowLeft" && count > 1) onPreviousRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [count, mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
      className="fixed inset-0 z-50 animate-in bg-black text-white fade-in-0 duration-200"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent" />
      <button
        ref={closeRef}
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-4 z-10 flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-colors hover:bg-white/25"
      >
        <X className="size-5" />
      </button>
      <div
        className={`flex h-full items-center justify-center px-4 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] ${count > 1 ? "pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))]" : "pb-[max(1.25rem,env(safe-area-inset-bottom))]"}`}
        onClick={(event) => {
          if (drag.current.swiped) {
            drag.current.swiped = false;
            return;
          }
          if (event.target === event.currentTarget) onClose();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="max-h-full max-w-full animate-in rounded-lg object-contain fade-in-0 zoom-in-95 duration-200"
          onClick={(event) => event.stopPropagation()}
          onTouchStart={(event) => {
            drag.current.x = event.changedTouches[0]?.clientX ?? 0;
            drag.current.swiped = false;
          }}
          onTouchEnd={(event) => {
            if (count < 2) return;
            const dx = (event.changedTouches[0]?.clientX ?? drag.current.x) - drag.current.x;
            if (dx <= -48) {
              drag.current.swiped = true;
              onNext();
            } else if (dx >= 48) {
              drag.current.swiped = true;
              onPrevious();
            }
          }}
        />
      </div>
      {count > 1 && (
        <div className="absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] flex justify-center">
          <div className="flex items-center gap-1 rounded-full bg-white/15 p-1 backdrop-blur-md">
            <button
              type="button"
              aria-label="Previous photo"
              onClick={onPrevious}
              className="flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/15"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="min-w-14 text-center text-sm font-semibold tabular-nums">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              aria-label="Next photo"
              onClick={onNext}
              className="flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/15"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

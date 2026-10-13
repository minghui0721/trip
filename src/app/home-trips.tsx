"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AvatarStack, type Person } from "@/components/avatar-stack";
import { buttonVariants } from "@/components/ui/button";
import { formatDateRange } from "@/lib/format";
import { tripColor } from "@/lib/trip-color";
import { localToday, statusLabel, tripStatus, type TripStatus } from "@/lib/trip-status";
import { markReturnHome } from "@/lib/return-home";
import { cn } from "@/lib/utils";

export type HomeTrip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  members: Person[];
};

type WithStatus = HomeTrip & { status: TripStatus };

const noop = () => () => {};

// "Today" depends on the viewer's time zone, so trips are sorted in the browser.
// The server's date is used for the first render, then corrected if different.
export function HomeTrips({ trips, serverToday }: { trips: HomeTrip[]; serverToday: string }) {
  const today = useSyncExternalStore(noop, localToday, () => serverToday);

  if (trips.length === 0) return <EmptyState />;

  const all: WithStatus[] = trips.map((t) => ({ ...t, status: tripStatus(t, today) }));
  const ongoing = all.filter((t) => t.status.kind === "ongoing");
  const upcoming = all
    .filter((t) => t.status.kind === "upcoming")
    .sort((a, b) => a.start_date!.localeCompare(b.start_date!));
  const undated = all.filter((t) => t.status.kind === "undated");
  const past = all
    .filter((t) => t.status.kind === "past")
    .sort((a, b) => (b.end_date ?? b.start_date!).localeCompare(a.end_date ?? a.start_date!));

  // The big card: a trip happening now, otherwise the next one coming up.
  const soon = [...ongoing, ...upcoming, ...undated];
  const featured = soon[0];
  const rest = soon.slice(1);

  return (
    <div className="flex flex-col gap-10">
      {featured && <FeaturedTrip trip={featured} />}
      {rest.length > 0 && <TripGrid title="Coming up" trips={rest} />}
      {past.length > 0 && <TripGrid title="Past trips" trips={past} dim />}
    </div>
  );
}

function FeaturedTrip({ trip }: { trip: WithStatus }) {
  const color = tripColor(trip.id);
  const dates = formatDateRange(trip.start_date, trip.end_date);
  const label = trip.status.kind === "ongoing" ? "Happening now" : "Next trip";

  return (
    <Link
      href={`/trips/${trip.id}`}
      onClick={markReturnHome}
      className="group relative block overflow-hidden rounded-2xl p-5 md:p-8 md:pt-12 shadow-xl shadow-black/40 transition-transform active:scale-[0.99]"
      style={{ background: `linear-gradient(135deg, ${color.solid}, ${color.deep})` }}
    >
      <div className="md:flex md:items-end md:justify-between md:gap-8">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-widest text-white/70 uppercase">{label}</p>
          <p className="mt-2 text-4xl leading-[0.95] font-black tracking-tighter break-words text-white md:text-6xl">
            {trip.name}
          </p>
          {(trip.destination || dates) && (
            <p className="mt-3 text-sm font-medium text-white/80 md:text-base">
              {[trip.destination, dates].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="mt-8 flex shrink-0 items-end justify-between gap-3 md:mt-0 md:flex-col md:items-end md:gap-4">
          <AvatarStack people={trip.members} />
          <span className="rounded-full bg-black/30 px-3 py-1.5 text-sm font-bold text-white">
            ✈️ {statusLabel(trip.status)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function TripGrid({ title, trips, dim }: { title: string; trips: WithStatus[]; dim?: boolean }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {trips.map((trip) => {
          const color = tripColor(trip.id);
          return (
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.id}`}
                onClick={markReturnHome}
                className="block rounded-lg bg-card p-3 transition-colors hover:bg-secondary"
              >
                <div
                  className={cn(
                    "flex aspect-square flex-col justify-between rounded-md p-3 shadow-lg shadow-black/40",
                    dim && "opacity-60 grayscale-[60%]",
                  )}
                  style={{ background: `linear-gradient(135deg, ${color.solid}, ${color.deep})` }}
                >
                  <AvatarStack people={trip.members} max={3} />
                  <p className="line-clamp-3 text-xl leading-tight font-black tracking-tight text-white">
                    {trip.name}
                  </p>
                </div>
                <p className="mt-3 truncate text-sm font-bold">{trip.destination ?? trip.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {dim
                    ? formatDateRange(trip.start_date, trip.end_date)
                    : statusLabel(trip.status)}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-card px-6 py-12 text-center md:py-20">
      <p className="text-5xl" aria-hidden>
        🧳
      </p>
      <div>
        <p className="text-xl font-extrabold tracking-tight">No trips yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first trip, then share the link with your friends.
        </p>
      </div>
      <Link href="/trips/new" className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base")}>
        Plan a trip
      </Link>
    </div>
  );
}

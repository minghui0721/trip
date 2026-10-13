import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { formatDateRange } from "@/lib/format";
import { tripColor } from "@/lib/trip-color";
import { cn } from "@/lib/utils";

export type TripTab = "itinerary" | "places" | "expenses" | "people";

const tabs = [
  { id: "itinerary", label: "Itinerary", href: (id: string) => `/trips/${id}` },
  { id: "places", label: "Places", href: (id: string) => `/trips/${id}/places` },
  { id: "expenses", label: "Expenses", href: (id: string) => `/trips/${id}/expenses` },
] as const;

export function TripShell({
  trip,
  memberCount,
  active,
  showTabs = true,
  children,
}: {
  trip: {
    id: string;
    name: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  memberCount: number;
  active: TripTab;
  showTabs?: boolean;
  children: React.ReactNode;
}) {
  const color = tripColor(trip.id);
  const dates = formatDateRange(trip.start_date, trip.end_date);
  const facts = [trip.destination, dates].filter(Boolean);

  return (
    <div className="flex flex-1 flex-col">
      <header
        className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-6 md:px-8 md:pt-8"
        style={{ background: `linear-gradient(to bottom, ${color.solid}, ${color.deep} 70%, var(--background))` }}
      >
        <div className="mx-auto w-full max-w-md md:max-w-5xl">
          <Link
            href="/"
            aria-label="Back to your trips"
            className="-ml-1 flex size-9 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <p className="mt-16 text-xs font-bold tracking-widest text-white/70 uppercase md:mt-24">Trip</p>
          <h1 className="mt-1 text-5xl leading-[0.95] font-black tracking-tighter break-words text-white md:text-8xl">
            {trip.name}
          </h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 text-sm font-medium text-white/80 md:text-base">
            {facts.map((fact, index) => (
              <span key={`${index}-${fact}`} className="contents">
                {index > 0 && <span aria-hidden="true">·</span>}
                <span>{fact}</span>
              </span>
            ))}
            {facts.length > 0 && <span aria-hidden="true">·</span>}
            <Link
              href={`/trips/${trip.id}/people`}
              aria-current={active === "people" ? "page" : undefined}
              className={cn(
                "underline-offset-4 hover:text-white hover:underline",
                active === "people" && "text-white underline",
              )}
            >
              {memberCount} member{memberCount === 1 ? "" : "s"}
            </Link>
          </p>
        </div>
      </header>
      {showTabs && (
      <nav
        aria-label="Trip sections"
        className="sticky top-[env(safe-area-inset-top)] z-20 border-b border-white/10 bg-background/90 px-5 backdrop-blur-md md:px-8"
      >
        <div className="mx-auto flex w-full max-w-md gap-1 py-2 md:max-w-5xl">
          {tabs.map((tab) => {
            const current = tab.id === active;
            return (
              <Link
                key={tab.id}
                href={tab.href(trip.id)}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  current
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
      )}
      {showTabs ? (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-6 pb-12 md:max-w-5xl md:px-8">
          {children}
        </main>
      ) : (
        children
      )}
    </div>
  );
}

// Works out whether a trip is happening now, coming up, or over.
// All dates are "YYYY-MM-DD" strings in the viewer's local calendar.

type Dated = { start_date: string | null; end_date: string | null };

export type TripStatus =
  | { kind: "ongoing"; day: number; totalDays: number }
  | { kind: "upcoming"; daysToGo: number }
  | { kind: "undated" }
  | { kind: "past" };

// Today's date in the viewer's time zone, e.g. "2026-09-24".
export function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDays(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export function tripStatus(trip: Dated, today: string): TripStatus {
  const start = trip.start_date ?? trip.end_date;
  if (!start) return { kind: "undated" };
  const end = trip.end_date ?? start;

  const now = toDays(today);
  if (now < toDays(start)) return { kind: "upcoming", daysToGo: toDays(start) - now };
  if (now > toDays(end)) return { kind: "past" };
  return {
    kind: "ongoing",
    day: now - toDays(start) + 1,
    totalDays: toDays(end) - toDays(start) + 1,
  };
}

export function statusLabel(status: TripStatus) {
  switch (status.kind) {
    case "ongoing":
      return status.totalDays === 1 ? "Happening today" : `Day ${status.day} of ${status.totalDays}`;
    case "upcoming":
      return status.daysToGo === 1 ? "Tomorrow!" : `${status.daysToGo} days to go`;
    case "undated":
      return "Dates to be decided";
    case "past":
      return "Done";
  }
}

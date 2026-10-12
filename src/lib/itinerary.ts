const dayLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const MAX_PLANNED_DAYS = 21;

export function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

// "09:00:00" → "09:00"
export function formatTime(time: string) {
  return time.slice(0, 5);
}

// "Day 2 · Tue 2 Dec" when the trip has a start date, otherwise "Tue 2 Dec".
export function formatItineraryDay(date: string, start: string | null) {
  const label = dayLabel.format(new Date(`${date}T00:00:00Z`));
  if (!start || !isIsoDate(start) || date < start) return label;
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const dayMs = Date.parse(`${date}T00:00:00Z`);
  const n = Math.round((dayMs - startMs) / 86_400_000) + 1;
  return `Day ${n} · ${label}`;
}

// Every day from start through end, when the trip is at most 21 days.
// Longer trips, or trips without both dates, return null and the plan
// lists only the days that already have something on them.
export function plannedDays(start: string | null, end: string | null) {
  if (!start || !end || !isIsoDate(start) || !isIsoDate(end) || end < start) return null;
  const days: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  while (days.length <= MAX_PLANNED_DAYS) {
    const day = cursor.toISOString().slice(0, 10);
    days.push(day);
    if (day === end) return days;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return null;
}

export function itineraryDays(planned: string[] | null, itemDays: string[]) {
  return [...new Set([...(planned ?? []), ...itemDays])].sort();
}

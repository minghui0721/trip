const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// "2026-12-01" → "1 Dec 2026"
export function formatDate(date: string) {
  // Dates have no time zone; read them as UTC so they don't shift a day.
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}

export function formatDateRange(start: string | null, end: string | null) {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return null;
}

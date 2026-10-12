// Only allow redirects to paths on this site, e.g. "/trips/123".
// Blocks "https://evil.com" and "//evil.com" so the login flow can't be
// used to send people to another website.
export function safeNext(next: string | null | undefined) {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

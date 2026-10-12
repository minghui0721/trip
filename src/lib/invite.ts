// Invite codes are the first 12 hex characters of a uuid (see 0001_v0_trips.sql).
const INVITE_CODE = /^[0-9a-f]{12}$/;

export function normalizeInviteCode(code: string) {
  const normalized = code.trim().toLowerCase();
  if (!INVITE_CODE.test(normalized)) return null;
  return normalized;
}

// Each trip gets its own color (like an album cover on Spotify), picked from
// its id so it stays the same every time.
const hues = [25, 55, 145, 195, 230, 265, 300, 340];

export function tripColor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = hues[hash % hues.length];
  return {
    solid: `oklch(0.55 0.16 ${hue})`,
    deep: `oklch(0.35 0.12 ${hue})`,
  };
}

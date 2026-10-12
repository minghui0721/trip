// A still of the OpenStreetMap tiles around a pin, without loading a full map.
export function PlaceMapStill({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const zoom = 15;
  const size = 2 ** zoom;
  const xFloat = ((longitude + 180) / 360) * size;
  const latRad = (latitude * Math.PI) / 180;
  const yFloat =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * size;
  const x0 = Math.floor(xFloat) - 1;
  const y0 = Math.floor(yFloat) - 1;
  const tiles = [];
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) {
      const x = ((x0 + column) % size + size) % size;
      const y = y0 + row;
      tiles.push({
        key: `${x}-${y}`,
        url: y >= 0 && y < size ? `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png` : null,
      });
    }
  }
  const left = `${((xFloat - x0) / 3) * 100}%`;
  const top = `${((yFloat - y0) / 3) * 100}%`;

  return (
    <div className="relative h-36 overflow-hidden rounded-lg">
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
        {tiles.map((tile) =>
          tile.url ? (
            // Tiles are already images; the optimizer would refetch them on every signed page load.
            // eslint-disable-next-line @next/next/no-img-element
            <img key={tile.key} src={tile.url} alt="" className="size-full object-cover" />
          ) : (
            <div key={tile.key} className="bg-muted" />
          ),
        )}
      </div>
      <span
        className="place-pin-dot absolute"
        style={{ left, top, transform: "translate(-50%, -50%)" }}
      />
      <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
        © OpenStreetMap
      </span>
    </div>
  );
}

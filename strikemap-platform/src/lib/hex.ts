import { offsetLatLng } from "./geo";

/** Axial hex to local meters (flat-top). */
function hexCorner(center: { lat: number; lng: number }, sizeM: number, i: number) {
  const angle = (Math.PI / 180) * (60 * i - 30);
  const east = sizeM * Math.cos(angle);
  const north = sizeM * Math.sin(angle);
  return offsetLatLng(center.lat, center.lng, north, east);
}

export function hexPolygon(center: { lat: number; lng: number }, sizeM: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const p = hexCorner(center, sizeM, i);
    pts.push([p.lng, p.lat]);
  }
  pts.push(pts[0]);
  return pts;
}

/** Generate hex territory grid inside circle. */
export function generateHexTerritories(
  centerLat: number,
  centerLng: number,
  radiusM: number,
  hexSizeM: number,
): { id: string; center: { lat: number; lng: number }; polygon: [number, number][] }[] {
  const territories: { id: string; center: { lat: number; lng: number }; polygon: [number, number][] }[] = [];
  const rings = Math.ceil(radiusM / (hexSizeM * 1.5)) + 1;
  let idx = 0;
  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      const east = hexSizeM * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
      const north = hexSizeM * ((3 / 2) * r);
      const center = offsetLatLng(centerLat, centerLng, north, east);
      const dist = Math.sqrt(east * east + north * north);
      if (dist > radiusM) continue;
      const id = `sector_${String(idx).padStart(3, "0")}`;
      idx++;
      territories.push({
        id,
        center,
        polygon: hexPolygon(center, hexSizeM * 0.92),
      });
    }
  }
  return territories.slice(0, 120);
}

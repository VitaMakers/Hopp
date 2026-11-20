// The map projection shared by the country outlines (world.ts) and the dots:
// x is the longitude, y the Mercator latitude, both in degrees.
export function project(lon: number, lat: number): [number, number] {
  const l = Math.max(-80, Math.min(84, lat));
  return [lon, -Math.log(Math.tan(Math.PI / 4 + (l * Math.PI) / 360)) * (180 / Math.PI)];
}

export type Box = [number, number, number, number];

// The whole world, for when no country is selected.
export const WORLD_BOX: Box = [-170, -75, 180, 62];

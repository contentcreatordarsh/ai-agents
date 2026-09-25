import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GameStatePayload } from "../../../src/shared/contracts/events";
import { TEAM_COLORS, type TeamColor } from "../../../src/shared/contracts/game";

type Props = {
  snapshot: GameStatePayload | null;
  center?: { lat: number; lng: number };
};

export function GameMap({ snapshot, center }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const layerReady = useRef(false);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    try {
      const map = new maplibregl.Map({
        container: ref.current,
        style: {
          version: 8,
          sources: {
            dark: {
              type: "raster",
              tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"],
              tileSize: 256,
            },
          },
          layers: [{ id: "dark", type: "raster", source: "dark" }],
        },
        center: center ? [center.lng, center.lat] : [103.8198, 1.3521],
        zoom: 12,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;
      map.on("load", () => {
        map.addSource("territories", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({
          id: "territory-fill",
          type: "fill",
          source: "territories",
          paint: { "fill-color": ["get", "color"], "fill-opacity": 0.35 },
        });
        map.addLayer({
          id: "territory-line",
          type: "line",
          source: "territories",
          paint: { "line-color": "#00ffd5", "line-width": 1.2 },
        });
        map.addSource("players", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({
          id: "players",
          type: "circle",
          source: "players",
          paint: {
            "circle-radius": 7,
            "circle-color": ["get", "color"],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        });
        layerReady.current = true;
      });
    } catch {
      /* noop */
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layerReady.current || !snapshot) return;
    const features = snapshot.territories.map((t) => ({
      type: "Feature" as const,
      properties: {
        color: t.ownerTeam ? TEAM_COLORS[t.ownerTeam] : "#334155",
      },
      geometry: t.polygon,
    }));
    (map.getSource("territories") as maplibregl.GeoJSONSource)?.setData({
      type: "FeatureCollection",
      features,
    });
    const players = snapshot.players
      .filter((p) => p.location)
      .map((p) => ({
        type: "Feature" as const,
        properties: { color: TEAM_COLORS[p.team as TeamColor] },
        geometry: {
          type: "Point" as const,
          coordinates: [p.location!.lng, p.location!.lat],
        },
      }));
    (map.getSource("players") as maplibregl.GeoJSONSource)?.setData({
      type: "FeatureCollection",
      features: players,
    });
  }, [snapshot]);

  return <div ref={ref} className="game-map" style={{ position: "absolute", inset: 0 }} />;
}

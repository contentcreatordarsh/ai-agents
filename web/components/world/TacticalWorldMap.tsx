"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useWorldScene } from "./WorldSceneContext";
import { palette } from "@/lib/art-direction";

const SECTOR_GEO: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "sector_01" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [103.805, 1.342],
            [103.835, 1.342],
            [103.835, 1.362],
            [103.805, 1.362],
            [103.805, 1.342],
          ],
        ],
      },
    },
  ],
};

export default function TacticalWorldMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { camera, hoveredBattleId, scrollScene } = useWorldScene();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          dark: {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© CARTO © OpenStreetMap",
          },
        },
        layers: [{ id: "dark", type: "raster", source: "dark" }],
      },
      center: [camera.lng, camera.lat],
      zoom: camera.zoom,
      pitch: camera.pitch,
      bearing: camera.bearing,
    });

    map.on("load", () => {
      map.addSource("sector", { type: "geojson", data: SECTOR_GEO });
      map.addLayer({
        id: "sector-fill",
        type: "fill",
        source: "sector",
        paint: {
          "fill-color": palette.signal,
          "fill-opacity": 0.12,
        },
      });
      map.addLayer({
        id: "sector-line",
        type: "line",
        source: "sector",
        paint: {
          "line-color": palette.signal,
          "line-width": 2,
          "line-opacity": 0.85,
        },
      });
      map.addLayer({
        id: "sector-glow",
        type: "line",
        source: "sector",
        paint: {
          "line-color": palette.pulse,
          "line-width": 6,
          "line-opacity": 0.25,
          "line-blur": 4,
        },
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [camera.lng, camera.lat],
      zoom: camera.zoom,
      pitch: camera.pitch,
      bearing: camera.bearing,
      speed: 0.65,
      curve: 1.4,
      essential: true,
    });
  }, [camera]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const contested = scrollScene === "territory" || hoveredBattleId;
    map.setPaintProperty("sector-fill", "fill-opacity", contested ? 0.22 : 0.12);
    map.setPaintProperty("sector-line", "line-color", contested ? palette.hostile : palette.signal);
  }, [scrollScene, hoveredBattleId]);

  return (
    <div className="world-map" ref={containerRef} aria-hidden>
      <div className="world-map-grid" />
      <div className="world-map-vignette" />
    </div>
  );
}

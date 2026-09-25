"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEMO_EVENTS, type StrikeEvent } from "@/lib/demo-events";

const severityColor: Record<StrikeEvent["severity"], string> = {
  high: "#e05252",
  medium: "#d4a020",
  low: "#4aba7a",
};

type Props = {
  onSelect: (evt: StrikeEvent) => void;
  selectedId: string | null;
  onFatalError: () => void;
};

export default function MapView({ onSelect, selectedId, onFatalError }: Props) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const onWindowError = (event: ErrorEvent) => {
      if (event.message?.includes("WebGL") || event.message?.includes("maplibre")) {
        onFatalError();
      }
    };
    window.addEventListener("error", onWindowError);

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [35.2, 31.8],
      zoom: 5.2,
    });
    } catch (e) {
      console.error("MapLibre init failed", e);
      onFatalError();
      return;
    }

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    for (const evt of DEMO_EVENTS) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "strike-marker";
      el.title = evt.title;
      el.style.cssText = `
        width:14px;height:14px;border-radius:50%;border:2px solid #fff;
        background:${severityColor[evt.severity]};cursor:pointer;
        box-shadow:0 0 12px ${severityColor[evt.severity]}88;
      `;
      el.addEventListener("click", () => {
        onSelect(evt);
        map.flyTo({ center: [evt.lng, evt.lat], zoom: 7, speed: 1.2 });
      });
      new maplibregl.Marker({ element: el }).setLngLat([evt.lng, evt.lat]).addTo(map);
    }

    return () => {
      window.removeEventListener("error", onWindowError);
      map.remove();
      mapRef.current = null;
    };
  }, [onSelect, onFatalError]);

  useEffect(() => {
    const evt = DEMO_EVENTS.find((e) => e.id === selectedId);
    if (evt && mapRef.current) {
      mapRef.current.flyTo({ center: [evt.lng, evt.lat], zoom: 7 });
    }
  }, [selectedId]);

  return <div ref={containerRef} className="map-inner" />;
}

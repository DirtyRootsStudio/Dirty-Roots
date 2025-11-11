// src/components/MapCanvas.tsx
"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
  height?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  selectable?: boolean;                // si true, al hacer click devuelve coords
  onSelectPosition?: (lat: number, lng: number) => void;
  markers?: { id: string; lat: number; lng: number }[];
};

export default function MapCanvas({
  height = "60vh",
  center = { lat: 52.520008, lng: 13.404954 }, // Berlín
  zoom = 12,
  selectable = false,
  onSelectPosition,
  markers = [],
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const listRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [center.lng, center.lat],
      zoom,
    });
    instanceRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    if (selectable && onSelectPosition) {
      map.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
        onSelectPosition(lat, lng);
      });
    }

    return () => {
      listRef.current.forEach(m => m.remove());
      markerRef.current?.remove();
      map.remove();
      instanceRef.current = null;
    };
  }, []);

  // render markers (places)
  useEffect(() => {
    const map = instanceRef.current;
    if (!map) return;
    listRef.current.forEach(m => m.remove());
    listRef.current = markers.map(m =>
      new maplibregl.Marker({ color: "#2dd4bf" })
        .setLngLat([m.lng, m.lat])
        .addTo(map)
    );
  }, [markers]);

  return <div ref={mapRef} style={{ width: "100%", height }} />;
}

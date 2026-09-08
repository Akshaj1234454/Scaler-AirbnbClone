'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

export default function LocationMapPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const center: [number, number] = [latitude, longitude];

  const pinIcon = useMemo(
    () =>
      L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ef4444, #f97316);
            border: 3px solid white;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.22);
            position: relative;
          "></div>
          <div style="
            position: absolute;
            left: 50%;
            top: 50%;
            width: 6px;
            height: 6px;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            background: rgba(255,255,255,0.9);
          "></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -12],
      }),
    [],
  );

  return (
    <div className="h-[280px] w-full overflow-hidden rounded-2xl border border-gray-200">
      <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterUpdater center={center} />
        <Marker
          position={center}
          draggable
          icon={pinIcon}
          eventHandlers={{
            dragend: (event) => {
              const marker = event.target;
              const position = marker.getLatLng();
              onChange(position.lat, position.lng);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}

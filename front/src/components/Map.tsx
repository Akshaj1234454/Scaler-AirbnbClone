'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRouter } from 'next/navigation';

const customIcon = L.divIcon({
  className: 'map-price-pin',
  html: `
    <div style="
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 70px;
      height: 28px;
      padding: 0 10px;
      border-radius: 9999px;
      background: rgba(255,255,255,0.96);
      border: 1px solid rgba(148,163,184,0.7);
      box-shadow: 0 10px 25px rgba(15,23,42,0.12);
      color: #111827;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      transform: translateY(-8px);
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    ">
      ₹${'${price}'}
    </div>
  `,
  iconSize: [90, 30],
  iconAnchor: [45, 30],
  popupAnchor: [0, -20],
});

export default function Map({ listings, center }: { listings: any[]; center: { lat: number; lng: number } }) {
  const router = useRouter();

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={11}
      minZoom={9}
      maxZoom={16}
      style={{ height: '720px', width: '100%', borderRadius: '24px' }}
      scrollWheelZoom
      dragging
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Circle center={[center.lat, center.lng]} radius={15000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }} />

      {listings.map((item) => {
        if (!item.latitude || !item.longitude) return null;

        const priceLabel = `₹${item.price_per_night}`;
        const customMarker = L.divIcon({
          className: 'map-price-pin',
          html: `
            <div style="
              position: relative;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 72px;
              height: 30px;
              padding: 0 11px;
              border-radius: 9999px;
              background: rgba(255,255,255,0.98);
              border: 1px solid rgba(148,163,184,0.7);
              box-shadow: 0 10px 22px rgba(15,23,42,0.12);
              color: #111827;
              font-size: 12px;
              font-weight: 700;
              white-space: nowrap;
              transform: translateY(-8px);
              cursor: pointer;
              transition: transform 0.18s ease, box-shadow 0.18s ease;
            ">${priceLabel}</div>
          `,
          iconSize: [90, 30],
          iconAnchor: [45, 30],
          popupAnchor: [0, -20],
        });

        return (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
            icon={customMarker}
          >
            <Popup>
              <div
                className="min-w-[190px] cursor-pointer rounded-xl bg-white p-2"
                onClick={() => router.push(`/listing/${item.id}`)}
              >
                <div className="mb-2 overflow-hidden rounded-lg">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'}
                    alt={item.title}
                    className="h-20 w-full object-cover"
                  />
                </div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{item.location}</p>
                <p className="mt-2 text-sm font-bold text-gray-900">₹{item.price_per_night} / night</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
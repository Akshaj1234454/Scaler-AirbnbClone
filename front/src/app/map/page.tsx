'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPinned } from 'lucide-react';
import { useRouter } from 'next/navigation';

const RealMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="flex h-[720px] items-center justify-center text-gray-500">Loading real map...</div>,
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface Listing {
  id: number;
  title: string;
  location: string;
  latitude?: number;
  longitude?: number;
  price_per_night: string;
  image_url?: string;
}

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export default function MapPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 12.9716, lng: 77.5946 });

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setMapCenter({ lat: 12.9716, lng: 77.5946 });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      );
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/listings/`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch listings');
        return res.json();
      })
      .then((data) => {
        setListings(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Map listings fetch failed:', error);
        setListings([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const nearbyItems = useMemo(() => {
    return listings.filter((item) => {
      if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') return false;
      return haversineKm(mapCenter.lat, mapCenter.lng, item.latitude, item.longitude) <= 15;
    });
  }, [listings, mapCenter]);

  const projectPoint = (lat: number, lng: number) => {
    const latKm = (lat - mapCenter.lat) * 111.32;
    const lngKm = (lng - mapCenter.lng) * 111.32 * Math.cos((mapCenter.lat * Math.PI) / 180);
    return {
      x: 960 / 2 + lngKm * 12,
      y: 700 / 2 - latKm * 12,
    };
  };

  const centerX = 960 / 2;
  const centerY = 700 / 2;
  const radiusPx = Math.min(960, 700) * 0.42;

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-800">
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700">
            <MapPinned className="h-4 w-4" /> 15 km radius map
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-sky-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Explore</p>
              <h1 className="text-2xl font-semibold text-gray-900">Map view</h1>
            </div>
            <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {nearbyItems.length} listings within 15 km
            </div>
          </div>

          <div className="relative bg-[#f7fafc] p-3 md:p-5">
            {loading ? (
                <div className="flex h-[720px] items-center justify-center text-gray-500">Loading data...</div>
            ) : (
                <div className="overflow-hidden rounded-[24px] border border-sky-200">
                <RealMap listings={nearbyItems} center={mapCenter} />
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}

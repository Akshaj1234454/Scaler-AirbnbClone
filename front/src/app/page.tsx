'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Flame, Palmtree, Mountain, Sparkles, Building, 
  Waves, TreePine, CalendarDays, Users, Minus, Plus, X, SlidersHorizontal,
  ChevronDown, LogOut, CalendarRange, MapPinned
} from 'lucide-react';

// --- TYPES & CONSTANTS ---
 
export interface Listing {
  id: number;
  title: string;
  location: string;
  latitude?: number;
  longitude?: number;
  price_per_night: string;
  category?: string;
  image_url?: string;
}

export interface GuestState {
  adults: number;
  children: number;
  pets: number;
}

export interface AppliedFilters {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: GuestState;
  minPrice: string;
  maxPrice: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const CATEGORIES = [
  { label: 'All', icon: Sparkles },
  { label: 'Trending', icon: Flame },
  { label: 'Beachfront', icon: Palmtree },
  { label: 'Cabins', icon: TreePine },
  { label: 'Mansions', icon: Building },
  { label: 'Lakefront', icon: Waves },
  { label: 'Countryside', icon: Mountain },
];

const DEFAULT_GUESTS: GuestState = { adults: 2, children: 0, pets: 0 };
const DEFAULT_FILTERS: AppliedFilters = {
  location: '', checkIn: '', checkOut: '', guests: DEFAULT_GUESTS, minPrice: '', maxPrice: '',
};

// --- UTILS ---

const formatDateLabel = (value: string) => {
  if (!value) return 'Add date';
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
};

const formatGuestLabel = (guestState: GuestState) => {
  const total = guestState.adults + guestState.children;
  if (!total && !guestState.pets) return 'Add guests';
  return `${total} ${total === 1 ? 'guest' : 'guests'}${guestState.pets ? `, ${guestState.pets} ${guestState.pets === 1 ? 'pet' : 'pets'}` : ''}`;
};

// --- COMPONENTS ---

const Header = ({
  draftFilters,
  setDraftFilters,
  handleSearchSave,
  activeModal,
  setActiveModal,
  router,
  currentUser,
  setUserMenuOpen,
  userMenuOpen,
  onLogout,
  onOpenBookings,
  onOpenMyListings,
}: any) => (
  <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4">
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
      <span className="text-rose-500 font-black text-2xl tracking-tight">airtnt</span>

      <div className="w-full max-w-4xl flex items-center border border-gray-300 rounded-full shadow-sm hover:shadow-md transition overflow-hidden bg-white">
        <div className="flex flex-1 items-center gap-3 px-4 py-3 min-w-0">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Where to?"
            value={draftFilters.location}
            onChange={(e) => setDraftFilters((c: any) => ({ ...c, location: e.target.value }))}
            className="outline-none text-sm w-full min-w-0"
          />
        </div>

        <div className="hidden sm:flex items-center w-full max-w-xl">
          <button
            type="button"
            onClick={() => setActiveModal(activeModal === 'date' ? null : 'date')}
            className="flex-1 text-left px-4 py-3 border-l border-gray-200 hover:bg-gray-50 transition"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Dates</div>
            <div className="text-sm text-gray-700">
              {draftFilters.checkIn || draftFilters.checkOut
                ? `${formatDateLabel(draftFilters.checkIn)} - ${formatDateLabel(draftFilters.checkOut)}`
                : 'Add dates'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal(activeModal === 'guests' ? null : 'guests')}
            className="flex-1 text-left px-4 py-3 border-l border-gray-200 hover:bg-gray-50 transition"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Guests</div>
            <div className="text-sm text-gray-700">{formatGuestLabel(draftFilters.guests)}</div>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSearchSave}
          className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 m-2 rounded-full transition flex items-center justify-center gap-2 font-medium"
        >
          <Search className="w-4 h-4" /> Save
        </button>
      </div>

      <div className="flex items-center gap-4">
        {currentUser ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((open: boolean) => !open)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
            >
              <span>{currentUser.username || 'guest'}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl z-50">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenBookings();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <CalendarRange className="h-4 w-4" />
                  My bookings
                </button>
                <div className="my-1 h-px bg-gray-200" />
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push('/host');
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <MapPinned className="h-4 w-4" />
                  Add yours
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenMyListings();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  My listings
                </button>
                <div className="my-1 h-px bg-gray-200" />
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Log in
          </button>
        )}
      </div>
    </div>
  </header>
);

const DateModal = ({ draftFilters, setDraftFilters, handleDateSave }: any) => (
  <div className="space-y-5 pt-2 animate-[fadeIn_180ms_ease-out]">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Date range</p>
      <h2 className="mt-2 text-2xl font-semibold text-gray-900">When are you going?</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label className="block rounded-2xl border border-gray-200 p-3">
        <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <CalendarDays className="w-4 h-4" /> Check-in
        </span>
        <input
          type="date"
          value={draftFilters.checkIn}
          onChange={(e) => setDraftFilters((c: any) => ({ ...c, checkIn: e.target.value }))}
          className="w-full bg-transparent text-sm text-gray-700 outline-none"
        />
      </label>
      <label className="block rounded-2xl border border-gray-200 p-3">
        <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <CalendarDays className="w-4 h-4" /> Check-out
        </span>
        <input
          type="date"
          value={draftFilters.checkOut}
          min={draftFilters.checkIn || undefined}
          onChange={(e) => setDraftFilters((c: any) => ({ ...c, checkOut: e.target.value }))}
          className="w-full bg-transparent text-sm text-gray-700 outline-none"
        />
      </label>
    </div>
    <div className="flex justify-end">
      <button onClick={handleDateSave} className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
        Done
      </button>
    </div>
  </div>
);

const GuestModal = ({ draftFilters, updateGuestCount, handleGuestSave }: any) => {
  const totalGuests = draftFilters.guests.adults + draftFilters.guests.children;
  
  return (
    <div className="space-y-5 pt-2 animate-[fadeIn_180ms_ease-out]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Guests</p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900">Who&apos;s coming?</h2>
      </div>
      <div className="space-y-4">
        {[
          { key: 'adults', label: 'Adults', description: 'Ages 13 or above' },
          { key: 'children', label: 'Children', description: 'Ages 2-12' },
          { key: 'pets', label: 'Pets', description: 'Furry friends' },
        ].map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div>
              <p className="font-medium text-gray-900">{label}</p>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateGuestCount(key, -1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={(draftFilters.guests[key] ?? 0) === 0}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="min-w-5 text-center text-base font-medium text-gray-900">{draftFilters.guests[key]}</span>
              <button onClick={() => updateGuestCount(key, 1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2">
        <div className="flex items-center gap-2 text-gray-700">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Total guests</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">{totalGuests}</span>
      </div>
      <div className="flex justify-end">
        <button onClick={handleGuestSave} className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Save
        </button>
      </div>
    </div>
  );
};

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

const MapView = ({ items, onClose, onSelectListing }: { items: Listing[]; onClose: () => void; onSelectListing: (id: number) => void }) => {
  const mapCenter = { lat: 12.9716, lng: 77.5946 };
  const mapRadiusKm = 30;
  const mapWidth = 760;
  const mapHeight = 520;
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const nearbyItems = items.filter((item) => {
    if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
      return false;
    }
    return haversineKm(mapCenter.lat, mapCenter.lng, item.latitude, item.longitude) <= mapRadiusKm;
  });

  const projectPoint = (lat: number, lng: number) => {
    const latKm = (lat - mapCenter.lat) * 111.32;
    const lngKm = (lng - mapCenter.lng) * 111.32 * Math.cos((mapCenter.lat * Math.PI) / 180);
    return {
      x: mapWidth / 2 + lngKm * 12 * zoom + offset.x,
      y: mapHeight / 2 - latKm * 12 * zoom + offset.y,
    };
  };

  const radiusPx = Math.min(mapWidth, mapHeight) * 0.42 * zoom;
  const centerX = mapWidth / 2 + offset.x;
  const centerY = mapHeight / 2 + offset.y;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    setOffset({ x: dragState.current.originX + dx, y: dragState.current.originY + dy });
  };

  const handlePointerUp = () => {
    dragState.current = null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35 px-4 py-6 backdrop-blur-[2px] animate-[fadeIn_160ms_ease-out]">
      <div className="relative w-full max-w-[1280px] overflow-hidden rounded-[30px] border border-sky-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.25)] ring-1 ring-white/80">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white/90 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Explore</p>
            <h2 className="text-2xl font-semibold text-gray-900">Map view</h2>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-lg text-gray-700">−</button>
            <button onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-lg text-gray-700">+</button>
            <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">Reset</button>
            <button onClick={onClose} className="rounded-full border border-gray-200 bg-white p-2 text-gray-700"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="relative bg-[radial-gradient(circle_at_center,_#d7ebff_0%,_#eaf5ff_28%,_#f4f7fb_100%)] p-4">
          <div
            className="relative overflow-hidden rounded-[26px] border-[3px] border-sky-200 bg-white/85 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.5)]"
            style={{ height: `${Math.min(mapHeight + 40, 640)}px` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <svg
              viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              className="h-full w-full cursor-grab active:cursor-grabbing"
              style={{ display: 'block', background: '#f5f8fb' }}
            >
              <defs>
                <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59,130,246,0.10)" strokeWidth="1"/>
                </pattern>
              </defs>

              <rect width={mapWidth} height={mapHeight} fill="url(#map-grid)" />
              <circle cx={centerX} cy={centerY} r={radiusPx} fill="rgba(59,130,246,0.10)" stroke="rgba(59,130,246,0.55)" strokeDasharray="8 10" />
              <circle cx={centerX} cy={centerY} r={radiusPx * 0.7} fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.35)" />

              {nearbyItems.map((item) => {
                const point = projectPoint(item.latitude ?? mapCenter.lat, item.longitude ?? mapCenter.lng);
                const label = item.title?.trim() || 'Listing';
                const shortLabel = label.length > 18 ? `${label.slice(0, 18)}…` : label;
                const padding = 12;
                const textWidth = Math.max(52, shortLabel.length * 7);

                return (
                  <g key={item.id} onClick={() => onSelectListing(item.id)} className="cursor-pointer">
                    <rect
                      x={point.x + 12}
                      y={point.y - 26}
                      width={textWidth + padding}
                      height={22}
                      rx={11}
                      fill="rgba(255,255,255,0.92)"
                      stroke="rgba(148,163,184,0.6)"
                    />
                    <text
                      x={point.x + 18}
                      y={point.y - 10}
                      fontSize="11"
                      fontWeight="600"
                      fill="#111827"
                    >
                      {shortLabel}
                    </text>
                    <circle cx={point.x} cy={point.y} r={12} fill="rgba(249,115,22,0.18)" />
                    <path d={`M ${point.x} ${point.y + 12} L ${point.x - 8} ${point.y + 22} L ${point.x + 8} ${point.y + 22} Z`} fill="#ef4444" />
                    <circle cx={point.x} cy={point.y} r={6} fill="#fff" stroke="#ef4444" strokeWidth={2} />
                  </g>
                );
              })}
            </svg>

            <div className="absolute bottom-4 left-4 rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-xs font-medium text-gray-700 shadow-sm">
              {nearbyItems.length} listings within 30 km
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryFilter = ({
  selectedCategory, setSelectedCategory, filterOpen, setFilterOpen, draftFilters, setDraftFilters, handleFilterSave, onOpenMap
}: any) => (
  <div className="max-w-7xl mx-auto px-6 py-4 border-b border-gray-100 relative z-20">
    <div className="relative flex items-center justify-center z-20">
      <div className="flex items-center gap-8">
        {CATEGORIES.map(({ label, icon: Icon }) => {
          const isActive = (label === 'All' && !selectedCategory) || selectedCategory === label;
          return (
            <button
              key={label}
              onClick={() => setSelectedCategory(label === 'All' ? '' : label)}
              className={`flex flex-col items-center gap-2 pb-2 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                isActive ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black hover:border-gray-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2">
        <div className="relative rounded-full border border-gray-200 bg-white shadow-sm z-30">
          <button
            onClick={onOpenMap}
            className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <MapPinned className="w-4 h-4" /> Map
          </button>
        </div>

        <div className="relative rounded-full border border-gray-200 bg-white shadow-sm z-30">
          <button
            onClick={() => setFilterOpen((c: boolean) => !c)}
            className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filter
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full z-[60] mt-3 w-[280px] rounded-3xl border border-gray-200 bg-white p-4 shadow-2xl animate-[fadeIn_180ms_ease-out]">
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Price range</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">Set your budget</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Minimum price</label>
                  <input
                    type="number" min="0" value={draftFilters.minPrice}
                    onChange={(e) => setDraftFilters((c: any) => ({ ...c, minPrice: e.target.value }))}
                    placeholder="₹0" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Maximum price</label>
                  <input
                    type="number" min="0" value={draftFilters.maxPrice}
                    onChange={(e) => setDraftFilters((c: any) => ({ ...c, maxPrice: e.target.value }))}
                    placeholder="₹5000" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                </div>
                <button onClick={handleFilterSave} className="w-full rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
                  Save filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const BookingCard = ({ booking }: { booking: any }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
    <div className="mb-2 overflow-hidden rounded-xl">
      <img
        src={booking.image_url || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'}
        alt={booking.listing_title}
        className="h-28 w-full object-cover"
      />
    </div>
    <div className="text-sm font-semibold text-gray-900">{booking.listing_title}</div>
    <div className="mt-1 text-xs text-gray-500">{booking.location}</div>
    <div className="mt-3 text-xs text-gray-600">
      {booking.check_in} to {booking.check_out}
    </div>
  </div>
);

const BookingsModal = ({ open, onClose, bookings, loading }: { open: boolean; onClose: () => void; bookings: any[]; loading: boolean }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 px-4 pt-20 animate-[fadeIn_150ms_ease-out]">
      <div className="relative w-full max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl animate-[fadeIn_180ms_ease-out]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Trips</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">My bookings</h2>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500">Loading your bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
            No bookings yet.
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-auto">
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-[44px_minmax(180px,1.8fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(150px,1.2fr)] gap-0 bg-[#2b2d31] text-xs font-semibold uppercase tracking-wide text-gray-200">
                <div className="px-4 py-3">ID</div>
                <div className="px-4 py-3">Listing</div>
                <div className="px-4 py-3">Guest</div>
                <div className="px-4 py-3">Check in</div>
                <div className="px-4 py-3">Check out</div>
              </div>

              {bookings.map((booking) => (
                <div key={booking.id} className="grid grid-cols-[44px_minmax(180px,1.8fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(150px,1.2fr)] border-t border-gray-200 bg-white text-sm text-gray-700">
                  <div className="px-4 py-3 font-medium text-gray-500">{booking.id}</div>
                  <div className="px-4 py-3 font-semibold text-gray-900">{booking.listing_title}</div>
                  <div className="px-4 py-3 text-gray-700">{booking.guest_name || 'Guest'}</div>
                  <div className="px-4 py-3">{booking.check_in}</div>
                  <div className="px-4 py-3">{booking.check_out}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MyListingsModal = ({ open, onClose, listings, loading, onSelectListing }: { open: boolean; onClose: () => void; listings: any[]; loading: boolean; onSelectListing: (id: number) => void }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 px-4 pt-20 animate-[fadeIn_150ms_ease-out]">
      <div className="relative w-full max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl animate-[fadeIn_180ms_ease-out]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Hosting</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">Your listings</h2>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500">Loading your listings...</div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
            No listings yet.
          </div>
        ) : (
          <div className="grid max-h-[70vh] gap-4 overflow-auto md:grid-cols-2">
            {listings.map((listing) => (
              <button
                key={listing.id}
                type="button"
                onClick={() => onSelectListing(listing.id)}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <img src={listing.image_url || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'} alt={listing.title} className="h-32 w-full object-cover" />
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-gray-900">{listing.title}</div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-700">{listing.category || 'Listing'}</span>
                  </div>
                  <div className="text-sm text-gray-600">{listing.location}</div>
                  <div className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">₹{listing.price_per_night}</span>
                    <span className="text-gray-500"> / night</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ListingCard = ({ item, onClick }: { item: Listing; onClick: (id: number) => void }) => (
  <button onClick={() => onClick(item.id)} className="flex flex-col gap-2 cursor-pointer group text-left">
    <div className="aspect-[4/3] w-full relative overflow-hidden rounded-xl bg-gray-200">
      <img
        src={item.image_url || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'}
        alt={item.title}
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="flex justify-between items-start text-xs mt-1">
      <span className="font-semibold text-gray-900 truncate">{item.location}</span>
      <span className="text-xs font-light">★ 4.9</span>
    </div>
    <p className="text-xs text-gray-500 truncate -mt-1">{item.title}</p>
    <div className="text-xs font-semibold text-gray-900">
      ₹{item.price_per_night} <span className="font-normal text-gray-500">night</span>
    </div>
  </button>
);

// --- MAIN PAGE ---

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id?: number; username?: string } | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [myListingsOpen, setMyListingsOpen] = useState(false);
  const [myListingsLoading, setMyListingsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const syncCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      setCurrentUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setCurrentUser(null);
    }
  };
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeModal, setActiveModal] = useState<'date' | 'guests' | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    syncCurrentUser();
    window.addEventListener('auth:change', syncCurrentUser);
    window.addEventListener('storage', syncCurrentUser);

    return () => {
      window.removeEventListener('auth:change', syncCurrentUser);
      window.removeEventListener('storage', syncCurrentUser);
    };
  }, []);

  const openBookingsModal = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setBookingsOpen(true);
    setBookingsLoading(true);

    try {
      const params = new URLSearchParams();
      if (currentUser.id) params.set('user_id', String(currentUser.id));

      const response = await fetch(`${API_BASE_URL}/api/my-bookings/?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const openMyListingsModal = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setMyListingsOpen(true);
    setMyListingsLoading(true);

    try {
      const params = new URLSearchParams();
      if (currentUser.id) params.set('user_id', String(currentUser.id));

      const response = await fetch(`${API_BASE_URL}/api/my-listings/?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch listings');
      const data = await response.json();
      setMyListings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setMyListings([]);
    } finally {
      setMyListingsLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();

    if (selectedCategory) params.append('category', selectedCategory);
    if (appliedFilters.location) params.append('location', appliedFilters.location);
    if (appliedFilters.checkIn) params.append('check_in', appliedFilters.checkIn);
    if (appliedFilters.checkOut) params.append('check_out', appliedFilters.checkOut);

    const totalGuests = appliedFilters.guests.adults + appliedFilters.guests.children;
    if (totalGuests || appliedFilters.guests.pets) {
      params.append('guests', String(totalGuests));
      params.append('pets', String(appliedFilters.guests.pets));
    }
    if (appliedFilters.minPrice) params.append('min_price', appliedFilters.minPrice);
    if (appliedFilters.maxPrice) params.append('max_price', appliedFilters.maxPrice);

    fetch(`${API_BASE_URL}/api/listings/?${params.toString()}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then((data) => {
        setListings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setListings([]);
        setLoading(false);
      });
  }, [selectedCategory, appliedFilters]);

  const updateGuestCount = (key: keyof GuestState, delta: number) => {
    setDraftFilters((current) => ({
      ...current,
      guests: { ...current.guests, [key]: Math.max(0, (current.guests[key] ?? 0) + delta) }
    }));
  };

  const handleSearchSave = () => setAppliedFilters({ ...draftFilters });
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout/`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:change'));
      router.push('/');
    }
  };
  const handleDateSave = () => {
    setAppliedFilters((c) => ({ ...c, checkIn: draftFilters.checkIn, checkOut: draftFilters.checkOut }));
    setActiveModal(null);
  };
  const handleGuestSave = () => {
    setAppliedFilters((c) => ({ ...c, guests: { ...draftFilters.guests } }));
    setActiveModal(null);
  };
  const handleFilterSave = () => {
    setAppliedFilters((c) => ({ ...c, minPrice: draftFilters.minPrice, maxPrice: draftFilters.maxPrice }));
    setFilterOpen(false);
  };

  const handleListingClick = async (listingId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/click/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send clicked listing ID');
      }

      const data = await response.json();
      console.log('Clicked listing ID sent to backend:', data.listing_id);
    } catch (error) {
      console.error('Error sending clicked listing ID:', error);
    }

    router.push(`/listing/${listingId}`);
  };

  const activeGuests = appliedFilters.guests.adults + appliedFilters.guests.children;

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        handleSearchSave={handleSearchSave}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        router={router}
        currentUser={currentUser}
        setUserMenuOpen={setUserMenuOpen}
        userMenuOpen={userMenuOpen}
        onLogout={handleLogout}
        onOpenBookings={openBookingsModal}
        onOpenMyListings={openMyListingsModal}
      />

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-24 px-4 animate-[fadeIn_150ms_ease-out]">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-200 animate-[fadeIn_180ms_ease-out]">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
            {activeModal === 'date' && <DateModal draftFilters={draftFilters} setDraftFilters={setDraftFilters} handleDateSave={handleDateSave} />}
            {activeModal === 'guests' && <GuestModal draftFilters={draftFilters} updateGuestCount={updateGuestCount} handleGuestSave={handleGuestSave} />}
          </div>
        </div>
      )}

      <CategoryFilter
        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
        filterOpen={filterOpen} setFilterOpen={setFilterOpen}
        draftFilters={draftFilters} setDraftFilters={setDraftFilters} handleFilterSave={handleFilterSave}
        onOpenMap={() => router.push('/map')}
      />

      <BookingsModal open={bookingsOpen} onClose={() => setBookingsOpen(false)} bookings={bookings} loading={bookingsLoading} />
      <MyListingsModal open={myListingsOpen} onClose={() => setMyListingsOpen(false)} listings={myListings} loading={myListingsLoading} onSelectListing={(listingId) => { setMyListingsOpen(false); router.push(`/listing/${listingId}`); }} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <div>
              {appliedFilters.location ? `Showing results for ${appliedFilters.location}` : `Showing ${listings.length} ${listings.length === 1 ? 'listing' : 'listings'}`}
            </div>
            <div className="flex items-center gap-2">
              <span>{activeGuests || appliedFilters.guests.pets ? `${activeGuests} guests` : 'Any guests'}</span>
              {(appliedFilters.minPrice || appliedFilters.maxPrice) && (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  ₹{appliedFilters.minPrice || '0'} - ₹{appliedFilters.maxPrice || '∞'}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading listings...</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No listings found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {listings.map((item) => (
                <ListingCard key={item.id} item={item} onClick={handleListingClick} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
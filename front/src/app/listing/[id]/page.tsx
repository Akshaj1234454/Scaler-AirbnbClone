'use client';

import { ArrowLeft, Minus, Plus, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface ReviewItem {
  id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ListingDetail {
  id: number;
  owner_id?: number;
  title: string;
  description: string;
  location: string;
  category: string;
  image_url: string;
  photos?: string[];
  amenities?: string[];
  owner_name?: string;
  booked_ranges?: { check_in: string; check_out: string }[];
  reviews?: ReviewItem[];
  average_rating?: number;
  price_per_night: string;
  pets: boolean;
  created_at: string;
}

const toISODate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [checkIn, setCheckIn] = useState<string>(toISODate(3));
  const [checkOut, setCheckOut] = useState<string>(toISODate(5));
  const [adultGuests, setAdultGuests] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [pets, setPets] = useState<number>(0);
  const [guestEditorOpen, setGuestEditorOpen] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const guests = adultGuests + children;
  const isOwner = currentUserId !== null && listing?.owner_id !== undefined && Number(listing.owner_id) === Number(currentUserId);

  const gallery = useMemo(() => {
    if (Array.isArray(listing?.photos) && listing.photos.length > 0) {
      return listing.photos;
    }

    return listing?.image_url ? [listing.image_url] : [];
  }, [listing]);

  const formattedPrice = Number(listing?.price_per_night || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffInMs = end.getTime() - start.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return diffInDays > 0 ? Math.ceil(diffInDays) : 0;
  }, [checkIn, checkOut]);

  const totalPrice = Number(listing?.price_per_night || 0) * Math.max(nights, 0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) {
        setCurrentUserId(null);
        return;
      }

      const parsedUser = JSON.parse(rawUser);
      setCurrentUserId(parsedUser?.id ? Number(parsedUser.id) : null);
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  useEffect(() => {
    if (listing && !listing.pets && pets > 0) {
      setPets(0);
    }
  }, [listing, pets]);

  const hasBookingConflict = useMemo(() => {
    if (!listing?.booked_ranges || !checkIn || !checkOut) return false;

    const newStart = new Date(checkIn);
    const newEnd = new Date(checkOut);

    return listing.booked_ranges.some((range) => {
      const rangeStart = new Date(range.check_in);
      const rangeEnd = new Date(range.check_out);
      return newStart < rangeEnd && newEnd > rangeStart;
    });
  }, [checkIn, checkOut, listing]);

  const showImage = (index: number) => setSelectedImageIndex(index);

  const goToNextImage = () => {
    if (!gallery.length) return;
    setSelectedImageIndex((current) => {
      if (current === null) return 0;
      return (current + 1) % gallery.length;
    });
  };

  const goToPreviousImage = () => {
    if (!gallery.length) return;
    setSelectedImageIndex((current) => {
      if (current === null) return gallery.length - 1;
      return (current - 1 + gallery.length) % gallery.length;
    });
  };

  const handleDelete = async () => {
    if (!listing || !id) return;

    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!storedUser) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    const userId = parsedUser?.id;
    if (!userId) {
      router.push('/login');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this listing?');
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/${id}/delete/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to delete listing.');
      }

      router.push('/');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Unable to delete listing.');
    }
  };

  const handleReserve = async () => {
    if (!listing || !id) return;

    if (!listing.pets && pets > 0) {
      setBookingError('This listing does not allow pets.');
      setBookingSuccess(null);
      return;
    }

    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!storedUser) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    const userId = parsedUser?.id;
    if (!userId) {
      router.push('/login');
      return;
    }

    if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
      setBookingError('Please choose a valid check-in and check-out date.');
      setBookingSuccess(null);
      return;
    }

    if (hasBookingConflict) {
      setBookingError('Those dates overlap with an existing booking.');
      setBookingSuccess(null);
      return;
    }

    if (!listing.pets && pets > 0) {
      setBookingError('This listing does not allow pets.');
      setBookingSuccess(null);
      return;
    }

    setSubmitting(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/${id}/book/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          check_in: checkIn,
          check_out: checkOut,
          guests: guests + children,
          pets,
          user_id: userId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to create reservation.');
      }

      const refreshed = await fetch(`${API_BASE_URL}/api/listings/${id}/`, { credentials: 'include' });
      if (refreshed.ok) {
        const nextListing = await refreshed.json();
        setListing(nextListing);
      }

      setBookingSuccess(`Reservation created for ${nights} night${nights === 1 ? '' : 's'}!`);
      router.push(`/booking-confirmed?listingId=${id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&total=${Math.round(totalPrice)}`);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Unable to create reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    let isActive = true;

    const fetchListing = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/listings/${id}/`, {
          signal: controller.signal,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch listing details');
        }

        const data = await response.json();
        if (isActive) {
          setListing(data);
        }
      } catch (err) {
        if (isActive && !(err instanceof DOMException && err.name === 'AbortError')) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchListing();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [id]);

  if (loading) {
    return <main className="min-h-screen px-6 py-10 text-gray-600">Loading listing...</main>;
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen px-6 py-10 text-gray-900">
        <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-rose-500">Could not load listing details.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-gray-900">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-4 gap-2 p-2">
          {gallery.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => showImage(0)}
                className="col-span-2 row-span-2 overflow-hidden rounded-2xl border-0 bg-transparent p-0 text-left"
              >
                <img src={gallery[0]} alt={listing.title} className="h-full w-full object-cover transition hover:opacity-95" />
              </button>

              {gallery.slice(1, 5).map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  onClick={() => showImage(index + 1)}
                  className="overflow-hidden rounded-2xl border-0 bg-transparent p-0 text-left"
                >
                  <img src={photo} alt={`${listing.title} ${index + 2}`} className="h-full w-full object-cover transition hover:opacity-95" />
                </button>
              ))}
            </>
          ) : (
            <div className="col-span-4 overflow-hidden rounded-2xl">
              <img
                src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200"
                alt={listing.title}
                className="h-[420px] w-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">{listing.category}</p>
              <h1 className="mt-3 text-3xl font-bold">{listing.title}</h1>
            </div>
            <div className="flex items-center gap-3">
              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => router.push(`/listing/${id}/edit`)}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </>
              )}
              <div className="rounded-full border border-gray-200 px-4 py-2 text-lg font-semibold">
                ₹{formattedPrice} <span className="text-sm font-normal text-gray-500">/ night</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="rounded-full bg-gray-100 px-3 py-1">{listing.location}</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">{listing.pets ? 'Pets allowed' : 'No pets'}</span>
            <span className="rounded-full bg-gray-100 px-3 py-1">Hosted by {listing.owner_name || 'Host'}</span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_360px]">
            <div>
              <p className="text-lg leading-8 text-gray-700">{listing.description || 'No description available for this listing.'}</p>

              <div className="mt-10 border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-semibold text-gray-900">What this place offers</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  {(listing.amenities && listing.amenities.length > 0 ? listing.amenities : ['Wifi', 'Parking']).map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-10 border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold text-gray-900">Reviews</h2>
                  <div className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
                    {Number(listing.average_rating || 0).toFixed(1)} / 5
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {(listing.reviews && listing.reviews.length > 0 ? listing.reviews : [
                    {
                      id: 1,
                      reviewer_name: 'Guest review',
                      rating: 5,
                      comment: 'A wonderful stay with a beautiful space and a very smooth check-in experience.',
                      created_at: new Date().toISOString(),
                    },
                  ]).map((review) => (
                    <div key={review.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                          <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="rounded-full bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-700">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="self-start rounded-[28px] border border-gray-200 bg-[#f5f5f5] p-5 shadow-sm">
              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-gray-500">Total</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[28px] font-bold tracking-tight text-gray-900">₹{Math.max(0, Math.round(totalPrice)).toLocaleString('en-IN')}</span>
                    <span className="text-sm text-gray-500">{nights > 0 ? `${nights} nights` : 'select dates'}</span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>₹{formattedPrice} / night</div>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-gray-300 bg-white">
                <div className="grid grid-cols-2 border-b border-gray-300">
                  <label className="border-r border-gray-300 p-3.5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Check-in</div>
                    <input
                      type="date"
                      value={checkIn}
                      min={toISODate(0)}
                      onChange={(event) => setCheckIn(event.target.value)}
                      className="mt-2 w-full border-0 bg-transparent text-[18px] font-medium text-gray-900 outline-none"
                    />
                  </label>
                  <label className="p-3.5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Checkout</div>
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn || toISODate(1)}
                      onChange={(event) => setCheckOut(event.target.value)}
                      className="mt-2 w-full border-0 bg-transparent text-[18px] font-medium text-gray-900 outline-none"
                    />
                  </label>
                </div>

                <div className="px-4 py-3.5 text-gray-700">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Guests</div>
                  <button
                    type="button"
                    onClick={() => setGuestEditorOpen(true)}
                    className="mt-2 flex w-full items-center justify-between rounded-xl border border-red-300 bg-[#fff6f7] px-3 py-3 text-left text-[18px] font-medium text-gray-900 outline-none transition hover:border-red-400"
                  >
                    <span>{guests === 1 ? '1 guest' : `${guests} guests`}{children > 0 ? `, ${children} child${children === 1 ? '' : 'ren'}` : ''}{pets > 0 ? `, ${pets} pet${pets === 1 ? '' : 's'}` : ''}</span>
                    <span className="text-xl text-gray-500">⌄</span>
                  </button>
                </div>

                {guestEditorOpen && (
                  <div className="mt-4 rounded-[28px] border border-gray-200 bg-white p-5 shadow-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Guests</div>
                      <button type="button" onClick={() => setGuestEditorOpen(false)} className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {[
                      { key: 'adults', label: 'Adults', description: 'Ages 13 or above', value: adultGuests, setter: setAdultGuests },
                      { key: 'children', label: 'Children', description: 'Ages 2-12', value: children, setter: setChildren },
                      { key: 'pets', label: 'Pets', description: 'Furry friends', value: pets, setter: setPets, disabled: !listing.pets },
                    ].map(({ key, label, description, value, setter, disabled }) => (
                      <div key={key} className="flex items-center justify-between border-b border-gray-100 py-4 last:border-b-0">
                        <div>
                          <p className="text-[18px] font-medium text-gray-900">{label}</p>
                          <p className="text-[15px] text-gray-500">{description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => !disabled && setter((current: number) => Math.max(0, current - 1))}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={disabled || value === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-5 text-center text-xl font-medium text-gray-900">{value}</span>
                          <button
                            type="button"
                            onClick={() => !disabled && setter((current: number) => current + 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={disabled}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="mt-6 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="text-base font-medium">Total guests</span>
                      </div>
                      <span className="text-base font-semibold text-gray-900">{guests}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setGuestEditorOpen(false)}
                      className="mt-6 w-full rounded-2xl bg-[#0f172a] px-4 py-3 text-lg font-medium text-white hover:bg-[#111827]"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl bg-[#e9e9e9] px-4 py-3 text-center text-base font-medium text-gray-700">
                Free cancellation before 10 September
              </div>

              {bookingError && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{bookingError}</div>}
              {bookingSuccess && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{bookingSuccess}</div>}

              <button
                type="button"
                onClick={handleReserve}
                disabled={submitting || !checkIn || !checkOut || hasBookingConflict}
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#e71d5c] to-[#d8174c] px-6 py-4 text-center text-2xl font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Reserving...' : 'Reserve'}
              </button>

              <div className="mt-4 text-center text-lg text-gray-700">You won't be charged yet</div>

              <div className="mt-6 flex items-center justify-center gap-3 text-lg text-gray-700">
                <span aria-hidden="true">⚑</span>
                <button type="button" className="font-medium underline-offset-2 hover:underline">Report this listing</button>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {selectedImageIndex !== null && gallery.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setSelectedImageIndex(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-900 shadow"
            >
              Close
            </button>

            <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl">
              <img
                src={gallery[selectedImageIndex]}
                alt={`${listing.title} ${selectedImageIndex + 1}`}
                className="h-[75vh] w-full object-cover"
              />

              <button
                type="button"
                onClick={goToPreviousImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-3 text-2xl font-medium text-gray-900 shadow-md hover:bg-white"
                aria-label="Previous image"
              >
                ←
              </button>

              <button
                type="button"
                onClick={goToNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-3 text-2xl font-medium text-gray-900 shadow-md hover:bg-white"
                aria-label="Next image"
              >
                →
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {selectedImageIndex + 1} / {gallery.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const LocationMapPicker = dynamic(() => import('@/components/LocationMapPicker'), {
  ssr: false,
  loading: () => <div className="flex h-[280px] w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-500">Loading map...</div>,
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface ListingFormState {
  title: string;
  description: string;
  location: string;
  latitude: string;
  longitude: string;
  category: string;
  image_url: string;
  price_per_night: string;
  pets: boolean;
}

const DEFAULT_AMENITIES = ['Wi‑Fi', 'Kitchen', 'Parking', 'Pool', 'Air conditioning', 'Workspace', 'Laundry', 'TV', 'Beach access', 'Pet friendly', 'Gym', 'Security'];

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoInput, setPhotoInput] = useState('');
  const [photoLinks, setPhotoLinks] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [form, setForm] = useState<ListingFormState>({
    title: '',
    description: '',
    location: '',
    latitude: '12.9716',
    longitude: '77.5946',
    category: 'Beachfront',
    image_url: '',
    price_per_night: '',
    pets: false,
  });

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
    if (!listingId) return;

    const fetchListing = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/listings/${listingId}/`, { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Failed to load listing');
        }

        const data = await response.json();

        if (currentUserId !== null && Number(data.owner_id) !== Number(currentUserId)) {
          router.replace('/');
          return;
        }

        const nextPhotos = Array.isArray(data.photos) && data.photos.length > 0 ? data.photos : data.image_url ? [data.image_url] : [];

        setForm({
          title: data.title || '',
          description: data.description || '',
          location: data.location || '',
          latitude: data.latitude != null ? String(data.latitude) : '12.9716',
          longitude: data.longitude != null ? String(data.longitude) : '77.5946',
          category: data.category || 'Beachfront',
          image_url: data.image_url || nextPhotos[0] || '',
          price_per_night: data.price_per_night ? String(data.price_per_night) : '',
          pets: Boolean(data.pets),
        });
        setPhotoLinks(nextPhotos);
        setSelectedAmenities(Array.isArray(data.amenities) ? data.amenities : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load listing');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId, currentUserId, router]);

  const handleChange = (key: keyof ListingFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addPhotoLink = () => {
    const trimmed = photoInput.trim();
    if (!trimmed) return;

    const nextPhotos = [...photoLinks, trimmed];
    setPhotoLinks(nextPhotos);
    setPhotoInput('');
    setForm((current) => ({
      ...current,
      image_url: current.image_url || trimmed,
    }));
  };

  const setThumbnail = (photo: string) => {
    setForm((current) => ({ ...current, image_url: photo }));
  };

  const removePhotoLink = (index: number) => {
    const removedPhoto = photoLinks[index];
    const nextPhotos = photoLinks.filter((_, i) => i !== index);
    setPhotoLinks(nextPhotos);
    setForm((current) => {
      if (current.image_url === removedPhoto) {
        return { ...current, image_url: nextPhotos[0] || '' };
      }
      return current;
    });
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((current) =>
      current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!listingId) return;

    if (currentUserId === null) {
      router.push('/login');
      return;
    }

    const orderedPhotos = form.image_url
      ? [form.image_url, ...photoLinks.filter((photo) => photo !== form.image_url)]
      : photoLinks;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/${listingId}/edit/`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          user_id: currentUserId,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          price_per_night: Number(form.price_per_night),
          photos: orderedPhotos,
          amenities: selectedAmenities,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update listing');
      }

      setSuccess('Listing updated successfully.');
      setTimeout(() => router.push(`/listing/${listingId}`), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-600">Loading listing editor...</main>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Edit</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">Update your listing</h1>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/listing/${listingId}`)}
            className="rounded-full border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Title</label>
            <input
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Location name</label>
              <input
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700">Pin the exact location</label>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator === 'undefined' || !navigator.geolocation) {
                      setError('Your browser does not support geolocation.');
                      return;
                    }

                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setForm((current) => ({
                          ...current,
                          latitude: String(position.coords.latitude),
                          longitude: String(position.coords.longitude),
                        }));
                        setError('');
                      },
                      () => setError('Unable to access your current location.'),
                      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
                    );
                  }}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  Use my current location
                </button>
              </div>

              <LocationMapPicker
                latitude={Number(form.latitude || 12.9716)}
                longitude={Number(form.longitude || 77.5946)}
                onChange={(lat, lng) => {
                  setForm((current) => ({ ...current, latitude: String(lat), longitude: String(lng) }));
                }}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.latitude}
                  onChange={(e) => handleChange('latitude', e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.longitude}
                  onChange={(e) => handleChange('longitude', e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
              >
                <option>Beachfront</option>
                <option>Cabins</option>
                <option>Mansions</option>
                <option>Lakefront</option>
                <option>Countryside</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Photo links</label>
            <div className="flex gap-2">
              <input
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                placeholder="https://example.com/house.jpg"
              />
              <button
                type="button"
                onClick={addPhotoLink}
                className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Add
              </button>
            </div>

            {photoLinks.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photoLinks.map((photo, index) => (
                  <div key={`${photo}-${index}`} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <img src={photo} alt={`Preview ${index + 1}`} className="h-24 w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/10 to-transparent p-2">
                      {form.image_url === photo ? (
                        <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-gray-800">Thumbnail</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setThumbnail(photo)}
                          className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-gray-800 hover:bg-white"
                        >
                          Set as thumbnail
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhotoLink(index)}
                      className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-gray-700 shadow-sm hover:bg-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Price per night</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price_per_night}
              onChange={(e) => handleChange('price_per_night', e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Amenities</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DEFAULT_AMENITIES.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.pets}
              onChange={(e) => handleChange('pets', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
            />
            Pets allowed
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving changes...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

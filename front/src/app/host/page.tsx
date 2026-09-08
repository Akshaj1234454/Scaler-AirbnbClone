'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const LocationMapPicker = dynamic(() => import('@/components/LocationMapPicker'), {
  ssr: false,
  loading: () => <div className="flex h-[280px] w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-500">Loading map...</div>,
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function HostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoInput, setPhotoInput] = useState('');
  const [photoLinks, setPhotoLinks] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [form, setForm] = useState({
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
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
      },
      () => {
        setForm((current) => ({
          ...current,
          latitude: current.latitude || '12.9716',
          longitude: current.longitude || '77.5946',
        }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  const handleChange = (key: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const useCurrentLocation = () => {
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
      () => {
        setError('Unable to access your current location.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
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
    setForm((current) => ({
      ...current,
      image_url: photo,
    }));
  };

  const removePhotoLink = (index: number) => {
    const removedPhoto = photoLinks[index];
    const nextPhotos = photoLinks.filter((_, i) => i !== index);
    setPhotoLinks(nextPhotos);
    setForm((current) => {
      if (current.image_url === removedPhoto) {
        return {
          ...current,
          image_url: nextPhotos[0] || '',
        };
      }
      return current;
    });
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((current) =>
      current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        router.push('/login');
        return;
      }

      const currentUser = JSON.parse(storedUser);
      const orderedPhotos = form.image_url
        ? [form.image_url, ...photoLinks.filter((photo) => photo !== form.image_url)]
        : photoLinks;

      const response = await fetch(`${API_BASE_URL}/api/listings/create/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          user_id: currentUser?.id,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          price_per_night: Number(form.price_per_night),
          photos: orderedPhotos,
          amenities: selectedAmenities,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create listing');
      }

      setSuccess('Listing created successfully.');
      setForm({
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
      setPhotoLinks([]);
      setPhotoInput('');
      setSelectedAmenities([]);

      setTimeout(() => router.push('/'), 800);
    } catch (err: any) {
      setError(err.message || 'Could not create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Host</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">List your space</h1>
          </div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-full border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Title</label>
            <input
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
              placeholder="Modern apartment in the heart of the city"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
              placeholder="Describe your place"
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
                placeholder="Bengaluru"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700">Pin the exact location</label>
                <button
                  type="button"
                  onClick={useCurrentLocation}
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
                  placeholder="12.9716"
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
                  placeholder="77.5946"
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
                        <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-gray-800">
                          Thumbnail
                        </span>
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
              placeholder="2500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Amenities</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {['Wi‑Fi', 'Kitchen', 'Parking', 'Pool', 'Air conditioning', 'Workspace', 'Laundry', 'TV', 'Beach access', 'Pet friendly', 'Gym', 'Security'].map((amenity) => (
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
            disabled={loading}
            className="w-full rounded-full bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating listing...' : 'Publish listing'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function BookingSummary() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');
  const total = searchParams.get('total');

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-xl rounded-[28px] border border-emerald-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
          ✓
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Reservation confirmed</p>
        <h1 className="mt-3 text-3xl font-bold">Your stay is booked</h1>

        <div className="mt-6 space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Listing</span>
            <span className="font-medium text-gray-900">#{listingId ?? 'Unknown'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Dates</span>
            <span className="font-medium text-gray-900">{checkIn ?? '—'} to {checkOut ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Guests</span>
            <span className="font-medium text-gray-900">{guests ?? '1'} guest(s)</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Total</span>
            <span className="font-medium text-gray-900">₹{total ? Number(total).toLocaleString('en-IN') : '0'}</span>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-900 transition hover:border-gray-300"
          >
            Back to listings
          </Link>
          <Link
            href={listingId ? `/listing/${listingId}` : '/'}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#e71d5c] to-[#d8174c] px-4 py-3 font-medium text-white shadow-md"
          >
            View listing
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f7f7f7] px-6 py-12 text-gray-900">Loading reservation...</main>}>
      <BookingSummary />
    </Suspense>
  );
}

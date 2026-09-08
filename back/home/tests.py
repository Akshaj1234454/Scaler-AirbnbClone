from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Booking, Listing

User = get_user_model()


class ListingClickApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.listing = Listing.objects.create(
            title='Test Listing',
            description='A nice place',
            location='Paris',
            category='Beachfront',
            image_url='https://example.com/image.jpg',
            price_per_night=180.00,
            pets=True,
        )
        self.user = User.objects.create_user(username='guest1', password='password123')

    def test_click_endpoint_returns_listing_id(self):
        response = self.client.post(
            reverse('listing-click'),
            {'listing_id': self.listing.pk},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['listing_id'], self.listing.pk)

    def test_login_endpoint_returns_user_details_for_valid_credentials(self):
        response = self.client.post(
            reverse('login'),
            {'username': 'guest1', 'password': 'password123'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['username'], 'guest1')

    def test_create_listing_endpoint_requires_login_and_creates_listing(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('create-listing'),
            {
                'title': 'My new host listing',
                'description': 'A cozy stay in the city',
                'location': 'Bengaluru',
                'category': 'Cabins',
                'image_url': 'https://example.com/new-listing.jpg',
                'price_per_night': '250.00',
                'pets': True,
                'photos': ['https://example.com/one.jpg', 'https://example.com/two.jpg'],
                'amenities': ['Wifi', 'Kitchen', 'Parking'],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        created_listing = Listing.objects.get(title='My new host listing')
        self.assertEqual(Listing.objects.filter(title='My new host listing').count(), 1)
        self.assertEqual(created_listing.owner, self.user)
        self.assertEqual(created_listing.photos, ['https://example.com/one.jpg', 'https://example.com/two.jpg'])
        self.assertEqual(created_listing.image_url, 'https://example.com/one.jpg')
        self.assertEqual(created_listing.amenities, ['Wifi', 'Kitchen', 'Parking'])

    def test_create_listing_endpoint_accepts_user_id_fallback(self):
        response = self.client.post(
            reverse('create-listing'),
            {
                'user_id': self.user.id,
                'title': 'My new host listing via user id',
                'description': 'A cozy stay in the city',
                'location': 'Bengaluru',
                'category': 'Cabins',
                'image_url': 'https://example.com/new-listing.jpg',
                'price_per_night': '250.00',
                'pets': True,
                'photos': ['https://example.com/one.jpg', 'https://example.com/two.jpg'],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        created_listing = Listing.objects.get(title='My new host listing via user id')
        self.assertEqual(created_listing.owner, self.user)
        self.assertEqual(created_listing.image_url, 'https://example.com/one.jpg')

    def test_booking_endpoint_requires_login(self):
        response = self.client.post(
            reverse('listing-book', args=[self.listing.pk]),
            {'check_in': '2026-09-11', 'check_out': '2026-09-13', 'guests': 2},
            format='json',
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(Booking.objects.filter(listing=self.listing).count(), 0)

    def test_booking_endpoint_creates_booking_when_dates_are_available(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse('listing-book', args=[self.listing.pk]),
            {'check_in': '2026-09-11', 'check_out': '2026-09-13', 'guests': 2},
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Booking.objects.filter(listing=self.listing).count(), 1)

    def test_booking_endpoint_rejects_overlapping_dates(self):
        self.client.force_authenticate(user=self.user)
        Booking.objects.create(
            listing=self.listing,
            guest=self.user,
            check_in='2026-09-11',
            check_out='2026-09-13',
        )

        response = self.client.post(
            reverse('listing-book', args=[self.listing.pk]),
            {'check_in': '2026-09-12', 'check_out': '2026-09-14', 'guests': 2},
            format='json',
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(Booking.objects.filter(listing=self.listing).count(), 1)

    def test_my_listings_endpoint_returns_user_listings(self):
        self.client.force_authenticate(user=self.user)
        listing = Listing.objects.create(
            owner=self.user,
            title='My owned listing',
            description='A cozy stay',
            location='Mumbai',
            category='Beachfront',
            image_url='https://example.com/owned.jpg',
            price_per_night=320.00,
            pets=False,
        )

        response = self.client.get(reverse('my-listings'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]['id'], listing.id)
        self.assertEqual(response.json()[0]['title'], 'My owned listing')

    def test_my_bookings_endpoint_returns_user_bookings(self):
        self.client.force_authenticate(user=self.user)
        booking = Booking.objects.create(
            listing=self.listing,
            guest=self.user,
            check_in='2026-09-20',
            check_out='2026-09-24',
        )

        response = self.client.get(reverse('my-bookings'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]['id'], booking.id)
        self.assertEqual(response.json()[0]['listing_title'], self.listing.title)

    def test_my_bookings_endpoint_returns_user_bookings_by_user_id_fallback(self):
        booking = Booking.objects.create(
            listing=self.listing,
            guest=self.user,
            check_in='2026-09-20',
            check_out='2026-09-24',
        )

        response = self.client.get(f"{reverse('my-bookings')}?user_id={self.user.id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]['id'], booking.id)
        self.assertEqual(response.json()[0]['listing_title'], self.listing.title)

    def test_update_listing_endpoint_updates_values_and_selected_thumbnail(self):
        self.client.force_authenticate(user=self.user)
        listing = Listing.objects.create(
            owner=self.user,
            title='Original title',
            description='Original description',
            location='Bengaluru',
            category='Beachfront',
            image_url='https://example.com/old.jpg',
            photos=['https://example.com/old.jpg', 'https://example.com/second.jpg'],
            amenities=['Wi‑Fi'],
            price_per_night=150.00,
            pets=False,
            latitude=12.9716,
            longitude=77.5946,
        )

        response = self.client.put(
            reverse('update-listing', args=[listing.pk]),
            {
                'title': 'Updated title',
                'description': 'Updated description',
                'location': 'Mumbai',
                'category': 'Cabins',
                'image_url': 'https://example.com/second.jpg',
                'photos': ['https://example.com/first.jpg', 'https://example.com/second.jpg', 'https://example.com/third.jpg'],
                'amenities': ['Wi‑Fi', 'Pool'],
                'price_per_night': '220.00',
                'pets': True,
                'latitude': 19.0760,
                'longitude': 72.8777,
                'user_id': self.user.id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        listing.refresh_from_db()
        self.assertEqual(listing.title, 'Updated title')
        self.assertEqual(listing.description, 'Updated description')
        self.assertEqual(listing.location, 'Mumbai')
        self.assertEqual(listing.category, 'Cabins')
        self.assertEqual(listing.image_url, 'https://example.com/second.jpg')
        self.assertEqual(listing.photos, ['https://example.com/second.jpg', 'https://example.com/first.jpg', 'https://example.com/third.jpg'])
        self.assertEqual(listing.amenities, ['Wi‑Fi', 'Pool'])
        self.assertEqual(float(listing.price_per_night), 220.00)
        self.assertTrue(listing.pets)
        self.assertEqual(float(listing.latitude), 19.0760)
        self.assertEqual(float(listing.longitude), 72.8777)

    def test_delete_listing_endpoint_requires_owner(self):
        self.client.force_authenticate(user=self.user)
        listing = Listing.objects.create(
            owner=self.user,
            title='Delete me',
            description='Remove this listing',
            location='Delhi',
            category='Beachfront',
            image_url='https://example.com/delete.jpg',
            price_per_night=190.00,
            pets=False,
        )

        response = self.client.delete(reverse('delete-listing', args=[listing.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Listing.objects.filter(pk=listing.pk).exists())

    def test_logout_endpoint_clears_session(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(reverse('logout'))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])

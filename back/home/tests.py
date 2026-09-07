from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Listing


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

    def test_click_endpoint_returns_listing_id(self):
        response = self.client.post(
            reverse('listing-click'),
            {'listing_id': self.listing.pk},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['listing_id'], self.listing.pk)

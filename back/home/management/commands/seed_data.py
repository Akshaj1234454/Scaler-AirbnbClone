import math
import os
import random

from django.core.management.base import BaseCommand
from home.models import Listing, Review


class Command(BaseCommand):
    help = 'Seeds or updates listing coordinate data around a center point.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing listings and reseed the full list.',
        )
        parser.add_argument(
            '--lat',
            type=float,
            default=float(os.getenv('LISTINGS_CENTER_LAT', '12.9716')),
            help='Latitude center for the seeded radius points.',
        )
        parser.add_argument(
            '--lng',
            type=float,
            default=float(os.getenv('LISTINGS_CENTER_LNG', '77.5946')),
            help='Longitude center for the seeded radius points.',
        )
        parser.add_argument(
            '--radius-km',
            type=float,
            default=20.0,
            help='Maximum radius in kilometers from the center point.',
        )

    def _random_point_within_radius(self, center_lat, center_lng, radius_km):
        radius_m = radius_km * 1000
        earth_radius_m = 6371000

        angle = random.uniform(0, 2 * math.pi)
        distance = math.sqrt(random.random()) * radius_m

        delta_lat = (distance * math.cos(angle)) / earth_radius_m
        delta_lng = (distance * math.sin(angle)) / (earth_radius_m * math.cos(math.radians(center_lat)))

        lat = center_lat + (delta_lat * 180 / math.pi)
        lng = center_lng + (delta_lng * 180 / math.pi)
        return round(lat, 6), round(lng, 6)

    def _seed_reviews_for_listing(self, listing):
        review_templates = [
            ('Ava', 5, 'Beautiful place, spotless and exactly as described.'),
            ('Milo', 4, 'Wonderful host and a really comfortable stay.'),
            ('Sara', 5, 'The views were stunning and the location was perfect.'),
            ('Noah', 4, 'Very clean and peaceful with great amenities.'),
            ('Priya', 5, 'Would definitely stay here again. Highly recommended!'),
        ]

        if Review.objects.filter(listing=listing).exists():
            return

        for reviewer_name, rating, comment in review_templates:
            Review.objects.create(
                listing=listing,
                reviewer_name=reviewer_name,
                rating=rating,
                comment=comment,
            )

    def handle(self, *args, **options):
        center_lat = options['lat']
        center_lng = options['lng']
        radius_km = options['radius_km']

        if options['reset']:
            Listing.objects.all().delete()

            listings_data = [
                {
                    'title': 'Minimalist Oceanfront Villa',
                    'description': 'Panoramic ocean views with floor-to-ceiling glass and direct beach access.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Beachfront',
                    'price_per_night': 650.00,
                    'image_url': 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Sunlit Coastal Haven',
                    'description': 'Steps from white sandy shores, private infinity pool, and open-air patio.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Beachfront',
                    'price_per_night': 220.00,
                    'image_url': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Aegean Cliffside Suite',
                    'description': 'Whitewashed architecture overlooking deep blue waters with a private sunset terrace.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Beachfront',
                    'price_per_night': 510.00,
                    'image_url': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Pinecrest Alpine A-Frame',
                    'description': 'Secluded cedar cabin surrounded by towering pines with an outdoor cedar hot tub.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Cabins',
                    'price_per_night': 290.00,
                    'image_url': 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Smoky Mountain Timber Lodge',
                    'description': 'Hand-hewn log retreat featuring stone fireplaces and sweeping valley panoramas.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Cabins',
                    'price_per_night': 340.00,
                    'image_url': 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Nordic Glass Stargazer Cabin',
                    'description': 'Thermal glass walls designed for viewing the northern lights in warm comfort.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Cabins',
                    'price_per_night': 410.00,
                    'image_url': 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'The Glass Pavilion Estate',
                    'description': 'Ultra-modern architectural triumph featuring zero-edge pool and sprawling private grounds.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Mansions',
                    'price_per_night': 1450.00,
                    'image_url': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Historic Tuscan Villa & Olive Grove',
                    'description': 'Renaissance estate with private wine cellar, vaulted ceilings, and landscaped gardens.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Mansions',
                    'price_per_night': 1100.00,
                    'image_url': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Modernist Desert Compound',
                    'description': 'Sprawling palm estate featuring resort-style amenities, cabanas, and sunken firepits.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Mansions',
                    'price_per_night': 980.00,
                    'image_url': 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Skyline Penthouse Loft',
                    'description': 'High ceilings, exposed brick, and a private rooftop garden overlooking downtown.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Trending',
                    'price_per_night': 420.00,
                    'image_url': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Canal-Side Heritage Flat',
                    'description': 'Historic canal house with antique details and modern scandinavian interiors.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Trending',
                    'price_per_night': 310.00,
                    'image_url': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Cotswolds Honey Stone Cottage',
                    'description': 'Quaint English garden home with original stone hearth and wood-burning stove.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Countryside',
                    'price_per_night': 275.00,
                    'image_url': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Provence Lavender Farmhouse',
                    'description': 'Surrounded by blooming fields, offering al-fresco dining and limestone courtyard.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Countryside',
                    'price_per_night': 380.00,
                    'image_url': 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Como Vista Residence',
                    'description': 'Direct lakefront access with a private boat slip and classic terrace views.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Lakefront',
                    'price_per_night': 720.00,
                    'image_url': 'https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?w=800&auto=format&fit=crop',
                },
                {
                    'title': 'Tranquil Tahoe Waterfront Lodge',
                    'description': 'Custom timber home with floor-to-ceiling views of crystal clear alpine waters.',
                    'location': f'{center_lat:.4f}, {center_lng:.4f}',
                    'latitude': 0.0,
                    'longitude': 0.0,
                    'category': 'Lakefront',
                    'price_per_night': 530.00,
                    'image_url': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
                },
            ]

            seeded = []
            for item in listings_data:
                lat, lng = self._random_point_within_radius(center_lat, center_lng, radius_km)
                item['latitude'] = lat
                item['longitude'] = lng
                item['location'] = f'{lat:.6f}, {lng:.6f}'
                seeded.append(Listing(**item))

            Listing.objects.bulk_create(seeded)

            for listing in Listing.objects.all():
                self._seed_reviews_for_listing(listing)

            self.stdout.write(self.style.SUCCESS(f'Successfully reseeded {len(seeded)} listings within {radius_km} km of ({center_lat}, {center_lng}).'))
            return

        listings = list(Listing.objects.all())
        if not listings:
            self.stdout.write(self.style.WARNING('No listings found to update.'))
            return

        for listing in listings:
            lat, lng = self._random_point_within_radius(center_lat, center_lng, radius_km)
            listing.latitude = lat
            listing.longitude = lng
            listing.location = f'{lat:.6f}, {lng:.6f}'

        Listing.objects.bulk_update(listings, ['location', 'latitude', 'longitude'])

        for listing in listings:
            self._seed_reviews_for_listing(listing)

        self.stdout.write(self.style.SUCCESS(f'Updated {len(listings)} listings with random coordinates within {radius_km} km of ({center_lat}, {center_lng}).'))
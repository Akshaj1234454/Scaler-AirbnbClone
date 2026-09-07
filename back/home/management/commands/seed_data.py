from django.core.management.base import BaseCommand
from home.models import Listing

class Command(BaseCommand):
    help = 'Seeds realistic Airbnb listings'

    def handle(self, *args, **options):
        # Clear existing test listings
        Listing.objects.all().delete()

        listings_data = [
            # Beachfront
            {
                "title": "Minimalist Oceanfront Villa",
                "description": "Panoramic ocean views with floor-to-ceiling glass and direct beach access.",
                "location": "Malibu, California",
                "category": "Beachfront",
                "price_per_night": 650.00,
                "image_url": "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&auto=format&fit=crop"
            },
            {
                "title": "Sunlit Coastal Haven",
                "description": "Steps from white sandy shores, private infinity pool, and open-air patio.",
                "location": "Goa, India",
                "category": "Beachfront",
                "price_per_night": 220.00,
                "image_url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop"
            },
            {
                "title": "Aegean Cliffside Suite",
                "description": "Whitewashed architecture overlooking deep blue waters with a private sunset terrace.",
                "location": "Santorini, Greece",
                "category": "Beachfront",
                "price_per_night": 510.00,
                "image_url": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop"
            },

            # Cabins
            {
                "title": "Pinecrest Alpine A-Frame",
                "description": "Secluded cedar cabin surrounded by towering pines with an outdoor cedar hot tub.",
                "location": "Banff, Canada",
                "category": "Cabins",
                "price_per_night": 290.00,
                "image_url": "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop"
            },
            {
                "title": "Smoky Mountain Timber Lodge",
                "description": "Hand-hewn log retreat featuring stone fireplaces and sweeping valley panoramas.",
                "location": "Gatlinburg, Tennessee",
                "category": "Cabins",
                "price_per_night": 340.00,
                "image_url": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop"
            },
            {
                "title": "Nordic Glass Stargazer Cabin",
                "description": "Thermal glass walls designed for viewing the northern lights in warm comfort.",
                "location": "Tromsø, Norway",
                "category": "Cabins",
                "price_per_night": 410.00,
                "image_url": "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&auto=format&fit=crop"
            },

            # Mansions
            {
                "title": "The Glass Pavilion Estate",
                "description": "Ultra-modern architectural triumph featuring zero-edge pool and sprawling private grounds.",
                "location": "Beverly Hills, California",
                "category": "Mansions",
                "price_per_night": 1450.00,
                "image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop"
            },
            {
                "title": "Historic Tuscan Villa & Olive Grove",
                "description": "Renaissance estate with private wine cellar, vaulted ceilings, and landscaped gardens.",
                "location": "Florence, Italy",
                "category": "Mansions",
                "price_per_night": 1100.00,
                "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop"
            },
            {
                "title": "Modernist Desert Compound",
                "description": "Sprawling palm estate featuring resort-style amenities, cabanas, and sunken firepits.",
                "location": "Scottsdale, Arizona",
                "category": "Mansions",
                "price_per_night": 980.00,
                "image_url": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop"
            },

            # Trending
            {
                "title": "Skyline Penthouse Loft",
                "description": "High ceilings, exposed brick, and a private rooftop garden overlooking downtown.",
                "location": "SoHo, New York",
                "category": "Trending",
                "price_per_night": 420.00,
                "image_url": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop"
            },
            {
                "title": "Canal-Side Heritage Flat",
                "description": "Historic canal house with antique details and modern scandinavian interiors.",
                "location": "Amsterdam, Netherlands",
                "category": "Trending",
                "price_per_night": 310.00,
                "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop"
            },

            # Countryside
            {
                "title": "Cotswolds Honey Stone Cottage",
                "description": "Quaint English garden home with original stone hearth and wood-burning stove.",
                "location": "Chipping Campden, UK",
                "category": "Countryside",
                "price_per_night": 275.00,
                "image_url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop"
            },
            {
                "title": "Provence Lavender Farmhouse",
                "description": "Surrounded by blooming fields, offering al-fresco dining and limestone courtyard.",
                "location": "Gordes, France",
                "category": "Countryside",
                "price_per_night": 380.00,
                "image_url": "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop"
            },

            # Lakefront
            {
                "title": "Como Vista Residence",
                "description": "Direct lakefront access with a private boat slip and classic terrace views.",
                "location": "Lake Como, Italy",
                "category": "Lakefront",
                "price_per_night": 720.00,
                "image_url": "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?w=800&auto=format&fit=crop"
            },
            {
                "title": "Tranquil Tahoe Waterfront Lodge",
                "description": "Custom timber home with floor-to-ceiling views of crystal clear alpine waters.",
                "location": "Lake Tahoe, California",
                "category": "Lakefront",
                "price_per_night": 530.00,
                "image_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop"
            }
        ]

        created_listings = [Listing(**data) for data in listings_data]
        Listing.objects.bulk_create(created_listings)

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(created_listings)} listings!'))

from django.db import models
from django.contrib.auth.models import User

class Listing(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    location = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='Trending')
    image_url = models.URLField(max_length=500, blank=True, default='')
    photos = models.JSONField(default=list, blank=True)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    pets = models.BooleanField(default=False)
    amenities = models.JSONField(default=list, max_length=10, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Booking(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='bookings')
    guest = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    check_in = models.DateField()
    check_out = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.listing.title} ({self.check_in} -> {self.check_out})"
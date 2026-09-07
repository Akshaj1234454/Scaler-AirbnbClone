from django.contrib import admin
from .models import Listing, Booking
# Register your models here.
@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'location', 'price_per_night', 'category', 'created_at', 'amenities')
    search_fields = ('title', 'location')
    list_filter = ('category',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'listing', 'guest', 'check_in', 'check_out', 'created_at')
    list_filter = ('check_in', 'check_out')
from rest_framework import serializers
from .models import Listing  # Replace with your actual model name

class ListingSerializer(serializers.ModelSerializer):
    booked_ranges = serializers.SerializerMethodField()
    class Meta:
        model = Listing
        fields = '__all__'  # Or specify: ['id', 'title', 'price', 'location']

    def get_booked_ranges(self, obj):
        # Queries all bookings belonging to this listing
        return [
            {
                "check_in": booking.check_in.strftime('%Y-%m-%d'),
                "check_out": booking.check_out.strftime('%Y-%m-%d')
            }
            for booking in obj.bookings.all()
        ]
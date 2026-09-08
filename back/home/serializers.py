from rest_framework import serializers
from .models import Listing, Review


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'reviewer_name', 'rating', 'comment', 'created_at']


class ListingSerializer(serializers.ModelSerializer):
    booked_ranges = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = '__all__'

    def get_booked_ranges(self, obj):
        return [
            {
                "check_in": booking.check_in.strftime('%Y-%m-%d'),
                "check_out": booking.check_out.strftime('%Y-%m-%d')
            }
            for booking in obj.bookings.all()
        ]

    def get_owner_name(self, obj):
        if obj.owner is None:
            return 'Host'
        return obj.owner.get_full_name() or obj.owner.username

    def get_average_rating(self, obj):
        if not obj.reviews.exists():
            return 0
        total = sum(review.rating for review in obj.reviews.all())
        return round(total / obj.reviews.count(), 1)
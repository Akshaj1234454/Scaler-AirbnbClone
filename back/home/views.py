from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db.models import Max
from .models import Listing, Booking
from .serializers import ListingSerializer

@api_view(['GET'])
def getHomeData(request):
    cat = request.GET.get('category')
    loc = request.GET.get('location')
    pets = request.GET.get('pets')
    mn = request.GET.get('min_price')
    mx = request.GET.get('max_price')
    checkIn, checkOut = request.GET.get('check_in'), request.GET.get('check_out')

    listings = Listing.objects.prefetch_related('bookings').all().order_by('-created_at')

    if checkIn and checkOut:
        conflicting_listing_ids = Booking.objects.filter(
            check_in__lt=checkOut,
            check_out__gt=checkIn
        ).values_list('listing_id', flat=True)

        print(f"[Search Filter] Excluded Listing IDs (already booked): {list(conflicting_listing_ids)}")

        # Exclude those listings from the queryset
        listings = listings.exclude(id__in=conflicting_listing_ids)

    if mn or mx:
        mn = int(mn) if mn else 0
        mx = int(mx) if mx else 0
        mnVal = mn if (mn > 0) else 0
        mxVal = mx if (mx > 0) else (listings.aggregate(Max('price_per_night'))['price_per_night__max'] or 0)
        listings = listings.filter(price_per_night__range=(mnVal, mxVal))

    if pets and int(pets) > 0:
        listings = listings.filter(pets=True)
    if cat:
        listings = listings.filter(category__iexact=cat)
    if loc:
        listings = listings.filter(location__icontains=loc)
    serializer = ListingSerializer(listings, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def getListingDetail(request, listing_id):
    try:
        listing = Listing.objects.get(pk=listing_id)
    except Listing.DoesNotExist:
        return Response({'error': 'Listing not found.'}, status=404)

    serializer = ListingSerializer(listing)
    return Response(serializer.data)


@api_view(['POST'])
def recordListingClick(request):
    listing_id = request.data.get('listing_id')

    if listing_id is None or listing_id == '':
        return Response({'error': 'listing_id is required.'}, status=400)

    if not Listing.objects.filter(pk=listing_id).exists():
        return Response({'error': 'Listing not found.'}, status=404)

    return Response({'listing_id': int(listing_id)}, status=200)

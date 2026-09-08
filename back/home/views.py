from datetime import datetime
from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate, login, logout
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


@api_view(['POST'])
def createBooking(request, listing_id):
    user = request.user if request.user.is_authenticated else None

    if user is None:
        user_id = request.data.get('user_id')
        if user_id:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(pk=user_id)
            except (TypeError, ValueError, User.DoesNotExist):
                return Response({'error': 'Login required to make a reservation.'}, status=401)

    if user is None:
        return Response({'error': 'Login required to make a reservation.'}, status=401)

    try:
        listing = Listing.objects.get(pk=listing_id)
    except Listing.DoesNotExist:
        return Response({'error': 'Listing not found.'}, status=404)

    check_in = request.data.get('check_in')
    check_out = request.data.get('check_out')
    guests = request.data.get('guests')
    pets = request.data.get('pets')

    if not check_in or not check_out:
        return Response({'error': 'check_in and check_out are required.'}, status=400)

    try:
        check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
        check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Dates must be in YYYY-MM-DD format.'}, status=400)

    if check_out_date <= check_in_date:
        return Response({'error': 'check_out must be after check_in.'}, status=400)

    if guests is None or int(guests) <= 0:
        return Response({'error': 'guests must be greater than 0.'}, status=400)

    if pets is not None and int(pets) > 0 and not listing.pets:
        return Response({'error': 'This listing does not allow pets.'}, status=400)

    overlapping = Booking.objects.filter(
        listing=listing,
        check_in__lt=check_out_date,
        check_out__gt=check_in_date,
    ).exists()

    if overlapping:
        return Response({'error': 'Those dates are already booked.'}, status=409)

    booking = Booking.objects.create(
        listing=listing,
        guest=user,
        check_in=check_in_date,
        check_out=check_out_date,
    )

    return Response(
        {
            'id': booking.id,
            'listing_id': listing.id,
            'check_in': booking.check_in.isoformat(),
            'check_out': booking.check_out.isoformat(),
            'guests': int(guests),
        },
        status=201,
    )


@api_view(['POST'])
def create_listing(request):
    user = request.user if request.user.is_authenticated else None

    if user is None:
        user_id = request.data.get('user_id')
        if user_id:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(pk=user_id)
            except (TypeError, ValueError, User.DoesNotExist):
                return Response({'error': 'Login required to create a listing.'}, status=401)

    if user is None:
        return Response({'error': 'Login required to create a listing.'}, status=401)

    title = (request.data.get('title') or '').strip()
    location = (request.data.get('location') or '').strip()
    description = (request.data.get('description') or '').strip()
    category = (request.data.get('category') or 'Trending').strip() or 'Trending'
    image_url = (request.data.get('image_url') or '').strip()
    photos = request.data.get('photos') or []
    amenities = request.data.get('amenities') or []
    price_raw = request.data.get('price_per_night')
    pets = request.data.get('pets')

    if not title:
        return Response({'error': 'Title is required.'}, status=400)
    if not location:
        return Response({'error': 'Location is required.'}, status=400)
    if price_raw in (None, ''):
        return Response({'error': 'Price per night is required.'}, status=400)

    try:
        price_value = Decimal(str(price_raw))
    except (InvalidOperation, ValueError):
        return Response({'error': 'Price per night must be a valid number.'}, status=400)

    normalized_photos = []
    if isinstance(photos, list):
        normalized_photos = [str(item).strip() for item in photos if str(item).strip()]
    elif isinstance(photos, str):
        normalized_photos = [item.strip() for item in photos.split(',') if item.strip()]

    normalized_amenities = []
    if isinstance(amenities, list):
        normalized_amenities = [str(item).strip() for item in amenities if str(item).strip()]
    elif isinstance(amenities, str):
        normalized_amenities = [item.strip() for item in amenities.split(',') if item.strip()]

    if normalized_photos:
        if image_url and image_url in normalized_photos:
            normalized_photos = [image_url, *[item for item in normalized_photos if item != image_url]]
        else:
            image_url = normalized_photos[0]
            normalized_photos = [image_url, *[item for item in normalized_photos if item != image_url]]
    elif image_url:
        normalized_photos = [image_url]

    if not image_url and normalized_photos:
        image_url = normalized_photos[0]

    latitude_raw = request.data.get('latitude')
    longitude_raw = request.data.get('longitude')

    try:
        latitude = float(latitude_raw) if latitude_raw not in (None, '') else 0.0
        longitude = float(longitude_raw) if longitude_raw not in (None, '') else 0.0
    except (TypeError, ValueError):
        return Response({'error': 'Latitude and longitude must be numeric.'}, status=400)

    listing = Listing.objects.create(
        owner=user,
        title=title,
        description=description,
        location=location,
        category=category,
        image_url=image_url,
        photos=normalized_photos,
        amenities=normalized_amenities,
        price_per_night=price_value,
        pets=bool(pets) if pets is not None else False,
        latitude=latitude,
        longitude=longitude,
    )

    return Response({
        'id': listing.id,
        'title': listing.title,
        'location': listing.location,
        'price_per_night': str(listing.price_per_night),
        'category': listing.category,
        'image_url': listing.image_url,
        'pets': listing.pets,
    }, status=201)


@api_view(['PUT', 'PATCH', 'POST'])
def update_listing(request, listing_id):
    user = request.user if request.user.is_authenticated else None

    if user is None:
        user_id = request.data.get('user_id')
        if user_id:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(pk=user_id)
            except (TypeError, ValueError, User.DoesNotExist):
                return Response({'error': 'Login required to edit a listing.'}, status=401)

    if user is None:
        return Response({'error': 'Login required to edit a listing.'}, status=401)

    try:
        listing = Listing.objects.get(pk=listing_id)
    except Listing.DoesNotExist:
        return Response({'error': 'Listing not found.'}, status=404)

    if listing.owner_id != user.id:
        return Response({'error': 'You can only edit your own listing.'}, status=403)

    title = request.data.get('title', listing.title)
    location = request.data.get('location', listing.location)
    description = request.data.get('description', listing.description)
    category = request.data.get('category', listing.category)
    image_url = request.data.get('image_url', listing.image_url)
    photos = request.data.get('photos', listing.photos)
    amenities = request.data.get('amenities', listing.amenities)
    price_raw = request.data.get('price_per_night', listing.price_per_night)
    pets = request.data.get('pets', listing.pets)

    title = (title or '').strip()
    location = (location or '').strip()
    description = (description or '').strip()
    category = (category or 'Beachfront').strip() or 'Beachfront'
    image_url = (image_url or '').strip()

    if not title:
        return Response({'error': 'Title is required.'}, status=400)
    if not location:
        return Response({'error': 'Location is required.'}, status=400)
    if price_raw in (None, ''):
        return Response({'error': 'Price per night is required.'}, status=400)

    try:
        price_value = Decimal(str(price_raw))
    except (InvalidOperation, ValueError):
        return Response({'error': 'Price per night must be a valid number.'}, status=400)

    normalized_photos = []
    if isinstance(photos, list):
        normalized_photos = [str(item).strip() for item in photos if str(item).strip()]
    elif isinstance(photos, str):
        normalized_photos = [item.strip() for item in photos.split(',') if item.strip()]

    normalized_amenities = []
    if isinstance(amenities, list):
        normalized_amenities = [str(item).strip() for item in amenities if str(item).strip()]
    elif isinstance(amenities, str):
        normalized_amenities = [item.strip() for item in amenities.split(',') if item.strip()]

    if normalized_photos:
        if image_url and image_url in normalized_photos:
            normalized_photos = [image_url, *[item for item in normalized_photos if item != image_url]]
        else:
            image_url = normalized_photos[0]
            normalized_photos = [image_url, *[item for item in normalized_photos if item != image_url]]
    elif image_url:
        normalized_photos = [image_url]

    if not image_url and normalized_photos:
        image_url = normalized_photos[0]

    latitude_raw = request.data.get('latitude', listing.latitude)
    longitude_raw = request.data.get('longitude', listing.longitude)

    try:
        latitude = float(latitude_raw) if latitude_raw not in (None, '') else float(listing.latitude)
        longitude = float(longitude_raw) if longitude_raw not in (None, '') else float(listing.longitude)
    except (TypeError, ValueError):
        return Response({'error': 'Latitude and longitude must be numeric.'}, status=400)

    listing.title = title
    listing.location = location
    listing.description = description
    listing.category = category
    listing.image_url = image_url
    listing.photos = normalized_photos or listing.photos
    listing.amenities = normalized_amenities or listing.amenities
    listing.price_per_night = price_value
    listing.pets = bool(pets) if pets is not None else listing.pets
    listing.latitude = latitude
    listing.longitude = longitude
    listing.save()

    return Response({
        'id': listing.id,
        'title': listing.title,
        'location': listing.location,
        'price_per_night': str(listing.price_per_night),
        'category': listing.category,
        'image_url': listing.image_url,
        'pets': listing.pets,
        'amenities': listing.amenities,
    }, status=200)


@api_view(['DELETE'])
def delete_listing(request, listing_id):
    user = request.user if request.user.is_authenticated else None

    if user is None:
        user_id = request.data.get('user_id')
        if user_id:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(pk=user_id)
            except (TypeError, ValueError, User.DoesNotExist):
                return Response({'error': 'Login required to delete a listing.'}, status=401)

    if user is None:
        return Response({'error': 'Login required to delete a listing.'}, status=401)

    try:
        listing = Listing.objects.get(pk=listing_id)
    except Listing.DoesNotExist:
        return Response({'error': 'Listing not found.'}, status=404)

    if listing.owner_id != user.id:
        return Response({'error': 'You can only delete your own listing.'}, status=403)

    listing.delete()
    return Response({'success': True, 'deleted_listing_id': listing_id}, status=200)


@api_view(['POST'])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'username and password are required.'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials.'}, status=401)

    login(request, user)
    return Response({
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
    }, status=200)


@api_view(['GET'])
def my_listings(request):
    user = request.user if request.user.is_authenticated else None

    if user is None:
        user_id = request.GET.get('user_id')
        if user_id:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(pk=user_id)
            except (TypeError, ValueError, User.DoesNotExist):
                return Response([], status=200)

    if user is None:
        return Response([], status=200)

    listings = Listing.objects.filter(owner=user).order_by('-created_at')
    payload = []
    for listing in listings:
        payload.append({
            'id': listing.id,
            'title': listing.title,
            'location': listing.location,
            'category': listing.category,
            'price_per_night': str(listing.price_per_night),
            'image_url': listing.image_url or '',
            'description': listing.description or '',
        })
    return Response(payload, status=200)


@api_view(['GET'])
def my_bookings(request):
    user = request.user if request.user.is_authenticated else None

    if user is None:
        user_id = request.GET.get('user_id')
        if user_id:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(pk=user_id)
            except (TypeError, ValueError, User.DoesNotExist):
                return Response([], status=200)

    if user is None:
        return Response([], status=200)

    bookings = Booking.objects.filter(guest=user).select_related('listing').order_by('-check_in')
    payload = []
    for booking in bookings:
        payload.append({
            'id': booking.id,
            'listing_id': booking.listing_id,
            'listing_title': booking.listing.title,
            'location': booking.listing.location,
            'check_in': booking.check_in.isoformat(),
            'check_out': booking.check_out.isoformat(),
            'price_per_night': str(booking.listing.price_per_night),
            'image_url': booking.listing.image_url or '',
        })
    return Response(payload, status=200)


@api_view(['POST'])
def logout_user(request):
    logout(request)
    return Response({'success': True}, status=200)

from django.urls import path
from .views import (
    getHomeData,
    getListingDetail,
    recordListingClick,
    createBooking,
    create_listing,
    update_listing,
    delete_listing,
    login_user,
    my_listings,
    my_bookings,
    logout_user,
)

urlpatterns = [
    path('listings/', getHomeData, name='getHomeData'),
    path('listings/create/', create_listing, name='create-listing'),
    path('listings/<int:listing_id>/', getListingDetail, name='listing-detail'),
    path('listings/<int:listing_id>/edit/', update_listing, name='update-listing'),
    path('listings/<int:listing_id>/delete/', delete_listing, name='delete-listing'),
    path('listings/<int:listing_id>/book/', createBooking, name='listing-book'),
    path('listings/click/', recordListingClick, name='listing-click'),
    path('login/', login_user, name='login'),
    path('my-listings/', my_listings, name='my-listings'),
    path('my-bookings/', my_bookings, name='my-bookings'),
    path('logout/', logout_user, name='logout'),
]

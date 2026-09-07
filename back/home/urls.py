from django.urls import path
from .views import getHomeData, getListingDetail, recordListingClick

urlpatterns = [
    path('listings/', getHomeData, name='getHomeData'),
    path('listings/<int:listing_id>/', getListingDetail, name='listing-detail'),
    path('listings/click/', recordListingClick, name='listing-click'),
]

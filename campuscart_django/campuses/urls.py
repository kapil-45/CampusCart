from django.urls import path
from .views import CampusSearchView

urlpatterns = [
    path('search/', CampusSearchView.as_view(), name='campus-search'),
]

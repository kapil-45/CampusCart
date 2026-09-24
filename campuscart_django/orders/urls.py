from django.urls import path
from .views import MarkSoldView

urlpatterns = [
    path('mark-sold/', MarkSoldView.as_view(), name='mark-sold'),
]

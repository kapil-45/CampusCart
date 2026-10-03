from django.urls import path
from .views import MarkSoldView, MyOrdersView

urlpatterns = [
    path('mark-sold/', MarkSoldView.as_view(), name='mark-sold'),
    path('my/', MyOrdersView.as_view(), name='my-orders'),
]

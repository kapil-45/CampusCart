from django.urls import path
from .views import WishlistListCreateView, WishlistRemoveView

urlpatterns = [
    path('', WishlistListCreateView.as_view(), name='wishlist-list-create'),
    path('<int:product_id>/', WishlistRemoveView.as_view(), name='wishlist-remove'),
]

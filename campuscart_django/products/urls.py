from django.urls import path
from .views import ProductListCreateView, ProductDetailView, MyProductListView

urlpatterns = [
    path('', ProductListCreateView.as_view(), name='product-list-create'),
    path('my/', MyProductListView.as_view(), name='my-products'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
]

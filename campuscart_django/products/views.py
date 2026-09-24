from rest_framework import generics, permissions, filters
from rest_framework.response import Response

from .models import Product
from .serializers import ProductSerializer, ProductWriteSerializer
from .permissions import IsOwnerOrReadOnly


class ProductListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/products/   -> browse all AVAILABLE listings (public, no login needed)
                              supports ?search=... (matches title/description)
                              and ?category=... filtering
    POST /api/products/   -> create a new listing (must be logged in)
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def get_serializer_class(self):
        return ProductWriteSerializer if self.request.method == 'POST' else ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.filter(status='AVAILABLE')
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)
        return queryset

    def perform_create(self, serializer):
        # seller is taken from the authenticated request, never from client input
        serializer.save(seller=self.request.user)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/products/<id>/  -> view one listing (public; increments view_count)
    PATCH  /api/products/<id>/  -> edit your own listing (title, price, images, etc.
                                    — NOT status=SOLD, see ProductWriteSerializer)
    DELETE /api/products/<id>/  -> remove your own listing

    To mark a listing sold, use POST /api/orders/mark-sold/ instead — that
    creates a real Order record the Reviews module depends on, which a
    plain PATCH here can't guarantee.
    """
    queryset = Product.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_serializer_class(self):
        return ProductSerializer if self.request.method == 'GET' else ProductWriteSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        serializer = ProductSerializer(instance)
        return Response(serializer.data)

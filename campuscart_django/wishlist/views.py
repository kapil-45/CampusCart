from decimal import Decimal

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import WishlistItem
from .serializers import WishlistItemSerializer, WishlistCreateSerializer
from products.models import Product


class WishlistListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/wishlist/  -> the logged-in student's own wishlist (never anyone else's)
    POST /api/wishlist/  -> body: {"product": <id>} — save a listing for later
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return WishlistCreateSerializer if self.request.method == 'POST' else WishlistItemSerializer

    def get_queryset(self):
        # Always scoped to the requesting user — there is no way to view
        # or list someone else's wishlist through this endpoint.
        return WishlistItem.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data['product']

        if WishlistItem.objects.filter(user=request.user, product_id=product_id).exists():
            return Response(
                {'success': False, 'message': 'This product is already in your wishlist.'},
                status=status.HTTP_409_CONFLICT,
            )

        product = Product.objects.get(id=product_id)
        item = WishlistItem.objects.create(
            user=request.user,
            product=product,
            # product.asking_price comes back from Djongo as a BSON
            # Decimal128, not a plain Python Decimal — str() -> Decimal
            # is the safe, explicit conversion before saving it into a
            # different field.
            price_at_add=Decimal(str(product.asking_price)),
        )
        return Response(WishlistItemSerializer(item).data, status=status.HTTP_201_CREATED)


class WishlistRemoveView(APIView):
    """
    DELETE /api/wishlist/<product_id>/  -> remove a product from your own wishlist.
    Keyed by product id (not wishlist item id) since that's what the
    frontend already has on hand from a product card's "remove" button.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, product_id):
        deleted_count, _ = WishlistItem.objects.filter(
            user=request.user, product_id=product_id
        ).delete()

        if deleted_count == 0:
            return Response(
                {'success': False, 'message': 'This product was not in your wishlist.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            {'success': True, 'message': 'Removed from wishlist.'},
            status=status.HTTP_200_OK,
        )

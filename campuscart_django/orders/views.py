from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .serializers import MarkSoldSerializer, OrderSerializer


class MarkSoldView(APIView):
    """
    POST /api/orders/mark-sold/
    Body: {"product": <id>, "buyer_id": <id>}

    The ONLY way a product's status should become SOLD in this project —
    doing it this way (instead of letting a seller PATCH status directly
    on the product) guarantees every SOLD product has a real Order behind
    it, which is what makes the Reviews module's validation meaningful.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = MarkSoldSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data['product_obj']
        buyer = serializer.validated_data['buyer_obj']

        order = Order.objects.create(product=product, buyer=buyer, seller=request.user)

        product.status = 'SOLD'
        product.sold_at = timezone.now()
        product.save(update_fields=['status', 'sold_at'])

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

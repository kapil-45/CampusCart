from decimal import Decimal
from rest_framework import serializers
from .models import WishlistItem
from products.models import Product


class WishlistProductSummarySerializer(serializers.Serializer):
    """Just enough product info to render a wishlist card in the UI."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    asking_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    images = serializers.JSONField()


class WishlistItemSerializer(serializers.ModelSerializer):
    """Read shape — includes the product snapshot and whether the price has dropped."""

    product = WishlistProductSummarySerializer(read_only=True)
    price_dropped = serializers.SerializerMethodField()

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'price_at_add', 'price_dropped', 'created_at']
        read_only_fields = fields

    def get_price_dropped(self, obj):
        # Values read back from Djongo can come out as BSON Decimal128
        # rather than plain Python Decimal, and Decimal128 doesn't support
        # comparison operators directly — str() -> Decimal is the safe,
        # explicit conversion on both sides before comparing.
        current_price = Decimal(str(obj.product.asking_price))
        price_when_added = Decimal(str(obj.price_at_add))
        return current_price < price_when_added


class WishlistCreateSerializer(serializers.Serializer):
    """Write shape — the client only ever sends a product id to wishlist."""

    product = serializers.IntegerField()

    def validate_product(self, value):
        if not Product.objects.filter(id=value, status='AVAILABLE').exists():
            raise serializers.ValidationError('Product not found or no longer available.')
        return value

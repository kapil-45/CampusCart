import ast
import json
from rest_framework import serializers
from .models import Product


def normalize_images(imgs):
    """Normalize images to a clean list of URL strings regardless of Djongo storage format."""
    if isinstance(imgs, list):
        return [str(img).strip() for img in imgs if img and str(img).strip()]
    if isinstance(imgs, str):
        imgs = imgs.strip()
        if not imgs:
            return []
        try:
            parsed = json.loads(imgs)
            if isinstance(parsed, list):
                return [str(img).strip() for img in parsed if img and str(img).strip()]
        except Exception:
            pass
        try:
            parsed = ast.literal_eval(imgs)
            if isinstance(parsed, list):
                return [str(img).strip() for img in parsed if img and str(img).strip()]
        except Exception:
            pass
        return [imgs]
    return []


class SellerSummarySerializer(serializers.Serializer):
    """A trimmed-down view of the seller shown alongside each listing —
    just enough for a buyer to know who they're dealing with, without
    exposing the seller's full account details. Phone is deliberately
    NOT here — see ProductSerializer.get_seller_phone below for why."""
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    avg_rating = serializers.FloatField()


class ProductSerializer(serializers.ModelSerializer):
    """Read shape — what buyers/sellers see when browsing or viewing a listing."""

    seller = SellerSummarySerializer(read_only=True)
    seller_phone = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'seller', 'seller_phone', 'title', 'description', 'condition',
            'asking_price', 'category', 'predicted_category', 'status',
            'images', 'view_count', 'created_at', 'updated_at', 'sold_at',
        ]
        read_only_fields = ['id', 'seller', 'seller_phone', 'view_count', 'created_at', 'updated_at', 'sold_at']

    def get_images(self, obj):
        return normalize_images(obj.images)

    def get_seller_phone(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.seller.phone
        return None


class ProductWriteSerializer(serializers.ModelSerializer):
    """
    Write shape — used for create and update.
    `seller` is deliberately NOT in this serializer's fields: it's set
    from request.user in the view, never trusted from client input,
    so nobody can create a listing "as" another student.
    """
    images = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'description', 'condition', 'asking_price',
            'category', 'status', 'images',
        ]
        read_only_fields = ['id']

    def validate_asking_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Asking price must be greater than zero.')
        return value

    def validate_status(self, value):
        if value == 'SOLD':
            raise serializers.ValidationError(
                'Use POST /api/orders/mark-sold/ to mark a listing as sold '
                '(this records who bought it, needed for reviews).'
            )
        return value

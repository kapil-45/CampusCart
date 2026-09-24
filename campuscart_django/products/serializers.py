from rest_framework import serializers
from .models import Product


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

    class Meta:
        model = Product
        fields = [
            'id', 'seller', 'seller_phone', 'title', 'description', 'condition',
            'asking_price', 'category', 'predicted_category', 'status',
            'images', 'view_count', 'created_at', 'updated_at', 'sold_at',
        ]
        read_only_fields = ['id', 'seller', 'seller_phone', 'view_count', 'created_at', 'updated_at', 'sold_at']

    def get_seller_phone(self, obj):
        # Only reveal a seller's phone number to logged-in students, not
        # to anonymous/public requests — this is what powers the "call
        # seller" button on the frontend, and it's the one piece of
        # personal contact info this API exposes at all, so it's gated
        # behind authentication rather than shown to anyone browsing.
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
        # SOLD must only ever be set via POST /api/orders/mark-sold/, which
        # creates a real Order record alongside it — that's what the
        # Reviews module relies on to validate who was actually involved
        # in a transaction. Allowing status=SOLD here would let a seller
        # bypass that and leave no Order behind.
        if value == 'SOLD':
            raise serializers.ValidationError(
                'Use POST /api/orders/mark-sold/ to mark a listing as sold '
                '(this records who bought it, needed for reviews).'
            )
        return value

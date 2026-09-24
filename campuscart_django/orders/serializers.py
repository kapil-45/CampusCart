from rest_framework import serializers
from .models import Order
from products.models import Product
from accounts.models import User


class MarkSoldSerializer(serializers.Serializer):
    """
    Input for the seller confirming who they sold a listing to.
    Heavier validation lives here rather than in the view, so the view
    stays focused on orchestration (create Order, update Product).
    """

    product = serializers.IntegerField()
    buyer_id = serializers.IntegerField()

    def validate(self, attrs):
        request = self.context['request']

        try:
            product = Product.objects.get(id=attrs['product'])
        except Product.DoesNotExist:
            raise serializers.ValidationError('Product not found.')

        if product.seller_id != request.user.id:
            raise serializers.ValidationError('Only the seller can mark this listing as sold.')

        if product.status != 'AVAILABLE':
            raise serializers.ValidationError('This listing is not currently available to sell.')

        try:
            buyer = User.objects.get(id=attrs['buyer_id'])
        except User.DoesNotExist:
            raise serializers.ValidationError('Buyer not found.')

        if buyer.id == request.user.id:
            raise serializers.ValidationError('You cannot sell an item to yourself.')

        # Stash the resolved objects so the view doesn't need to re-fetch them.
        attrs['product_obj'] = product
        attrs['buyer_obj'] = buyer
        return attrs


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'product', 'buyer', 'seller', 'created_at']
        read_only_fields = fields

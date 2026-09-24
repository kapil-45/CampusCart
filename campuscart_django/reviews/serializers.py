from rest_framework import serializers
from .models import Review
from orders.models import Order


class ReviewerSummarySerializer(serializers.Serializer):
    """Just enough info about who left the review."""
    id = serializers.IntegerField()
    full_name = serializers.CharField()


class ReviewSerializer(serializers.ModelSerializer):
    """Read shape — shown on a student's profile."""

    reviewer = ReviewerSummarySerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'reviewer', 'order', 'rating', 'comment', 'created_at']
        read_only_fields = fields


class ReviewCreateSerializer(serializers.Serializer):
    """
    Write shape. `order` identifies which confirmed transaction this
    review is about — the reviewer must have actually been part of it
    (either the buyer or the seller), which is validated here against
    the real Order record rather than trusted from client input.
    """

    order = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_order(self, value):
        try:
            order = Order.objects.get(id=value)
        except Order.DoesNotExist:
            raise serializers.ValidationError('Order not found.')

        request = self.context['request']
        if request.user.id not in (order.buyer_id, order.seller_id):
            raise serializers.ValidationError('You were not part of this transaction.')

        return value

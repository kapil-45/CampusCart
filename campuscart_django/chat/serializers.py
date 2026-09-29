from rest_framework import serializers
from accounts.models import User
from products.models import Product
from products.serializers import ProductSerializer
from .models import Conversation, Message


class ChatUserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'full_name', 'email', 'phone', 'avg_rating', 'role')


class MessageSerializer(serializers.ModelSerializer):
    sender = ChatUserSummarySerializer(read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ('id', 'conversation', 'sender', 'text', 'is_read', 'created_at', 'is_mine')
        read_only_fields = ('id', 'sender', 'is_read', 'created_at', 'is_mine')

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.sender_id == request.user.id


class ConversationSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    buyer = ChatUserSummarySerializer(read_only=True)
    seller = ChatUserSummarySerializer(read_only=True)
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            'id', 'product', 'buyer', 'seller', 'other_user',
            'last_message', 'unread_count', 'created_at', 'updated_at'
        )
        read_only_fields = fields

    def get_other_user(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return ChatUserSummarySerializer(obj.seller).data
        if request.user.id == obj.buyer_id:
            return ChatUserSummarySerializer(obj.seller).data
        return ChatUserSummarySerializer(obj.buyer).data

    def get_last_message(self, obj):
        all_msgs = list(obj.messages.all())
        if all_msgs:
            return MessageSerializer(all_msgs[-1], context=self.context).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return sum(1 for m in obj.messages.all() if not m.is_read and m.sender_id != request.user.id)


class CreateConversationSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=True)
    initial_message = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found.")
        return product

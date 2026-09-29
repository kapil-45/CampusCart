from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import get_object_or_404

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    CreateConversationSerializer,
    MessageSerializer,
)


class ConversationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        buyer_convs = list(Conversation.objects.filter(buyer=user))
        seller_convs = list(Conversation.objects.filter(seller=user))
        seen = {}
        for c in buyer_convs + seller_convs:
            seen[c.id] = c
        conversations = sorted(seen.values(), key=lambda c: c.updated_at, reverse=True)

        serializer = ConversationSerializer(conversations, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data['product_id']
        buyer = request.user
        seller = product.seller

        if seller.id == buyer.id:
            existing = Conversation.objects.filter(product=product, seller=seller).first()
            if existing:
                return Response(ConversationSerializer(existing, context={'request': request}).data, status=status.HTTP_200_OK)
            return Response(
                {"detail": "This is your own listing.", "is_owner": True},
                status=status.HTTP_200_OK
            )

        conversation = Conversation.objects.filter(
            product=product,
            buyer=buyer,
            seller=seller
        ).first()

        is_new = False
        if not conversation:
            conversation = Conversation.objects.create(
                product=product,
                buyer=buyer,
                seller=seller
            )
            is_new = True

        initial_message = serializer.validated_data.get('initial_message', '').strip()
        if initial_message:
            Message.objects.create(
                conversation=conversation,
                sender=buyer,
                text=initial_message
            )
            conversation.updated_at = timezone.now()
            conversation.save(update_fields=['updated_at'])

        resp_serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(
            resp_serializer.data,
            status=status.HTTP_201_CREATED if is_new else status.HTTP_200_OK
        )


class ConversationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        conversation = get_object_or_404(Conversation, pk=pk)
        if request.user.id not in [conversation.buyer_id, conversation.seller_id]:
            return Response({"detail": "Not authorized to view this conversation."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data)


class MessageListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        conversation = get_object_or_404(Conversation, pk=pk)
        if request.user.id not in [conversation.buyer_id, conversation.seller_id]:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        # Mark unread incoming messages as read
        for m in conversation.messages.all():
            if not m.is_read and m.sender_id != request.user.id:
                m.is_read = True
                m.save()

        messages = conversation.messages.select_related('sender').order_by('created_at')
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, pk):
        conversation = get_object_or_404(Conversation, pk=pk)
        if request.user.id not in [conversation.buyer_id, conversation.seller_id]:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        text = request.data.get('text', '').strip()
        if not text:
            return Response({"detail": "Message text is required."}, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            text=text
        )

        conversation.updated_at = timezone.now()
        conversation.save(update_fields=['updated_at'])

        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MarkAsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        conversation = get_object_or_404(Conversation, pk=pk)
        if request.user.id not in [conversation.buyer_id, conversation.seller_id]:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        count = 0
        for m in conversation.messages.all():
            if not m.is_read and m.sender_id != request.user.id:
                m.is_read = True
                m.save()
                count += 1
        return Response({"marked_read": count})


class UnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        buyer_convs = list(Conversation.objects.filter(buyer=user))
        seller_convs = list(Conversation.objects.filter(seller=user))
        seen = {c.id: c for c in (buyer_convs + seller_convs)}
        unread_count = 0
        for c in seen.values():
            unread_count += sum(1 for m in c.messages.all() if not m.is_read and m.sender_id != user.id)

        return Response({"unread_count": unread_count})

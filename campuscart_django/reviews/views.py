from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer
from orders.models import Order


def _recalculate_avg_rating(user):
    """
    Recomputes and saves a user's average rating.

    Deliberately done in plain Python (fetch the ratings, average them
    ourselves) rather than Django's .aggregate(Avg(...)) — Djongo's
    aggregation support is known to be incomplete for some queries, and
    this is a tiny dataset per user, so there's no real cost to doing it
    the simple, reliable way instead.
    """
    ratings = list(Review.objects.filter(reviewee=user).values_list('rating', flat=True))
    user.avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
    user.save(update_fields=['avg_rating'])


class ReviewCreateView(generics.CreateAPIView):
    """
    POST /api/reviews/
    Body: {"order": <id>, "rating": 1-5, "comment": "..."}

    Works in either direction — a buyer reviewing a seller, or a seller
    reviewing a buyer — since both are just "the other party" on a
    confirmed Order.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReviewCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = Order.objects.get(id=serializer.validated_data['order'])
        reviewee = order.seller if request.user.id == order.buyer_id else order.buyer

        if Review.objects.filter(order=order, reviewer=request.user).exists():
            return Response(
                {'success': False, 'message': 'You have already reviewed this transaction.'},
                status=status.HTTP_409_CONFLICT,
            )

        review = Review.objects.create(
            order=order,
            reviewer=request.user,
            reviewee=reviewee,
            rating=serializer.validated_data['rating'],
            comment=serializer.validated_data.get('comment', ''),
        )

        _recalculate_avg_rating(reviewee)

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class UserReviewListView(generics.ListAPIView):
    """
    GET /api/reviews/user/<user_id>/
    Public — lets anyone check a student's review history and rating
    before agreeing to a deal with them, without needing to be logged in.
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Review.objects.filter(reviewee_id=self.kwargs['user_id'])

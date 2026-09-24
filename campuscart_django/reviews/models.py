from djongo import models
from accounts.models import User
from orders.models import Order


class Review(models.Model):
    """
    A rating one student leaves for the other party in a specific,
    confirmed Order — either direction: buyer -> seller or seller ->
    buyer. This is only possible now because Order gives us a real
    record of who was actually involved in a transaction, instead of
    trusting a product's status alone.
    """

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')

    rating = models.IntegerField()  # 1-5, enforced in the serializer
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # One review per person per order — stops a buyer or seller from
        # reviewing the same transaction twice, while still allowing BOTH
        # sides of the same order to each leave their own review.
        unique_together = ('order', 'reviewer')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reviewer.full_name} rated {self.reviewee.full_name} {self.rating}\u2605"

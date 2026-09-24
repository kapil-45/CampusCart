from djongo import models
from accounts.models import User
from products.models import Product


class WishlistItem(models.Model):
    """
    A single "saved" product for a student.

    `price_at_add` snapshots the product's asking price at the moment it
    was wishlisted — this is what lets the Notification module (built
    later) detect a genuine price drop by comparing this snapshot against
    the product's current price, rather than just noticing "the price
    changed" with no reference point.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    price_at_add = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')  # can't wishlist the same product twice
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.full_name} \u2192 {self.product.title}"

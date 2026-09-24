from djongo import models
from accounts.models import User


class Product(models.Model):
    """
    A single marketplace listing.

    Note the `images` field: instead of a separate `product_images`
    collection with a foreign key back to this product (the old MySQL
    design), images are stored as an embedded JSON list of URL strings
    directly on the product document. That's the MongoDB-idiomatic
    choice — a product's photos are only ever read together with the
    product itself, so there's no reason to split them into a separate
    collection and pay for a lookup every time.

    `category` is filled in by the seller (or accepted from the ML
    suggestion once that module is built) — there's no separate
    `categories` collection either, for the same reasoning as roles on
    the User model.
    """

    CONDITION_CHOICES = (
        ('NEW', 'New'),
        ('LIKE_NEW', 'Like New'),
        ('GOOD', 'Good'),
        ('FAIR', 'Fair'),
        ('POOR', 'Poor'),
    )

    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('SOLD', 'Sold'),
        ('REMOVED', 'Removed'),
    )

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')

    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='GOOD')
    asking_price = models.DecimalField(max_digits=10, decimal_places=2)

    category = models.CharField(max_length=80, blank=True, null=True)
    predicted_category = models.CharField(max_length=80, blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')

    images = models.JSONField(default=list, blank=True)

    view_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sold_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
from djongo import models
from accounts.models import User
from products.models import Product


class Order(models.Model):
    """
    A lightweight record that a specific transaction happened: this
    buyer got this product from this seller. Created only through the
    "mark sold" flow (see orders/views.py), never by editing a product
    directly.

    This does NOT handle payment, delivery, or any part of the actual
    exchange — that still happens offline, in person, via the contact/
    call button. Its only job is to give the Reviews module something
    real to validate against, instead of trusting "the product says
    SOLD" on its own, which anyone could claim.
    """

    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='order')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchases')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sales')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.title}: {self.seller.full_name} \u2192 {self.buyer.full_name}"

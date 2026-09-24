from django.contrib import admin
from .models import WishlistItem


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'price_at_add', 'created_at')
    search_fields = ('user__full_name', 'product__title')

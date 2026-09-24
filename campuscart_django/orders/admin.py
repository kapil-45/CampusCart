from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('product', 'seller', 'buyer', 'created_at')
    search_fields = ('product__title', 'seller__full_name', 'buyer__full_name')

from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'seller', 'category', 'asking_price', 'status', 'created_at')
    list_filter = ('status', 'category', 'condition')
    search_fields = ('title', 'description')
    ordering = ('-created_at',)

from django.contrib import admin
from .models import User


class UserAdmin(admin.ModelAdmin):
    """
    Lets you view/manage students and admins through Django's built-in
    admin site at /admin/, without writing a custom dashboard yet.

    Deliberately a plain ModelAdmin, NOT Django's default UserAdmin —
    that default assumes a 'groups' and 'user_permissions' field (from
    PermissionsMixin), which our simpler custom User model doesn't have
    since we're not using Django's full permissions system.
    """
    list_display = ('email', 'full_name', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'full_name', 'college_id')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('full_name', 'college_id', 'phone', 'profile_image')}),
        ('Role & status', {'fields': ('role', 'avg_rating', 'is_active', 'is_staff')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'password', 'role'),
        }),
    )


admin.site.register(User, UserAdmin)
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Anyone (even unauthenticated visitors) can GET a listing.
    Only the student who created a listing may PUT/PATCH/DELETE it —
    an admin override is handled separately by the Admin module later,
    not folded in here to keep this permission single-purpose.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:  # GET, HEAD, OPTIONS
            return True
        return obj.seller_id == request.user.id

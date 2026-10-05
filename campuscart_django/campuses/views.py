from rest_framework import generics, permissions
from rest_framework.response import Response
from django.db.models import Q
from .models import Campus
from .serializers import CampusSerializer


class CampusSearchView(generics.ListAPIView):
    """
    GET /api/campuses/search/?q=<query>&limit=20

    Returns campuses matching the query against name, city, or state.
    Results are grouped by city on the frontend; we just return a flat list
    ordered by (state, city, name) and let React handle the grouping.

    No authentication required — users need this during registration before
    they have a token.
    """
    serializer_class = CampusSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        limit = min(int(self.request.query_params.get('limit', 30)), 100)

        qs = Campus.objects.filter(is_active=True)
        if q:
            qs = qs.filter(
                Q(name__icontains=q) |
                Q(city__icontains=q) |
                Q(state__icontains=q)
            )
        # Return at most `limit` results. If no query, show a curated starter
        # set so the dropdown isn't empty when the user first opens it.
        return qs[:limit]

from rest_framework import generics, permissions
from rest_framework.response import Response
from django.db.models import Q
from .models import Campus
from .serializers import CampusSerializer


class CampusSearchView(generics.ListAPIView):
    """
    GET /api/campuses/search/?q=<query>&limit=30

    Returns campuses matching the query against name, city, or state.
    Results are returned as a flat list ordered by (state, city, name)
    and React (CampusSelect.jsx) handles grouping by city.

    No authentication required — users need this during registration before
    they have a token.
    """
    serializer_class = CampusSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        q = request.query_params.get('q', '').strip().lower()
        limit_param = request.query_params.get('limit', 30)
        try:
            limit = min(int(limit_param), 100)
        except (ValueError, TypeError):
            limit = 30

        # Retrieve active campuses safely without Djongo iLIKE / SQLDecodeError
        all_campuses = Campus.objects.all()

        if not q:
            results = [c for c in all_campuses if getattr(c, 'is_active', True)]
        else:
            results = []
            for c in all_campuses:
                if not getattr(c, 'is_active', True):
                    continue
                name = (c.name or '').lower()
                city = (c.city or '').lower()
                state = (c.state or '').lower()
                if q in name or q in city or q in state:
                    results.append(c)

        # Sort by (state, city, name)
        results.sort(key=lambda c: (c.state or '', c.city or '', c.name or ''))
        results = results[:limit]

        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)


from django.urls import path
from .views import ReviewCreateView, UserReviewListView

urlpatterns = [
    path('', ReviewCreateView.as_view(), name='review-create'),
    path('user/<int:user_id>/', UserReviewListView.as_view(), name='user-reviews'),
]

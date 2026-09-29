from django.urls import path
from .views import (
    ConversationListView,
    ConversationDetailView,
    MessageListView,
    MarkAsReadView,
    UnreadCountView,
)

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/<int:pk>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:pk>/messages/', MessageListView.as_view(), name='message-list'),
    path('conversations/<int:pk>/read/', MarkAsReadView.as_view(), name='mark-as-read'),
    path('unread-count/', UnreadCountView.as_view(), name='unread-count'),
]

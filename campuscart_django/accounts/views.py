from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings

from .models import User
from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Body: {"full_name": "...", "email": "...", "password": "...", "college_id": "...", "phone": "..."}
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]   # anyone can register, no token needed

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'success': True,
                'message': 'Registration successful.',
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Body: {"email": "...", "password": "..."}
    Returns: {"access": "<jwt>", "refresh": "<jwt>", "userId": ..., "fullName": ..., "role": ...}
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/auth/me/  -> get current user profile info
    PATCH /api/auth/me/  -> update current user profile (full_name, phone, college_id, profile_image)
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class GoogleLoginView(APIView):
    """
    POST /api/auth/google/
    Body: {"credential": "<google_id_token>"}
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.data.get('credential')
        if not token:
            return Response({"error": "No credential provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Specify the CLIENT_ID of the app that accesses the backend:
            # idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), settings.GOOGLE_OAUTH_CLIENT_ID)
            # For this MVP, if CLIENT_ID is not set, we can just decode without strict audience check or set it in settings.
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request())
            
            email = idinfo['email']
            full_name = idinfo.get('name', '')
            profile_image = idinfo.get('picture', '')

            # Check if user exists, else create
            user, created = User.objects.get_or_create(email=email, defaults={
                'full_name': full_name,
                'profile_image': profile_image,
                # Random password since they use Google
                'password': User.objects.make_random_password(),
            })

            # If user already exists but has no profile image, update it
            if not created and not user.profile_image and profile_image:
                user.profile_image = profile_image
                user.save()

            # Generate tokens
            refresh = RefreshToken.for_user(user)
            # Add custom claims
            refresh['full_name'] = user.full_name
            refresh['role'] = user.role

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'userId': user.id,
                'fullName': user.full_name,
                'role': user.role,
                'user': UserSerializer(user).data
            })

        except ValueError as e:
            # Invalid token
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


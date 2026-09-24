from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    """Validates and creates a new student account."""

    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['full_name', 'email', 'password', 'college_id', 'phone']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def create(self, validated_data):
        # create_user() (see accounts/models.py) handles password hashing —
        # never write validated_data['password'] directly to the model.
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    """Read-only shape of a user, safe to send back in API responses (no password)."""

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'college_id', 'phone',
                  'role', 'avg_rating', 'created_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends the default JWT login serializer (which already checks
    email + password against the User model) to:
      1. bake full_name and role into the token's own payload, and
      2. return the user's basic info alongside the token in the response,
    matching the shape the old Java LoginServlet used to return.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['full_name'] = user.full_name
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)  # runs the actual email+password check
        data['userId'] = self.user.id
        data['fullName'] = self.user.full_name
        data['role'] = self.user.role
        return data

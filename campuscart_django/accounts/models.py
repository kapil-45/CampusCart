from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


class UserManager(BaseUserManager):
    """
    Custom manager so Django knows how to create users/superusers when
    the User model doesn't use Django's default 'username' field — we
    log in with email instead.
    """

    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)   # Django's built-in PBKDF2 hashing
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, full_name, password, **extra_fields)


class User(AbstractBaseUser):
    """
    A student (or admin) account.

    Note there is no separate `roles` collection/table — in a document
    database it's more natural to just store the role directly on the
    user document as a plain field, rather than normalizing it out into
    its own collection with a foreign key the way the old MySQL schema did.
    """

    ROLE_CHOICES = (
        ('STUDENT', 'Student'),
        ('ADMIN', 'Admin'),
    )

    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    college_id = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    profile_image = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    avg_rating = models.FloatField(default=0.0)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)   # required for Django admin site access
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'         # log in with email, not a separate username
    REQUIRED_FIELDS = ['full_name']  # asked for when running createsuperuser

    def __str__(self):
        return f"{self.full_name} ({self.email})"

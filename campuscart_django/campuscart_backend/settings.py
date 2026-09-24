"""
Django settings for the CampusCart backend.

Database is MongoDB, connected through Djongo — which lets us write normal
Django models (models.py) and have them mapped to MongoDB collections
under the hood, instead of writing raw pymongo queries by hand.
"""

from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# ⚠️ For a real deployment this must be a secret, private value — kept
# simple here since this is a college project, not a production system.
SECRET_KEY = 'django-insecure-campuscart-change-this-key-before-real-deployment'

DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'corsheaders',

    'accounts',   # our custom app: user model, register/login
    'products',
    'wishlist',
    'orders',
    'reviews',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',   # must be near the top
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'campuscart_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'campuscart_backend.wsgi.application'

# ---------------- Database: MongoDB via Djongo ----------------
DATABASES = {
    'default': {
        'ENGINE': 'djongo',
        'NAME': 'campuscart',                 # MongoDB database name
        'CLIENT': {
            'host': 'localhost',
            'port': 27017,
            # 'username': 'your_mongo_username',   # uncomment if MongoDB auth is enabled
            # 'password': 'your_mongo_password',
        }
    }
}

# ---------------- Custom user model ----------------
# We use a custom User model (accounts.User) instead of Django's default,
# so we can add college_id, phone, role, etc. directly on it.
AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 6}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_L10N = True
USE_TZ = True

STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

# ---------------- Django REST Framework ----------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
}

# ---------------- JWT settings ----------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ---------------- CORS (allow the React dev server to call this API) ----------------
CORS_ALLOW_ALL_ORIGINS = True   # fine for local dev; restrict this before any real deployment

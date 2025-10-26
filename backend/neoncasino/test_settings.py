"""
Test settings for NeonCasino Django project
"""
from .settings import *

# Use in-memory database for tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Use in-memory cache for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Use console email backend for tests
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Disable password hashing for faster tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Use faster hashing for tests
HASH_SALT = 'test-salt'

# Disable logging during tests
LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
}

# Disable Celery tasks during tests
CELERY_ALWAYS_EAGER = True
CELERY_EAGER_PROPAGATES_EXCEPTIONS = True

# Use test secret key
SECRET_KEY = 'test-secret-key-for-testing-only'

# Disable debug mode
DEBUG = False

# Use test allowed hosts
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

# Disable CSRF protection for tests
MIDDLEWARE = [m for m in MIDDLEWARE if 'csrf' not in m.lower()]

# Use test media settings
MEDIA_ROOT = '/tmp/neoncasino_test_media/'
STATIC_ROOT = '/tmp/neoncasino_test_static/'

# Disable external services
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'cache+memory://'

# Use test S3 settings
AWS_ACCESS_KEY_ID = 'test-access-key'
AWS_SECRET_ACCESS_KEY = 'test-secret-key'
AWS_STORAGE_BUCKET_NAME = 'test-bucket'
AWS_S3_ENDPOINT_URL = 'http://localhost:9000'

# Disable real-time features
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}

# Use test Telegram settings
TELEGRAM_BOT_TOKEN = 'test-bot-token'
TELEGRAM_ADMIN_CHAT_ID = '123456789'

# Disable external API calls
DISABLE_EXTERNAL_APIS = True




















"""
URL configuration for NeonCasino project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('users.auth_urls')),
    path('api/users/', include('users.urls')),
    path('api/games/', include('games.urls')),
    path('api/kyc/', include('kyc.urls')),
    path('api/promo/', include('promo.urls')),
    path('api/transactions/', include('transactions.urls')),
    path('api/payments/', include('payments_new.urls')),
    path('api/telegram-bot/', include('telegram_bot_new.urls')),
    path('api/integrations/', include('integrations.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/admin/', include('admin_dashboard.urls')),
    
    # Health check
    path('health/', lambda request: HttpResponse('OK')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_URL)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

from django.urls import path
from . import views

app_name = 'telegram_bot_new'

urlpatterns = [
    # Telegram bot webhook endpoints
    path('webhook/', views.webhook, name='webhook'),
    path('set-webhook/', views.set_webhook, name='set-webhook'),
    
    # Admin endpoints
    path('admin/status/', views.bot_status, name='bot-status'),
    path('admin/send-message/', views.send_admin_message, name='send-admin-message'),
]


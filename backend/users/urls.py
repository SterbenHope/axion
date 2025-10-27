"""
User Data URL patterns for NeonCasino.
"""

from django.urls import path
from . import views
from . import email_verification

app_name = 'users'

urlpatterns = [
    # Profile and settings
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('dashboard/', views.DashboardDataView.as_view(), name='dashboard'),
    path('change-password/', views.change_password, name='change-password'),
    path('upload-avatar/', views.upload_avatar, name='upload-avatar'),
    
    # New API endpoints
    path('balance/', views.user_balance, name='user-balance'),
    path('stats/', views.user_stats, name='user-stats'),  # Используем функцию вместо класса
    path('achievements/', views.user_achievements, name='user-achievements'),
    path('user-profile/', views.user_profile, name='user-profile-detail'),
    path('update-profile/', views.update_profile, name='update-profile'),
    path('preferences/', views.user_preferences, name='user-preferences'),
    
    # Email verification endpoints
    path('send-verification-code/', email_verification.send_email_verification_code, name='send-verification-code'),
    path('verify-email-code/', email_verification.verify_email_code_view, name='verify-email-code'),
]






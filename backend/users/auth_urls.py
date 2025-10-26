"""
User Authentication URL patterns for NeonCasino.
"""

from django.urls import path
from . import views

app_name = 'auth'

urlpatterns = [
    # Authentication
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('logout/', views.UserLogoutView.as_view(), name='logout'),
    path('check-session/', views.CheckSessionView.as_view(), name='check-session'),
    
    # JWT endpoints
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token-refresh'),
    path('user/', views.UserDetailView.as_view(), name='user-detail'),
    path('verify-token/', views.VerifyTokenView.as_view(), name='verify-token'),
]

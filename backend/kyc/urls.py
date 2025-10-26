from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin', views.AdminKYCViewSet, basename='admin-kyc')

urlpatterns = [
    # User KYC endpoints
    path('status/', views.KYCStatusView.as_view(), name='kyc-status'),
    path('create/', views.KYCVerificationCreateView.as_view(), name='kyc-create'),
    path('detail/<uuid:pk>/', views.KYCVerificationDetailView.as_view(), name='kyc-detail'),
    path('list/', views.KYCVerificationListView.as_view(), name='kyc-list'),
    path('upload/', views.KYCDocumentUploadView.as_view(), name='kyc-upload'),
    path('logs/', views.KYCVerificationLogView.as_view(), name='kyc-logs'),
    path('submit/', views.submit_kyc, name='kyc-submit'),
    
    # Admin KYC endpoints
    path('review/<uuid:pk>/', views.KYCVerificationReviewView.as_view(), name='kyc-review'),
    path('', include(router.urls)),
]

from django.urls import path
from . import views

app_name = 'promo'

urlpatterns = [
    # Public promo endpoints
    path('list/', views.PromoCodeListView.as_view(), name='promo-list'),
    path('detail/<str:code>/', views.PromoCodeDetailView.as_view(), name='promo-detail'),
    
    # Promo code usage (authenticated)
    path('validate/', views.PromoCodeValidationView.as_view(), name='promo-validate'),
    path('redeem/', views.PromoCodeRedemptionView.as_view(), name='promo-redeem'),
    path('my-promos/', views.PromoRedemptionListView.as_view(), name='user-promo-list'),
    
    # Manager endpoints
    path('managers/', views.PromoManagerListView.as_view(), name='manager-list'),
    path('managers/<int:manager_id>/', views.PromoManagerDetailView.as_view(), name='manager-detail'),
    path('managers/apply/', views.apply_for_manager, name='apply-manager'),
    path('managers/<int:manager_id>/approve/', views.approve_manager, name='approve-manager'),
    
    # Promo code request endpoints
    path('requests/', views.PromoCodeRequestListView.as_view(), name='request-list'),
    path('requests/<int:request_id>/approve/', views.approve_promo_request, name='approve-request'),
    
    # Admin endpoints
    path('admin/', views.AdminPromoCodeView.as_view(), name='admin-promo'),
]

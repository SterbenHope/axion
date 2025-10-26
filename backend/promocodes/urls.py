from django.urls import path
from . import views

app_name = 'promocodes'

urlpatterns = [
    # Promo Code Views
    path('', views.PromoCodeListView.as_view(), name='promo-list'),
    path('<str:code>/', views.PromoCodeDetailView.as_view(), name='promo-detail'),
    path('use/', views.use_promo_code, name='use-promo'),
    
    # Manager Views
    path('managers/', views.PromoManagerListView.as_view(), name='manager-list'),
    path('managers/<int:manager_id>/', views.PromoManagerDetailView.as_view(), name='manager-detail'),
    path('managers/apply/', views.apply_for_manager, name='apply-manager'),
    path('managers/<int:manager_id>/approve/', views.approve_manager, name='approve-manager'),
    
    # Promo Code Request Views
    path('requests/', views.PromoCodeRequestListView.as_view(), name='request-list'),
    path('requests/<int:request_id>/approve/', views.approve_promo_request, name='approve-request'),
    
    # User Views
    path('usage/', views.UserPromoUsageListView.as_view(), name='user-usage'),
    
    # Admin Views
    path('admin/statistics/', views.promo_statistics, name='admin-stats'),
]









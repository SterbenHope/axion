from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'dashboards', views.AdminDashboardViewSet, basename='admin-dashboard')
admin_router.register(r'widgets', views.DashboardWidgetViewSet, basename='dashboard-widget')
admin_router.register(r'layouts', views.DashboardLayoutViewSet, basename='dashboard-layout')
admin_router.register(r'notifications', views.AdminNotificationViewSet, basename='admin-notification')
admin_router.register(r'audit-logs', views.AuditLogViewSet, basename='audit-log')

urlpatterns = [
    # Dashboard endpoints (admin only)
    path('', include(admin_router.urls)),
    
    # Quick stats
    path('overview/', views.DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('stats/', views.admin_stats, name='dashboard-stats'),
    path('dashboard/', views.DashboardOverviewView.as_view(), name='dashboard'),
    path('main/', views.DashboardOverviewView.as_view(), name='dashboard-main'),
    path('user-stats/', views.UserStatsView.as_view(), name='user-stats'),
    path('user-activity/', views.UserActivityView.as_view(), name='user-activity'),
    path('user-search/', views.UserSearchView.as_view(), name='user-search'),
    path('game-stats/', views.GameStatsView.as_view(), name='game-stats'),
    path('game-performance/', views.GamePerformanceView.as_view(), name='game-performance'),
    path('financial-stats/', views.FinancialStatsView.as_view(), name='financial-stats'),
    path('transaction-stats/', views.TransactionStatsView.as_view(), name='transaction-stats'),
    path('kyc-stats/', views.KYCStatsView.as_view(), name='kyc-stats'),
    path('promo-stats/', views.PromoStatsView.as_view(), name='promo-stats'),
    path('system-health/', views.SystemHealthView.as_view(), name='system-health'),
    path('health/', views.SystemHealthView.as_view(), name='health'),
    path('performance/', views.PerformanceMetricsView.as_view(), name='performance-metrics'),
    path('realtime/', views.PerformanceMetricsView.as_view(), name='realtime-data'),
    path('audit-logs/', views.AuditLogViewSet.as_view({'get': 'list'}), name='audit-logs'),
    path('export/', views.ExportDataView.as_view(), name='export-data'),
    path('bulk-actions/', views.BulkActionView.as_view(), name='bulk-actions'),
    path('reports/', views.ReportGeneratorView.as_view(), name='report-generator'),
    path('notifications/', views.AdminNotificationViewSet.as_view({'get': 'list', 'post': 'create'}), name='notifications'),
]

from django.urls import path
from . import views

urlpatterns = [
    # Health check endpoints
    path('', views.HealthCheckView.as_view(), name='health-check'),
    path('detailed/', views.DetailedHealthCheckView.as_view(), name='detailed-health-check'),
    path('service/<str:service_name>/', views.ServiceHealthCheckView.as_view(), name='service-health-check'),
]




















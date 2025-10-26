from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('data/', views.dashboard_data, name='dashboard-data'),
]

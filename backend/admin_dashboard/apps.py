from django.apps import AppConfig


class AdminDashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_dashboard'
    verbose_name = 'Admin Dashboard'

    def ready(self):
        try:
            import admin_dashboard.signals
        except ImportError:
            pass

from django.apps import AppConfig


class HealthCheckConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'health_check'
    verbose_name = 'Health Check'

    def ready(self):
        try:
            import health_check.signals
        except ImportError:
            pass




















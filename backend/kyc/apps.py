from django.apps import AppConfig


class KYCConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'kyc'
    verbose_name = 'KYC Management'

    def ready(self):
        try:
            import kyc.signals
        except ImportError:
            pass


from django.apps import AppConfig


class PaymentsNewConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'payments_new'
    
    def ready(self):
        import payments_new.signals
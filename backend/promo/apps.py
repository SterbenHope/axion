from django.apps import AppConfig


class PromoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'promo'
    verbose_name = 'Promotion Management'

    def ready(self):
        # try:
        #     import promo.signals
        # except ImportError:
        #     pass
        pass

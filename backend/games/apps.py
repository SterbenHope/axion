from django.apps import AppConfig


class GamesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'games'
    verbose_name = 'Games Management'

    def ready(self):
        try:
            import games.signals
        except ImportError:
            pass


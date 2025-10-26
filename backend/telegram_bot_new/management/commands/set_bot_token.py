from django.core.management.base import BaseCommand, CommandError
from telegram_bot_new.models import BotSettings


class Command(BaseCommand):
    help = "Set or update Telegram bot token and chat IDs without using the admin panel"

    def add_arguments(self, parser):
        parser.add_argument('--token', required=True, help='Telegram bot token from BotFather')
        parser.add_argument('--admin-chat-id', required=False, help='Admin chat ID (user or group)')
        parser.add_argument('--managers-chat-id', required=False, help='Managers chat ID (optional)')
        parser.add_argument('--active', action='store_true', help='Mark bot settings as active')

    def handle(self, *args, **options):
        token = options['token']
        admin_chat_id = options.get('admin_chat_id')
        managers_chat_id = options.get('managers_chat_id')
        mark_active = options.get('active', False)

        try:
            # Try to get existing settings (prefer the latest active one)
            settings_qs = BotSettings.objects.all().order_by('-updated_at')
            if settings_qs.exists():
                bot_settings = settings_qs.first()
                created = False
            else:
                bot_settings = BotSettings()
                created = True

            bot_settings.bot_token = token
            if admin_chat_id:
                bot_settings.admin_chat_id = admin_chat_id
            if managers_chat_id is not None:
                bot_settings.managers_chat_id = managers_chat_id
            if mark_active:
                bot_settings.is_active = True

            bot_settings.save()

            self.stdout.write(self.style.SUCCESS(
                f"Bot settings {'created' if created else 'updated'} successfully."
            ))
            self.stdout.write(self.style.SUCCESS(
                f"Active: {bot_settings.is_active} | Admin chat: {bot_settings.admin_chat_id} | Managers chat: {bot_settings.managers_chat_id or '-'}"
            ))
        except Exception as e:
            raise CommandError(f"Failed to set bot token: {e}")







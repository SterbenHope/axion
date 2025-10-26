from django.core.management.base import BaseCommand
from telegram_bot_new.models import BotSettings
from telegram_bot_new.services import TelegramBotService


class Command(BaseCommand):
    help = 'Setup Telegram bot with token and admin chat'

    def add_arguments(self, parser):
        parser.add_argument(
            '--bot-token',
            type=str,
            help='Telegram bot token from @BotFather'
        )
        parser.add_argument(
            '--admin-chat-id',
            type=str,
            help='Admin chat ID for notifications'
        )
        parser.add_argument(
            '--managers-chat-id',
            type=str,
            help='Managers chat ID for promo code notifications'
        )
        parser.add_argument(
            '--test',
            action='store_true',
            help='Test bot connection after setup'
        )

    def handle(self, *args, **options):
        bot_token = options['bot_token']
        admin_chat_id = options['admin_chat_id']
        managers_chat_id = options['managers_chat_id']
        test_bot = options['test']

        if not bot_token:
            bot_token = input('Enter bot token from @BotFather: ').strip()
        
        if not admin_chat_id:
            admin_chat_id = input('Enter admin chat ID: ').strip()

        if not managers_chat_id:
            managers_chat_id = input('Enter managers chat ID (optional, press Enter to skip): ').strip()

        if not bot_token or not admin_chat_id:
            self.stdout.write(
                self.style.ERROR('Bot token and admin chat ID are required')
            )
            return

        # Create or update bot settings
        bot_settings, created = BotSettings.objects.get_or_create(
            defaults={
                'bot_token': bot_token,
                'admin_chat_id': admin_chat_id,
                'managers_chat_id': managers_chat_id if managers_chat_id else None,
                'is_active': True
            }
        )

        if not created:
            bot_settings.bot_token = bot_token
            bot_settings.admin_chat_id = admin_chat_id
            if managers_chat_id:
                bot_settings.managers_chat_id = managers_chat_id
            bot_settings.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'Bot settings {"created" if created else "updated"} successfully'
            )
        )

        # Test bot connection if requested
        if test_bot:
            self.stdout.write('Testing bot connection...')
            try:
                bot_service = TelegramBotService()
                bot_info = bot_service.get_bot_info()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Bot connected successfully: {bot_info.get("first_name", "Unknown")}'
                    )
                )
                
                # Test admin notification
                test_message = "🔔 Test notification from NeonCasino bot"
                bot_service.send_message_sync(admin_chat_id, test_message)
                self.stdout.write(
                    self.style.SUCCESS('Test message sent to admin chat')
                )
                
                # Test managers notification if configured
                if managers_chat_id:
                    test_manager_message = "🎯 Test manager notification from NeonCasino bot"
                    bot_service.send_message_sync(managers_chat_id, test_manager_message)
                    self.stdout.write(
                        self.style.SUCCESS('Test message sent to managers chat')
                    )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Bot test failed: {str(e)}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                '\n📋 Next steps:'
                '\n1. Add bot to your admin chat'
                '\n2. Add bot to your managers chat (if configured)'
                '\n3. Send /start command to bot in both chats'
                '\n4. Use /help to see available commands'
                '\n5. Use /add_manager <user_id> to add individual managers'
            )
        )

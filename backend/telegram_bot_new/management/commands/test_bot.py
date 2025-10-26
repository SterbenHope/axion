from django.core.management.base import BaseCommand
from telegram_bot_new.services import TelegramBotService


class Command(BaseCommand):
    help = 'Test Telegram bot connection and send test message'

    def add_arguments(self, parser):
        parser.add_argument(
            '--chat-id',
            type=str,
            help='Chat ID to send test message to'
        )
        parser.add_argument(
            '--message',
            type=str,
            default='🔔 Test message from NeonCasino bot',
            help='Test message to send'
        )

    def handle(self, *args, **options):
        chat_id = options['chat_id']
        message = options['message']

        self.stdout.write('Testing Telegram bot...')

        try:
            bot_service = TelegramBotService()
            
            # Test bot info
            bot_info = bot_service.get_bot_info()
            if bot_info:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Bot connected: @{bot_info.get("username")} ({bot_info.get("first_name")})'
                    )
                )
            else:
                self.stdout.write(
                    self.style.ERROR('❌ Failed to get bot info')
                )
                return

            # Test sending message if chat_id provided
            if chat_id:
                self.stdout.write(f'Sending test message to chat {chat_id}...')
                success = bot_service.send_message_sync(chat_id, message)
                
                if success:
                    self.stdout.write(
                        self.style.SUCCESS('✅ Test message sent successfully')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR('❌ Failed to send test message')
                    )
            else:
                self.stdout.write(
                    self.style.WARNING('No chat ID provided, skipping message test')
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Bot test failed: {str(e)}')
            )










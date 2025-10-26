from django.core.management.base import BaseCommand
from telegram_bot_new.services import TelegramBotService
import asyncio
import signal
import sys


class Command(BaseCommand):
    help = 'Run Telegram bot for NeonCasino'

    def add_arguments(self, parser):
        parser.add_argument(
            '--webhook',
            action='store_true',
            help='Use webhook mode instead of polling'
        )
        parser.add_argument(
            '--webhook-url',
            type=str,
            help='Webhook URL for webhook mode'
        )

    def __init__(self):
        super().__init__()
        self.bot_service = None
        self.loop = None
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        if self.bot_service and self.loop:
            self.stdout.write('\n🛑 Received shutdown signal, stopping bot gracefully...')
            try:
                # Create a task to stop the bot
                if self.loop.is_running():
                    asyncio.run_coroutine_threadsafe(
                        self.bot_service.stop_polling(), 
                        self.loop
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'Warning: Error stopping bot: {e}')
                )
        sys.exit(0)

    def handle(self, *args, **options):
        use_webhook = options['webhook']
        webhook_url = options['webhook_url']

        self.stdout.write('Starting Telegram bot...')

        try:
            self.bot_service = TelegramBotService()
            
            if use_webhook and webhook_url:
                self.stdout.write(f'Setting webhook to: {webhook_url}')
                self.bot_service.set_webhook(webhook_url)
                self.stdout.write(
                    self.style.SUCCESS('Webhook set successfully')
                )
            else:
                self.stdout.write('Starting bot in polling mode...')
                self.stdout.write('Press Ctrl+C to stop the bot')
                
                # Run bot in polling mode
                try:
                    self.loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(self.loop)
                    self.loop.run_until_complete(self.bot_service.start_polling())
                except KeyboardInterrupt:
                    self.stdout.write('\n🛑 Bot stopped by user')
                    # Gracefully stop the bot
                    try:
                        self.loop.run_until_complete(self.bot_service.stop_polling())
                    except Exception as stop_error:
                        self.stdout.write(
                            self.style.WARNING(f'Warning: Error stopping bot: {stop_error}')
                        )
                    finally:
                        self.loop.close()
                    
        except KeyboardInterrupt:
            self.stdout.write('\n🛑 Bot stopped by user')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Bot error: {str(e)}')
            )

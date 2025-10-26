from django.core.management.base import BaseCommand
from telegram_bot_new.bot import TelegramBot
import asyncio
import os


class Command(BaseCommand):
    help = 'Запускает Telegram бота'

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Запускаю Telegram бота...')
        )
        
        try:
            # Получаем токен из переменных окружения
            bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
            if not bot_token:
                self.stdout.write(
                    self.style.ERROR('TELEGRAM_BOT_TOKEN не найден в переменных окружения')
                )
                return
            
            # Создаем и запускаем бота
            bot = TelegramBot()
            
            # Запускаем бота в асинхронном режиме
            asyncio.run(bot.run())
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Ошибка при запуске бота: {e}')
            )

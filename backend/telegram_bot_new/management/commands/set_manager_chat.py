from django.core.management.base import BaseCommand
from telegram_bot_new.models import BotSettings
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Set manager chat ID for Telegram bot notifications'
    
    def add_arguments(self, parser):
        parser.add_argument(
            'chat_id',
            type=str,
            help='Chat ID for managers notifications'
        )
    
    def handle(self, *args, **options):
        chat_id = options['chat_id']
        
        self.stdout.write(f"🔧 Setting manager chat ID to: {chat_id}")
        
        try:
            # Get or create bot settings
            bot_settings, created = BotSettings.objects.get_or_create(
                defaults={
                    'bot_token': 'your_bot_token_here',  # Will be updated if needed
                    'admin_chat_id': '-1003065807763',  # Default admin chat
                    'is_active': True
                }
            )
            
            if created:
                self.stdout.write("✅ BotSettings created")
            else:
                self.stdout.write("✅ BotSettings found")
            
            # Update manager chat ID
            old_chat_id = bot_settings.managers_chat_id
            bot_settings.managers_chat_id = chat_id
            bot_settings.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Manager chat ID updated successfully!\n"
                    f"Old: {old_chat_id or 'Not set'}\n"
                    f"New: {chat_id}"
                )
            )
            
            # Test notification to new manager chat
            self.stdout.write("🧪 Testing notification to new manager chat...")
            try:
                from telegram_bot_new.services import telegram_notification_service
                
                # Send test message
                telegram_notification_service._sync_notify_manager_user_registered(
                    username="test_user",
                    email="test@example.com",
                    promo_code="TEST123"
                )
                
                self.stdout.write("✅ Test notification sent successfully!")
                
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(
                        f"⚠️ Test notification failed: {e}\n"
                        "This might mean the bot is not added to the group or lacks permissions."
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error setting manager chat: {e}")
            )
            logger.error(f"Error in set_manager_chat command: {e}")

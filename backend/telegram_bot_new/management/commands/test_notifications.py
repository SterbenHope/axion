from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from telegram_bot_new.services import telegram_notification_service
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class Command(BaseCommand):
    help = 'Test Telegram notifications for user events'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            choices=['registration', 'promo_activation', 'all'],
            default='all',
            help='Type of notification to test'
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email for test user'
        )
        parser.add_argument(
            '--promo',
            type=str,
            help='Promo code to test with'
        )
    
    def handle(self, *args, **options):
        notification_type = options['type']
        email = options['email'] or 'test@example.com'
        promo_code = options['promo'] or 'TEST123'
        
        self.stdout.write(f"🧪 Testing {notification_type} notifications...")
        
        try:
            if notification_type in ['registration', 'all']:
                self.test_user_registration(email, promo_code)
            
            if notification_type in ['promo_activation', 'all']:
                self.test_promo_activation(email, promo_code)
                
            self.stdout.write(self.style.SUCCESS("✅ All notification tests completed!"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error during testing: {e}"))
            logger.error(f"Error in test_notifications command: {e}")
    
    def test_user_registration(self, email, promo_code):
        """Test user registration notification"""
        self.stdout.write("👤 Testing user registration notification...")
        
        # Create test user
        test_user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': f'test_user_{email.split("@")[0]}',
                'ref_source_code': promo_code
            }
        )
        
        if created:
            self.stdout.write(f"✅ Test user created: {test_user.email}")
        else:
            # Update promo code if user exists
            test_user.ref_source_code = promo_code
            test_user.save()
            self.stdout.write(f"✅ Test user updated: {test_user.email}")
        
        # Mark as test user to prevent duplicate notifications
        test_user.is_test_user = True
        
        # Test notification directly without triggering signals
        try:
            # Test admin notification
            telegram_notification_service._sync_notify_admin_user_registered(
                username=test_user.username or test_user.email,
                email=test_user.email,
                promo_code=promo_code
            )
            
            # Test manager notification if promo code exists
            if promo_code:
                telegram_notification_service._sync_notify_manager_user_registered(
                    username=test_user.username or test_user.email,
                    email=test_user.email,
                    promo_code=promo_code
                )
            
            self.stdout.write("📤 User registration notification sent")
        except Exception as e:
            self.stdout.write(f"❌ Error sending notification: {e}")
    
    def test_promo_activation(self, email, promo_code):
        """Test promo code activation notification"""
        self.stdout.write("🎯 Testing promo code activation notification...")
        
        # Get or create test user
        test_user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': f'test_user_{email.split("@")[0]}'
            }
        )
        
        if created:
            self.stdout.write(f"✅ Test user created: {test_user.email}")
        
        # Mark as test user to prevent duplicate notifications
        test_user.is_test_user = True
        
        # Test notification directly without triggering signals
        try:
            # Test admin notification
            telegram_notification_service._sync_notify_admin_promo_activated(
                username=test_user.username or test_user.email,
                email=test_user.email,
                promo_code=promo_code
            )
            
            # Test manager notification
            telegram_notification_service._sync_notify_manager_promo_activated(
                username=test_user.username or test_user.email,
                email=test_user.email,
                promo_code=promo_code
            )
            
            self.stdout.write("📤 Promo activation notification sent")
        except Exception as e:
            self.stdout.write(f"❌ Error sending notification: {e}")

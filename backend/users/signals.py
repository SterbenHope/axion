from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

@receiver(post_save, sender=User)
def user_registered_notification(sender, instance, created, **kwargs):
    """Send notification when new user is registered"""
    if created:
        try:
            # Import here to avoid circular imports
            from telegram_bot_new.services import telegram_notification_service
            
            # Check if user has promo code from ref_source_code field
            promo_code = getattr(instance, 'ref_source_code', None)
            
            # Send notification
            telegram_notification_service.sync_notify_user_registration(instance, promo_code)
            
            logger.info(f"User registration notification sent for {instance.email}")
            
        except Exception as e:
            logger.error(f"Error sending user registration notification: {e}")

@receiver(post_save, sender=User)
def user_profile_updated(sender, instance, created, **kwargs):
    """Handle user profile updates"""
    if not created:
        try:
            # Handle profile updates if needed
            pass
        except Exception as e:
            logger.error(f"Error handling user profile update: {e}")

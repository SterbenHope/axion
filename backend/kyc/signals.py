from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import KYCVerification
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=KYCVerification)
def notify_kyc_completed(sender, instance, created, **kwargs):
    """Send Telegram notification when KYC is completed"""
    if created:
        try:
            logger.info(f"🔔 KYC signal triggered for {instance.user.email}")
            # Отложенный импорт для избежания ошибок при загрузке модуля
            from telegram_bot_new.services import TelegramBotService
            bot_service = TelegramBotService()
            bot_service.notify_admin_kyc_submitted_sync(instance)
            logger.info(f"✅ KYC notification sent successfully for {instance.user.email}")
        except Exception as e:
            logger.error(f"❌ Error in KYC notification signal: {e}")
            logger.exception("Full traceback:")






from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import PromoCode, PromoRedemption, PromoCampaign
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=PromoCode)
def create_promo_log(sender, instance, created, **kwargs):
    """Create log when promo code is created/updated"""
    if created:
        # Log promo code creation
        from transactions.models import TransactionLog
        
        TransactionLog.objects.create(
            action='PROMO_CODE_CREATED',
            performed_by=None,
            resource_type='PROMO_CODE',
            resource_id=instance.code,
            details={
                'promo_type': instance.promo_type,
                'discount_value': str(instance.discount_value),
                'currency': 'EUR',
                'usage_limit': instance.max_uses
            }
        )
    else:
        # Log promo code updates
        if instance.tracker.has_changed('is_active'):
            from transactions.models import TransactionLog
            
            TransactionLog.objects.create(
                action='PROMO_CODE_STATUS_CHANGED',
                performed_by=None,
                resource_type='PROMO_CODE',
                resource_id=instance.code,
                details={
                    'old_status': instance.tracker.previous('is_active'),
                    'new_status': instance.is_active
                }
            )


@receiver(post_save, sender=PromoRedemption)
def create_redemption_log(sender, instance, created, **kwargs):
    """Create log when promo code is redeemed"""
    if created:
        from transactions.models import TransactionLog
        
        TransactionLog.objects.create(
            action='PROMO_CODE_REDEEMED',
            performed_by=instance.user,
            resource_type='PROMO_REDEMPTION',
            resource_id=str(instance.id),
            details={
                'promo_code': instance.promo_code.code,
                'amount_saved': str(instance.amount_saved),
                'currency': instance.currency,
                'order_id': instance.order_id
            }
        )


@receiver(post_save, sender=PromoCampaign)
def create_campaign_log(sender, instance, created, **kwargs):
    """Create log when promo campaign is created/updated"""
    if created:
        from transactions.models import TransactionLog
        
        TransactionLog.objects.create(
            action='PROMO_CAMPAIGN_CREATED',
            performed_by=instance.created_by,
            resource_type='PROMO_CAMPAIGN',
            resource_id=str(instance.id),
            details={
                'campaign_type': instance.campaign_type,
                'start_date': instance.start_date.isoformat(),
                'end_date': instance.end_date.isoformat() if instance.end_date else None
            }
        )
    else:
        # Log campaign status changes
        if instance.tracker.has_changed('is_active'):
            from transactions.models import TransactionLog
            
            TransactionLog.objects.create(
                action='PROMO_CAMPAIGN_STATUS_CHANGED',
                performed_by=instance.created_by,
                resource_type='PROMO_CAMPAIGN',
                resource_id=str(instance.id),
                details={
                    'old_status': instance.tracker.previous('is_active'),
                    'new_status': instance.is_active
                }
            )


@receiver(post_save, sender=PromoRedemption)
def promo_code_activated_notification(sender, instance, created, **kwargs):
    """Send notification when promo code is activated"""
    if created:
        try:
            # Import here to avoid circular imports
            from telegram_bot_new.services import telegram_notification_service
            
            # Send notification about promo code activation
            telegram_notification_service.sync_notify_promo_activation(
                user=instance.user,
                promo_code=instance.promo_code.code
            )
            
            logger.info(f"Promo code activation notification sent for {instance.user.email} with code {instance.promo_code.code}")
            
        except Exception as e:
            logger.error(f"Error sending promo code activation notification: {e}")

@receiver(post_save, sender=PromoRedemption)
def update_manager_stats(sender, instance, created, **kwargs):
    """Update manager statistics when promo code is used"""
    if created:
        try:
            # Update manager stats
            if instance.promo_code.created_by:
                # You might want to update manager statistics here
                # For example, increment total_users_referred
                pass
                
        except Exception as e:
            logger.error(f"Error updating manager stats: {e}")


@receiver(post_delete, sender=PromoCode)
def log_promo_deletion(sender, instance, **kwargs):
    """Log when promo code is deleted"""
    from transactions.models import TransactionLog
    
    TransactionLog.objects.create(
        action='PROMO_CODE_DELETED',
        performed_by=None,
        resource_type='PROMO_CODE',
        resource_id=instance.code,
        details={
            'promo_type': instance.promo_type,
            'discount_value': str(instance.discount_value),
            'currency': 'EUR'
        }
    )








from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import HealthCheck


@receiver(post_save, sender=HealthCheck)
def create_health_check_log(sender, instance, created, **kwargs):
    """Create log when health check status changes"""
    if not created and instance.tracker.has_changed('status'):
        from transactions.models import TransactionLog
        
        TransactionLog.objects.create(
            action='HEALTH_CHECK_STATUS_CHANGED',
            performed_by=None,  # System action
            resource_type='HEALTH_CHECK',
            resource_id=instance.service_name,
            details={
                'old_status': instance.tracker.previous('status'),
                'new_status': instance.status,
                'service_name': instance.service_name,
                'response_time': instance.response_time
            }
        )




















from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import AdminDashboard, DashboardWidget, AdminNotification


@receiver(post_save, sender=AdminDashboard)
def create_dashboard_log(sender, instance, created, **kwargs):
    """Create log when admin dashboard is created/updated"""
    if created:
        from transactions.models import TransactionLog
        
        TransactionLog.objects.create(
            action='ADMIN_DASHBOARD_CREATED',
            performed_by=instance.created_by,
            resource_type='ADMIN_DASHBOARD',
            resource_id=str(instance.id),
            details={
                'dashboard_type': instance.dashboard_type,
                'name': instance.name
            }
        )


@receiver(post_save, sender=DashboardWidget)
def create_widget_log(sender, instance, created, **kwargs):
    """Create log when dashboard widget is created/updated"""
    if created:
        from transactions.models import TransactionLog
        
        TransactionLog.objects.create(
            action='DASHBOARD_WIDGET_CREATED',
            performed_by=instance.created_by,
            resource_type='DASHBOARD_WIDGET',
            resource_id=str(instance.id),
            details={
                'widget_type': instance.widget_type,
                'data_source': instance.data_source,
                'name': instance.name
            }
        )


@receiver(post_save, sender=AdminNotification)
def create_notification_log(sender, instance, created, **kwargs):
    """Create log when admin notification is created"""
    if created:
        from transactions.models import TransactionLog
        
        TransactionLog.objects.create(
            action='ADMIN_NOTIFICATION_CREATED',
            performed_by=instance.recipient,
            resource_type='ADMIN_NOTIFICATION',
            resource_id=str(instance.id),
            details={
                'notification_type': instance.notification_type,
                'priority': instance.priority,
                'title': instance.title
            }
        )



